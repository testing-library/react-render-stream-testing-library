import {expect} from '@jest/globals'
import {
  toRerender,
  toRenderExactlyTimes,
  type RenderStreamMatchers,
} from './renderStreamMatchers.js'

expect.extend({
  toRerender,
  toRenderExactlyTimes,
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Matchers<R = void, T = {}> extends RenderStreamMatchers<R, T> {}
  }
}
