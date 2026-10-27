import {expect, test} from '@jest/globals'
import {
  createRenderStream,
  useTrackRenders,
  WaitForRenderTimeoutError,
} from '@testing-library/react-render-stream'
import * as React from 'react'

test.each(['render', 'rerender'] as const)(
  '%s completes a skipped commit without notifying snapshot consumers',
  async method => {
    const stream = createRenderStream({skipNonTrackingRenders: true})
    let subscribed = false
    function Tracked() {
      useTrackRenders()
      React.useEffect(() => {
        subscribed = true
        return () => {
          subscribed = false
        }
      }, [])
      return <span>tracked</span>
    }
    const container = document.createElement('div')
    const {rerender} = await stream.render(<Tracked />, {container})
    await stream.takeRender()
    const render = (ui: React.ReactNode) =>
      method === 'render' ? stream.render(ui, {container}) : rerender(ui)
    let notified = false
    const next = stream.takeRender().then(result => {
      notified = true
      return result
    })

    await render(null)
    expect(container.innerHTML).toBe('')
    expect(subscribed).toBe(false)
    expect(stream.totalRenderCount()).toBe(1)
    expect(notified).toBe(false)

    await render(<Tracked />)
    expect(subscribed).toBe(true)
    expect((await next).count).toBe(2)
  },
)

test('initial and overlapping skipped renders finish while snapshot waits still time out', async () => {
  const stream = createRenderStream({skipNonTrackingRenders: true})
  let effectValue = -1
  function Untracked({value}: {value: number}) {
    React.useEffect(() => {
      effectValue = value
    }, [value])
    return null
  }
  const {rerender} = await stream.render(<Untracked value={0} />)
  expect(effectValue).toBe(0)
  const timeout = expect(
    stream.takeRender({timeout: 100}),
  ).rejects.toBeInstanceOf(WaitForRenderTimeoutError)
  await Promise.all([
    rerender(<Untracked value={1} />),
    rerender(<Untracked value={2} />),
  ])
  expect(effectValue).toBe(2)
  expect(stream.totalRenderCount()).toBe(0)
  await timeout
})
