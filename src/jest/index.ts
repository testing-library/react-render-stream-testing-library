import { expect } from "@jest/globals";
import { toRerender, toRenderExactlyTimes } from "./renderStreamMatchers.js";
import type { RenderStreamMatchers } from "./renderStreamMatchers.js";

expect.extend({
  toRerender,
  toRenderExactlyTimes,
});

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> extends RenderStreamMatchers<R, T> {}
  }
}
