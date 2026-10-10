import type { Db } from '../database'
import type { Repositories } from '../database/repositories'
import type { SettingsService } from '../settings/settings-service'

/** Everything a handler needs. Handlers read the active profile from here, never from the renderer. */
export interface AppContext {
  db: Db
  repos: Repositories
  settings: SettingsService
}
