/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {EventEmitter} from 'node:events'
import {describe, test, expect} from '@jest/globals'
import {
  createRenderStream,
  renderHookToSnapshotStream,
} from '@testing-library/react-render-stream'
import * as React from 'react'
import {getExpectErrorMessage} from '../../__testHelpers__/getCleanedErrorMessage.js'
import {withDisabledActWarnings} from '../../__testHelpers__/withDisabledActWarnings.js'

const testEvents = new EventEmitter<{
  rerender: []
}>()

function useRerender() {
  const [, rerender] = React.useReducer(c => c + 1, 0)
  React.useEffect(() => {
    const cb = () => void withDisabledActWarnings(rerender)

    testEvents.addListener('rerender', cb)
    return () => {
      testEvents.removeListener('rerender', cb)
    }
  }, [])
}

function RerenderingComponent() {
  useRerender()
  return null
}

describe('toRerender', () => {
  test('basic functionality', async () => {
    const {takeRender, render} = createRenderStream({})

    render(<RerenderingComponent />)
    await expect(takeRender).toRerender()
    await takeRender()

    testEvents.emit('rerender')
    await expect(takeRender).toRerender()
    await takeRender()

    await expect(takeRender).not.toRerender()
  })

  test('works with renderStream object', async () => {
    const renderStream = createRenderStream({})

    renderStream.render(<RerenderingComponent />)
    await expect(renderStream).toRerender()
    await renderStream.takeRender()

    testEvents.emit('rerender')
    await expect(renderStream).toRerender()
    await renderStream.takeRender()

    await expect(renderStream).not.toRerender()
  })

  test('works with takeSnapshot function', async () => {
    const {takeSnapshot} = renderHookToSnapshotStream(() => useRerender())

    await expect(takeSnapshot).toRerender()
    await takeSnapshot()

    testEvents.emit('rerender')
    await expect(takeSnapshot).toRerender()
    await takeSnapshot()

    await expect(takeSnapshot).not.toRerender()
  })

  test('works with snapshotStream', async () => {
    const snapshotStream = renderHookToSnapshotStream(() => useRerender())

    await expect(snapshotStream).toRerender()
    await snapshotStream.takeSnapshot()

    testEvents.emit('rerender')
    await expect(snapshotStream).toRerender()
    await snapshotStream.takeSnapshot()

    await expect(snapshotStream).not.toRerender()
  })

  test("errors when it rerenders, but shouldn't", async () => {
    const {takeRender, render} = createRenderStream({})

    render(<RerenderingComponent />)
    await expect(takeRender).toRerender()
    await takeRender()

    testEvents.emit('rerender')
    const error = await getExpectErrorMessage(
      expect(takeRender).not.toRerender(),
    )
    expect(error).toMatchInlineSnapshot(`
expect(received).not.toRerender(expected)

Expected component to not rerender, but it did.
`)
  })

  test("errors when it should rerender, but doesn't", async () => {
    const {takeRender, render} = createRenderStream({})

    render(<RerenderingComponent />)
    await expect(takeRender).toRerender()
    await takeRender()

    const error = await getExpectErrorMessage(expect(takeRender).toRerender())
    expect(error).toMatchInlineSnapshot(`
expect(received).toRerender(expected)

Expected component to rerender, but it did not.
`)
  })
})

describe('toRenderExactlyTimes', () => {
  test('basic functionality', async () => {
    const {takeRender, render} = createRenderStream({})

    render(<RerenderingComponent />)
    testEvents.emit('rerender')

    await expect(takeRender).toRenderExactlyTimes(2)
  })

  test('works with renderStream object', async () => {
    const renderStream = createRenderStream({})

    renderStream.render(<RerenderingComponent />)
    testEvents.emit('rerender')

    await expect(renderStream).toRenderExactlyTimes(2)
  })

  test('works with takeSnapshot function', async () => {
    const {takeSnapshot} = renderHookToSnapshotStream(() => useRerender())
    testEvents.emit('rerender')

    await expect(takeSnapshot).toRenderExactlyTimes(2)
  })

  test('works with snapshotStream', async () => {
    const snapshotStream = renderHookToSnapshotStream(() => useRerender())
    testEvents.emit('rerender')

    await expect(snapshotStream).toRenderExactlyTimes(2)
  })

  test('errors when the count of rerenders is wrong', async () => {
    const {takeRender, render} = createRenderStream({})

    render(<RerenderingComponent />)
    testEvents.emit('rerender')

    const error = await getExpectErrorMessage(
      expect(takeRender).toRenderExactlyTimes(3),
    )
    expect(error).toMatchInlineSnapshot(`
expect(received).toRenderExactlyTimes(expected)

Expected component to render exactly 3 times.
It rendered 2 times.
`)
  })

  test('errors when the count of rerenders is right (inverted)', async () => {
    const {takeRender, render} = createRenderStream({})

    render(<RerenderingComponent />)
    testEvents.emit('rerender')

    const error = await getExpectErrorMessage(
      expect(takeRender).not.toRenderExactlyTimes(2),
    )
    expect(error).toMatchInlineSnapshot(`
expect(received).not.toRenderExactlyTimes(expected)

Expected component to not render exactly 2 times.
It rendered 2 times.
`)
  })
})
