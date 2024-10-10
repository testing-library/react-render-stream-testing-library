import { RenderHookOptions } from "@testing-library/react";
import { createRenderStream } from "./renderStream/createRenderStream.js";
import type { NextRenderOptions } from "./renderStream/createRenderStream.js";

import { Render } from "./renderStream/Render.js";
import { createElement } from "react";
import { Assertable, assertableSymbol, markAssertable } from "./assertable.js";

export interface SnapshotStream<Snapshot, Props> extends Assertable {
  /**
   * An array of all renders that have happened so far.
   * Errors thrown during component render will be captured here, too.
   */
  renders: Array<
    | Render<{ value: Snapshot }>
    | { phase: "snapshotError"; count: number; error: unknown }
  >;
  /**
   * Peeks the next render from the current iterator position, without advancing the iterator.
   * If no render has happened yet, it will wait for the next render to happen.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  peekSnapshot(options?: NextRenderOptions): Promise<Snapshot>;
  /**
   * Iterates to the next render and returns it.
   * If no render has happened yet, it will wait for the next render to happen.
   * @throws {WaitForRenderTimeoutError} if no render happens within the timeout
   */
  takeSnapshot: Assertable &
    ((options?: NextRenderOptions) => Promise<Snapshot>);
  /**
   * Returns the total number of renders.
   */
  totalSnapshotCount(): number;
  /**
   * Returns the current render.
   * @throws {Error} if no render has happened yet
   */
  getCurrentSnapshot(): Snapshot;
  /**
   * Waits for the next render to happen.
   * Does not advance the render iterator.
   */
  waitForNextSnapshot(options?: NextRenderOptions): Promise<Snapshot>;
  rerender: (rerenderCallbackProps: Props) => void;
  unmount: () => void;
}

export function renderHookToSnapshotStream<ReturnValue, Props extends {}>(
  renderCallback: (props: Props) => ReturnValue,
  { initialProps, ...options }: RenderHookOptions<Props> = {}
): SnapshotStream<ReturnValue, Props> {
  const { render, ...stream } = createRenderStream<{ value: ReturnValue }>();

  const HookComponent: React.FC<Props> = (props) => {
    stream.replaceSnapshot({ value: renderCallback(props) });
    return null;
  };

  const { rerender: baseRerender, unmount } = render(
    createElement(HookComponent, initialProps),
    options
  );

  function rerender(rerenderCallbackProps: Props) {
    return baseRerender(createElement(HookComponent, rerenderCallbackProps));
  }

  return {
    [assertableSymbol]: stream,
    renders: stream.renders,
    totalSnapshotCount: stream.totalRenderCount,
    async peekSnapshot(options) {
      return (await stream.peekRender(options)).snapshot.value;
    },
    takeSnapshot: markAssertable(async function takeSnapshot(options) {
      return (await stream.takeRender(options)).snapshot.value;
    }, stream),
    getCurrentSnapshot() {
      return stream.getCurrentRender().snapshot.value;
    },
    async waitForNextSnapshot(options) {
      return (await stream.waitForNextRender(options)).snapshot.value;
    },
    rerender,
    unmount,
  };
}
