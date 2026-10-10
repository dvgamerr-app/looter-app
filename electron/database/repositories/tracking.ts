import type { TrackingKind } from '../../domain/types'
import type { QuestStatus } from '../../ipc/contracts'
import { AppError } from '../../ipc/errors'
import { nowIso } from '../../utils/time'
import type { Db } from '../index'

export interface TrackingTargetRow {
  id: number
  kind: TrackingKind
  questId: number | null
  recipeId: number | null
  targetQty: number
  priority: number
  pinned: number
}

/** A target with the name of its quest or recipe output, for the target list (F5-R10). */
export interface TrackingLabelRow extends TrackingTargetRow {
  label: string
  questStatus: QuestStatus | null
}

export interface NewTarget {
  kind: TrackingKind
  questId?: number
  recipeId?: number
  targetQty: number
}

export function createTrackingRepository(db: Db) {
  // Quest targets only take part while the quest is active (Data Model section 11.2).
  const activeTargets = db.prepare<{ profileId: number }, TrackingTargetRow>(`
    SELECT tt.id, tt.kind, tt.quest_id AS questId, tt.recipe_id AS recipeId, tt.target_qty AS targetQty,
           tt.priority, tt.pinned
    FROM tracking_target tt
    LEFT JOIN quest q ON q.id = tt.quest_id
    WHERE tt.profile_id = :profileId AND (tt.kind = 'recipe' OR q.status = 'active')
    ORDER BY tt.priority, tt.id
  `)
  const allTargets = db.prepare<{ profileId: number }, TrackingTargetRow>(`
    SELECT id, kind, quest_id AS questId, recipe_id AS recipeId, target_qty AS targetQty, priority, pinned
    FROM tracking_target
    WHERE profile_id = :profileId
    ORDER BY priority, id
  `)
  const labelled = db.prepare<{ profileId: number }, TrackingLabelRow>(`
    SELECT tt.id, tt.kind, tt.quest_id AS questId, tt.recipe_id AS recipeId, tt.target_qty AS targetQty,
           tt.priority, tt.pinned,
           COALESCE(q.name, oi.name, '') AS label, q.status AS questStatus
    FROM tracking_target tt
    LEFT JOIN quest q ON q.id = tt.quest_id
    LEFT JOIN recipe r ON r.id = tt.recipe_id
    LEFT JOIN item oi ON oi.id = r.output_item_id
    WHERE tt.profile_id = :profileId
    ORDER BY tt.priority, tt.id
  `)
  const byId = db.prepare<{ profileId: number; id: number }, TrackingTargetRow>(`
    SELECT id, kind, quest_id AS questId, recipe_id AS recipeId, target_qty AS targetQty, priority, pinned
    FROM tracking_target WHERE profile_id = :profileId AND id = :id
  `)
  const questOwner = db.prepare<{ profileId: number; id: number }, { id: number }>(
    'SELECT id FROM quest WHERE id = :id AND profile_id = :profileId',
  )
  const recipeOwner = db.prepare<{ profileId: number; id: number }, { id: number }>(
    'SELECT id FROM recipe WHERE id = :id AND profile_id = :profileId',
  )
  const byQuest = db.prepare<{ questId: number }, { id: number }>('SELECT id FROM tracking_target WHERE quest_id = :questId')
  const byRecipe = db.prepare<{ recipeId: number }, { id: number }>('SELECT id FROM tracking_target WHERE recipe_id = :recipeId')
  const insert = db.prepare(`
    INSERT INTO tracking_target (profile_id, kind, quest_id, recipe_id, target_qty, priority, pinned, created_at)
    VALUES (:profileId, :kind, :questId, :recipeId, :targetQty,
            (SELECT COALESCE(MAX(priority), 0) + 1 FROM tracking_target WHERE profile_id = :profileId), 0, :now)
  `)
  const remove = db.prepare('DELETE FROM tracking_target WHERE id = :id AND profile_id = :profileId')
  const setQty = db.prepare('UPDATE tracking_target SET target_qty = :targetQty WHERE id = :id AND profile_id = :profileId')
  const setPinned = db.prepare('UPDATE tracking_target SET pinned = :pinned WHERE id = :id AND profile_id = :profileId')
  const setPriority = db.prepare('UPDATE tracking_target SET priority = :priority WHERE id = :id AND profile_id = :profileId')
  const idsInOrder = db.prepare<{ profileId: number }, { id: number }>(
    'SELECT id FROM tracking_target WHERE profile_id = :profileId ORDER BY priority, id',
  )

  /** Rewrites priorities as 1..n in the current order (Data Model invariant 11). */
  const renumber = (profileId: number): void => {
    idsInOrder.all({ profileId }).forEach((row, index) => setPriority.run({ id: row.id, profileId, priority: index + 1 }))
  }

  const require = (profileId: number, id: number): TrackingTargetRow => {
    const row = byId.get({ profileId, id })
    if (!row) throw new AppError('NOT_FOUND', 'ไม่พบ Tracking Target')
    return row
  }

  return {
    listActive: (profileId: number): TrackingTargetRow[] => activeTargets.all({ profileId }),
    listAll: (profileId: number): TrackingTargetRow[] => allTargets.all({ profileId }),
    listLabelled: (profileId: number): TrackingLabelRow[] => labelled.all({ profileId }),
    get: (profileId: number, id: number): TrackingTargetRow | undefined => byId.get({ profileId, id }),
    require,

    /** Appends a target at the lowest priority (F5-R4). One target per quest or recipe (F5-R1). */
    add(profileId: number, target: NewTarget): number {
      if (target.kind === 'quest') {
        if (target.questId === undefined || !questOwner.get({ profileId, id: target.questId })) {
          throw new AppError('NOT_FOUND', 'ไม่พบ Quest')
        }
        if (byQuest.get({ questId: target.questId })) throw new AppError('DUPLICATE_TARGET', 'Quest นี้ถูกติดตามอยู่แล้ว')
      } else {
        if (target.recipeId === undefined || !recipeOwner.get({ profileId, id: target.recipeId })) {
          throw new AppError('NOT_FOUND', 'ไม่พบ Recipe')
        }
        if (byRecipe.get({ recipeId: target.recipeId })) throw new AppError('DUPLICATE_TARGET', 'Recipe นี้ถูกติดตามอยู่แล้ว')
      }
      return Number(
        insert.run({
          profileId,
          kind: target.kind,
          questId: target.kind === 'quest' ? target.questId : null,
          recipeId: target.kind === 'recipe' ? target.recipeId : null,
          // A quest target does not use the quantity; it is stored as 1 (F5-R3).
          targetQty: target.kind === 'recipe' ? target.targetQty : 1,
          now: nowIso(),
        }).lastInsertRowid,
      )
    },

    /** Removes only the target row and closes the gap in the priorities (F5-R2). */
    remove(profileId: number, id: number): void {
      require(profileId, id)
      db.transaction(() => {
        remove.run({ id, profileId })
        renumber(profileId)
      })()
    },

    updateQty(profileId: number, id: number, targetQty: number): void {
      const target = require(profileId, id)
      if (target.kind !== 'recipe') throw new AppError('VALIDATION', 'Quest ไม่มีจำนวนเป้าหมาย')
      setQty.run({ id, profileId, targetQty })
    },

    setPinned(profileId: number, id: number, pinned: boolean): void {
      require(profileId, id)
      setPinned.run({ id, profileId, pinned: pinned ? 1 : 0 })
    },

    /** `ids` must be exactly the profile's targets in the new order (F5-R5). */
    reorder(profileId: number, ids: number[]): void {
      const current = idsInOrder.all({ profileId }).map((row) => row.id)
      const same = ids.length === current.length && new Set(ids).size === ids.length && ids.every((id) => current.includes(id))
      if (!same) throw new AppError('VALIDATION', 'รายการลำดับไม่ครบหรือไม่ตรงกับข้อมูลปัจจุบัน', { field: 'ids' })
      db.transaction(() => ids.forEach((id, index) => setPriority.run({ id, profileId, priority: index + 1 })))()
    },

    /** Lowers a recipe target after crafting, removing it when nothing is left (F8-R11). */
    reduceRecipeTarget(profileId: number, recipeId: number, by: number): void {
      const target = byRecipe.get({ recipeId })
      if (!target) return
      const row = require(profileId, target.id)
      const left = row.targetQty - by
      if (left <= 0) {
        remove.run({ id: row.id, profileId })
        renumber(profileId)
      } else {
        setQty.run({ id: row.id, profileId, targetQty: left })
      }
    },
  }
}

export type TrackingRepository = ReturnType<typeof createTrackingRepository>
