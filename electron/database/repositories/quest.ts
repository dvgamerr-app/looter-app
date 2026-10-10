import type { Mode } from '../../domain/types'
import type { IngredientInput, QuestStatus } from '../../ipc/contracts'
import { AppError } from '../../ipc/errors'
import { nowIso } from '../../utils/time'
import type { Db } from '../index'

export interface QuestJoinRow {
  id: number
  name: string
  status: QuestStatus
  notes: string | null
  completedAt: string | null
  updatedAt: string
  itemId: number | null
  qty: number | null
  mode: Mode | null
  sortOrder: number | null
  trackingTargetId: number | null
}

export interface QuestDraft {
  name: string
  notes: string | null
  requirements: IngredientInput[]
}

export function createQuestRepository(db: Db) {
  const select = db.prepare<{ profileId: number; status: string | null; questId: number | null }, QuestJoinRow>(`
    SELECT q.id, q.name, q.status, q.notes, q.completed_at AS completedAt, q.updated_at AS updatedAt,
           qr.item_id AS itemId, qr.qty, qr.mode, qr.sort_order AS sortOrder,
           tt.id AS trackingTargetId
    FROM quest q
    LEFT JOIN quest_requirement qr ON qr.quest_id = q.id
    LEFT JOIN tracking_target tt ON tt.quest_id = q.id
    WHERE q.profile_id = :profileId
      AND (:status IS NULL OR q.status = :status)
      AND (:questId IS NULL OR q.id = :questId)
    ORDER BY q.status, q.updated_at DESC, q.id, qr.sort_order
  `)
  const knownItems = db.prepare<{ profileId: number }, { id: number }>('SELECT id FROM item WHERE profile_id = :profileId')
  const owner = db.prepare<{ profileId: number; questId: number }, { id: number; status: QuestStatus }>(
    'SELECT id, status FROM quest WHERE id = :questId AND profile_id = :profileId',
  )
  const insertQuest = db.prepare(`
    INSERT INTO quest (profile_id, name, notes, created_at, updated_at) VALUES (:profileId, :name, :notes, :now, :now)
  `)
  const updateQuest = db.prepare(
    'UPDATE quest SET name = :name, notes = :notes, updated_at = :now WHERE id = :questId AND profile_id = :profileId',
  )
  const updateStatus = db.prepare(`
    UPDATE quest SET status = :status, completed_at = :completedAt, updated_at = :now
    WHERE id = :questId AND profile_id = :profileId
  `)
  const deleteRequirements = db.prepare('DELETE FROM quest_requirement WHERE quest_id = :questId')
  const insertRequirement = db.prepare(`
    INSERT INTO quest_requirement (quest_id, item_id, qty, mode, sort_order)
    VALUES (:questId, :itemId, :qty, :mode, :sortOrder)
  `)
  const deleteQuest = db.prepare('DELETE FROM quest WHERE id = :questId AND profile_id = :profileId')

  function assertItems(profileId: number, requirements: IngredientInput[]): void {
    const known = new Set(knownItems.all({ profileId }).map((row) => row.id))
    for (const requirement of requirements) {
      if (!known.has(requirement.itemId)) throw new AppError('NOT_FOUND', 'ไม่พบ Item ที่ใช้เป็น Requirement', { field: 'requirements' })
    }
  }

  const writeRequirements = (questId: number, requirements: IngredientInput[]): void => {
    deleteRequirements.run({ questId })
    requirements.forEach((requirement, index) => {
      insertRequirement.run({ questId, itemId: requirement.itemId, qty: requirement.qty, mode: requirement.mode, sortOrder: index })
    })
  }

  return {
    list: (profileId: number, status?: QuestStatus): QuestJoinRow[] =>
      select.all({ profileId, status: status ?? null, questId: null }),
    get: (profileId: number, questId: number): QuestJoinRow[] => select.all({ profileId, status: null, questId }),
    exists: (profileId: number, questId: number): boolean => owner.get({ profileId, questId }) !== undefined,
    statusOf: (profileId: number, questId: number): QuestStatus | undefined => owner.get({ profileId, questId })?.status,

    create(profileId: number, draft: QuestDraft): number {
      assertItems(profileId, draft.requirements)
      return db.transaction(() => {
        const id = Number(insertQuest.run({ profileId, name: draft.name, notes: draft.notes, now: nowIso() }).lastInsertRowid)
        writeRequirements(id, draft.requirements)
        return id
      })()
    },

    /** Replaces the supplied fields; `requirements` replaces the whole list in the same transaction (F4-R9). */
    update(profileId: number, questId: number, patch: Partial<QuestDraft>): void {
      const current = owner.get({ profileId, questId })
      if (!current) throw new AppError('NOT_FOUND', 'ไม่พบ Quest')
      if (patch.requirements) assertItems(profileId, patch.requirements)
      const existing = select.all({ profileId, status: null, questId })[0]!
      db.transaction(() => {
        updateQuest.run({
          questId,
          profileId,
          name: patch.name ?? existing.name,
          notes: patch.notes === undefined ? existing.notes : patch.notes,
          now: nowIso(),
        })
        if (patch.requirements) writeRequirements(questId, patch.requirements)
      })()
    },

    /** Changing the status never touches the inventory (F4-R3). `completed_at` follows the status (invariant 13). */
    setStatus(profileId: number, questId: number, status: QuestStatus): void {
      if (!owner.get({ profileId, questId })) throw new AppError('NOT_FOUND', 'ไม่พบ Quest')
      const now = nowIso()
      updateStatus.run({ questId, profileId, status, completedAt: status === 'completed' ? now : null, now })
    },

    /** Requirements and the tracking target go with the quest through ON DELETE CASCADE (F4-R10). */
    delete(profileId: number, questId: number): void {
      if (deleteQuest.run({ questId, profileId }).changes === 0) throw new AppError('NOT_FOUND', 'ไม่พบ Quest')
    },
  }
}

export type QuestRepository = ReturnType<typeof createQuestRepository>
