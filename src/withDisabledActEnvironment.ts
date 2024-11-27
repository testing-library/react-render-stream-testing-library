import {disableActEnvironment} from './disableActEnvironment.js'

export function withDisabledActEnvironment<T>(cb: () => T): T {
  const disabledActWarnings = disableActEnvironment()
  let result: T
  try {
    result = cb()
    return result instanceof Promise
      ? (result.finally(disabledActWarnings.cleanup) as T)
      : result
  } finally {
    disabledActWarnings.cleanup()
  }
}
