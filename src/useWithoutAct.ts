import {getConfig} from '@testing-library/dom'
import {UserEvent} from '@testing-library/user-event'

type AsyncUserEvent = {
  [K in keyof UserEvent as UserEvent[K] extends (...args: any[]) => Promise<any>
    ? K
    : never]: UserEvent[K]
}

export function userEventWithoutAct(
  userEvent: UserEvent | typeof import('@testing-library/user-event').userEvent,
): AsyncUserEvent {
  return Object.fromEntries(
    Object.entries(userEvent).map(([key, value]) => {
      if (typeof value === 'function') {
        return [
          key,
          async function wrapped(this: any, ...args: any[]) {
            const config = getConfig()
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const orig = config.eventWrapper
            try {
              config.eventWrapper = cb => cb()
              // eslint-disable-next-line @typescript-eslint/return-await
              return await (value as Function).apply(this, args)
            } finally {
              config.eventWrapper = orig
            }
          },
        ]
      }
      return [key, value]
    }),
  ) as AsyncUserEvent
}
