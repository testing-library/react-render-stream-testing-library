import {disableActWarnings} from '../renderStream/disableActWarnings.js'

export function withDisabledActWarnings<T>(cb: () => T): T {
  const disabledActWarnings = disableActWarnings()
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
