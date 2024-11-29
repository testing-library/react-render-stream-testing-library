import * as ReactDOMClient from 'react-dom/client'
import * as ReactDOM from 'react-dom'
import {
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react/pure.js'
import {
  getQueriesForElement,
  prettyDOM,
  type Queries,
} from '@testing-library/dom'
import React from 'react'
import {SyncQueries} from './renderStream/syncQueries.js'
import {withDisabledActEnvironment} from './withDisabledActEnvironment.js'

// Ideally we'd just use a WeakMap where containers are keys and roots are values.
// We use two variables so that we can bail out in constant time when we render with a new container (most common use case)

const mountedContainers: Set<import('react-dom').Container> = new Set()
const mountedRootEntries: Array<{
  container: import('react-dom').Container
  root: ReturnType<typeof createConcurrentRoot>
}> = []

function renderRoot(
  ui: React.ReactNode,
  {
    baseElement,
    container,
    queries,
    wrapper: WrapperComponent,
    root,
  }: Pick<RenderOptions<Queries>, 'queries' | 'wrapper'> & {
    baseElement: ReactDOMClient.Container
    container: ReactDOMClient.Container
    root: ReturnType<typeof createConcurrentRoot>
  },
): RenderResult<Queries, any, any> {
  root.render(
    WrapperComponent ? React.createElement(WrapperComponent, null, ui) : ui,
  )

  return {
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) =>
      Array.isArray(el)
        ? // eslint-disable-next-line no-console
          el.forEach(e =>
            console.log(prettyDOM(e as Element, maxLength, options)),
          )
        : // eslint-disable-next-line no-console,
          console.log(prettyDOM(el as Element, maxLength, options)),
    unmount: () => {
      root.unmount()
    },
    rerender: rerenderUi => {
      renderRoot(rerenderUi, {
        container,
        baseElement,
        root,
        wrapper: WrapperComponent,
      })
      // Intentionally do not return anything to avoid unnecessarily complicating the API.
      // folks can use all the same utilities we return in the first place that are bound to the container
    },
    asFragment: () => {
      /* istanbul ignore else (old jsdom limitation) */
      if (typeof document.createRange === 'function') {
        return document
          .createRange()
          .createContextualFragment((container as HTMLElement).innerHTML)
      } else {
        const template = document.createElement('template')
        template.innerHTML = (container as HTMLElement).innerHTML
        return template.content
      }
    },
    ...getQueriesForElement<Queries>(baseElement as HTMLElement, queries),
  } as RenderResult<Queries, any, any> // TODO clean up more
}

export type RenderWithoutActAsync = {
  <
    Q extends Queries = SyncQueries,
    Container extends ReactDOMClient.Container = HTMLElement,
    BaseElement extends ReactDOMClient.Container = Container,
  >(
    this: any,
    ui: React.ReactNode,
    options: //Omit<
    RenderOptions<Q, Container, BaseElement>,
    //'hydrate' | 'legacyRoot'  >,
  ): Promise<RenderResult<Q, Container, BaseElement>>
  (
    this: any,
    ui: React.ReactNode,
    options?:
      | Omit<RenderOptions, 'hydrate' | 'legacyRoot' | 'queries'>
      | undefined,
  ): Promise<
    RenderResult<
      SyncQueries,
      ReactDOMClient.Container,
      ReactDOMClient.Container
    >
  >
}

export function renderWithoutAct<
  Q extends Queries = SyncQueries,
  Container extends ReactDOMClient.Container = HTMLElement,
  BaseElement extends ReactDOMClient.Container = Container,
>(
  ui: React.ReactNode,
  options: //Omit<
  RenderOptions<Q, Container, BaseElement>,
  //'hydrate' | 'legacyRoot'  >,
): RenderResult<Q, Container, BaseElement>
export function renderWithoutAct(
  ui: React.ReactNode,
  options?:
    | Omit<RenderOptions, 'hydrate' | 'legacyRoot' | 'queries'>
    | undefined,
): RenderResult<Queries, ReactDOMClient.Container, ReactDOMClient.Container>

export function renderWithoutAct(
  ui: React.ReactNode,
  {
    container,
    baseElement = container,
    queries,
    wrapper,
  }: Omit<
    RenderOptions<Queries, ReactDOMClient.Container, ReactDOMClient.Container>,
    'hydrate' | 'legacyRoot'
  > = {},
): RenderResult<any, ReactDOMClient.Container, ReactDOMClient.Container> {
  if (!baseElement) {
    // default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output
    baseElement = document.body
  }
  if (!container) {
    container = baseElement.appendChild(document.createElement('div'))
  }

  let root: ReturnType<typeof createConcurrentRoot>
  // eslint-disable-next-line no-negated-condition -- we want to map the evolution of this over time. The root is created first. Only later is it re-used so we don't want to read the case that happens later first.
  if (!mountedContainers.has(container)) {
    root = (
      ReactDOM.version.startsWith('16') || ReactDOM.version.startsWith('17')
        ? createLegacyRoot
        : createConcurrentRoot
    )(container)
    mountedRootEntries.push({container, root})
    // we'll add it to the mounted containers regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.
    mountedContainers.add(container)
  } else {
    mountedRootEntries.forEach(rootEntry => {
      // Else is unreachable since `mountedContainers` has the `container`.
      // Only reachable if one would accidentally add the container to `mountedContainers` but not the root to `mountedRootEntries`
      /* istanbul ignore else */
      if (rootEntry.container === container) {
        root = rootEntry.root
      }
    })
  }

  return renderRoot(ui, {baseElement, container, queries, wrapper, root: root!})
}

function createLegacyRoot(container: ReactDOMClient.Container) {
  return {
    render(element: React.ReactNode) {
      ReactDOM.render(element as unknown as React.ReactElement, container)
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container)
    },
  }
}

function createConcurrentRoot(container: ReactDOMClient.Container) {
  const anyThis = globalThis as any as {IS_REACT_ACT_ENVIRONMENT?: boolean}
  if (anyThis.IS_REACT_ACT_ENVIRONMENT) {
    throw new Error(`Tried to create a React root for a render stream inside a React act environment.
This is not supported. Please use \`disableActEnvironment\` to disable the act environment for this test.`)
  }
  const root = ReactDOMClient.createRoot(container)

  return {
    render(element: React.ReactNode) {
      if (anyThis.IS_REACT_ACT_ENVIRONMENT) {
        throw new Error(`Tried to render a render stream inside a React act environment.
    This is not supported. Please use \`disableActEnvironment\` to disable the act environment for this test.`)
      }
      root.render(element)
    },
    unmount() {
      root.unmount()
    },
  }
}

export function cleanup() {
  // there is a good chance this happens outside of a test, where the user
  // has no control over enabling or disabling the React Act environment,
  // so we do it for them here.
  withDisabledActEnvironment(() => {
    mountedRootEntries.forEach(({root, container}) => {
      root.unmount()

      if (container.parentNode === document.body) {
        document.body.removeChild(container)
      }
    })
    mountedRootEntries.length = 0
    mountedContainers.clear()
  })
}
