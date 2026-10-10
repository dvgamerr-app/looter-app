import { broadcast } from '../broadcast'
import type { AppContext } from '../context'
import { handle } from '../register'

export function registerSettingsHandlers({ settings }: AppContext): void {
  settings.onChange((state) => broadcast('settings:changed', state))

  handle('settings:get', () => settings.getState())
  handle('settings:update', (request) => settings.update(request))
}
