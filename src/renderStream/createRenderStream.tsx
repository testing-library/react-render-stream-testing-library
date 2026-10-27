import * as React from 'rehackt'

import {type RenderOptions} from '@testing-library/react/pure.js'
import {Assertable, markAssertable} from '../assertable.js'
import {
  renderWithoutAct,
  type RenderWithoutActAsync,
} from '../renderWithoutAct.js'
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
   * Resolves after the recorded commit's passive effects have run.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  peekRender: (options?: NextRenderOptions) => Promise<Render<Snapshot, Q>>
  /**
   * Iterates to the next render and returns it.
   * If no render has happened yet, it will wait for the next render to happen.
   * Resolves after the recorded commit's passive effects have run.
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
   * Resolves after its passive effects have run.
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
  /** Renders the UI and waits for the commit's passive effects to run. */
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

  type Commit = PromiseWithResolvers<
    (typeof stream.renders)[number] | undefined
  > & {
    finalize?: () => (typeof stream.renders)[number]
  }
  let nextRender: Promise<Render<Snapshot, Q>> | undefined,
    upcomingCommit: Commit | undefined
  const pendingCommits: Array<{commitTime: number; commit: Commit}> = []

  function nextCommit(): Commit {
    return (upcomingCommit ??=
      Promise.withResolvers<Awaited<Commit['promise']>>())
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
    const commit = nextCommit()
    upcomingCommit = undefined
    pendingCommits.push({commitTime, commit})
    if (/^(16|17)\./.test(React.version)) {
      // React 16/17 have no onPostCommit hook. Let the commit finish scheduling
      // passive effects before yielding a task for them to run.
      void Promise.resolve().then(() => {
        setTimeout(() => profilerOnPostCommit(id, phase, 0, commitTime), 0)
      })
    }
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
      count:
        stream.renders.length +
        pendingCommits.filter(pending => pending.commit.finalize).length +
        1,
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
      commit.finalize = () => {
        stream.renders.push(render)
        return render
      }
    } catch (error) {
      commit.finalize = () => {
        const err = {
          phase: 'snapshotError' as const,
          count: stream.renders.length,
          error,
        }
        stream.renders.push(err)
        return err
      }
    }
  }

  function profilerOnPostCommit(
    _id: string,
    _phase: string,
    _passiveEffectDuration: number,
    commitTime: number,
  ) {
    const index = pendingCommits.findIndex(
      pending => pending.commitTime === commitTime,
    )
    if (index === -1) return
    const {commit} = pendingCommits.splice(index, 1)[0]
    commit.resolve(commit.finalize?.())
  }

  let iteratorPosition = 0
  function Wrapper({children}: {children: React.ReactNode}) {
    return (
      <RenderStreamContextProvider value={renderStreamContext}>
        <React.Profiler
          id="test"
          onRender={profilerOnRender}
          // Supported in React 18+ development/profiling builds, but untyped.
          {...{onPostCommit: profilerOnPostCommit}}
        >
          {children}
        </React.Profiler>
      </RenderStreamContextProvider>
    )
  }

  const render: RenderWithoutActAsync = (async (
    ui: React.ReactNode,
    options?: RenderOptions<any, any, any>,
  ) => {
    const commit = nextCommit()
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
    await waitForCommit(commit)
    const origRerender = ret.rerender
    ret.rerender = async function rerender(rerenderUi: React.ReactNode) {
      const rerenderCommit = nextCommit()
      await origRerender(rerenderUi)
      await waitForCommit(rerenderCommit)
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
      if (iteratorPosition < stream.renders.length) {
        const peekedRender = stream.renders[iteratorPosition]

        if (peekedRender.phase === 'snapshotError') {
          throw peekedRender.error
        }

        return peekedRender
      }
      return stream
        .waitForNextRender(options)
        .catch(rethrowWithCapturedStackTrace(stream.peekRender))
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
        const position = stream.renders.length
        const wait = {active: true}
        let timer: ReturnType<typeof setTimeout> | undefined
        nextRender = Promise.race<Render<Snapshot, Q>>([
          (async () => {
            while (wait.active && stream.renders.length === position) {
              // A skipped commit completes without publishing a snapshot.
              // eslint-disable-next-line no-await-in-loop
              await (pendingCommits[0]?.commit ?? nextCommit()).promise
            }
            if (!wait.active) throw new WaitForRenderTimeoutError()
            const next = stream.renders[position]
            if (next.phase === 'snapshotError') throw next.error
            return next
          })(),
          new Promise<Render<Snapshot, Q>>((_, reject) => {
            timer = setTimeout(() => {
              const error = new WaitForRenderTimeoutError()
              Error.captureStackTrace(error, stream.waitForNextRender)
              reject(error)
            }, timeout)
          }),
        ]).finally(() => {
          wait.active = false
          clearTimeout(timer)
          nextRender = undefined
        })
      }
      return nextRender
    },
    render,
  })
  return stream

  async function waitForCommit(commit: Commit) {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        commit.promise.then(result => {
          if (result?.phase === 'snapshotError') throw result.error
          return result
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new WaitForRenderTimeoutError()),
            1000,
          )
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  }
}

function rethrowWithCapturedStackTrace(constructorOpt: Function | undefined) {
  return function catchFn(error: unknown) {
    if (error instanceof Object) {
      Error.captureStackTrace(error, constructorOpt)
    }
    throw error
  }
}
