import type { MatcherFunction } from "expect";
import { WaitForRenderTimeoutError } from "@testing-library/react-render-stream";
import type {
  Assertable,
  NextRenderOptions,
  RenderStream,
} from "@testing-library/react-render-stream";
// explicitly imported the symbol from the internal file
// this will bundle the `Symbol.for` call twice, but we keep it private
import { assertableSymbol } from "../assertable.js";

export const toRerender: MatcherFunction<[options?: NextRenderOptions]> =
  async function (actual, options) {
    const _profiler = actual as RenderStream<any> | Assertable;
    const profiler =
      assertableSymbol in _profiler ? _profiler[assertableSymbol] : _profiler;
    const hint = this.utils.matcherHint("toRerender", "ProfiledComponent", "");
    let pass = true;
    try {
      await profiler.peekRender({ timeout: 100, ...options });
    } catch (e) {
      if (e instanceof WaitForRenderTimeoutError) {
        pass = false;
      } else {
        throw e;
      }
    }

    return {
      pass,
      message() {
        return (
          hint +
          `\n\nExpected component to${pass ? " not" : ""} rerender, ` +
          `but it did${pass ? "" : " not"}.`
        );
      },
    };
  };

/** to be thrown to "break" test execution and fail it */
const failed = {};

export const toRenderExactlyTimes: MatcherFunction<
  [times: number, options?: NextRenderOptions]
> = async function (actual, times, optionsPerRender) {
  const _profiler = actual as RenderStream<any> | Assertable;
  const profiler =
    assertableSymbol in _profiler ? _profiler[assertableSymbol] : _profiler;
  const options = { timeout: 100, ...optionsPerRender };
  const hint = this.utils.matcherHint("toRenderExactlyTimes");
  let pass = true;
  try {
    if (profiler.totalRenderCount() > times) {
      throw failed;
    }
    try {
      while (profiler.totalRenderCount() < times) {
        await profiler.waitForNextRender(options);
      }
    } catch (e) {
      // timeouts here should just fail the test, rethrow other errors
      throw e instanceof WaitForRenderTimeoutError ? failed : e;
    }
    try {
      await profiler.waitForNextRender(options);
    } catch (e) {
      // we are expecting a timeout here, so swallow that error, rethrow others
      if (!(e instanceof WaitForRenderTimeoutError)) {
        throw e;
      }
    }
  } catch (e) {
    if (e === failed) {
      pass = false;
    } else {
      throw e;
    }
  }
  return {
    pass,
    message() {
      return (
        hint +
        ` Expected component to${pass ? " not" : ""} render exactly ${times}.` +
        ` It rendered ${profiler.totalRenderCount()} times.`
      );
    },
  };
};
