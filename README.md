# @testing-library/react-render-stream

## What is this library?

This library allows you to make render-per-render asserions on your React
components and hooks. This is usually not necessary, but can be highly
beneficial when testing hot code paths.

## Who is this library for?

This library is intended to test libraries or library-like code. It requires you
to write additional components so you can test how your components interact with
other components in specific scenarios.

As such, it is not intended to be used for end-to-end testing of your
application.

## Brought to you by Apollo

<a style="display: flex; justify-content: center; height: 40px; margin: 1em" href="https://www.apollographql.com/"><img src="./other/apollo-wordmark.svg" height="40" alt="">
</a>

This library originally was part of the Apollo Client test suite and is
maintained by the Apollo Client team.

### Usage examples:

#### `createRenderStream` with DOM snapshots

If used with `snapshotDOM`, RSTL will create a snapshot of your DOM after every
render, and you can iterate through all the intermediate states of your DOM at
your own pace, independenly of how fast these renders actually happened.

```jsx
test('iterate through renders with DOM snapshots', async () => {
  const {takeRender, render} = createRenderStream({
    snapshotDOM: true,
  })
  const utils = render(<Counter />)
  const incrementButton = utils.getByText('Increment')
  await userEvent.click(incrementButton)
  await userEvent.click(incrementButton)
  {
    const {withinDOM} = await takeRender()
    const input = withinDOM().getByLabelText('Value')
    expect(input.value).toBe('0')
  }
  {
    const {withinDOM} = await takeRender()
    const input = withinDOM().getByLabelText('Value')
    expect(input.value).toBe('1')
  }
  {
    const {withinDOM} = await takeRender()
    const input = withinDOM().getByLabelText('Value')
    expect(input.value).toBe('2')
  }
})
```

### `renderToRenderStream` as a shortcut for `createRenderStream` and calling `render`

In every place you would call

```js
const renderStream = createRenderStream(options)
const utils = renderStream.render(<Component />, options)
```

you can also call

```js
const renderStream = renderToRenderStream(<Component />, combinedOptions)
// if required
const utils = await renderStream.renderResultPromise
```

This might be shorter (especially in cases where you don't need to access
`utils`), but keep in mind that the render is executed **asynchronously** after
calling `renderToRenderStream`, and that you need to `await renderResultPromise`
if you need access to `utils` as returned by `render`.

### `renderHookToSnapshotStream`

Usage is very similar to RTL's `renderHook`, but you get a `snapshotStream`
object back that you can iterate with `takeSnapshot` calls.

```jsx
test('`useQuery` with `skip`', async () => {
  const {takeSnapshot, rerender} = renderHookToSnapshotStream(
    ({skip}) => useQuery(query, {skip}),
    {
      wrapper: ({children}) => <Provider client={client}>{children}</Provider>,
    },
  )

  {
    const result = await takeSnapshot()
    expect(result.loading).toBe(true)
    expect(result.data).toBe(undefined)
  }
  {
    const result = await takeSnapshot()
    expect(result.loading).toBe(false)
    expect(result.data).toEqual({hello: 'world 1'})
  }

  rerender({skip: true})
  {
    const snapshot = await takeSnapshot()
    expect(snapshot.loading).toBe(false)
    expect(snapshot.data).toEqual(undefined)
  }
})
```

### Tracking which components rerender with `useTrackRenders`

You can track if a component was rerendered during a specific render by calling
`useTrackRenders` within it.

```jsx
test('`useTrackRenders` with suspense', async () => {
  function ErrorComponent() {
    useTrackRenders()
    // return ...
  }
  function DataComponent() {
    useTrackRenders()
    const data = useSuspenseQuery(someQuery)
    // return ...
  }
  function LoadingComponent() {
    useTrackRenders()
    // return ...
  }
  function App() {
    useTrackRenders()
    return (
      <ErrorBoundary FallbackComponent={ErrorComponent}>
        <React.Suspense fallback={<LoadingComponent />}>
          <DataComponent />
        </React.Suspense>
      </ErrorBoundary>
    )
  }

  const {takeRender, render} = createRenderStream()
  render(<App />)
  {
    const {renderedComponents} = await takeRender()
    expect(renderedComponents).toEqual([App, LoadingComponent])
  }
  {
    const {renderedComponents} = await takeRender()
    expect(renderedComponents).toEqual([DataComponent])
  }
})
```

> [!NOTE]
>
> The order of components in `renderedComponents` is the order of execution of
> `useLayoutEffect`. Keep in mind that this might not be the order you would
> expect.

### taking custom snapshots inside of helper Components with `replaceSnapshot`

If you need to, you can also take custom snapshots of data in each render.

```tsx
test('custom snapshots with `replaceSnapshot`', async () => {
  function Counter() {
    const [value, setValue] = React.useState(0)
    replaceSnapshot({value})
    // return ...
  }

  const {takeRender, replaceSnapshot, render} = createRenderStream<{
    value: number
  }>()
  const utils = render(<Counter />)
  const incrementButton = utils.getByText('Increment')
  await userEvent.click(incrementButton)
  {
    const {snapshot} = await takeRender()
    expect(snapshot).toEqual({value: 0})
  }
  {
    const {snapshot} = await takeRender()
    expect(snapshot).toEqual({value: 1})
  }
})
```

> [!TIP]
>
> `replaceSnapshot` can also be called with a callback that gives you access to
> the last snapshot value.

> [!TIP]
>
> You can also use `mergeSnapshot`, which shallowly merges the last snapshot
> with the new one instead of replacing it.

### Making assertions directly after a render with `onRender`

```tsx
test('assertions in `onRender`', async () => {
  function Counter() {
    const [value, setValue] = React.useState(0)
    replaceSnapshot({value})
    return (
      <CounterForm value={value} onIncrement={() => setValue(v => v + 1)} />
    )
  }

  const {takeRender, replaceSnapshot, renderResultPromise} =
    renderToRenderStream<{
      value: number
    }>({
      onRender(info) {
        // you can use `expect` here
        expect(info.count).toBe(info.snapshot.value + 1)
      },
    })
  const utils = await renderResultPromise
  const incrementButton = utils.getByText('Increment')
  await userEvent.click(incrementButton)
  await userEvent.click(incrementButton)
  await takeRender()
  await takeRender()
  await takeRender()
})
```

> [!NOTE]
>
> `info` contains the
> [base profiling information](https://react.dev/reference/react/Profiler#onrender-parameters)
> passed into `onRender` of React's `Profiler` component, as well as `snapshot`,
> `replaceSnapshot` and `mergeSnapshot`

## A note on `act`.

You might want to avoid using this library with `act`, as `act`
[can end up batching multiple renders](https://github.com/facebook/react/issues/30031#issuecomment-2183951296)
into one in a way that would not happen in a production application.

While that is convenient in a normal test suite, it defeats the purpose of this
library.

Keep in mind that tools like `userEvent.click` use `act` internally. Many of
those calls would only trigger one render anyways, so it can be okay to use
them, but avoid this for longer-running actions inside of `act` calls.
