// eslint-disable-next-line no-control-regex
const consoleColors = /\x1b\[\d+m/g

export function getExpectErrorMessage(
  expectPromise: Promise<unknown>,
): Promise<string> {
  return expectPromise.then(
    () => {
      throw new Error('Expected promise to fail, but did not.')
    },
    e => {
      const error = e as Error
      return error.message.replace(consoleColors, '')
    },
  )
}
