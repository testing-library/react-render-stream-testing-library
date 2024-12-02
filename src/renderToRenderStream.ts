import {type RenderOptions as BaseOptions} from '@testing-library/react/pure.js'
import {type Queries} from '@testing-library/dom'
import {
  createRenderStream,
  type RenderStreamOptions,
  type RenderStream,
  type ValidSnapshot,
} from './renderStream/createRenderStream.js'
import {SyncQueries} from './renderStream/syncQueries.js'
import {AsyncRenderResult} from './renderWithoutAct.js'

type RenderOptions<
  Snapshot extends ValidSnapshot = void,
  Q extends Queries = SyncQueries,
> = BaseOptions<Q> & RenderStreamOptions<Snapshot, Q>

export interface RenderStreamWithRenderResult<
  Snapshot extends ValidSnapshot = void,
  Q extends Queries = SyncQueries,
> extends RenderStream<Snapshot, Q> {
  utils: AsyncRenderResult<Q>
}

/**
 * Render into a container which is appended to document.body. It should be used with cleanup.
 */
export async function renderToRenderStream<
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
): Promise<RenderStreamWithRenderResult<Snapshot, Q>> {
  const {render, ...stream} = createRenderStream<Snapshot, Q>({
    onRender,
    snapshotDOM,
    initialSnapshot,
    skipNonTrackingRenders,
    queries,
  })

  // We need to wait a tick before calling `render` here, because the definition of `ui`
  // might contain components that reference the return value of `renderToRenderStream`
  // itself, e.g. `replaceSnapshot` or `mergeSnapshot`.
  await Promise.resolve()
  const utils = await render<Q>(ui, {...options, queries})

  return {...stream, utils}
}
