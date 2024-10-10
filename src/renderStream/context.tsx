import * as React from 'rehackt'

export interface RenderStreamContextValue {
  renderedComponents: Array<React.ComponentType | string>
}

const RenderStreamContext = React.createContext<
  RenderStreamContextValue | undefined
>(undefined)

export function RenderStreamContextProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: RenderStreamContextValue
}) {
  const parentContext = useRenderStreamContext()

  if (parentContext) {
    throw new Error('Render streams should not be nested in the same tree')
  }

  return (
    <RenderStreamContext.Provider value={value}>
      {children}
    </RenderStreamContext.Provider>
  )
}

export function useRenderStreamContext() {
  return React.useContext(RenderStreamContext)
}
