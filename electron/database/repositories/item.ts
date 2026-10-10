import type { ItemCategory } from '../../domain/types'
import { AppError } from '../../ipc/errors'
import { nowIso } from '../../utils/time'
import type { Db } from '../index'

export interface ItemRow {
  id: number
  name: string
  category: ItemCategory
  imagePath: string | null
  thumbnailPath: string | null
  notes: string | null
  pinned: number
  updatedAt: string
  owned: number
  hasRecipe: number
}

export interface ItemFilter {
  profileId: number
  category?: ItemCategory | null
  pinnedOnly?: boolean
  search?: string
}

export interface ItemUsageRow {
  kind: 'recipe' | 'quest' | 'recipe_output'
  id: number
  label: string
}

export interface NewItem {
  name: string
  category: ItemCategory
  notes: string | null
}

export interface ItemPatch {
  name?: string
  category?: ItemCategory
  notes?: string | null
}

/** Files that belong to a deleted item; the caller removes them after the transaction commits. */
export interface ItemFiles {
  imagePath: string | null
  thumbnailPath: string | null
}

/** Escapes LIKE wildcards so the search text matches literally (Data Model section 11.1). */
const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (char) => `\\${char}`)

const SELECT_ITEM = `
  SELECT i.id, i.name, i.category, i.image_path AS imagePath, i.thumbnail_path AS thumbnailPath, i.notes,
         i.pinned, i.updated_at AS updatedAt, COALESCE(inv.owned, 0) AS owned,
         EXISTS (SELECT 1 FROM recipe r WHERE r.output_item_id = i.id) AS hasRecipe
  FROM item i
  LEFT JOIN inventory inv ON inv.item_id = i.id
`

