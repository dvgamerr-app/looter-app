import Database from 'better-sqlite3'
import { strFromU8, strToU8, unzipSync, zip, type Zippable } from 'fflate'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { migrate, SchemaTooNewError } from '../database/migrate'
import type { Migration } from '../database/migrations'
import type { Db } from '../database'
import { cleanupOrphanImages } from '../images/orphans'
import type { BackupSummary } from '../ipc/contracts'
import { AppError } from '../ipc/errors'
import { fileStamp } from '../utils/time'

const FORMAT = 'gamelooter-backup'
const FORMAT_VERSION = 1
const KEPT_PRE_RESTORE = 1
const RESTART_AFTER_FAILURE_MS = 3000

interface Manifest {
  format: string
  formatVersion: number
  appVersion: string
  schemaVersion: number
  exportedAt: string
  profiles?: Array<{ id: number; name: string; items: number }>
}

export interface BackupDeps {
  getDb: () => Db
  migrations: Migration[]
  appVersion: string
  /** `<userData>` */
  userDataDir: string
  dataDir: string
  backupsDir: string
  /** Closes the database, the overlay, the capture window and the hotkeys before the folders are swapped. */
  prepareForSwap: () => void
  /** Starts the app again; `afterMs` delays the restart so an error can still be shown. */
  relaunch: (afterMs?: number) => void
}

const invalid = (message = 'ไฟล์นี้ไม่ใช่ Backup ของ GameLooter หรือ manifest.json เสียหาย'): AppError =>
  new AppError('BACKUP_INVALID', message)

/** An entry may only live below the extraction folder: no absolute path, drive letter or `..` (F11-R12). */
function isSafeEntry(name: string): boolean {
  if (name.startsWith('/') || name.startsWith('\\') || /^[a-zA-Z]:/.test(name)) return false
  return !name.split(/[\\/]/).includes('..')
}

function parseManifest(bytes: Uint8Array): Manifest {
  let value: unknown
  try {
    value = JSON.parse(strFromU8(bytes))
  } catch {
    throw invalid()
  }
  const manifest = value as Partial<Manifest>
  if (
    manifest.format !== FORMAT ||
    manifest.formatVersion !== FORMAT_VERSION ||
    typeof manifest.appVersion !== 'string' ||
    typeof manifest.exportedAt !== 'string' ||
    !Number.isInteger(manifest.schemaVersion) ||
    (manifest.schemaVersion as number) < 1
  ) {
    throw invalid()
  }
  return manifest as Manifest
}

/** Reads the zip's entry list and the manifest without extracting anything. */
function readArchive(file: string): { names: string[]; manifest: Manifest } {
  let data: Uint8Array
  try {
    data = new Uint8Array(readFileSync(file))
  } catch (error) {
    throw new AppError('IO', 'เปิดไฟล์ Backup ไม่สำเร็จ', { reason: (error as Error).message })
  }
  const names: string[] = []
  let manifestBytes: Uint8Array | undefined
  try {
    const manifestOnly = unzipSync(data, {
      filter: (entry) => {
        names.push(entry.name)
        return entry.name === 'manifest.json'
      },
    })
    manifestBytes = manifestOnly['manifest.json']
  } catch {
    throw invalid()
  }
  if (!manifestBytes) throw invalid()
  if (names.some((name) => !isSafeEntry(name))) throw invalid('ไฟล์ Backup มีตำแหน่งไฟล์ที่ไม่ปลอดภัย')
  if (!names.includes('gamelooter.sqlite')) throw invalid()
  return { names, manifest: parseManifest(manifestBytes) }
}

