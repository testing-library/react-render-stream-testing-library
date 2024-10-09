import {
  type RenderOptions as BaseOptions,
  type RenderResult as BaseResult,
} from "@testing-library/react";
import {
  createRenderStream,
  ProfiledComponentFields,
  ProfiledComponentOnlyFields,
  ProfilerOptions,
  ValidSnapshot,
} from "./profile/profile.js";

type RenderOptions<Snapshot extends ValidSnapshot = void> = BaseOptions &
  ProfilerOptions<Snapshot>;

type RenderResult<Snapshot extends ValidSnapshot = void> =
  ProfiledComponentFields<Snapshot> &
    ProfiledComponentOnlyFields<Snapshot> & {
      renderResultPromise: Promise<BaseResult>;
    };

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
  const { render, ...stream } = createRenderStream<Snapshot>({
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
  });
  const renderResultPromise = Promise.resolve().then(() => render(ui, options));
  return { ...stream, renderResultPromise };
}
