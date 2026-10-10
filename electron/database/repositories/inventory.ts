import { MAX_OWNED } from '../../domain/limits'
import type { InventoryPlan, InventoryPlanRow } from '../../ipc/contracts'
import { AppError } from '../../ipc/errors'
import { nowIso } from '../../utils/time'
import type { Db } from '../index'

export interface OwnedRow {
  itemId: number
  owned: number
}

interface RequirementRow {
  itemId: number
  name: string
  qty: number
  owned: number
}

const maxRunsFor = (rows: RequirementRow[]): number | null =>
  rows.length === 0 ? null : Math.min(...rows.map((row) => Math.floor(row.owned / row.qty)))

/** Manual inventory plus the atomic consume and craft actions (Data Model section 9). */
export function createInventoryRepository(db: Db) {
  const ownedByProfile = db.prepare<{ profileId: number }, OwnedRow>(`
    SELECT inv.item_id AS itemId, inv.owned
    FROM inventory inv
    JOIN item i ON i.id = inv.item_id
    WHERE i.profile_id = :profileId AND inv.owned > 0
  `)
  const ownedOf = db.prepare<{ itemId: number }, { owned: number }>(
    'SELECT COALESCE((SELECT owned FROM inventory WHERE item_id = :itemId), 0) AS owned',
  )
  const itemInProfile = db.prepare<{ profileId: number; itemId: number }, { id: number }>(
    'SELECT id FROM item WHERE id = :itemId AND profile_id = :profileId',
  )
  const adjustStatement = db.prepare(`
    INSERT INTO inventory (item_id, owned, updated_at)
    VALUES (:itemId, MIN(:max, MAX(0, :delta)), :now)
    ON CONFLICT(item_id) DO UPDATE SET owned = MIN(:max, MAX(0, owned + :delta)), updated_at = excluded.updated_at
  `)
  const setStatement = db.prepare(`
    INSERT INTO inventory (item_id, owned, updated_at) VALUES (:itemId, :owned, :now)
    ON CONFLICT(item_id) DO UPDATE SET owned = excluded.owned, updated_at = excluded.updated_at
  `)
  const decrement = db.prepare(
    'UPDATE inventory SET owned = owned - :qty, updated_at = :now WHERE item_id = :itemId AND owned >= :qty',
  )
  const questRequirements = db.prepare<{ questId: number; profileId: number }, RequirementRow>(`
    SELECT qr.item_id AS itemId, i.name, qr.qty, COALESCE(inv.owned, 0) AS owned
    FROM quest_requirement qr
    JOIN item i ON i.id = qr.item_id
    LEFT JOIN inventory inv ON inv.item_id = qr.item_id
    WHERE qr.quest_id = :questId AND i.profile_id = :profileId
    ORDER BY qr.sort_order
  `)
  const questHeader = db.prepare<{ questId: number; profileId: number }, { status: 'active' | 'paused' | 'completed' }>(
    'SELECT status FROM quest WHERE id = :questId AND profile_id = :profileId',
  )
  const recipeHeader = db.prepare<
    { recipeId: number; profileId: number },
    { outputItemId: number; outputQty: number }
  >('SELECT output_item_id AS outputItemId, output_qty AS outputQty FROM recipe WHERE id = :recipeId AND profile_id = :profileId')
  const recipeIngredients = db.prepare<{ recipeId: number; profileId: number }, RequirementRow>(`
    SELECT ri.item_id AS itemId, i.name, ri.qty, COALESCE(inv.owned, 0) AS owned
    FROM recipe_ingredient ri
    JOIN item i ON i.id = ri.item_id
    LEFT JOIN inventory inv ON inv.item_id = ri.item_id
    WHERE ri.recipe_id = :recipeId AND i.profile_id = :profileId
    ORDER BY ri.sort_order
  `)
  const targetOfQuest = db.prepare<{ questId: number }, { id: number; targetQty: number }>(
    'SELECT id, target_qty AS targetQty FROM tracking_target WHERE quest_id = :questId',
  )
  const targetOfRecipe = db.prepare<{ recipeId: number }, { id: number; targetQty: number }>(
    'SELECT id, target_qty AS targetQty FROM tracking_target WHERE recipe_id = :recipeId',
  )

  const rowsOf = (requirements: RequirementRow[], times: number): InventoryPlanRow[] =>
    requirements.map((row) => ({
      itemId: row.itemId,
      delta: -row.qty * times,
      before: row.owned,
      after: row.owned - row.qty * times,
    }))

  const missingOf = (requirements: RequirementRow[], times: number): InventoryPlan['missing'] =>
    requirements
      .filter((row) => row.owned < row.qty * times)
      .map((row) => ({ itemId: row.itemId, name: row.name, need: row.qty * times, owned: row.owned }))

  /** Read-only plan for consuming a quest's requirements (F8-R1, F8-R9). */
  function planConsume(profileId: number, questId: number): InventoryPlan {
    const quest = questHeader.get({ questId, profileId })
    if (!quest) throw new AppError('NOT_FOUND', 'ไม่พบ Quest')
    const requirements = questRequirements.all({ questId, profileId })
    const missing = missingOf(requirements, 1)
    return {
      ok: requirements.length > 0 && missing.length === 0,
      rows: rowsOf(requirements, 1),
      output: null,
      missing,
      target: targetOfQuest.get({ questId }) ?? null,
      maxRuns: null,
      questStatus: quest.status,
    }
  }

  /** Read-only plan for crafting `runs` times (F8-R2, F8-R9). */
  function planCraft(profileId: number, recipeId: number, runs: number): InventoryPlan {
    const recipe = recipeHeader.get({ recipeId, profileId })
    if (!recipe) throw new AppError('NOT_FOUND', 'ไม่พบ Recipe')
    const ingredients = recipeIngredients.all({ recipeId, profileId })
    const missing = missingOf(ingredients, runs)
    const before = ownedOf.get({ itemId: recipe.outputItemId })?.owned ?? 0
    const gained = recipe.outputQty * runs
    const maxRuns = maxRunsFor(ingredients)
    if (before + gained > MAX_OWNED) {
      const room = Math.floor((MAX_OWNED - before) / recipe.outputQty)
      throw new AppError('VALIDATION', 'จำนวนที่ได้เกินค่าสูงสุดของ Inventory', { field: 'runs', maxRuns: room })
    }
    return {
      ok: missing.length === 0,
      rows: rowsOf(ingredients, runs),
      output: { itemId: recipe.outputItemId, delta: gained, before, after: before + gained },
      missing,
      target: targetOfRecipe.get({ recipeId }) ?? null,
      maxRuns,
      questStatus: null,
    }
  }

  const insufficient = (plan: InventoryPlan): AppError =>
    new AppError('INSUFFICIENT_MATERIALS', 'วัตถุดิบไม่พอ', {
      items: plan.missing,
    })

  return {
    /** item_id -> owned for every item with at least one unit (a missing entry means 0). */
    ownedMap: (profileId: number): Map<number, number> =>
      new Map(ownedByProfile.all({ profileId }).map((row) => [row.itemId, row.owned])),

    getOwned: (itemId: number): number => ownedOf.get({ itemId })?.owned ?? 0,

    /** Relative change, clamped to 0..MAX_OWNED instead of rejected (F7-R2). Returns the new value. */
    adjust(profileId: number, itemId: number, delta: number): number {
      if (!itemInProfile.get({ profileId, itemId })) throw new AppError('NOT_FOUND', 'ไม่พบ Item')
      adjustStatement.run({ itemId, delta, max: MAX_OWNED, now: nowIso() })
      return ownedOf.get({ itemId })!.owned
    },

    /** Direct value; the caller has already validated the range (F7-R3). */
    set(profileId: number, itemId: number, owned: number): number {
      if (!itemInProfile.get({ profileId, itemId })) throw new AppError('NOT_FOUND', 'ไม่พบ Item')
      setStatement.run({ itemId, owned, now: nowIso() })
      return owned
    },

    planConsume,
    planCraft,

    /** Deducts a quest's requirements all-or-nothing. Run inside the handler's transaction. */
    consume(profileId: number, questId: number): InventoryPlan {
      return db.transaction(() => {
        const plan = planConsume(profileId, questId)
        if (plan.rows.length === 0) throw new AppError('VALIDATION', 'Quest นี้ไม่มี Requirement ให้หัก')
        if (!plan.ok) throw insufficient(plan)
        const now = nowIso()
        for (const row of plan.rows) {
          if (decrement.run({ itemId: row.itemId, qty: -row.delta, now }).changes !== 1) {
            throw new AppError('IO', 'หักวัตถุดิบไม่สำเร็จ', { itemId: row.itemId })
          }
        }
        return plan
      })()
    },

    /** Deducts the ingredients and adds the output in one transaction (F8-R2). */
    craft(profileId: number, recipeId: number, runs: number): InventoryPlan {
      return db.transaction(() => {
        const plan = planCraft(profileId, recipeId, runs)
        if (!plan.ok) throw insufficient(plan)
        const now = nowIso()
        for (const row of plan.rows) {
          if (decrement.run({ itemId: row.itemId, qty: -row.delta, now }).changes !== 1) {
            throw new AppError('IO', 'หักวัตถุดิบไม่สำเร็จ', { itemId: row.itemId })
          }
        }
        if (plan.output) setStatement.run({ itemId: plan.output.itemId, owned: plan.output.after, now })
        return plan
      })()
    },
  }
}

export type InventoryRepository = ReturnType<typeof createInventoryRepository>
