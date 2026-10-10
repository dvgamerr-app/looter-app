import type Database from 'better-sqlite3'
import initial from './001-initial'

export interface Migration {
  /** Equals the NNN prefix of the file name. */
  version: number
  /** Equals the name part of the file name. */
  name: string
  /** True when the migration replaces tables, which needs foreign_keys off outside the transaction. */
  rebuildsTables?: boolean
  /** Synchronous. Must not call BEGIN or COMMIT: the runner wraps it in a transaction. */
  up(db: Database.Database): void
}

export const migrations: Migration[] = [initial]
