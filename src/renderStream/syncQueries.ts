import {queries, Query, Queries} from '@testing-library/dom'

export {Query, Queries}

type OriginalQueries = typeof queries

export type SyncQueries = {
  [K in keyof OriginalQueries as K extends `${'query'}${string}`
    ? never
    : K]: OriginalQueries[K]
}

export const syncQueries = Object.values(
  Object.entries(queries).filter(
    ([key]) => key.startsWith('get') || key.startsWith('find'),
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
      findByLabelText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByText<T>>>
      ): ReturnType<queries.FindByText<T>>
      findAllByLabelText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByText<T>>>
      ): ReturnType<queries.FindAllByText<T>>
      getByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      findByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByBoundAttribute<T>>>
      ): ReturnType<queries.FindByBoundAttribute<T>>
      findAllByPlaceholderText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByBoundAttribute<T>>>
      ): ReturnType<queries.FindAllByBoundAttribute<T>>
      getByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByText<T>>>
      ): ReturnType<queries.GetByText<T>>
      getAllByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByText<T>>>
      ): ReturnType<queries.AllByText<T>>
      findByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByText<T>>>
      ): ReturnType<queries.FindByText<T>>
      findAllByText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByText<T>>>
      ): ReturnType<queries.FindAllByText<T>>
      getByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      findByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByBoundAttribute<T>>>
      ): ReturnType<queries.FindByBoundAttribute<T>>
      findAllByAltText<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByBoundAttribute<T>>>
      ): ReturnType<queries.FindAllByBoundAttribute<T>>
      getByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      findByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByBoundAttribute<T>>>
      ): ReturnType<queries.FindByBoundAttribute<T>>
      findAllByTitle<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByBoundAttribute<T>>>
      ): ReturnType<queries.FindAllByBoundAttribute<T>>
      getByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByBoundAttribute<T>>>
      ): ReturnType<queries.GetByBoundAttribute<T>>
      getAllByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByBoundAttribute<T>>>
      ): ReturnType<queries.AllByBoundAttribute<T>>
      findByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByBoundAttribute<T>>>
      ): ReturnType<queries.FindByBoundAttribute<T>>
      findAllByDisplayValue<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByBoundAttribute<T>>>
      ): ReturnType<queries.FindAllByBoundAttribute<T>>
      getByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.GetByRole<T>>>
      ): ReturnType<queries.GetByRole<T>>
      getAllByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.AllByRole<T>>>
      ): ReturnType<queries.AllByRole<T>>
      findByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByRole<T>>>
      ): ReturnType<queries.FindByRole<T>>
      findAllByRole<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByRole<T>>>
      ): ReturnType<queries.FindAllByRole<T>>
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
      findByTestId<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindByBoundAttribute<T>>>
      ): ReturnType<queries.FindByBoundAttribute<T>>
      findAllByTestId<T extends HTMLElement = HTMLElement>(
        ...args: Parameters<BoundFunction<queries.FindAllByBoundAttribute<T>>>
      ): ReturnType<queries.FindAllByBoundAttribute<T>>
    } & {
      [P in keyof Q]: BoundFunction<Q[P]>
    }
  : {
      [P in keyof Q]: BoundFunction<Q[P]>
    }
