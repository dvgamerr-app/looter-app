import type { Mode } from '../../domain/types'
import type { Db } from '../index'

export interface QuestJoinRow {
  id: number
  name: string
  status: 'active' | 'paused' | 'completed'
  notes: string | null
  completedAt: string | null
  updatedAt: string
  itemId: number | null
  qty: number | null
  mode: Mode | null
  sortOrder: number | null
  trackingTargetId: number | null
}

/** Read side of quests. Creating and editing quests arrives in Phase 2. */
export function createQuestRepository(db: Db) {
  const select = db.prepare<{ profileId: number; status: string | null }, QuestJoinRow>(`
    SELECT q.id, q.name, q.status, q.notes, q.completed_at AS completedAt, q.updated_at AS updatedAt,
           qr.item_id AS itemId, qr.qty, qr.mode, qr.sort_order AS sortOrder,
           tt.id AS trackingTargetId
    FROM quest q
    LEFT JOIN quest_requirement qr ON qr.quest_id = q.id
    LEFT JOIN tracking_target tt ON tt.quest_id = q.id
    WHERE q.profile_id = :profileId AND (:status IS NULL OR q.status = :status)
    ORDER BY q.status, q.updated_at DESC, qr.sort_order
  `)

  return {
    list: (profileId: number, status?: string): QuestJoinRow[] => select.all({ profileId, status: status ?? null }),
  }
}

export type QuestRepository = ReturnType<typeof createQuestRepository>
