import {
  NextRenderOptions,
  Profiler,
  ProfiledComponent,
  ProfiledHook,
} from "../profile/index.js";

interface ApolloCustomMatchers<R = void, T = {}> {
  toRerender: T extends
    | Profiler<any>
    | ProfiledComponent<any, any>
    | ProfiledHook<any, any>
    ? (options?: NextRenderOptions) => Promise<R>
    : { error: "matcher needs to be called on a ProfiledComponent instance" };

  toRenderExactlyTimes: T extends
    | Profiler<any>
    | ProfiledComponent<any, any>
    | ProfiledHook<any, any>
    ? (count: number, options?: NextRenderOptions) => Promise<R>
    : { error: "matcher needs to be called on a ProfiledComponent instance" };
}

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> extends ApolloCustomMatchers<R, T> {}
  }
}
