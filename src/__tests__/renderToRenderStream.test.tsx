/* eslint-disable @typescript-eslint/no-use-before-define */
import {describe, test, expect} from '@jest/globals'
import {renderToRenderStream} from '@testing-library/react-render-stream'
import {userEvent} from '@testing-library/user-event'
import * as React from 'react'
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

    const {takeRender, renderResultPromise} = renderToRenderStream(
      <Counter />,
      {
        snapshotDOM: true,
      },
    )
    const utils = await renderResultPromise
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

  test('queries option', async () => {
    function Component() {
      return null
    }
    const queries = {
      foo: (_: any) => {
        return null
      },
    }
    const {takeRender, renderResultPromise} = renderToRenderStream(
      <Component />,
      {
        queries,
        snapshotDOM: true,
      },
    )
    const utils = await renderResultPromise
    expect(utils.foo()).toBe(null)
    const {withinDOM} = await takeRender()
    expect(withinDOM().foo()).toBe(null)
    function _typeTest() {
      // @ts-expect-error should not be present
      utils.getByText
      // @ts-expect-error should not be present
      withinDOM().getByText
      utils.debug()
      withinDOM().debug()
      const _str: string = withinDOM().logTestingPlaygroundURL()
    }
  })
})

// for more tests, see the `createRenderStream` test suite, as `renderToRenderStream` is just a wrapper around that
