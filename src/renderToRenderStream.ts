import {
  render,
  type RenderOptions as BaseOptions,
  type RenderResult as BaseResult,
} from "@testing-library/react";
import {
  createProfiler,
  ProfiledComponentFields,
  ProfiledComponentOnlyFields,
  ProfilerOptions,
  ValidSnapshot,
} from "./profile/profile.js";
import { createElement } from "react";

type RenderOptions<Snapshot extends ValidSnapshot = void> = BaseOptions &
  ProfilerOptions<Snapshot>;

type RenderResult<Snapshot extends ValidSnapshot = void> = [
  Stream: ProfiledComponentFields<Snapshot> &
    ProfiledComponentOnlyFields<Snapshot>,
  resultPromise: Promise<BaseResult>,
];

/**
 * Render into a container which is appended to document.body. It should be used with cleanup.
 */
export function renderToRenderStream<Snapshot extends ValidSnapshot = void>(
  ui: React.ReactNode,
  // TODO: add `queries`
  {
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
    ...options
  }: RenderOptions<Snapshot> = {}
): RenderResult<Snapshot> {
  const { Wrapper, ...stream } = createProfiler<Snapshot>({
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
  });
  const result = Promise.resolve().then(() =>
    render(ui, {
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
    })
  );
  return [stream, result];
}
