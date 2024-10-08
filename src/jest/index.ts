import { expect } from "@jest/globals";
import { toRerender, toRenderExactlyTimes } from "./ProfiledComponent.js";
import type { NextRenderOptions, RenderStream } from "../index.js";

expect.extend({
  toRerender,
  toRenderExactlyTimes,
});
interface ApolloCustomMatchers<R = void, T = {}> {
  toRerender: T extends RenderStream<any> | unknown // TODO
    ? (options?: NextRenderOptions) => Promise<R>
    : { error: "matcher needs to be called on a ProfiledComponent instance" };

  toRenderExactlyTimes: T extends RenderStream<any> | unknown // TODO
    ? (count: number, options?: NextRenderOptions) => Promise<R>
    : { error: "matcher needs to be called on a ProfiledComponent instance" };
}

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> extends ApolloCustomMatchers<R, T> {}
  }
}
