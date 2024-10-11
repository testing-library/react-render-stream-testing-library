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

<a style="display: flex; justify-content: center; height: 40px; margin: 1em" href="https://www.apollographql.com/">
<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 253 87" fill="none"><path fill="#15252D" d="M141.613 50.612a16.232 16.232 0 0 1-6.217 6.445c-2.663 1.55-5.695 2.325-9.099 2.325-3.403 0-6.435-.775-9.098-2.325a16.215 16.215 0 0 1-6.217-6.445c-1.483-2.746-2.225-5.82-2.224-9.224 0-3.404.742-6.478 2.224-9.225a16.227 16.227 0 0 1 6.217-6.444c2.662-1.55 5.695-2.325 9.098-2.325 3.404 0 6.437.774 9.099 2.325a16.244 16.244 0 0 1 6.217 6.444c1.482 2.747 2.224 5.822 2.224 9.225 0 3.404-.741 6.479-2.224 9.224Zm-23.908-3.26c.809 1.753 1.955 3.126 3.437 4.12 1.483.993 3.201 1.49 5.156 1.49 1.921 0 3.622-.496 5.105-1.49 1.483-.994 2.628-2.367 3.437-4.12.809-1.752 1.213-3.74 1.213-5.964s-.404-4.212-1.213-5.964c-.809-1.752-1.954-3.126-3.437-4.12-1.483-.994-3.184-1.491-5.105-1.49-1.955 0-3.673.496-5.156 1.49-1.482.994-2.628 2.367-3.437 4.12-.809 1.752-1.213 3.74-1.213 5.964s.404 4.212 1.213 5.964ZM249.781 50.612a16.232 16.232 0 0 1-6.217 6.445c-2.663 1.55-5.695 2.325-9.099 2.325-3.403 0-6.435-.775-9.098-2.325a16.215 16.215 0 0 1-6.217-6.445c-1.483-2.746-2.225-5.82-2.224-9.224 0-3.404.742-6.478 2.224-9.225a16.227 16.227 0 0 1 6.217-6.444c2.662-1.55 5.695-2.325 9.098-2.325 3.404 0 6.437.774 9.099 2.325a16.244 16.244 0 0 1 6.217 6.444c1.482 2.747 2.224 5.822 2.224 9.225 0 3.404-.741 6.479-2.224 9.224Zm-23.908-3.26c.809 1.753 1.955 3.126 3.437 4.12 1.483.993 3.201 1.49 5.156 1.49 1.921 0 3.622-.496 5.105-1.49 1.483-.994 2.628-2.367 3.437-4.12.809-1.752 1.213-3.74 1.213-5.964s-.404-4.212-1.213-5.964c-.809-1.752-1.954-3.126-3.437-4.12-1.483-.994-3.184-1.491-5.105-1.49-1.955 0-3.673.496-5.156 1.49-1.482.994-2.628 2.367-3.437 4.12-.809 1.752-1.213 3.74-1.213 5.964s.404 4.212 1.213 5.964ZM58.86 52.87l-1.669-4.742-2.197-6.244-1.59-4.52-2.081-5.913-2.417-6.87H37.18l-1.872 5.32-1.669 4.742-8.287 23.551h7.733l2.426-6.874H47.24l-2.081-5.914h-7.574l1.59-4.519 3.32-9.436.549-1.562.549 1.562 9.406 26.738.002.006h7.734L58.86 52.87ZM97.536 27.589c1.752 2.005 2.628 4.591 2.628 7.758 0 3.336-.868 6.024-2.603 8.062-1.736 2.04-4.423 3.058-8.062 3.058h-10.11v11.727h-7.733V24.58H89.5c3.605 0 6.284 1.003 8.037 3.008ZM87.073 40.503c1.786 0 3.083-.455 3.892-1.365.809-.91 1.213-2.156 1.213-3.74 0-3.235-1.685-4.853-5.054-4.853H79.39v9.958h7.683ZM161.94 24.581v27.497h15.72v6.116h-23.453V24.581h7.733ZM193.944 24.581v27.497h15.72v6.116h-23.453V24.581h7.733Z"/><path fill="#15252D" d="M66.644 13.647a4.482 4.482 0 1 0-2.562-8.16 43.052 43.052 0 1 0 3.566 72.898 1.756 1.756 0 0 0-2.01-2.88 39.534 39.534 0 1 1-3.423-67.039 4.485 4.485 0 0 0 4.428 5.18Z"/>
  <style>
    path {
      fill: #15252D;
    }
    @media (prefers-color-scheme: dark) {
      path {
        fill: #feeadb;
      }
    }
  </style>
</svg>
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

> [!INFO]
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
