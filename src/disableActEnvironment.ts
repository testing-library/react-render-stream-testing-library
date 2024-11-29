const dispose: typeof Symbol.dispose =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  Symbol.dispose ?? Symbol.for('nodejs.dispose')

/**
 * Helper to temporarily disable a React 18+ act environment.
 *
 * This returns a disposable and can be used in combination with `using` to
 * automatically restore the state from before this method call after your test.
 *
 * @example
 * ```ts
 * test("my test", () => {
 *   using _disabledAct = disableActEnvironment();
 *
 *   // your test code here
 *
 *   // as soon as this scope is left, the environment will be cleaned up
 * })
 * ```
 *
 * If you can not use the explicit resouce management keyword `using`,
 * you can also manually call `cleanup`:
 *
 * @example
 * ```ts
 * test("my test", () => {
 *   const { cleanup } = disableActEnvironment();
 *
 *   // your test code here
 *
 *   cleanup();
 * })
 */
export function disableActEnvironment(): {cleanup: () => void} & Disposable {
  const anyThis = globalThis as any as {IS_REACT_ACT_ENVIRONMENT?: boolean}
  const prevActEnv = anyThis.IS_REACT_ACT_ENVIRONMENT
  anyThis.IS_REACT_ACT_ENVIRONMENT = false

  function cleanup() {
    anyThis.IS_REACT_ACT_ENVIRONMENT = prevActEnv
  }
  return {
    cleanup,
    [dispose]: cleanup,
  }
}
