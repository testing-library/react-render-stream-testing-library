import {MatcherContext, type MatcherFunction} from 'expect'
import {
  WaitForRenderTimeoutError,
  type Assertable,
  type NextRenderOptions,
  type RenderStream,
} from '@testing-library/react-render-stream'
// explicitly imported the symbol from the internal file
// this will bundle the `Symbol.for` call twice, but we keep it private
import {assertableSymbol} from '../assertable.js'

export interface RenderStreamMatchers<R = void, T = {}> {
  toRerender: T extends RenderStream<any> | Assertable
    ? (options?: NextRenderOptions) => Promise<R>
    : {
        error: 'matcher needs to be called on a `takeRender` function, `takeSnapshot` function or `RenderStream` instance'
      }

  toRenderExactlyTimes: T extends RenderStream<any> | Assertable
    ? (count: number, options?: NextRenderOptions) => Promise<R>
    : {
        error: 'matcher needs to be called on a `takeRender` function, `takeSnapshot` function or `RenderStream` instance'
      }
}

export const toRerender: MatcherFunction<[options?: NextRenderOptions]> =
  async function toRerender(this: MatcherContext, actual, options) {
    const _stream = actual as RenderStream<any> | Assertable
    const stream =
      assertableSymbol in _stream ? _stream[assertableSymbol] : _stream
    const hint = this.utils.matcherHint('toRerender')
    let pass = true
    try {
      await stream.peekRender({timeout: 100, ...options})
    } catch (e) {
      if (e instanceof WaitForRenderTimeoutError) {
        pass = false
      } else {
        throw e
      }
    }

    return {
      pass,
      message() {
        return (
          `${hint}\n\nExpected component to${pass ? ' not' : ''} rerender, ` +
          `but it did${pass ? '' : ' not'}.`
        )
      },
    }
  }

/** to be thrown to "break" test execution and fail it */
const failed = new Error()

export const toRenderExactlyTimes: MatcherFunction<
  [times: number, options?: NextRenderOptions]
> = async function toRenderExactlyTimes(
  this: MatcherContext,
  actual,
  times,
  optionsPerRender,
) {
  const _stream = actual as RenderStream<any> | Assertable
  const stream =
    assertableSymbol in _stream ? _stream[assertableSymbol] : _stream
  const options = {timeout: 100, ...optionsPerRender}
  const hint = this.utils.matcherHint('toRenderExactlyTimes')
  let pass = true
  try {
    if (stream.totalRenderCount() > times) {
      throw failed
    }
    try {
      while (stream.totalRenderCount() < times) {
        // eslint-disable-next-line no-await-in-loop
        await stream.waitForNextRender(options)
      }
    } catch (e) {
      // timeouts here should just fail the test, rethrow other errors
      throw e instanceof WaitForRenderTimeoutError ? failed : e
    }
    try {
      await stream.waitForNextRender(options)
    } catch (e) {
      // we are expecting a timeout here, so swallow that error, rethrow others
      if (!(e instanceof WaitForRenderTimeoutError)) {
        throw e
      }
    }
  } catch (e) {
    if (e === failed) {
      pass = false
    } else {
      throw e
    }
  }
  return {
    pass,
    message() {
      return (
        `${
          hint
        } Expected component to${pass ? ' not' : ''} render exactly ${times}.` +
        ` It rendered ${stream.totalRenderCount()} times.`
      )
    },
  }
}
