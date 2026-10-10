import { nowIso } from '../../utils/time'
import type { Db } from '../index'

/** Key/value store over `app_setting`; values are JSON (Data Model section 3.12). */
export function createSettingRepository(db: Db) {
  const select = db.prepare<{ key: string }, { value: string }>('SELECT value FROM app_setting WHERE key = :key')
  const upsert = db.prepare(`
    INSERT INTO app_setting (key, value, updated_at) VALUES (:key, :value, :now)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)

  return {
    /** Returns the parsed JSON, or undefined when the key is missing or the stored text is not valid JSON. */
    get(key: string): unknown {
      const row = select.get({ key })
      if (!row) return undefined
      try {
        return JSON.parse(row.value)
      } catch {
        return undefined
      }
    },

    set(key: string, value: unknown): void {
      upsert.run({ key, value: JSON.stringify(value), now: nowIso() })
    },
  }
}

export type SettingRepository = ReturnType<typeof createSettingRepository>
