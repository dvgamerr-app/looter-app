import type { ItemRow } from '../database/repositories/item'
import type { QuestJoinRow } from '../database/repositories/quest'
import type { RecipeJoinRow } from '../database/repositories/recipe'
import type { TrackingLabelRow, TrackingTargetRow } from '../database/repositories/tracking'
import { imageUrl } from '../images/image-store'
import type { ItemDto, QuestDto, RecipeDto, TrackingTargetDto } from './contracts'

export function toItemDto(row: ItemRow): ItemDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    notes: row.notes,
    pinned: row.pinned === 1,
    imageUrl: imageUrl(row.imagePath, row.updatedAt),
    thumbnailUrl: imageUrl(row.thumbnailPath, row.updatedAt),
    owned: row.owned,
    hasRecipe: row.hasRecipe === 1,
    updatedAt: row.updatedAt,
  }
}

/** Folds the recipe/ingredient join into one DTO per recipe, keeping the join order. */
export function toRecipeDtos(rows: RecipeJoinRow[], targets: TrackingTargetRow[]): RecipeDto[] {
  const targetOf = new Map(targets.filter((target) => target.recipeId !== null).map((target) => [target.recipeId, target.id]))
  const byId = new Map<number, RecipeDto>()
  for (const row of rows) {
    let recipe = byId.get(row.id)
    if (!recipe) {
      recipe = {
        id: row.id,
        outputItemId: row.outputItemId,
        outputQty: row.outputQty,
        station: row.station,
        notes: row.notes,
        ingredients: [],
        trackingTargetId: targetOf.get(row.id) ?? null,
        updatedAt: row.updatedAt,
      }
      byId.set(row.id, recipe)
    }
    if (row.itemId !== null && row.qty !== null && row.mode !== null) {
      recipe.ingredients.push({
        itemId: row.itemId,
        qty: row.qty,
        mode: row.mode,
        sortOrder: row.sortOrder ?? 0,
        ingredientHasRecipe: row.ingredientHasRecipe === 1,
      })
    }
  }
  return [...byId.values()]
}

export function toQuestDtos(rows: QuestJoinRow[]): QuestDto[] {
  const byId = new Map<number, QuestDto>()
  for (const row of rows) {
    let quest = byId.get(row.id)
    if (!quest) {
      quest = {
        id: row.id,
        name: row.name,
        status: row.status,
        notes: row.notes,
        completedAt: row.completedAt,
        requirements: [],
        trackingTargetId: row.trackingTargetId,
        updatedAt: row.updatedAt,
      }
      byId.set(row.id, quest)
    }
    if (row.itemId !== null && row.qty !== null && row.mode !== null) {
      quest.requirements.push({ itemId: row.itemId, qty: row.qty, mode: row.mode, sortOrder: row.sortOrder ?? 0 })
    }
  }
  return [...byId.values()]
}

export function toTrackingDto(row: TrackingLabelRow): TrackingTargetDto {
  return {
    id: row.id,
    kind: row.kind,
    questId: row.questId,
    recipeId: row.recipeId,
    label: row.label,
    targetQty: row.targetQty,
    priority: row.priority,
    pinned: row.pinned === 1,
    questStatus: row.questStatus,
  }
}
