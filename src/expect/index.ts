import {expect} from 'expect'
import {
  toRerender,
  toRenderExactlyTimes,
  type RenderStreamMatchers,
} from './renderStreamMatchers.js'

expect.extend({
  toRerender,
  toRenderExactlyTimes,
})

declare module 'expect' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Matchers<R extends void | Promise<void>, T = unknown>
    extends RenderStreamMatchers<R, T> {}
}
