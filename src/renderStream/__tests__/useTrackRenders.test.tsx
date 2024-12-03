/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {jest, describe, test, expect, beforeEach} from '@jest/globals'
import {
  createRenderStream,
  useTrackRenders,
} from '@testing-library/react-render-stream'
import * as React from 'react'
import {ErrorBoundary} from 'react-error-boundary'
import {__use} from '../../__testHelpers__/useShim.js'

type AsyncState =
  | {status: 'loading'}
  | {status: 'success'; data: string}
  | {status: 'error'; error: Error}

describe('non-suspense use cases', () => {
  let asyncAction = Promise.withResolvers<string>()
  beforeEach(() => {
    asyncAction = Promise.withResolvers<string>()
    void asyncAction.promise.catch(() => {
      /* avoid uncaught promise rejection */
    })
  })
  function ErrorComponent() {
    useTrackRenders()
    return null
  }
  function DataComponent() {
    useTrackRenders()
    return null
  }
  function LoadingComponent() {
    useTrackRenders()
    return null
  }
  function App() {
    useTrackRenders()
    const [state, setState] = React.useState<AsyncState>({status: 'loading'})
    React.useEffect(() => {
      let canceled = false
      void (async function iife() {
        try {
          const data = await asyncAction.promise
          if (canceled) return
          setState({status: 'success', data})
        } catch (error: any) {
          if (canceled) return
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          setState({status: 'error', error})
        }
      })()
      return () => {
        canceled = true
      }
    }, [asyncAction.promise])
    return state.status === 'loading' ? (
      <LoadingComponent />
    ) : state.status === 'error' ? (
      <ErrorComponent />
    ) : (
      <DataComponent />
    )
  }

  test('basic functionality', async () => {
    const {takeRender, render} = createRenderStream()
    await render(<App />)
    asyncAction.resolve('data')
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([App, LoadingComponent])
    }
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([App, DataComponent])
    }
  })

  test('error path', async () => {
    const {takeRender, render} = createRenderStream()
    await render(<App />)
    asyncAction.reject(new Error('error'))
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([App, LoadingComponent])
    }
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([App, ErrorComponent])
    }
  })
})

describe('suspense use cases', () => {
  let asyncAction = Promise.withResolvers<string>()
  beforeEach(() => {
    asyncAction = Promise.withResolvers<string>()
  })
  function ErrorComponent() {
    useTrackRenders()
    return null
  }
  function DataComponent() {
    useTrackRenders()
    __use(asyncAction.promise)
    return null
  }
  function LoadingComponent() {
    useTrackRenders()
    return null
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

  test('basic functionality', async () => {
    const {takeRender, render} = createRenderStream()
    await render(<App />)
    asyncAction.resolve('data')
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([App, LoadingComponent])
    }
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([DataComponent])
    }
  })

  test('ErrorBoundary', async () => {
    const {takeRender, render} = createRenderStream()
    await render(<App />)

    const spy = jest.spyOn(console, 'error')
    spy.mockImplementation(() => {})
    asyncAction.reject(new Error('error'))
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([App, LoadingComponent])
    }
    {
      const {renderedComponents} = await takeRender()
      expect(renderedComponents).toEqual([ErrorComponent])
    }
    spy.mockRestore()
  })
})

test('specifying the `name` option', async () => {
  function NamedComponent({name, children}: {name: string; children?: any}) {
    useTrackRenders({name: `NamedComponent:${name}`})
    return <>{children}</>
  }
  const {takeRender, render} = createRenderStream()
  await render(
    <>
      <NamedComponent name="Darth Vader">
        <NamedComponent name="Luke">
          <NamedComponent name="R2D2" />
        </NamedComponent>
        <NamedComponent name="Leia" />
      </NamedComponent>
    </>,
  )
  {
    const {renderedComponents} = await takeRender()
    expect(renderedComponents).toEqual([
      'NamedComponent:Darth Vader',
      // this relies on the order of `useLayoutEffect` being executed, we have no way to influence that siblings seem "backwards" here
      'NamedComponent:Leia',
      'NamedComponent:Luke',
      'NamedComponent:R2D2',
    ])
  }
})
