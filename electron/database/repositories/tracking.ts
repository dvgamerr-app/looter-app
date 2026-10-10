import type { TrackingKind } from '../../domain/types'
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

/** Read side of tracking targets. Add, reorder and remove arrive in Phase 2. */
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

  return {
    listActive: (profileId: number): TrackingTargetRow[] => activeTargets.all({ profileId }),
    listAll: (profileId: number): TrackingTargetRow[] => allTargets.all({ profileId }),
  }
}

export type TrackingRepository = ReturnType<typeof createTrackingRepository>
