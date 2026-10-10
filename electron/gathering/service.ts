import { aggregate } from '../domain/aggregation'
import type { AggregationRequirement, AggregationTarget } from '../domain/types'
import type { Repositories } from '../database/repositories'
import { broadcast } from '../ipc/broadcast'
import type {
  GatheringCraftRow,
  GatheringItemRow,
  GatheringResult,
  GatheringTargetAllocation,
  IngredientInput,
} from '../ipc/contracts'
import { imageUrl } from '../images/image-store'
import type { SettingsService } from '../settings/settings-service'
import { debounce } from '../utils/debounce'

const RECOMPUTE_DELAY_MS = 16

const EMPTY: GatheringResult = { items: [], craftPlan: [], perTarget: [], overall: { owned: 0, required: 0 }, warnings: [] }

/**
 * Runs the aggregation for the active profile and pushes the result. Nothing computed is stored
 * (F12-R15): every mutation calls `schedule()` and the renderer only displays the latest payload.
 */
export function createGatheringService(repos: Repositories, settings: SettingsService) {
  function compute(profileId: number): GatheringResult {
    const recipes = repos.recipes.loadGraph(profileId)
    const recipeById = new Map([...recipes.values()].map((recipe) => [recipe.id, recipe]))

    const questRequirements = new Map<number, AggregationRequirement[]>()
    for (const row of repos.quests.list(profileId)) {
      if (row.itemId === null || row.qty === null || row.mode === null) continue
      const list = questRequirements.get(row.id) ?? []
      list.push({ itemId: row.itemId, qty: row.qty, mode: row.mode })
      questRequirements.set(row.id, list)
    }

    const targets: AggregationTarget[] = repos.tracking.listActive(profileId).map((target) => ({
      id: target.id,
      kind: target.kind,
      priority: target.priority,
      ...(target.questId === null ? {} : { questId: target.questId }),
      ...(target.recipeId === null ? {} : { recipeId: target.recipeId }),
      targetQty: target.targetQty,
      requirements:
        target.kind === 'quest'
          ? (questRequirements.get(target.questId ?? 0) ?? [])
          : (recipeById.get(target.recipeId ?? 0)?.ingredients ?? []),
    }))

    const result = aggregate({ targets, recipesByOutputItem: recipes, owned: repos.inventory.ownedMap(profileId) })

    const items = new Map(repos.items.list({ profileId }).map((row) => [row.id, row]))
    const rows: GatheringItemRow[] = result.items.flatMap((row) => {
      const item = items.get(row.itemId)
      return item
        ? [{ ...row, name: item.name, category: item.category, thumbnailUrl: imageUrl(item.thumbnailPath, item.updatedAt), pinned: item.pinned === 1 }]
        : []
    })
    const craftPlan: GatheringCraftRow[] = result.craftPlan.flatMap((row) => {
      const output = items.get(row.outputItemId)
      const recipe = recipeById.get(row.recipeId)
      if (!output || !recipe) return []
      const ingredientsPerRun: IngredientInput[] = recipe.ingredients.map((ingredient) => ({ ...ingredient }))
      return [{ ...row, outputName: output.name, outputThumbnailUrl: imageUrl(output.thumbnailPath, output.updatedAt), ingredientsPerRun }]
    })

    const targetInfo = new Map(repos.tracking.listLabelled(profileId).map((target) => [target.id, target]))
    const perTarget: GatheringTargetAllocation[] = result.perTarget.flatMap((entry) => {
      const info = targetInfo.get(entry.targetId)
      if (!info) return []
      const named = entry.rows.map((row) => {
        const item = items.get(row.itemId)
        return { ...row, name: item?.name ?? `#${row.itemId}`, thumbnailUrl: item ? imageUrl(item.thumbnailPath, item.updatedAt) : null }
      })
      return [{ ...entry, label: info.label, kind: info.kind, priority: info.priority, pinned: info.pinned === 1, rows: named }]
    })

    return { ...result, items: rows, craftPlan, perTarget }
  }

  // The dashboard shows the progress of every profile; computing them all for each profile list would be wasteful,
  // so results are kept until the next mutation (every mutation calls `schedule`).
  const progressCache = new Map<number, GatheringResult['overall']>()
  const progress = (profileId: number): GatheringResult['overall'] => {
    let overall = progressCache.get(profileId)
    if (!overall) {
      overall = compute(profileId).overall
      progressCache.set(profileId, overall)
    }
    return overall
  }

  const get = (): GatheringResult => {
    const profileId = settings.getActiveProfileId()
    return profileId === null ? EMPTY : compute(profileId)
  }

  // Bursts of writes (holding the + button) collapse into one recomputation (F6-R13).
  const schedule = debounce(() => {
    if (settings.getActiveProfileId() === null) return
    try {
      broadcast('gathering:changed', get())
    } catch (error) {
      console.error('Could not recompute the gathering list', error)
    }
  }, RECOMPUTE_DELAY_MS)

  return {
    compute,
    get,
    progress,
    schedule: (): void => {
      progressCache.clear()
      schedule()
    },
    flush: (): void => schedule.flush(),
  }
}

export type GatheringService = ReturnType<typeof createGatheringService>
