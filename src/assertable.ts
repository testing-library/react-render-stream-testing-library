import {type RenderStream} from './renderStream/createRenderStream.js'

export const assertableSymbol = Symbol.for(
  '@testing-library/react-render-stream:assertable',
)

/**
 * A function or object that can be used in assertions, like e.g.
 ```ts
 expect(assertable).toRerender()
 expect(assertable).not.toRerender()
 expect(assertable).toRenderExactlyTimes(3)
 ```
 */
export type Assertable = {
  [assertableSymbol]: RenderStream<any>
}

export function markAssertable<T extends {}>(
  assertable: T,
  stream: RenderStream<any>,
): T & Assertable {
  return Object.assign(assertable, {
    [assertableSymbol]: stream,
  })
}
