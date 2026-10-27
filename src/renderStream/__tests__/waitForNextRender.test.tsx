import {expect, jest, test} from '@jest/globals'
import {createRenderStream} from '@testing-library/react-render-stream'
import * as React from 'react'
import {flushSync} from 'react-dom'

test.each([false, true])(
  'a completed wait cannot clear a later waiter (snapshot error: %s)',
  async snapshotError => {
    const error = new Error('snapshot failed')
    const stream = createRenderStream<{value: number}>({
      onRender({snapshot}) {
        if (snapshotError && snapshot.value === 1) throw error
      },
    })
    let update: React.Dispatch<React.SetStateAction<number>>
    function Component() {
      const [value, setValue] = React.useState(0)
      update = setValue
      stream.replaceSnapshot({value})
      return null
    }
    await stream.render(<Component />)
    await stream.takeRender()

    jest.useFakeTimers()
    try {
      const first = stream.takeRender({timeout: 100}).then(
        () => undefined,
        failure => failure,
      )
      flushSync(() => update!(1))
      await jest.advanceTimersByTimeAsync(0)
      expect(await first).toBe(snapshotError ? error : undefined)

      const second = stream.takeRender({timeout: 200}).catch(failure => failure)
      // Cross the first wait's original deadline while the second is pending.
      await jest.advanceTimersByTimeAsync(100)
      flushSync(() => update!(2))
      await jest.advanceTimersByTimeAsync(100)
      expect(await second).toMatchObject({snapshot: {value: 2}})
    } finally {
      jest.useRealTimers()
    }
  },
)
