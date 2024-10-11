/* eslint-disable default-case */
/* eslint-disable consistent-return */
function isStatefulPromise(promise) {
  return 'status' in promise
}
function wrapPromiseWithState(promise) {
  if (isStatefulPromise(promise)) {
    return promise
  }
  const pendingPromise = promise
  pendingPromise.status = 'pending'
  pendingPromise.then(
    value => {
      if (pendingPromise.status === 'pending') {
        const fulfilledPromise = pendingPromise
        fulfilledPromise.status = 'fulfilled'
        fulfilledPromise.value = value
      }
    },
    reason => {
      if (pendingPromise.status === 'pending') {
        const rejectedPromise = pendingPromise
        rejectedPromise.status = 'rejected'
        rejectedPromise.reason = reason
      }
    },
  )
  return promise
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @returns {T}
 */
export function __use(promise) {
  const statefulPromise = wrapPromiseWithState(promise)
  switch (statefulPromise.status) {
    case 'pending':
      throw statefulPromise
    case 'rejected':
      throw statefulPromise.reason
    case 'fulfilled':
      return statefulPromise.value
  }
}
