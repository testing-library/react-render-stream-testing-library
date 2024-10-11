import {
  Queries,
  type RenderOptions as BaseOptions,
  type RenderResult as BaseResult,
} from '@testing-library/react'
import {
  createRenderStream,
  type RenderStreamOptions,
  type RenderStream,
  type ValidSnapshot,
} from './renderStream/createRenderStream.js'
import {SyncQueries} from './renderStream/syncQueries.js'

type RenderOptions<
  Snapshot extends ValidSnapshot = void,
  Q extends Queries = SyncQueries,
> = BaseOptions<Q> & RenderStreamOptions<Snapshot, Q>

export interface RenderStreamWithRenderResult<
  Snapshot extends ValidSnapshot = void,
  Q extends Queries = SyncQueries,
> extends RenderStream<Snapshot, Q> {
  renderResultPromise: Promise<BaseResult<Q>>
}

/**
 * Render into a container which is appended to document.body. It should be used with cleanup.
 */
export function renderToRenderStream<
  Snapshot extends ValidSnapshot = void,
  Q extends Queries = SyncQueries,
>(
  ui: React.ReactNode,
  {
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
    queries,
    ...options
  }: RenderOptions<Snapshot, Q> = {},
): RenderStreamWithRenderResult<Snapshot, Q> {
  const {render, ...stream} = createRenderStream<Snapshot, Q>({
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
    queries,
  })
  // `render` needs to be called asynchronously here, because the definition of `ui`
  // might contain components that reference the return value of `renderToRenderStream`
  // itself, e.g. `replaceSnapshot` or `mergeSnapshot`.
  const renderResultPromise = Promise.resolve().then(() =>
    render<Q>(ui, {...options, queries}),
  )
  return {...stream, renderResultPromise}
}
