import type { ItemCategory } from '../../domain/types'
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

/** Escapes LIKE wildcards so the search text matches literally (Data Model section 11.1). */
const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (char) => `\\${char}`)

/** Read side of the item library. Mutations arrive with the Item Library in Phase 2. */
export function createItemRepository(db: Db) {
  const list = db.prepare<
    { profileId: number; category: string | null; pinnedOnly: number; search: string },
    ItemRow
  >(`
    SELECT i.id, i.name, i.category, i.image_path AS imagePath, i.thumbnail_path AS thumbnailPath, i.notes,
           i.pinned, i.updated_at AS updatedAt, COALESCE(inv.owned, 0) AS owned,
           EXISTS (SELECT 1 FROM recipe r WHERE r.output_item_id = i.id) AS hasRecipe
    FROM item i
    LEFT JOIN inventory inv ON inv.item_id = i.id
    WHERE i.profile_id = :profileId
      AND (:category IS NULL OR i.category = :category)
      AND (:pinnedOnly = 0 OR i.pinned = 1)
      AND (:search = '' OR i.name LIKE '%' || :search || '%' ESCAPE '\\')
    ORDER BY i.pinned DESC, i.name COLLATE NOCASE
  `)
  const byId = db.prepare<{ profileId: number; id: number }, ItemRow>(`
    SELECT i.id, i.name, i.category, i.image_path AS imagePath, i.thumbnail_path AS thumbnailPath, i.notes,
           i.pinned, i.updated_at AS updatedAt, COALESCE(inv.owned, 0) AS owned,
           EXISTS (SELECT 1 FROM recipe r WHERE r.output_item_id = i.id) AS hasRecipe
    FROM item i
    LEFT JOIN inventory inv ON inv.item_id = i.id
    WHERE i.profile_id = :profileId AND i.id = :id
  `)
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

  return {
    list: (filter: ItemFilter): ItemRow[] =>
      list.all({
        profileId: filter.profileId,
        category: filter.category ?? null,
        pinnedOnly: filter.pinnedOnly ? 1 : 0,
        search: escapeLike((filter.search ?? '').trim()),
      }),
    get: (profileId: number, id: number): ItemRow | undefined => byId.get({ profileId, id }),
    findIdByName: (profileId: number, name: string): number | undefined => byName.get({ profileId, name })?.id,
    getUsage: (itemId: number): ItemUsageRow[] => usage.all({ itemId }),
  }
}

export type ItemRepository = ReturnType<typeof createItemRepository>
