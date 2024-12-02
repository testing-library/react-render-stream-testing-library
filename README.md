# @testing-library/react-render-stream

## What is this library?

This library allows you to make committed-render-to-committed-render assertions
on your React components and hooks. This is usually not necessary, but can be
highly beneficial when testing hot code paths.

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
  const utils = await render(<Counter />)
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
const {takeRender, render} = createRenderStream(options)
const utils = await render(<Component />, options)
```

you can also call

```js
const {takeRender, utils} = await renderToRenderStream(
  <Component />,
  combinedOptions,
)
```

### `renderHookToSnapshotStream`

Usage is very similar to RTL's `renderHook`, but you get a `snapshotStream`
object back that you can iterate with `takeSnapshot` calls.

```jsx
test('`useQuery` with `skip`', async () => {
  const {takeSnapshot, rerender} = await renderHookToSnapshotStream(
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

  await rerender({skip: true})
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
  await render(<App />)
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
  const utils = await render(<Counter />)
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

  const {takeRender, replaceSnapshot, utils} = await renderToRenderStream<{
    value: number
  }>({
    onRender(info) {
      // you can use `expect` here
      expect(info.count).toBe(info.snapshot.value + 1)
    },
  })
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

### `expect(...)[.not].toRerender()` and `expect(...)[.not].toRenderExactlyTimes(n)`

This library adds to matchers to `expect` that can be used like

```tsx
test('basic functionality', async () => {
  const {takeRender} = await renderToRenderStream(<RerenderingComponent />)

  await expect(takeRender).toRerender()
  await takeRender()

  // trigger a rerender somehow
  await expect(takeRender).toRerender()
  await takeRender()

  // ensure at the end of a test that no more renders will happen
  await expect(takeRender).not.toRerender()
  await expect(takeRender).toRenderExactlyTimes(2)
})
```

These matchers can be used on multiple different objects:

```ts
await expect(takeRender).toRerender()
await expect(renderStream).toRerender()
await expect(takeSnapshot).toRerender()
await expect(snapshotStream).toRerender()
```

> [!NOTE]
>
> By default, `.toRerender` and `toRenderExactlyTimes` will wait 100ms for
> renders or to ensure no more renders happens.
>
> You can modify that with the `timeout` option:
>
> ```js
> await expect(takeRender).not.toRerender({timeout: 300})
> ```

> [!TIP]
>
> If you don't want these matchers not to be automatically installed, you can
> import from `@testing-library/react-render-stream/pure` instead.  
> Keep in mind that if you use the `/pure` import, you have to call the
> `cleanup` export manually after each test.

## Usage side-by side with `@testing-library/react` or other tools that set `IS_REACT_ACT_ENVIRONMENT` or use `act`

This library is written in a way if should not be used with `act`, and it will
throw an error if `IS_REACT_ACT_ENVIRONMENT` is `true`.

React Testing Library usually sets `IS_REACT_ACT_ENVIRONMENT` to `true`
globally, and wraps some helpers like `userEvent.click` in `act` calls.

To use this library side-by-side with React Testing Library, we ship the
`disableActEnvironment` helper to undo these changes temporarily.

It returns a `Disposable` and can be used together with the `using` keyword to
automatically clean up once the scope is left:

```ts
test('my test', () => {
  using _disabledAct = disableActEnvironment()

  // your test code here

  // as soon as this scope is left, the environment will be cleaned up
})
```

If you cannot use `using`, you can also manually call the returned `cleanup`
function:

```ts
test('my test', () => {
  const {cleanup} = disableActEnvironment()

  try {
    // your test code here
  } finally {
    cleanup()
  }
})
```
