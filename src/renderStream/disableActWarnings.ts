/**
 * Temporarily disable act warnings.
 *
 * https://github.com/reactwg/react-18/discussions/102
 */
export function disableActWarnings() {
  const anyThis = globalThis as any as {IS_REACT_ACT_ENVIRONMENT?: boolean}
  const prevActEnv = anyThis.IS_REACT_ACT_ENVIRONMENT
  anyThis.IS_REACT_ACT_ENVIRONMENT = false

  return {
    cleanup: () => {
      anyThis.IS_REACT_ACT_ENVIRONMENT = prevActEnv
    },
  }
}
