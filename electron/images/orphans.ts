import { existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Db } from '../database'

export interface CleanupResult {
  /** Files in images/ that no row refers to; they were deleted. */
  removedFiles: number
  /** Items whose image file was missing; their image paths were set to NULL. */
  clearedItems: number
}

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

/**
 * Makes the database and the image folder agree (Data Model section 5.4): an item whose image file is
 * gone loses both image paths, and a file nothing refers to is deleted. `dataRoot` is the folder that
 * contains `images/`, so the same function serves the manual button and a restore into a temp folder.
 */
export function cleanupOrphanImages(db: Db, dataRoot: string): CleanupResult {
  const root = path.resolve(dataRoot)
  const exists = (relative: string): boolean => existsSync(path.join(root, ...relative.split('/')))

  const items = db
    .prepare<[], { id: number; imagePath: string | null; thumbnailPath: string | null }>(
      'SELECT id, image_path AS imagePath, thumbnail_path AS thumbnailPath FROM item WHERE image_path IS NOT NULL OR thumbnail_path IS NOT NULL',
    )
    .all()
  const clear = db.prepare('UPDATE item SET image_path = NULL, thumbnail_path = NULL WHERE id = :id')
  let clearedItems = 0
  db.transaction(() => {
    for (const item of items) {
      if (!item.imagePath || !item.thumbnailPath || !exists(item.imagePath) || !exists(item.thumbnailPath)) {
        clear.run({ id: item.id })
        clearedItems++
      }
    }
  })()

  // Read the references again after the pass above, so files of cleared items are removed too.
  const referenced = new Set<string>()
  const rows = db
    .prepare<[], { path: string | null }>(
      `SELECT image_path AS path FROM item UNION ALL SELECT thumbnail_path FROM item UNION ALL SELECT icon_path FROM game_profile`,
    )
    .all()
  for (const row of rows) if (row.path) referenced.add(path.join(root, ...row.path.split('/')))

  let removedFiles = 0
  for (const file of listFiles(path.join(root, 'images'))) {
    if (!referenced.has(file)) {
      rmSync(file, { force: true })
      removedFiles++
    }
  }
  return { removedFiles, clearedItems }
}
