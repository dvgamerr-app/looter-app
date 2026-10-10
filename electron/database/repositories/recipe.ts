import { findCycle } from '../../domain/cycle'
import type { AggregationRecipe, Mode } from '../../domain/types'
import type { IngredientInput } from '../../ipc/contracts'
import { AppError } from '../../ipc/errors'
import { nowIso } from '../../utils/time'
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

export interface RecipeDraft {
  outputItemId: number
  outputQty: number
  station: string | null
  notes: string | null
  ingredients: IngredientInput[]
}

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
  const itemNames = db.prepare<{ profileId: number }, { id: number; name: string }>(
    'SELECT id, name FROM item WHERE profile_id = :profileId',
  )
  const existingForOutput = db.prepare<{ outputItemId: number }, { id: number }>(
    'SELECT id FROM recipe WHERE output_item_id = :outputItemId',
  )
  const owner = db.prepare<{ profileId: number; recipeId: number }, { id: number }>(
    'SELECT id FROM recipe WHERE id = :recipeId AND profile_id = :profileId',
  )
  const insertRecipe = db.prepare(`
    INSERT INTO recipe (profile_id, output_item_id, output_qty, station, notes, created_at, updated_at)
    VALUES (:profileId, :outputItemId, :outputQty, :station, :notes, :now, :now)
  `)
  const updateRecipe = db.prepare(`
    UPDATE recipe SET output_item_id = :outputItemId, output_qty = :outputQty, station = :station,
                      notes = :notes, updated_at = :now
    WHERE id = :recipeId AND profile_id = :profileId
  `)
  const deleteIngredients = db.prepare('DELETE FROM recipe_ingredient WHERE recipe_id = :recipeId')
  const insertIngredient = db.prepare(`
    INSERT INTO recipe_ingredient (recipe_id, item_id, qty, mode, sort_order)
    VALUES (:recipeId, :itemId, :qty, :mode, :sortOrder)
  `)
  const deleteRecipe = db.prepare('DELETE FROM recipe WHERE id = :recipeId AND profile_id = :profileId')

  /** Every recipe of the profile in the shape the domain functions use, keyed by output item. */
  function loadGraph(profileId: number): Map<number, AggregationRecipe> {
    const graph = new Map<number, AggregationRecipe>()
    for (const row of select.all({ profileId, recipeId: null })) {
      let recipe = graph.get(row.outputItemId)
      if (!recipe) {
        recipe = { id: row.id, outputItemId: row.outputItemId, outputQty: row.outputQty, ingredients: [] }
        graph.set(row.outputItemId, recipe)
      }
      if (row.itemId !== null && row.qty !== null && row.mode !== null) {
        recipe.ingredients.push({ itemId: row.itemId, qty: row.qty, mode: row.mode })
      }
    }
    return graph
  }

  /** Throws CYCLE when the draft would close a loop (F3-R5, F3-R6). `recipeId` is the recipe being edited. */
  function assertAcyclic(profileId: number, draft: RecipeDraft, recipeId: number | null): void {
    const graph = loadGraph(profileId)
    if (recipeId !== null) {
      for (const [outputItemId, recipe] of graph) if (recipe.id === recipeId) graph.delete(outputItemId)
    }
    const cycle = findCycle(draft.outputItemId, draft.ingredients, graph)
    if (!cycle) return
    const names = new Map(itemNames.all({ profileId }).map((row) => [row.id, row.name]))
    const path = cycle.map((id) => names.get(id) ?? `#${id}`)
    throw new AppError('CYCLE', `Recipe วนกลับมาหาตัวเอง: ${path.join(' → ')}`, { path, itemIds: cycle })
  }

  function assertItemsInProfile(profileId: number, draft: RecipeDraft): void {
    const known = new Set(itemNames.all({ profileId }).map((row) => row.id))
    if (!known.has(draft.outputItemId)) throw new AppError('NOT_FOUND', 'ไม่พบ Item ปลายทาง', { field: 'outputItemId' })
    for (const ingredient of draft.ingredients) {
      if (!known.has(ingredient.itemId)) throw new AppError('NOT_FOUND', 'ไม่พบ Item ที่ใช้เป็นวัตถุดิบ', { field: 'ingredients' })
    }
  }

  function assertOutputFree(draft: RecipeDraft, recipeId: number | null): void {
    const existing = existingForOutput.get({ outputItemId: draft.outputItemId })
    if (existing && existing.id !== recipeId) {
      throw new AppError('DUPLICATE_RECIPE', 'Item นี้มี Recipe อยู่แล้ว', { id: existing.id })
    }
  }

  return {
    list: (profileId: number): RecipeJoinRow[] => select.all({ profileId, recipeId: null }),
    get: (profileId: number, recipeId: number): RecipeJoinRow[] => select.all({ profileId, recipeId }),
    exists: (profileId: number, recipeId: number): boolean => owner.get({ profileId, recipeId }) !== undefined,
    loadGraph,

    /** Dry run of the save checks, used by recipes:validate while the user edits a draft. */
    validate(profileId: number, draft: RecipeDraft, recipeId: number | null): void {
      assertItemsInProfile(profileId, draft)
      assertAcyclic(profileId, draft, recipeId)
    },

    /** Creates or replaces a recipe and its ingredients in one transaction (F3-R7). Returns the recipe id. */
    save(profileId: number, draft: RecipeDraft, recipeId: number | null): number {
      if (recipeId !== null && !owner.get({ profileId, recipeId })) throw new AppError('NOT_FOUND', 'ไม่พบ Recipe')
      assertItemsInProfile(profileId, draft)
      assertOutputFree(draft, recipeId)
      assertAcyclic(profileId, draft, recipeId)
      return db.transaction(() => {
        const now = nowIso()
        const fields = {
          outputItemId: draft.outputItemId,
          outputQty: draft.outputQty,
          station: draft.station,
          notes: draft.notes,
          now,
        }
        let id = recipeId
        if (id === null) {
          id = Number(insertRecipe.run({ profileId, ...fields }).lastInsertRowid)
        } else {
          updateRecipe.run({ recipeId: id, profileId, ...fields })
          deleteIngredients.run({ recipeId: id })
        }
        draft.ingredients.forEach((ingredient, index) => {
          insertIngredient.run({ recipeId: id, itemId: ingredient.itemId, qty: ingredient.qty, mode: ingredient.mode, sortOrder: index })
        })
        return id
      })()
    },

    /** Deleting a recipe removes its ingredients and tracking target through ON DELETE CASCADE (F3-R12). */
    delete(profileId: number, recipeId: number): void {
      if (deleteRecipe.run({ recipeId, profileId }).changes === 0) throw new AppError('NOT_FOUND', 'ไม่พบ Recipe')
    },
  }
}

export type RecipeRepository = ReturnType<typeof createRecipeRepository>
