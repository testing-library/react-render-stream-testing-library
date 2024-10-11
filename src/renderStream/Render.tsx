import {screen, getQueriesForElement, Screen} from '@testing-library/dom'
import {JSDOM, VirtualConsole} from 'jsdom'
import {
  BoundSyncFunctions,
  type Queries,
  type SyncQueries,
} from './syncQueries.js'

export interface BaseRender {
  id: string
  phase: 'mount' | 'update' | 'nested-update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
  /**
   * The number of renders that have happened so far (including this render).
   */
  count: number
}

export type SyncScreen<Q extends Queries = SyncQueries> =
  BoundSyncFunctions<Q> & Pick<Screen, 'debug' | 'logTestingPlaygroundURL'>

export interface Render<Snapshot, Q extends Queries = SyncQueries>
  extends BaseRender {
  /**
   * The snapshot, as returned by the `takeSnapshot` option of `createRenderStream`.
   */
  snapshot: Snapshot
  /**
   * A DOM snapshot of the rendered component, if the `snapshotDOM`
   * option of `createRenderStream` was enabled.
   */
  readonly domSnapshot: HTMLElement
  /**
   * Returns a callback to receive a `screen` instance that is scoped to the
   * DOM snapshot of this `Render` instance.
   * Note: this is used as a callback to prevent linter errors.
   * @example
   * ```diff
   * const { withinDOM } = RenderedComponent.takeRender();
   * -expect(screen.getByText("foo")).toBeInTheDocument();
   * +expect(withinDOM().getByText("foo")).toBeInTheDocument();
   * ```
   */
  withinDOM: () => SyncScreen<Q>

  renderedComponents: Array<string | React.ComponentType>
}

export class RenderInstance<Snapshot, Q extends Queries = SyncQueries>
  implements Render<Snapshot, Q>
{
  id: string
  phase: 'mount' | 'update' | 'nested-update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
  count: number
  public snapshot: Snapshot
  private stringifiedDOM: string | undefined
  public renderedComponents: Array<string | React.ComponentType>
  private queries: Q

  constructor(
    baseRender: BaseRender,
    snapshot: Snapshot,
    stringifiedDOM: string | undefined,
    renderedComponents: Array<string | React.ComponentType>,
    queries: Q,
  ) {
    this.snapshot = snapshot
    this.stringifiedDOM = stringifiedDOM
    this.renderedComponents = renderedComponents
    this.id = baseRender.id
    this.phase = baseRender.phase
    this.actualDuration = baseRender.actualDuration
    this.baseDuration = baseRender.baseDuration
    this.startTime = baseRender.startTime
    this.commitTime = baseRender.commitTime
    this.count = baseRender.count
    this.queries = queries
  }

  private _domSnapshot: HTMLElement | undefined
  get domSnapshot() {
    if (this._domSnapshot) return this._domSnapshot
    if (!this.stringifiedDOM) {
      throw new Error(
        'DOM snapshot is not available - please set the `snapshotDOM` option',
      )
    }

    const virtualConsole = new VirtualConsole()
    virtualConsole.on('jsdomError', (error: any) => {
      throw error
    })

    const snapDOM = new JSDOM(this.stringifiedDOM, {
      runScripts: 'dangerously',
      virtualConsole,
    })
    const document = snapDOM.window.document
    const body = document.body
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.text = `
        ${errorOnDomInteraction.toString()};
        ${errorOnDomInteraction.name}();
      `
    body.appendChild(script)
    body.removeChild(script)

    return (this._domSnapshot = body)
  }

  get withinDOM(): () => SyncScreen<Q> {
    const snapScreen = Object.assign(
      getQueriesForElement<Q>(
        this.domSnapshot,
        this.queries,
      ) as any as BoundSyncFunctions<Q>,
      {
        debug: (
          ...[dom = this.domSnapshot, ...rest]: Parameters<typeof screen.debug>
        ) => screen.debug(dom, ...rest),
        logTestingPlaygroundURL: (
          ...[dom = this.domSnapshot, ...rest]: Parameters<
            typeof screen.logTestingPlaygroundURL
          >
        ) => screen.logTestingPlaygroundURL(dom, ...rest),
      },
    )
    return () => snapScreen
  }
}

export function errorOnDomInteraction() {
  const events: Array<keyof DocumentEventMap> = [
    'auxclick',
    'blur',
    'change',
    'click',
    'copy',
    'cut',
    'dblclick',
    'drag',
    'dragend',
    'dragenter',
    'dragleave',
    'dragover',
    'dragstart',
    'drop',
    'focus',
    'focusin',
    'focusout',
    'input',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'paste',
    'pointercancel',
    'pointerdown',
    'pointerenter',
    'pointerleave',
    'pointermove',
    'pointerout',
    'pointerover',
    'pointerup',
    'scroll',
    'select',
    'selectionchange',
    'selectstart',
    'submit',
    'toggle',
    'touchcancel',
    'touchend',
    'touchmove',
    'touchstart',
    'wheel',
  ]
  function warnOnDomInteraction() {
    throw new Error(`
    DOM interaction with a snapshot detected in test.
    Please don't interact with the DOM you get from \`withinDOM\`,
    but still use \`screen\` to get elements for simulating user interaction.
    `)
  }
  events.forEach(event => {
    document.addEventListener(event, warnOnDomInteraction)
  })
}
