import { render, RenderHookOptions } from "@testing-library/react";
import {
  createProfiler,
  ProfiledComponentFields,
  RenderStream,
  ValidSnapshot,
} from "./profile/profile.js";
import { Render } from "./profile/Render.js";
import { createElement } from "react";

type StringReplaceRenderWithSnapshot<T extends string> =
  T extends `${infer Pre}Render${infer Post}` ? `${Pre}Snapshot${Post}` : T;

type ResultReplaceRenderWithSnapshot<T> = T extends (
  ...args: infer Args
) => Render<infer Snapshot>
  ? (...args: Args) => Snapshot
  : T extends (...args: infer Args) => Promise<Render<infer Snapshot>>
    ? (...args: Args) => Promise<Snapshot>
    : T;

type ProfiledHookFields<ReturnValue> =
  ProfiledComponentFields<ReturnValue> extends infer PC
    ? {
        [K in keyof PC as StringReplaceRenderWithSnapshot<
          K & string
        >]: ResultReplaceRenderWithSnapshot<PC[K]>;
      }
    : never;

/** @internal */
export interface ProfiledHook<Props, ReturnValue extends ValidSnapshot>
  extends ProfiledHookFields<ReturnValue> {
  //Profiler: RenderStream<ReturnValue>;
}

export function renderHookToSnapshotStream<
  ReturnValue extends ValidSnapshot,
  Props extends {},
>(
  renderCallback: (props: Props) => ReturnValue,
  { initialProps, ...options }: RenderHookOptions<Props> = {}
): [
  stream: ProfiledHook<Props, ReturnValue>,
  renderResult: {
    rerender: (rerenderCallbackProps: Props) => void;
    unmount: () => void;
  },
] {
  const { Wrapper, ...stream } = createProfiler<ReturnValue>();

  const ProfiledHook: React.FC<Props> = (props) => {
    stream.replaceSnapshot(renderCallback(props));
    return null;
  };

  const { rerender: baseRerender, unmount } = render(
    createElement(ProfiledHook, initialProps),
    {
      ...options,
      wrapper(props) {
        let elem: React.ReactNode = createElement(
          Wrapper,
          undefined,
          props.children
        );
        if (options.wrapper) {
          elem = createElement(options.wrapper, undefined, elem);
        }
        return elem;
      },
    }
  );

  function rerender(rerenderCallbackProps: Props) {
    return baseRerender(createElement(ProfiledHook, rerenderCallbackProps));
  }

  return [
    Object.assign({}, stream, {
      renders: stream.renders,
      totalSnapshotCount: stream.totalRenderCount,
      async peekSnapshot(options) {
        return (await stream.peekRender(options)).snapshot;
      },
      async takeSnapshot(options) {
        return (await stream.takeRender(options)).snapshot;
      },
      getCurrentSnapshot() {
        return stream.getCurrentRender().snapshot;
      },
      async waitForNextSnapshot(options) {
        return (await stream.waitForNextRender(options)).snapshot;
      },
    } satisfies ProfiledHookFields<ReturnValue>),
    {
      rerender,
      unmount,
    },
  ];
}
