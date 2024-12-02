import * as React from 'rehackt'

import {type RenderOptions} from '@testing-library/react/pure.js'
import {Assertable, markAssertable} from '../assertable.js'
import {renderWithoutAct, RenderWithoutActAsync} from '../renderWithoutAct.js'
import {RenderInstance, type Render, type BaseRender} from './Render.js'
import {type RenderStreamContextValue} from './context.js'
import {RenderStreamContextProvider} from './context.js'
import {syncQueries, type Queries, type SyncQueries} from './syncQueries.js'

export type ValidSnapshot =
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  void | (object & {/* not a function */ call?: never})

export interface NextRenderOptions {
  timeout?: number
}

interface ReplaceSnapshot<Snapshot> {
  (newSnapshot: Snapshot): void
  (updateSnapshot: (lastSnapshot: Readonly<Snapshot>) => Snapshot): void
}

interface MergeSnapshot<Snapshot> {
  (partialSnapshot: Partial<Snapshot>): void
  (
    updatePartialSnapshot: (
      lastSnapshot: Readonly<Snapshot>,
    ) => Partial<Snapshot>,
  ): void
}

export interface RenderStream<
  Snapshot extends ValidSnapshot,
  Q extends Queries = SyncQueries,
> {
  // Allows for partial updating of the snapshot by shallow merging the results
  mergeSnapshot: MergeSnapshot<Snapshot>
  // Performs a full replacement of the snapshot
  replaceSnapshot: ReplaceSnapshot<Snapshot>
  /**
   * An array of all renders that have happened so far.
   * Errors thrown during component render will be captured here, too.
   */
  renders: Array<
    | Render<Snapshot, Q>
    | {phase: 'snapshotError'; count: number; error: unknown}
  >
  /**
   * Peeks the next render from the current iterator position, without advancing the iterator.
   * If no render has happened yet, it will wait for the next render to happen.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  peekRender: (options?: NextRenderOptions) => Promise<Render<Snapshot, Q>>
  /**
   * Iterates to the next render and returns it.
   * If no render has happened yet, it will wait for the next render to happen.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  takeRender: Assertable &
    ((options?: NextRenderOptions) => Promise<Render<Snapshot, Q>>)
  /**
   * Returns the total number of renders.
   */
  totalRenderCount: () => number
  /**
   * Returns the current render.
   * @throws {Error} if no render has happened yet
   */
  getCurrentRender: () => Render<Snapshot, Q>
  /**
   * Waits for the next render to happen.
   * Does not advance the render iterator.
   */
  waitForNextRender: (
    options?: NextRenderOptions,
  ) => Promise<Render<Snapshot, Q>>
}

export interface RenderStreamWithRenderFn<
  Snapshot extends ValidSnapshot,
  Q extends Queries = SyncQueries,
> extends RenderStream<Snapshot, Q> {
  render: RenderWithoutActAsync
}

export type RenderStreamOptions<
  Snapshot extends ValidSnapshot,
  Q extends Queries = SyncQueries,
> = {
  onRender?: (
    info: BaseRender & {
      snapshot: Snapshot
      replaceSnapshot: ReplaceSnapshot<Snapshot>
      mergeSnapshot: MergeSnapshot<Snapshot>
    },
  ) => void
  snapshotDOM?: boolean
  initialSnapshot?: Snapshot
  /**
   * This will skip renders during which no renders tracked by
   * `useTrackRenders` occured.
   */
  skipNonTrackingRenders?: boolean
  queries?: Q
}

export class WaitForRenderTimeoutError extends Error {
  constructor() {
    super('Exceeded timeout waiting for next render.')
    this.name = 'WaitForRenderTimeoutError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function createRenderStream<
  Snapshot extends ValidSnapshot = void,
  Q extends Queries = SyncQueries,
>({
  onRender,
  snapshotDOM = false,
  initialSnapshot,
  skipNonTrackingRenders,
  queries = syncQueries as any as Q,
}: RenderStreamOptions<Snapshot, Q> = {}): RenderStreamWithRenderFn<
  Snapshot,
  Q
> {
  // creating the object first and then assigning in all the properties
  // allows keeping the object instance for reference while the members are
  // created, which is important for the `markAssertable` function
  const stream = {} as any as RenderStreamWithRenderFn<Snapshot, Q>

  let nextRender: Promise<Render<Snapshot, Q>> | undefined,
    resolveNextRender: ((render: Render<Snapshot, Q>) => void) | undefined,
    rejectNextRender: ((error: unknown) => void) | undefined
  function resetNextRender() {
    nextRender = undefined
    resolveNextRender = undefined
    rejectNextRender = undefined
  }
  const snapshotRef = {current: initialSnapshot}
  const replaceSnapshot: ReplaceSnapshot<Snapshot> = snap => {
    if (typeof snap === 'function') {
      if (!initialSnapshot) {
        throw new Error(
          'Cannot use a function to update the snapshot if no initial snapshot was provided.',
        )
      }
      snapshotRef.current = snap(
        typeof snapshotRef.current === 'object'
          ? // "cheap best effort" to prevent accidental mutation of the last snapshot
            {...snapshotRef.current}
          : snapshotRef.current!,
      )
    } else {
      snapshotRef.current = snap
    }
  }

  const mergeSnapshot: MergeSnapshot<Snapshot> = partialSnapshot => {
    replaceSnapshot(snapshot => ({
      ...snapshot,
      ...(typeof partialSnapshot === 'function'
        ? partialSnapshot(snapshot)
        : partialSnapshot),
    }))
  }

  const renderStreamContext: RenderStreamContextValue = {
    renderedComponents: [],
  }

  const profilerOnRender: React.ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  ) => {
    if (
      skipNonTrackingRenders &&
      renderStreamContext.renderedComponents.length === 0
    ) {
      return
    }

    const renderBase = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      count: stream.renders.length + 1,
    }
    try {
      /*
       * The `onRender` function could contain `expect` calls that throw
       * `JestAssertionError`s - but we are still inside of React, where errors
       * might be swallowed.
       * So we record them and re-throw them in `takeRender`
       * Additionally, we reject the `waitForNextRender` promise.
       */
      onRender?.({
        ...renderBase,
        replaceSnapshot,
        mergeSnapshot,
        snapshot: snapshotRef.current!,
      })

      const snapshot = snapshotRef.current as Snapshot
      const domSnapshot = snapshotDOM
        ? window.document.body.innerHTML
        : undefined
      const render = new RenderInstance(
        renderBase,
        snapshot,
        domSnapshot,
        renderStreamContext.renderedComponents,
        queries,
      )
      renderStreamContext.renderedComponents = []
      stream.renders.push(render)
      resolveNextRender?.(render)
    } catch (error) {
      stream.renders.push({
        phase: 'snapshotError',
        count: stream.renders.length,
        error,
      })
      rejectNextRender?.(error)
    } finally {
      resetNextRender()
    }
  }

