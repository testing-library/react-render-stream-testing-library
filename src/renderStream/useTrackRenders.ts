import React from 'rehackt'
import {useRenderStreamContext} from './context.js'

function resolveR18HookOwner(): React.ComponentType | undefined {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  return (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    ?.ReactCurrentOwner?.current?.elementType
}

function resolveR19HookOwner(): React.ComponentType | undefined {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  return (
    React as any
  ).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.A?.getOwner()
    .elementType
}

export function useTrackRenders({name}: {name?: string} = {}) {
  const component = name ?? resolveR18HookOwner() ?? resolveR19HookOwner()

  if (!component) {
    throw new Error(
      'useTrackRenders: Unable to determine component. Please ensure the hook is called inside a rendered component or provide a `name` option.',
    )
  }

  const ctx = useRenderStreamContext()

  if (!ctx) {
    throw new Error(
      'useTrackRenders: A Render Stream must be created and rendered to track component renders',
    )
  }

  React.useLayoutEffect(() => {
    ctx.renderedComponents.unshift(component)
  })
}
