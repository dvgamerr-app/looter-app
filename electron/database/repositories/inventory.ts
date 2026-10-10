import type { Db } from '../index'

export interface OwnedRow {
  itemId: number
  owned: number
}

/** Read side of the manual inventory. Adjusting, consuming and crafting arrive in Phase 2. */
export function createInventoryRepository(db: Db) {
  const ownedByProfile = db.prepare<{ profileId: number }, OwnedRow>(`
    SELECT inv.item_id AS itemId, inv.owned
    FROM inventory inv
    JOIN item i ON i.id = inv.item_id
    WHERE i.profile_id = :profileId AND inv.owned > 0
  `)

  return {
    /** item_id -> owned for every item with at least one unit (a missing entry means 0). */
    ownedMap: (profileId: number): Map<number, number> =>
      new Map(ownedByProfile.all({ profileId }).map((row) => [row.itemId, row.owned])),
  }
}

export type InventoryRepository = ReturnType<typeof createInventoryRepository>