  let iteratorPosition = 0
  function Wrapper({children}: {children: React.ReactNode}) {
    return (
      <RenderStreamContextProvider value={renderStreamContext}>
        <React.Profiler id="test" onRender={profilerOnRender}>
          {children}
        </React.Profiler>
      </RenderStreamContextProvider>
    )
  }

  const render: RenderWithoutActAsync = (async (
    ui: React.ReactNode,
    options?: RenderOptions<any, any, any>,
  ) => {
    const ret = await renderWithoutAct(ui, {
      ...options,
      wrapper: props => {
        const ParentWrapper = options?.wrapper ?? React.Fragment
        return (
          <ParentWrapper>
            <Wrapper>{props.children}</Wrapper>
          </ParentWrapper>
        )
      },
    })
    if (stream.renders.length === 0) {
      await stream.waitForNextRender()
    }
    const origRerender = ret.rerender
    ret.rerender = async function rerender(rerenderUi: React.ReactNode) {
      const previousRenderCount = stream.renders.length
      try {
        return await origRerender(rerenderUi)
      } finally {
        // only wait for the next render if the rerender was not
        // synchronous (React 17)
        if (previousRenderCount === stream.renders.length) {
          await stream.waitForNextRender()
        }
      }
    }
    return ret
  }) as unknown as RenderWithoutActAsync // TODO

  Object.assign<typeof stream, typeof stream>(stream, {
    replaceSnapshot,
    mergeSnapshot,
    renders: new Array<
      | Render<Snapshot, Q>
      | {phase: 'snapshotError'; count: number; error: unknown}
    >(),
    totalRenderCount() {
      return stream.renders.length
    },
    async peekRender(options: NextRenderOptions = {}) {
      try {
        if (iteratorPosition < stream.renders.length) {
          const peekedRender = stream.renders[iteratorPosition]

          if (peekedRender.phase === 'snapshotError') {
            throw peekedRender.error
          }

          return peekedRender
        }
        return await stream
          .waitForNextRender(options)
          .catch(rethrowWithCapturedStackTrace(stream.peekRender))
      } finally {
        /** drain microtask queue */
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, 0)
        })
      }
    },
    takeRender: markAssertable(async function takeRender(
      options: NextRenderOptions = {},
    ) {
      let error: unknown

      try {
        return await stream.peekRender({
          ...options,
        })
      } catch (e) {
        if (e instanceof Object) {
          Error.captureStackTrace(e, stream.takeRender)
        }
        error = e
        throw e
      } finally {
        if (!(error && error instanceof WaitForRenderTimeoutError)) {
          iteratorPosition++
        }
      }
    }, stream),
    getCurrentRender() {
      // The "current" render should point at the same render that the most
      // recent `takeRender` call returned, so we need to get the "previous"
      // iterator position, otherwise `takeRender` advances the iterator
      // to the next render. This means we need to call `takeRender` at least
      // once before we can get a current render.
      const currentPosition = iteratorPosition - 1

      if (currentPosition < 0) {
        throw new Error(
          'No current render available. You need to call `takeRender` before you can get the current render.',
        )
      }

      const currentRender = stream.renders[currentPosition]

      if (currentRender.phase === 'snapshotError') {
        throw currentRender.error
      }
      return currentRender
    },
    waitForNextRender({timeout = 1000}: NextRenderOptions = {}) {
      if (!nextRender) {
        nextRender = Promise.race<Render<Snapshot, Q>>([
          new Promise<Render<Snapshot, Q>>((resolve, reject) => {
            resolveNextRender = resolve
            rejectNextRender = reject
          }),
          new Promise<Render<Snapshot, Q>>((_, reject) =>
            setTimeout(() => {
              const error = new WaitForRenderTimeoutError()
              Error.captureStackTrace(error, stream.waitForNextRender)
              reject(error)
              resetNextRender()
            }, timeout),
          ),
        ])
      }
      return nextRender
    },
    render,
  })
  return stream
}

function rethrowWithCapturedStackTrace(constructorOpt: Function | undefined) {
  return function catchFn(error: unknown) {
    if (error instanceof Object) {
      Error.captureStackTrace(error, constructorOpt)
    }
    throw error
  }
}
