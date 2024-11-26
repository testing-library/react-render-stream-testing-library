/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {EventEmitter} from 'node:events'
import {test, expect} from '@jest/globals'
import {renderHookToSnapshotStream} from '@testing-library/react-render-stream'
import * as React from 'react'
import {withDisabledActWarnings} from '../__testHelpers__/withDisabledActWarnings.js'

// @ts-expect-error this is not defined anywhere
globalThis.IS_REACT_ACT_ENVIRONMENT = false

const testEvents = new EventEmitter<{
  rerenderWithValue: [unknown]
}>()

function useRerenderEvents(initialValue: unknown) {
  const lastValueRef = React.useRef(initialValue)
  return React.useSyncExternalStore(
    onChange => {
      const cb = (value: unknown) => {
        lastValueRef.current = value
        withDisabledActWarnings(onChange)
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
  const {takeSnapshot} = renderHookToSnapshotStream(useRerenderEvents, {
    initialProps: 'initial',
  })
  {
    const snapshot = await takeSnapshot()
    expect(snapshot).toBe('initial')
  }
  testEvents.emit('rerenderWithValue', 'value')
  await Promise.resolve()
  testEvents.emit('rerenderWithValue', 'value2')
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
  const {takeSnapshot} = renderHookToSnapshotStream(useRerenderEvents, {
    initialProps: initialValue,
  })
  expect(await takeSnapshot()).toBe(initialValue)
  for (const nextValue of nextValues) {
    testEvents.emit('rerenderWithValue', nextValue)
    // allow for a render to happen
    await Promise.resolve()
  }
  for (const nextValue of nextValues) {
    expect(await takeSnapshot()).toBe(nextValue)
  }
})