/** Export, inspect and restore of the whole data folder (Feature Specification F11, Data Model section 6). */
export function createBackupService(deps: BackupDeps) {
  const latest = deps.migrations.at(-1)?.version ?? 0

  function inspect(file: string): BackupSummary {
    const { manifest } = readArchive(file)
    if (manifest.schemaVersion > latest) {
      throw new AppError('BACKUP_TOO_NEW', 'ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อน')
    }
    return {
      appVersion: manifest.appVersion,
      schemaVersion: manifest.schemaVersion,
      exportedAt: manifest.exportedAt,
      profileCount: manifest.profiles?.length ?? 0,
      itemCount: manifest.profiles?.reduce((sum, profile) => sum + profile.items, 0) ?? 0,
    }
  }

  async function exportTo(target: string): Promise<{ path: string; bytes: number; profileCount: number; itemCount: number }> {
    const db = deps.getDb()
    const temp = path.join(deps.userDataDir, `export-tmp-${fileStamp()}`)
    mkdirSync(temp, { recursive: true })
    try {
      // A consistent snapshot of the live database, taken while the app keeps running (F12, Data Model 6.2).
      db.pragma('wal_checkpoint(PASSIVE)')
      const snapshot = path.join(temp, 'gamelooter.sqlite')
      await db.backup(snapshot)

      const profiles = db
        .prepare<[], { id: number; name: string; items: number }>(
          'SELECT p.id, p.name, (SELECT COUNT(*) FROM item i WHERE i.profile_id = p.id) AS items FROM game_profile p ORDER BY p.id',
        )
        .all()
      const referenced = db
        .prepare<[], { path: string | null }>(
          'SELECT image_path AS path FROM item UNION ALL SELECT thumbnail_path FROM item UNION ALL SELECT icon_path FROM game_profile',
        )
        .all()

      const manifest: Manifest = {
        format: FORMAT,
        formatVersion: FORMAT_VERSION,
        appVersion: deps.appVersion,
        schemaVersion: db.pragma('user_version', { simple: true }) as number,
        exportedAt: new Date().toISOString(),
        profiles,
      }

      // PNG files do not compress further, so they are stored as they are (Data Model 6.1).
      const files: Zippable = {
        'manifest.json': [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }],
        'gamelooter.sqlite': [new Uint8Array(readFileSync(snapshot)), { level: 6 }],
      }
      for (const row of referenced) {
        if (!row.path || !isSafeEntry(row.path)) continue
        const absolute = path.join(deps.dataDir, ...row.path.split('/'))
        if (existsSync(absolute)) files[row.path] = [new Uint8Array(readFileSync(absolute)), { level: 0 }]
      }

      // The asynchronous API keeps the main process responsive while the archive is built.
      const archive = await new Promise<Uint8Array>((resolve, reject) => {
        zip(files, (error, data) => (error ? reject(error) : resolve(data)))
      })
      const partial = `${target}.tmp`
      try {
        writeFileSync(partial, archive)
        renameSync(partial, target)
      } catch (error) {
        rmSync(partial, { force: true })
        throw new AppError('IO', 'เขียนไฟล์ Backup ไม่สำเร็จ', { reason: (error as Error).message })
      }
      return { path: target, bytes: archive.length, profileCount: profiles.length, itemCount: profiles.reduce((sum, p) => sum + p.items, 0) }
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  }

  /** Validates the extracted database before anything of the current data is touched (F11-R11 step 6). */
  async function verifyExtracted(folder: string, manifest: Manifest): Promise<void> {
    const file = path.join(folder, 'gamelooter.sqlite')
    let restored: Database.Database
    try {
      restored = new Database(file)
    } catch {
      throw invalid()
    }
    try {
      restored.pragma('foreign_keys = ON')
      if (restored.pragma('integrity_check', { simple: true }) !== 'ok') throw invalid()
      if (restored.pragma('user_version', { simple: true }) !== manifest.schemaVersion) throw invalid()
      if ((restored.pragma('foreign_key_check') as unknown[]).length > 0) throw invalid()
      try {
        await migrate(restored, deps.migrations, deps.backupsDir, { snapshot: false })
      } catch (error) {
        if (error instanceof SchemaTooNewError) throw new AppError('BACKUP_TOO_NEW', 'ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อน')
        throw new AppError('BACKUP_INVALID', `อัปเดตข้อมูลใน Backup ไม่สำเร็จ: ${(error as Error).message}`)
      }
      // Missing image files do not fail a restore; their paths are cleared and the item shows a placeholder (F11-R14).
      cleanupOrphanImages(restored, folder)
      restored.pragma('wal_checkpoint(TRUNCATE)')
    } catch (error) {
      // A file that SQLite cannot read at all (not a database, damaged pages) is an invalid backup.
      if (error instanceof AppError) throw error
      throw invalid()
    } finally {
      restored.close()
    }
  }

  async function restore(file: string): Promise<void> {
    const { names, manifest } = readArchive(file)
    if (manifest.schemaVersion > latest) {
      throw new AppError('BACKUP_TOO_NEW', 'ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อน')
    }

    const stamp = fileStamp()
    const temp = path.join(deps.userDataDir, `restore-tmp-${stamp}`)
    mkdirSync(temp, { recursive: true })
    try {
      const wanted = new Set(names.filter((name) => name === 'gamelooter.sqlite' || name.startsWith('images/')))
      const extracted = unzipSync(new Uint8Array(readFileSync(file)), { filter: (entry) => wanted.has(entry.name) && !entry.name.endsWith('/') })
      const root = path.resolve(temp)
      for (const [name, bytes] of Object.entries(extracted)) {
        const target = path.resolve(root, ...name.split('/'))
        if (!target.startsWith(root + path.sep)) throw invalid('ไฟล์ Backup มีตำแหน่งไฟล์ที่ไม่ปลอดภัย')
        mkdirSync(path.dirname(target), { recursive: true })
        writeFileSync(target, bytes)
      }
      await verifyExtracted(temp, manifest)
    } catch (error) {
      rmSync(temp, { recursive: true, force: true })
      throw error
    }

    // From here on the app has let go of its database, so every outcome ends in a restart: on success the app opens
    // the restored data, on failure it opens the original data again. The restart is delayed so the error is shown.
    deps.prepareForSwap()
    const previous = path.join(deps.backupsDir, `pre-restore-${stamp}`)
    const abort = (error: AppError): never => {
      rmSync(temp, { recursive: true, force: true })
      deps.relaunch(RESTART_AFTER_FAILURE_MS)
      throw error
    }
    mkdirSync(deps.backupsDir, { recursive: true })
    try {
      renameSync(deps.dataDir, previous)
    } catch (error) {
      abort(new AppError('IO', 'สำรองข้อมูลเดิมไม่สำเร็จ ข้อมูลเดิมไม่ถูกแตะ แอปจะเปิดใหม่', { reason: (error as Error).message }))
    }
    try {
      renameSync(temp, deps.dataDir)
    } catch (error) {
      // Put the original folder back so no data is lost (F11-R13).
      try {
        renameSync(previous, deps.dataDir)
      } catch (rollbackError) {
        abort(new AppError('IO', `กู้คืนไม่สำเร็จและคืนข้อมูลเดิมไม่ได้ ข้อมูลเดิมอยู่ที่ ${previous}`, { backup: previous, reason: (rollbackError as Error).message }))
      }
      abort(new AppError('IO', 'กู้คืนข้อมูลไม่สำเร็จ ข้อมูลเดิมถูกคืนกลับแล้ว แอปจะเปิดใหม่', { backup: previous, reason: (error as Error).message }))
    }

    // Keep only the newest pre-restore folder.
    const old = readdirSync(deps.backupsDir)
      .filter((name) => name.startsWith('pre-restore-'))
      .map((name) => ({ name, time: statSync(path.join(deps.backupsDir, name)).mtimeMs }))
      .sort((a, b) => b.time - a.time)
      .slice(KEPT_PRE_RESTORE)
    for (const entry of old) rmSync(path.join(deps.backupsDir, entry.name), { recursive: true, force: true })

    deps.relaunch()
  }

  return { inspect, exportTo, restore }
}

export type BackupService = ReturnType<typeof createBackupService>
