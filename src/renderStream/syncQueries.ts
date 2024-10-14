import {queries} from '@testing-library/dom'

export type {Queries} from '@testing-library/dom'

type OriginalQueries = typeof queries

export type SyncQueries = {
  [K in keyof OriginalQueries as K extends `${'find'}${string}`
    ? never
    : K]: OriginalQueries[K]
}

export const syncQueries = Object.fromEntries(
  Object.entries(queries).filter(
    ([key]) => key.startsWith('get') || key.startsWith('query'),
  ),
) as any as SyncQueries

export type BoundFunction<T> = T extends (
  container: HTMLElement,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never

export type BoundSyncFunctions<Q> = Q extends typeof syncQueries
  ? {
      getByLabelText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByText<T>>>
      ): ReturnType<queries.GetByText<T>>
      getAllByLabelText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByText<T>>>
      ): ReturnType<queries.AllByText<T>>
      queryByLabelText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByText<T>>>
      ): ReturnType<queries.QueryByText<T>>
      queryAllByLabelText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByText<T>>>
      ): ReturnType<queries.AllByText<T>>
      getByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      queryByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByBoundAttribute<T>>>
      ): ReturnType<queries.QueryByBoundAttribute<T>>
      queryAllByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      getByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByText<T>>>
      ): ReturnType<queries.GetByText<T>>
      getAllByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByText<T>>>
      ): ReturnType<queries.AllByText<T>>
      queryByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByText<T>>>
      ): ReturnType<queries.QueryByText<T>>
      queryAllByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByText<T>>>
      ): ReturnType<queries.AllByText<T>>
      getByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      queryByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByBoundAttribute<T>>>
      ): ReturnType<queries.QueryByBoundAttribute<T>>
      queryAllByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      getByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      queryByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByBoundAttribute<T>>>
      ): ReturnType<queries.QueryByBoundAttribute<T>>
      queryAllByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      getByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      queryByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByBoundAttribute<T>>>
      ): ReturnType<queries.QueryByBoundAttribute<T>>
      queryAllByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      getByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByRole<T>>>
      ): ReturnType<queries.GetByRole<T>>
      getAllByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByRole<T>>>
      ): ReturnType<queries.AllByRole<T>>
      queryByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByRole<T>>>
      ): ReturnType<queries.QueryByRole<T>>
      queryAllByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByRole<T>>>
      ): ReturnType<queries.AllByRole<T>>
      getByTestId<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByTestId<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      queryByTestId<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.QueryByBoundAttribute<T>>>
      ): ReturnType<queries.QueryByBoundAttribute<T>>
      queryAllByTestId<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
    } & {
      [P in keyof Q]: BoundFunction<Q[P]>
    }
  : {
      [P in keyof Q]: BoundFunction<Q[P]>
    }
