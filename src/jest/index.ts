import { expect } from "@jest/globals";
import { toRerender, toRenderExactlyTimes } from "./ProfiledComponent.js";
import type {
  NextRenderOptions,
  RenderStream,
  Assertable,
} from "@testing-library/react-render-stream";

expect.extend({
  toRerender,
  toRenderExactlyTimes,
});
interface CustomMatchers<R = void, T = {}> {
  toRerender: T extends RenderStream<any> | Assertable
    ? (options?: NextRenderOptions) => Promise<R>
    : {
        error: "matcher needs to be called on a `takeRender` function, `takeSnapshot` function or `RenderStream` instance";
      };

  toRenderExactlyTimes: T extends RenderStream<any> | Assertable
    ? (count: number, options?: NextRenderOptions) => Promise<R>
    : {
        error: "matcher needs to be called on a `takeRender` function, `takeSnapshot` function or `RenderStream` instance";
      };
}

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> extends CustomMatchers<R, T> {}
  }
}
