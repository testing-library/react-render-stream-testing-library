import {type RenderHookOptions} from '@testing-library/react/pure.js'
import React from 'rehackt'
import {createRenderStream} from './renderStream/createRenderStream.js'
import {type NextRenderOptions} from './renderStream/createRenderStream.js'
import {Render} from './renderStream/Render.js'
import {Assertable, assertableSymbol, markAssertable} from './assertable.js'

export interface SnapshotStream<Snapshot, Props> extends Assertable {
  /**
   * An array of all renders that have happened so far.
   * Errors thrown during component render will be captured here, too.
   */
  renders: Array<
    | Render<{value: Snapshot}, never>
    | {phase: 'snapshotError'; count: number; error: unknown}
  >
  /**
   * Peeks the next render from the current iterator position, without advancing the iterator.
   * If no render has happened yet, it will wait for the next render to happen.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  peekSnapshot(options?: NextRenderOptions): Promise<Snapshot>
  /**
   * Iterates to the next render and returns it.
   * If no render has happened yet, it will wait for the next render to happen.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  takeSnapshot: Assertable &
    ((options?: NextRenderOptions) => Promise<Snapshot>)
  /**
   * Returns the total number of renders.
   */
  totalSnapshotCount(): number
  /**
   * Returns the current render.
   * @throws {Error} if no render has happened yet
   */
  getCurrentSnapshot(): Snapshot
  /**
   * Waits for the next render to happen.
   * Does not advance the render iterator.
   */
  waitForNextSnapshot(options?: NextRenderOptions): Promise<Snapshot>
  rerender: (rerenderCallbackProps: Props) => Promise<void>
  unmount: () => void
}

export async function renderHookToSnapshotStream<ReturnValue, Props>(
  renderCallback: (props: Props) => ReturnValue,
  {initialProps, ...renderOptions}: RenderHookOptions<Props> = {},
): Promise<SnapshotStream<ReturnValue, Props>> {
  const {render, ...stream} = createRenderStream<{value: ReturnValue}, never>()

  const HookComponent: React.FC<{arg: Props}> = props => {
    stream.replaceSnapshot({value: renderCallback(props.arg)})
    return null
  }

  const {rerender: baseRerender, unmount} = await render(
    <HookComponent arg={initialProps!} />,
    renderOptions,
  )

  function rerender(rerenderCallbackProps: Props) {
    return baseRerender(<HookComponent arg={rerenderCallbackProps} />)
  }

  return {
    [assertableSymbol]: stream,
    renders: stream.renders,
    totalSnapshotCount: stream.totalRenderCount,
    async peekSnapshot(options) {
      return (await stream.peekRender(options)).snapshot.value
    },
    takeSnapshot: markAssertable(async function takeSnapshot(options) {
      return (await stream.takeRender(options)).snapshot.value
    }, stream),
    getCurrentSnapshot() {
      return stream.getCurrentRender().snapshot.value
    },
    async waitForNextSnapshot(options) {
      return (await stream.waitForNextRender(options)).snapshot.value
    },
    rerender,
    unmount,
  }
}
