import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Db } from './index'
import type { Migration } from './migrations'
import { fileStamp } from '../utils/time'

const KEPT_BACKUPS = 5

/** The database was written by a newer app version (F12-R6 step 6). */
export class SchemaTooNewError extends Error {
  constructor(
    readonly current: number,
    readonly latest: number,
  ) {
    super(`Database schema v${current} is newer than the v${latest} this app supports`)
  }
}

/** A migration failed and was rolled back (F12-R7). */
export class MigrationError extends Error {
  constructor(
    readonly version: number,
    readonly migrationName: string,
    readonly backupPath: string | null,
    cause: unknown,
  ) {
    super(`Migration ${String(version).padStart(3, '0')}-${migrationName} failed: ${(cause as Error).message}`, { cause })
  }
}

function assertSequential(migrations: Migration[]): void {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(`Migrations must be numbered 1..n without gaps; found ${migration.version} at position ${index + 1}`)
    }
  })
}

function pruneBackups(backupsDir: string): void {
  const files = readdirSync(backupsDir)
    .filter((name) => /^gamelooter-v\d+-.+\.sqlite$/.test(name))
    .map((name) => ({ name, mtime: statSync(path.join(backupsDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  for (const file of files.slice(KEPT_BACKUPS)) rmSync(path.join(backupsDir, file.name), { force: true })
}

function applyMigration(db: Db, migration: Migration): void {
  if (migration.rebuildsTables) db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      migration.up(db)
      if (migration.rebuildsTables && (db.pragma('foreign_key_check') as unknown[]).length > 0) {
        throw new Error('foreign_key_check reported violations after the table rebuild')
      }
      db.pragma(`user_version = ${migration.version}`)
    })()
  } finally {
    db.pragma('foreign_keys = ON')
  }
}

/**
 * Brings the database up to the latest schema. Before any change on an existing database it takes a
 * snapshot with `db.backup()` into `backupsDir` (Data Model section 4.3).
 */
export async function migrate(
  db: Db,
  migrations: Migration[],
  backupsDir: string,
): Promise<{ from: number; to: number }> {
  assertSequential(migrations)
  const current = db.pragma('user_version', { simple: true }) as number
  const latest = migrations.at(-1)?.version ?? 0
  if (current > latest) throw new SchemaTooNewError(current, latest)

  const pending = migrations.filter((migration) => migration.version > current)
  if (pending.length === 0) return { from: current, to: latest }

  let backupPath: string | null = null
  if (current > 0) {
    mkdirSync(backupsDir, { recursive: true })
    backupPath = path.join(backupsDir, `gamelooter-v${current}-${fileStamp()}.sqlite`)
    await db.backup(backupPath)
    pruneBackups(backupsDir)
  }

  for (const migration of pending) {
    try {
      applyMigration(db, migration)
    } catch (error) {
      throw new MigrationError(migration.version, migration.name, backupPath, error)
    }
  }
  console.info(`migrated from v${current} to v${latest}`)
  return { from: current, to: latest }
}
