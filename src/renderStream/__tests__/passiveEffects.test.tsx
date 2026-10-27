import {EventEmitter} from 'node:events'
import {describe, expect, test} from '@jest/globals'
import {
  createRenderStream,
  useTrackRenders,
} from '@testing-library/react-render-stream'
import * as React from 'react'

describe('passive effects', () => {
  test('render and rerender wait for subscriptions without consuming renders', async () => {
    const events = new EventEmitter()
    const received: number[] = []
    const stream = createRenderStream<{value: number}>()
    function Subscriber({value}: {value: number}) {
      stream.replaceSnapshot({value})
      React.useEffect(() => {
        const listener = () => received.push(value)
        events.on('event', listener)
        return () => {
          events.off('event', listener)
        }
      }, [value])
      return null
    }

    const {rerender} = await stream.render(<Subscriber value={0} />)
    events.emit('event')
    await rerender(<Subscriber value={1} />)
    events.emit('event')

    expect(received).toEqual([0, 1])
    expect((await stream.takeRender()).snapshot).toEqual({value: 0})
    expect((await stream.takeRender()).snapshot).toEqual({value: 1})
  })

  test.each(['takeRender', 'peekRender', 'waitForNextRender'] as const)(
    '%s waits for effects of descendant-only updates',
    async method => {
      const events = new EventEmitter()
      const received: number[] = []
      const stream = createRenderStream<{value: number}>()
      let update: React.Dispatch<React.SetStateAction<number>>
      let parentCommits = 0
      function Subscriber() {
        const [value, setValue] = React.useState(0)
        update = setValue
        stream.replaceSnapshot({value})
        React.useEffect(() => {
          const listener = () => received.push(value)
          events.on('event', listener)
          return () => {
            events.off('event', listener)
          }
        }, [value])
        return null
      }
      function Parent() {
        React.useLayoutEffect(() => {
          parentCommits++
        })
        return <Subscriber />
      }

      await stream.render(<Parent />)
      await stream.takeRender()
      update!(1)
      const render = await stream[method]()
      events.emit('event')

      expect(render.snapshot).toEqual({value: 1})
      expect(received).toEqual([1])
      expect(parentCommits).toBe(1)
    },
  )

  test('takeRender waits for effects even when onRender has already run', async () => {
    let commitRecorded: () => void = () => {}
    const stream = createRenderStream<{value: number}>({
      onRender: () => commitRecorded(),
    })
    let update: React.Dispatch<React.SetStateAction<number>>
    let effectValue = -1
    function Component() {
      const [value, setValue] = React.useState(0)
      update = setValue
      stream.replaceSnapshot({value})
      React.useEffect(() => {
        effectValue = value
      }, [value])
      return null
    }

    await stream.render(<Component />)
    await stream.takeRender()
    const committed = new Promise<void>(resolve => {
      commitRecorded = resolve
    })
    update!(1)
    await committed
    expect((await stream.takeRender()).snapshot).toEqual({value: 1})
    expect(effectValue).toBe(1)
  })

  test('overlapping rerenders both resolve after the batched commit', async () => {
    const stream = createRenderStream()
    let effectValue = -1
    function Component({value}: {value: number}) {
      React.useEffect(() => {
        effectValue = value
      }, [value])
      return null
    }
    const {rerender} = await stream.render(<Component value={0} />)
    await Promise.all([
      rerender(<Component value={1} />),
      rerender(<Component value={2} />),
    ])
    expect(effectValue).toBe(2)
  })

  test('descendant commits without passive effects still resolve', async () => {
    const stream = createRenderStream<{value: number}>()
    let update: React.Dispatch<React.SetStateAction<number>>
    function Child() {
      const [value, setValue] = React.useState(0)
      update = setValue
      stream.replaceSnapshot({value})
      return null
    }
    await stream.render(<Child />)
    await stream.takeRender()
    update!(1)
    expect((await stream.takeRender()).snapshot).toEqual({value: 1})
  })

  test('skipped commits do not resolve a waiter for a tracked render', async () => {
    const stream = createRenderStream<{value: number}>({
      skipNonTrackingRenders: true,
    })
    let updateTracked: React.Dispatch<React.SetStateAction<number>>,
      updateUntracked: React.Dispatch<React.SetStateAction<number>>
    let untrackedEffect: () => void = () => {}
    function Tracked() {
      useTrackRenders()
      const [value, setValue] = React.useState(0)
      updateTracked = setValue
      stream.replaceSnapshot({value})
      return null
    }
    function Untracked() {
      const [value, setValue] = React.useState(0)
      updateUntracked = setValue
      React.useEffect(() => untrackedEffect(), [value])
      return null
    }
    await stream.render(
      <>
        <Tracked />
        <Untracked />
      </>,
    )
    await stream.takeRender()
    let resolved = false
    const next = stream.takeRender().then(render => {
      resolved = true
      return render
    })
    const skipped = new Promise<void>(resolve => {
      untrackedEffect = resolve
    })
    updateUntracked!(1)
    await skipped
    expect(resolved).toBe(false)
    updateTracked!(1)
    expect((await next).snapshot).toEqual({value: 1})
  })

  test('snapshot errors reject pending consumers after effects and preserve iteration', async () => {
    const error = new Error('snapshot failed')
    const stream = createRenderStream<{value: number}>({
      onRender({snapshot}) {
        if (snapshot.value === 1) throw error
      },
    })
    let update: React.Dispatch<React.SetStateAction<number>>
    let effectValue = -1
    function Component() {
      const [value, setValue] = React.useState(0)
      update = setValue
      stream.replaceSnapshot({value})
      React.useEffect(() => {
        effectValue = value
      }, [value])
      return null
    }
    await stream.render(<Component />)
    await stream.takeRender()
    update!(1)
    await expect(stream.takeRender()).rejects.toBe(error)
    expect(effectValue).toBe(1)
    update!(2)
    expect((await stream.takeRender()).snapshot).toEqual({value: 2})
  })

  test('retains commit-time snapshots across layout and passive effect updates', async () => {
    const stream = createRenderStream<{value: number}>({snapshotDOM: true})
    const effects: number[] = []
    function Component() {
      const [value, setValue] = React.useState(0)
      stream.replaceSnapshot({value})
      React.useLayoutEffect(() => {
        if (value === 0) setValue(1)
      }, [value])
      React.useEffect(() => {
        effects.push(value)
        if (value === 1) setValue(2)
      }, [value])
      return <span data-testid="value">{value}</span>
    }
    await stream.render(<Component />)
    for (const value of [0, 1, 2]) {
      // eslint-disable-next-line no-await-in-loop
      const render = await stream.takeRender()
      expect(render.count).toBe(value + 1)
      expect(render.snapshot).toEqual({value})
      expect(render.withinDOM().getByTestId('value').textContent).toBe(
        String(value),
      )
      expect(effects).toContain(value)
    }
  })
})
