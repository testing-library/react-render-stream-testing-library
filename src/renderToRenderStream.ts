import {
  type RenderOptions as BaseOptions,
  type RenderResult as BaseResult,
} from '@testing-library/react'
import {createRenderStream} from './renderStream/createRenderStream.js'
import type {
  RenderStreamOptions,
  RenderStream,
  ValidSnapshot,
} from './renderStream/createRenderStream.js'

type RenderOptions<Snapshot extends ValidSnapshot = void> = BaseOptions &
  RenderStreamOptions<Snapshot>

export interface RenderStreamWithRenderResult<
  Snapshot extends ValidSnapshot = void,
> extends RenderStream<Snapshot> {
  renderResultPromise: Promise<BaseResult>
}

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
  }: RenderOptions<Snapshot> = {},
): RenderStreamWithRenderResult<Snapshot> {
  const {render, ...stream} = createRenderStream<Snapshot>({
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
  })
  // `render` needs to be called asynchronously here, because the definition of `ui`
  // might contain components that reference the return value of `renderToRenderStream`
  // itself, e.g. `replaceSnapshot` or `mergeSnapshot`.
  const renderResultPromise = Promise.resolve().then(() => render(ui, options))
  return {...stream, renderResultPromise}
}
