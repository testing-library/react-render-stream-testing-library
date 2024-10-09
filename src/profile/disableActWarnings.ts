/**
 * Temporarily disable act warnings.
 *
 * https://github.com/reactwg/react-18/discussions/102
 */
export function disableActWarnings() {
  const anyThis = globalThis as any;
  const prevActEnv = anyThis.IS_REACT_ACT_ENVIRONMENT;
  anyThis.IS_REACT_ACT_ENVIRONMENT = false;

  return {
    [Symbol.dispose]() {
      anyThis.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
    },
  };
}
