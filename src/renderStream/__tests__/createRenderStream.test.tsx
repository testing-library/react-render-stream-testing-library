/* eslint-disable @typescript-eslint/no-use-before-define */
import {jest, describe, test, expect} from '@jest/globals'
import {createRenderStream} from '@testing-library/react-render-stream'
import {userEvent} from '@testing-library/user-event'
import * as React from 'react'
import {ErrorBoundary} from 'react-error-boundary'

function CounterForm({
  value,
  onIncrement,
}: {
  value: number
  onIncrement: () => void
}) {
  return (
    <form>
      <button type="button" onClick={() => onIncrement()}>
        Increment
      </button>
      <label>
        Value
        <input type="number" value={value} readOnly />
      </label>
    </form>
  )
}

describe('snapshotDOM', () => {
  test('basic functionality', async () => {
    function Counter() {
      const [value, setValue] = React.useState(0)
      return (
        <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
      )
    }

    const {takeRender, render} = createRenderStream({
      snapshotDOM: true,
    })
    const utils = render(<Counter />)
    const incrementButton = utils.getByText('Increment')
    await userEvent.click(incrementButton)
    await userEvent.click(incrementButton)
    {
      const {withinDOM} = await takeRender()
      const input = withinDOM().getByLabelText<HTMLInputElement>('Value')
      expect(input.value).toBe('0')
    }
    {
      const {withinDOM} = await takeRender()
      const input = withinDOM().getByLabelText<HTMLInputElement>('Value')
      expect(input.value).toBe('1')
    }
    {
      const {withinDOM} = await takeRender()
      const input = withinDOM().getByLabelText<HTMLInputElement>('Value')
      expect(input.value).toBe('2')
    }
  })

  test('errors when triggering events on rendered elemenst', async () => {
    function Counter() {
      const [value, setValue] = React.useState(0)
      return (
        <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
      )
    }

    const {takeRender, render} = createRenderStream({
      snapshotDOM: true,
    })
    render(<Counter />)
    {
      const {withinDOM} = await takeRender()
      const snapshotIncrementButton = withinDOM().getByText('Increment')
      try {
        await userEvent.click(snapshotIncrementButton)
      } catch (error) {
        expect(error).toMatchInlineSnapshot(`
[Error: Uncaught [Error: 
    DOM interaction with a snapshot detected in test.
    Please don't interact with the DOM you get from \`withinDOM\`,
    but still use \`screen\` to get elements for simulating user interaction.
    ]]
`)
      }
    }
  })
})

describe('replaceSnapshot', () => {
  test('basic functionality', async () => {
    function Counter() {
      const [value, setValue] = React.useState(0)
      replaceSnapshot({value})
      return (
        <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
      )
    }

    const {takeRender, replaceSnapshot, render} = createRenderStream<{
      value: number
    }>()
    const utils = render(<Counter />)
    const incrementButton = utils.getByText('Increment')
    await userEvent.click(incrementButton)
    await userEvent.click(incrementButton)
    {
      const {snapshot} = await takeRender()
      expect(snapshot).toEqual({value: 0})
    }
    {
      const {snapshot} = await takeRender()
      expect(snapshot).toEqual({value: 1})
    }
    {
      const {snapshot} = await takeRender()
      expect(snapshot).toEqual({value: 2})
    }
  })
  describe('callback notation', () => {
    test('basic functionality', async () => {
      function Counter() {
        const [value, setValue] = React.useState(0)
        replaceSnapshot(oldSnapshot => ({...oldSnapshot, value}))
        return (
          <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
        )
      }

      const {takeRender, replaceSnapshot, render} = createRenderStream({
        initialSnapshot: {unrelatedValue: 'unrelated', value: -1},
      })
      const utils = render(<Counter />)
      const incrementButton = utils.getByText('Increment')
      await userEvent.click(incrementButton)
      await userEvent.click(incrementButton)
      {
        const {snapshot} = await takeRender()
        expect(snapshot).toEqual({unrelatedValue: 'unrelated', value: 0})
      }
      {
        const {snapshot} = await takeRender()
        expect(snapshot).toEqual({unrelatedValue: 'unrelated', value: 1})
      }
      {
        const {snapshot} = await takeRender()
        expect(snapshot).toEqual({unrelatedValue: 'unrelated', value: 2})
      }
    })
    test('requires initialSnapshot', async () => {
      function Counter() {
        const [value, setValue] = React.useState(0)
        replaceSnapshot(() => ({value}))
        return (
          <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
        )
      }

      const {replaceSnapshot, render} = createRenderStream<{
        value: number
      }>()
      let caughtError: Error

      const spy = jest.spyOn(console, 'error')
      spy.mockImplementation(() => {})
      render(
        <ErrorBoundary
          fallbackRender={({error}) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            caughtError = error
            return null
          }}
        >
          <Counter />
        </ErrorBoundary>,
      )
      spy.mockRestore()

      expect(caughtError!).toMatchInlineSnapshot(
        `[Error: Cannot use a function to update the snapshot if no initial snapshot was provided.]`,
      )
    })
  })
})

describe('onRender', () => {
  test('basic functionality', async () => {
    function Counter() {
      const [value, setValue] = React.useState(0)
      replaceSnapshot({value})
      return (
        <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
      )
    }

    const {takeRender, replaceSnapshot, render} = createRenderStream<{
      value: number
    }>({
      onRender(info) {
        // can use expect here
        expect(info.count).toBe(info.snapshot.value + 1)
      },
    })
    const utils = render(<Counter />)
    const incrementButton = utils.getByText('Increment')
    await userEvent.click(incrementButton)
    await userEvent.click(incrementButton)
    await takeRender()
    await takeRender()
    await takeRender()
  })

  test('errors in `onRender` propagate to the associated `takeRender` call', async () => {
    function Counter() {
      const [value, setValue] = React.useState(0)
      return (
        <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
      )
    }

    const {takeRender, render} = createRenderStream({
      onRender(info) {
        expect(info.count).toBe(1)
      },
    })

    const utils = render(<Counter />)
    const incrementButton = utils.getByText('Increment')
    await userEvent.click(incrementButton)
    await userEvent.click(incrementButton)
    await takeRender()
    const error = await takeRender()
      .then(() => undefined as never)
      .catch(e => e as Error)

    // eslint-disable-next-line no-control-regex
    const consoleColors = /\x1b\[\d+m/g

    expect(error.message.replace(consoleColors, '')).toMatchInlineSnapshot(`
expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
`)
  })
})
