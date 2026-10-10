import type { Mode } from '../../domain/types'
import type { Db } from '../index'

/** One row of the recipe/ingredient join; ingredient columns are null for a recipe without ingredients. */
export interface RecipeJoinRow {
  id: number
  outputItemId: number
  outputQty: number
  station: string | null
  notes: string | null
  updatedAt: string
  itemId: number | null
  qty: number | null
  mode: Mode | null
  sortOrder: number | null
  ingredientHasRecipe: number | null
}

/** Read side of recipes. Saving recipes with the cycle check arrives in Phase 2. */
export function createRecipeRepository(db: Db) {
  const select = db.prepare<{ profileId: number; recipeId: number | null }, RecipeJoinRow>(`
    SELECT r.id, r.output_item_id AS outputItemId, r.output_qty AS outputQty, r.station, r.notes,
           r.updated_at AS updatedAt,
           ri.item_id AS itemId, ri.qty, ri.mode, ri.sort_order AS sortOrder,
           EXISTS (SELECT 1 FROM recipe r2 WHERE r2.output_item_id = ri.item_id) AS ingredientHasRecipe
    FROM recipe r
    LEFT JOIN recipe_ingredient ri ON ri.recipe_id = r.id
    WHERE r.profile_id = :profileId AND (:recipeId IS NULL OR r.id = :recipeId)
    ORDER BY r.id, ri.sort_order
  `)

  return {
    list: (profileId: number): RecipeJoinRow[] => select.all({ profileId, recipeId: null }),
    get: (profileId: number, recipeId: number): RecipeJoinRow[] => select.all({ profileId, recipeId }),
  }
}

export type RecipeRepository = ReturnType<typeof createRecipeRepository>
