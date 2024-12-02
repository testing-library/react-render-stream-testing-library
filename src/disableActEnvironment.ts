import {getConfig} from '@testing-library/dom'

const dispose: typeof Symbol.dispose =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  Symbol.dispose ?? Symbol.for('nodejs.dispose')

export interface DisableActEnvironmentOptions {
  /**
   * If `true`, all modifications of values set by `disableActEnvironment`
   * will be prevented until `cleanup` is called.
   *
   * @default true
   */
  preventModification?: boolean

  /**
   * If `true`, will change the configuration of the testing library to
   * prevent auto-wrapping e.g. `userEvent` calls in `act`.
   *
   * @default true
   */
  adjustTestingLibConfig?: boolean
}

/**
 * Helper to temporarily disable a React 18+ act environment.
 *
 * By default, this also adjusts the configuration of @testing-library/dom
 * to prevent auto-wrapping of user events in `act`, as well as preventing
 * all modifications of values set by this method until `cleanup` is called
 * or the returned `Disposable` is disposed of.
 *
 * Both of these behaviors can be disabled with the option, of the defaults
 * can be changed for all calls to this method by modifying
 * `disableActEnvironment.defaultOptions`.
 *
 * This returns a disposable and can be used in combination with `using` to
 * automatically restore the state from before this method call after your test.
 *
 * @example
 * ```ts
 * test("my test", () => {
 *   using _disabledAct = disableActEnvironment();
 *
 *   // your test code here
 *
 *   // as soon as this scope is left, the environment will be cleaned up
 * })
 * ```
 *
 * If you can not use the explicit resouce management keyword `using`,
 * you can also manually call `cleanup`:
 *
 * @example
 * ```ts
 * test("my test", () => {
 *   const { cleanup } = disableActEnvironment();
 *
 *   // your test code here
 *
 *   cleanup();
 * })
 *
 * For more context on what `act` is and why you shouldn't use it in renderStream tests,
 * https://github.com/reactwg/react-18/discussions/102 is probably the best resource we have.
 */
export function disableActEnvironment({
  preventModification = disableActEnvironment.defaultOptions
    .preventModification,
  adjustTestingLibConfig = disableActEnvironment.defaultOptions
    .adjustTestingLibConfig,
}: DisableActEnvironmentOptions = {}): {cleanup: () => void} & Disposable {
  const typedGlobal = globalThis as any as {IS_REACT_ACT_ENVIRONMENT?: boolean}
  const cleanupFns: Array<() => void> = []

  // core functionality
  {
    const previous = typedGlobal.IS_REACT_ACT_ENVIRONMENT
    cleanupFns.push(() => {
      Object.defineProperty(typedGlobal, 'IS_REACT_ACT_ENVIRONMENT', {
        value: previous,
        writable: true,
        configurable: true,
      })
    })
    Object.defineProperty(
      typedGlobal,
      'IS_REACT_ACT_ENVIRONMENT',
      getNewPropertyDescriptor(false, preventModification),
    )
  }

  if (adjustTestingLibConfig) {
    const config = getConfig()
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const {asyncWrapper, eventWrapper} = config
    cleanupFns.push(() => {
      Object.defineProperty(config, 'asyncWrapper', {
        value: asyncWrapper,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(config, 'eventWrapper', {
        value: eventWrapper,
        writable: true,
        configurable: true,
      })
    })

    Object.defineProperty(
      config,
      'asyncWrapper',
      getNewPropertyDescriptor<typeof asyncWrapper>(
        fn => fn(),
        preventModification,
      ),
    )
    Object.defineProperty(
      config,
      'eventWrapper',
      getNewPropertyDescriptor<typeof eventWrapper>(
        fn => fn(),
        preventModification,
      ),
    )
  }

  function cleanup() {
    while (cleanupFns.length > 0) {
      cleanupFns.pop()!()
    }
  }
  return {
    cleanup,
    [dispose]: cleanup,
  }
}

/**
 * Default options for `disableActEnvironment`.
 *
 * This can be modified to change the default options for all calls to `disableActEnvironment`.
 */
disableActEnvironment.defaultOptions = {
  preventModification: true,
  adjustTestingLibConfig: true,
} satisfies Required<DisableActEnvironmentOptions> as Required<DisableActEnvironmentOptions>

function getNewPropertyDescriptor<T>(
  value: T,
  preventModification: boolean,
): PropertyDescriptor {
  return preventModification
    ? {
        configurable: true,
        enumerable: true,
        get() {
          return value
        },
        set() {},
      }
    : {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      }
}
