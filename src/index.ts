import '@testing-library/react-render-stream/expect'
import {cleanup} from '@testing-library/react-render-stream/pure'
export * from '@testing-library/react-render-stream/pure'

const global = globalThis as {afterEach?: (fn: () => void) => void}
if (global.afterEach) {
  global.afterEach(cleanup)
}
