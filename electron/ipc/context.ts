import type { Db } from '../database'
import type { Repositories } from '../database/repositories'
import type { GatheringService } from '../gathering/service'
import type { PendingStore } from '../images/pending-store'
import type { SettingsService } from '../settings/settings-service'
import { broadcast } from './broadcast'
import { AppError } from './errors'

/**
 * Announces what a handler changed. Every call also schedules a recomputation of the gathering list,
 * because every write that reaches here can affect it (Feature Specification section 1.3 rule 5).
 */
export function createNotifier(gathering: GatheringService) {
  return {
    items(profileId: number, itemIds?: number[]): void {
      broadcast('items:changed', { profileId, ...(itemIds ? { itemIds } : {}) })
      gathering.schedule()
    },
    recipes(profileId: number, recipeIds?: number[]): void {
      broadcast('recipes:changed', { profileId, ...(recipeIds ? { recipeIds } : {}) })
      gathering.schedule()
    },
    quests(profileId: number, questIds?: number[]): void {
      broadcast('quests:changed', { profileId, ...(questIds ? { questIds } : {}) })
      gathering.schedule()
    },
    tracking(profileId: number): void {
      broadcast('tracking:changed', { profileId })
      gathering.schedule()
    },
    inventory(profileId: number, changes: Array<{ itemId: number; owned: number }>): void {
      broadcast('inventory:changed', { profileId, changes })
      gathering.schedule()
    },
  }
}

export type Notifier = ReturnType<typeof createNotifier>

/** Everything a handler needs. Handlers read the active profile from here, never from the renderer. */
export interface AppContext {
  db: Db
  repos: Repositories
  settings: SettingsService
  gathering: GatheringService
  pending: PendingStore
  notify: Notifier
}

/** The profile every data command works on; there is none during onboarding. */
export function requireActiveProfile(context: Pick<AppContext, 'settings'>): number {
  const id = context.settings.getActiveProfileId()
  if (id === null) throw new AppError('NOT_FOUND', 'ยังไม่มี Game Profile ที่ใช้งานอยู่')
  return id
}
