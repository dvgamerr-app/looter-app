import type { Db } from '../index'
import { createInventoryRepository } from './inventory'
import { createItemRepository } from './item'
import { createProfileRepository } from './profile'
import { createQuestRepository } from './quest'
import { createRecipeRepository } from './recipe'
import { createSettingRepository } from './setting'
import { createTrackingRepository } from './tracking'

/** Builds every repository once. Each one prepares its statements a single time at construction. */
export function createRepositories(db: Db) {
  return {
    profiles: createProfileRepository(db),
    settings: createSettingRepository(db),
    items: createItemRepository(db),
    inventory: createInventoryRepository(db),
    recipes: createRecipeRepository(db),
    quests: createQuestRepository(db),
    tracking: createTrackingRepository(db),
  }
}

export type Repositories = ReturnType<typeof createRepositories>
