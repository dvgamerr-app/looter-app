import { rmSync } from 'node:fs'
import path from 'node:path'
import { AppError, mapDatabaseError } from '../../ipc/errors'
import { nowIso } from '../../utils/time'
import { imagesDir, type Db } from '../index'

export interface ProfileRow {
  id: number
  name: string
  iconPath: string | null
  createdAt: string
  updatedAt: string
  lastOpenedAt: string | null
  itemCount: number
  recipeCount: number
  questCount: number
}

export interface DeleteSummaryRow {
  id: number
  name: string
  items: number
  recipes: number
  quests: number
  targets: number
  imageFiles: number
}

const DUPLICATE_MESSAGE = 'มี Game Profile ชื่อนี้อยู่แล้ว'

export function createProfileRepository(db: Db) {
  const listAll = db.prepare<[], ProfileRow>(`
    SELECT p.id, p.name, p.icon_path AS iconPath, p.created_at AS createdAt, p.updated_at AS updatedAt,
           p.last_opened_at AS lastOpenedAt,
           (SELECT COUNT(*) FROM item i WHERE i.profile_id = p.id) AS itemCount,
           (SELECT COUNT(*) FROM recipe r WHERE r.profile_id = p.id) AS recipeCount,
           (SELECT COUNT(*) FROM quest q WHERE q.profile_id = p.id) AS questCount
    FROM game_profile p
    ORDER BY p.last_opened_at DESC NULLS LAST, p.name COLLATE NOCASE
  `)
  const byId = db.prepare<{ id: number }, { id: number; name: string }>(
    'SELECT id, name FROM game_profile WHERE id = :id',
  )
  const mostRecentId = db.prepare<[], { id: number }>(
    'SELECT id FROM game_profile ORDER BY last_opened_at DESC NULLS LAST, id LIMIT 1',
  )
  const insert = db.prepare('INSERT INTO game_profile (name, created_at, updated_at) VALUES (:name, :now, :now)')
  const updateName = db.prepare('UPDATE game_profile SET name = :name, updated_at = :now WHERE id = :id')
  const touch = db.prepare('UPDATE game_profile SET last_opened_at = :now WHERE id = :id')
  const summary = db.prepare<{ id: number }, Omit<DeleteSummaryRow, 'id' | 'name'>>(`
    SELECT (SELECT COUNT(*) FROM item WHERE profile_id = :id) AS items,
           (SELECT COUNT(*) FROM recipe WHERE profile_id = :id) AS recipes,
           (SELECT COUNT(*) FROM quest WHERE profile_id = :id) AS quests,
           (SELECT COUNT(*) FROM tracking_target WHERE profile_id = :id) AS targets,
           (SELECT COUNT(image_path) + COUNT(thumbnail_path) FROM item WHERE profile_id = :id) AS imageFiles
  `)
  // Children are deleted explicitly, in dependency order, so the delete never relies on SQLite's
  // internal cascade ordering (Data Model section 3.11).
  const cascade = [
    'DELETE FROM tracking_target WHERE profile_id = :id',
    'DELETE FROM quest_requirement WHERE quest_id IN (SELECT id FROM quest WHERE profile_id = :id)',
    'DELETE FROM recipe_ingredient WHERE recipe_id IN (SELECT id FROM recipe WHERE profile_id = :id)',
    'DELETE FROM quest WHERE profile_id = :id',
    'DELETE FROM recipe WHERE profile_id = :id',
    'DELETE FROM inventory WHERE item_id IN (SELECT id FROM item WHERE profile_id = :id)',
    'DELETE FROM item WHERE profile_id = :id',
    'DELETE FROM game_profile WHERE id = :id',
  ].map((sql) => db.prepare(sql))

  function requireProfile(id: number): { id: number; name: string } {
    const row = byId.get({ id })
    if (!row) throw new AppError('NOT_FOUND', 'ไม่พบ Game Profile')
    return row
  }

  return {
    list: (): ProfileRow[] => listAll.all(),
    get: (id: number): ProfileRow | undefined => listAll.all().find((row) => row.id === id),
    exists: (id: number): boolean => byId.get({ id }) !== undefined,
    /** Profile used when `active_profile_id` is empty or dangling (F1-R5). */
    mostRecentId: (): number | null => mostRecentId.get()?.id ?? null,

    create(name: string): number {
      try {
        return Number(insert.run({ name: name.trim(), now: nowIso() }).lastInsertRowid)
      } catch (error) {
        throw mapDatabaseError(error, DUPLICATE_MESSAGE)
      }
    },

    rename(id: number, name: string): void {
      requireProfile(id)
      try {
        updateName.run({ id, name: name.trim(), now: nowIso() })
      } catch (error) {
        throw mapDatabaseError(error, DUPLICATE_MESSAGE)
      }
    },

    touchLastOpened: (id: number): void => {
      touch.run({ id, now: nowIso() })
    },

    getDeleteSummary(id: number): DeleteSummaryRow {
      const profile = requireProfile(id)
      return { id, name: profile.name, ...summary.get({ id })! }
    },

    /** Deletes the profile in one transaction, then its image folder (F1-R9). */
    delete(id: number): void {
      requireProfile(id)
      db.transaction(() => {
        for (const statement of cascade) statement.run({ id })
      })()
      try {
        rmSync(path.join(imagesDir(), String(id)), { recursive: true, force: true })
      } catch (error) {
        console.error(`Could not remove the image folder of profile ${id}`, error)
      }
    },
  }
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>
