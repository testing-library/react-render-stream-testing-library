import {disableActEnvironment} from './disableActEnvironment.js'

export function withDisabledActEnvironment<T>(cb: () => T): T {
  const disabledActWarnings = disableActEnvironment()
  let result: T | undefined
  try {
    result = cb()
    return result
  } finally {
    if (result != null && result instanceof Promise) {
      void result.finally(disabledActWarnings.cleanup)
    } else disabledActWarnings.cleanup()
  }
}
