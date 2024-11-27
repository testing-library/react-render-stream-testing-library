const dispose: typeof Symbol.dispose =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  Symbol.dispose ?? Symbol.for('nodejs.dispose')

/**
 * Temporarily disable act warnings.
 *
 * https://github.com/reactwg/react-18/discussions/102
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
