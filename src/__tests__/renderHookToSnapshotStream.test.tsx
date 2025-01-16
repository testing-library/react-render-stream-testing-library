/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {EventEmitter} from 'node:events'
import {scheduler} from 'node:timers/promises'
import {test, expect} from '@jest/globals'
import {
  renderHookToSnapshotStream,
  SnapshotStream,
} from '@testing-library/react-render-stream'
import * as React from 'react'

const testEvents = new EventEmitter<{
  rerenderWithValue: [unknown]
}>()

function useRerenderEvents(initialValue: unknown) {
  const lastValueRef = React.useRef(initialValue)
  return React.useSyncExternalStore(
    onChange => {
      const cb = (value: unknown) => {
        lastValueRef.current = value
        onChange()
      }
      testEvents.addListener('rerenderWithValue', cb)
      return () => {
        testEvents.removeListener('rerenderWithValue', cb)
      }
    },
    () => {
      return lastValueRef.current
    },
  )
}

test('basic functionality', async () => {
  const {takeSnapshot} = await renderHookToSnapshotStream(useRerenderEvents, {
    initialProps: 'initial',
  })
  testEvents.emit('rerenderWithValue', 'value')
  await scheduler.wait(10)
  testEvents.emit('rerenderWithValue', 'value2')
  {
    const snapshot = await takeSnapshot()
    expect(snapshot).toBe('initial')
  }
  {
    const snapshot = await takeSnapshot()
    expect(snapshot).toBe('value')
  }
  {
    const snapshot = await takeSnapshot()
    expect(snapshot).toBe('value2')
  }
})

test.each<[type: string, initialValue: unknown, ...nextValues: unknown[]]>([
  ['string', 'initial', 'value', 'value2'],
  ['number', 0, 1, 2],
  ['functions', () => {}, () => {}, function named() {}],
  ['objects', {a: 1}, {a: 2}, {foo: 'bar'}],
  ['arrays', [1], [1, 2], [2]],
  ['null/undefined', null, undefined, null],
  ['undefined/null', undefined, null, undefined],
])('works with %s', async (_, initialValue, ...nextValues) => {
  const {takeSnapshot} = await renderHookToSnapshotStream(useRerenderEvents, {
    initialProps: initialValue,
  })
  for (const nextValue of nextValues) {
    testEvents.emit('rerenderWithValue', nextValue)
    // allow for a render to happen
    await Promise.resolve()
  }
  expect(await takeSnapshot()).toBe(initialValue)
  for (const nextValue of nextValues) {
    expect(await takeSnapshot()).toBe(nextValue)
  }
})

test.skip('type test: render function without an argument -> no argument required for `rerender`', async () => {
  {
    // prop type has nothing to infer on - defaults to `void`
    const stream = await renderHookToSnapshotStream(() => {})
    const _test1: SnapshotStream<void, void> = stream
    // @ts-expect-error should not be assignable
    const _test2: SnapshotStream<void, string> = stream
    await stream.rerender()
    // @ts-expect-error invalid argument
    await stream.rerender('foo')
  }
  {
    // prop type is implicitly set via the render function argument
    const stream = await renderHookToSnapshotStream((_arg1: string) => {})
    // @ts-expect-error should not be assignable
    const _test1: SnapshotStream<void, void> = stream
    const _test2: SnapshotStream<void, string> = stream
    // @ts-expect-error missing argument
    await stream.rerender()
    await stream.rerender('foo')
  }
  {
    // prop type is implicitly set via the initialProps argument
    const stream = await renderHookToSnapshotStream(() => {}, {
      initialProps: 'initial',
    })
    // @ts-expect-error should not be assignable
    const _test1: SnapshotStream<void, void> = stream
    const _test2: SnapshotStream<void, string> = stream
    // @ts-expect-error missing argument
    await stream.rerender()
    await stream.rerender('foo')
  }
  {
    // argument is optional
    const stream = await renderHookToSnapshotStream((_arg1?: string) => {})

    const _test1: SnapshotStream<void, void> = stream
    const _test2: SnapshotStream<void, string> = stream
    const _test3: SnapshotStream<void, string | undefined> = stream
    await stream.rerender()
    await stream.rerender('foo')
  }
})