export function createItemRepository(db: Db) {
  const list = db.prepare<
    { profileId: number; category: string | null; pinnedOnly: number; search: string },
    ItemRow
  >(`
    ${SELECT_ITEM}
    WHERE i.profile_id = :profileId
      AND (:category IS NULL OR i.category = :category)
      AND (:pinnedOnly = 0 OR i.pinned = 1)
      AND (:search = '' OR i.name LIKE '%' || :search || '%' ESCAPE '\\')
    ORDER BY i.pinned DESC, i.name COLLATE NOCASE
  `)
  const byId = db.prepare<{ profileId: number; id: number }, ItemRow>(
    `${SELECT_ITEM} WHERE i.profile_id = :profileId AND i.id = :id`,
  )
  const byName = db.prepare<{ profileId: number; name: string }, { id: number }>(
    'SELECT id FROM item WHERE profile_id = :profileId AND name = :name COLLATE NOCASE',
  )
  const usage = db.prepare<{ itemId: number }, ItemUsageRow>(`
    SELECT 'recipe' AS kind, r.id AS id, oi.name AS label
    FROM recipe_ingredient ri
    JOIN recipe r ON r.id = ri.recipe_id
    JOIN item oi ON oi.id = r.output_item_id
    WHERE ri.item_id = :itemId
    UNION ALL
    SELECT 'quest' AS kind, q.id AS id, q.name AS label
    FROM quest_requirement qr
    JOIN quest q ON q.id = qr.quest_id
    WHERE qr.item_id = :itemId
    UNION ALL
    SELECT 'recipe_output' AS kind, r.id AS id, oi.name AS label
    FROM recipe r
    JOIN item oi ON oi.id = r.output_item_id
    WHERE r.output_item_id = :itemId
    ORDER BY kind, label COLLATE NOCASE
  `)
  const insert = db.prepare(`
    INSERT INTO item (profile_id, name, category, notes, created_at, updated_at)
    VALUES (:profileId, :name, :category, :notes, :now, :now)
  `)
  const insertInventory = db.prepare('INSERT INTO inventory (item_id, owned, updated_at) VALUES (:itemId, 0, :now)')
  const update = db.prepare(`
    UPDATE item SET name = :name, category = :category, notes = :notes, updated_at = :now
    WHERE id = :id AND profile_id = :profileId
  `)
  const updatePinned = db.prepare(
    'UPDATE item SET pinned = :pinned, updated_at = :now WHERE id = :id AND profile_id = :profileId',
  )
  const updateImage = db.prepare(`
    UPDATE item SET image_path = :imagePath, thumbnail_path = :thumbnailPath, updated_at = :now
    WHERE id = :id AND profile_id = :profileId
  `)
  const remove = db.prepare('DELETE FROM item WHERE id = :id AND profile_id = :profileId')

  function require(profileId: number, id: number): ItemRow {
    const row = byId.get({ profileId, id })
    if (!row) throw new AppError('NOT_FOUND', 'ไม่พบ Item')
    return row
  }

  /** A UNIQUE violation on (profile_id, name) becomes DUPLICATE_NAME carrying the id that clashed (F2-R1). */
  function duplicate(profileId: number, name: string): AppError {
    return new AppError('DUPLICATE_NAME', 'มี Item ชื่อนี้แล้ว', { id: byName.get({ profileId, name })?.id ?? null })
  }

  return {
    list: (filter: ItemFilter): ItemRow[] =>
      list.all({
        profileId: filter.profileId,
        category: filter.category ?? null,
        pinnedOnly: filter.pinnedOnly ? 1 : 0,
        search: escapeLike((filter.search ?? '').trim()),
      }),
    get: (profileId: number, id: number): ItemRow | undefined => byId.get({ profileId, id }),
    require,
    exists: (profileId: number, id: number): boolean => byId.get({ profileId, id }) !== undefined,
    findIdByName: (profileId: number, name: string): number | undefined => byName.get({ profileId, name })?.id,
    getUsage: (itemId: number): ItemUsageRow[] => usage.all({ itemId }),

    /** Creates the item and its inventory row together (F2-R3). */
    create(profileId: number, item: NewItem): number {
      if (byName.get({ profileId, name: item.name })) throw duplicate(profileId, item.name)
      return db.transaction(() => {
        const now = nowIso()
        const id = Number(insert.run({ profileId, ...item, now }).lastInsertRowid)
        insertInventory.run({ itemId: id, now })
        return id
      })()
    },

    update(profileId: number, id: number, patch: ItemPatch): void {
      const current = require(profileId, id)
      const next = {
        name: patch.name ?? current.name,
        category: patch.category ?? current.category,
        notes: patch.notes === undefined ? current.notes : patch.notes,
      }
      const clash = byName.get({ profileId, name: next.name })
      if (clash && clash.id !== id) throw duplicate(profileId, next.name)
      update.run({ id, profileId, ...next, now: nowIso() })
    },

    setPinned(profileId: number, id: number, pinned: boolean): void {
      require(profileId, id)
      updatePinned.run({ id, profileId, pinned: pinned ? 1 : 0, now: nowIso() })
    },

    /** Both paths are set or both are cleared (Data Model invariant 14). */
    setImage(profileId: number, id: number, paths: ItemFiles): void {
      require(profileId, id)
      updateImage.run({ id, profileId, imagePath: paths.imagePath, thumbnailPath: paths.thumbnailPath, now: nowIso() })
    },

    /**
     * Deletes the item. Items used as an ingredient or quest requirement are refused (F2-R12); an item that
     * is only the output of a recipe takes that recipe with it through ON DELETE CASCADE (F2-R13).
     */
    delete(profileId: number, id: number): ItemFiles {
      const row = require(profileId, id)
      const blockers = usage.all({ itemId: id }).filter((entry) => entry.kind !== 'recipe_output')
      if (blockers.length > 0) {
        throw new AppError('ITEM_IN_USE', 'Item นี้ยังถูกใช้งานอยู่', { usages: blockers })
      }
      remove.run({ id, profileId })
      return { imagePath: row.imagePath, thumbnailPath: row.thumbnailPath }
    },
  }
}

export type ItemRepository = ReturnType<typeof createItemRepository>
