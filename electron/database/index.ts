import Database from 'better-sqlite3'
import { app, dialog } from 'electron'
import { existsSync, mkdirSync, renameSync } from 'node:fs'
import path from 'node:path'
import { fileStamp } from '../utils/time'

export type Db = Database.Database

let connection: Db | null = null

export const dataDir = (): string => path.join(app.getPath('userData'), 'data')
export const imagesDir = (): string => path.join(dataDir(), 'images')
export const databasePath = (): string => path.join(dataDir(), 'gamelooter.sqlite')
export const backupsDir = (): string => path.join(app.getPath('userData'), 'backups')

class CorruptDatabaseError extends Error {}

function openFile(file: string): Db {
  const db = new Database(file)
  try {
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    if (db.pragma('quick_check', { simple: true }) !== 'ok') {
      throw new CorruptDatabaseError('PRAGMA quick_check did not return ok')
    }
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

function isCorruption(error: unknown): boolean {
  if (error instanceof CorruptDatabaseError) return true
  const code = (error as { code?: string }).code
  return code === 'SQLITE_NOTADB' || code === 'SQLITE_CORRUPT'
}

/** Renames the damaged file and its WAL/SHM companions so a fresh database can be created (F12-R9). */
function quarantine(file: string): void {
  const stamp = fileStamp()
  for (const suffix of ['', '-wal', '-shm']) {
    if (existsSync(file + suffix)) renameSync(file + suffix, `${file}${suffix}.corrupt-${stamp}`)
  }
}

/**
 * Opens the single application database (F12-R1, F12-R2). Throws after showing a dialog when the
 * database cannot be opened; the caller quits the app.
 */
export function openDatabase(): Db {
  if (connection) return connection
  mkdirSync(imagesDir(), { recursive: true })
  const file = databasePath()

  try {
    connection = openFile(file)
  } catch (error) {
    if (!isCorruption(error)) {
      dialog.showErrorBox(
        'เปิดฐานข้อมูลไม่สำเร็จ',
        `${file}\n\n${(error as Error).message}\n\nหากไฟล์ถูกใช้งานโดยโปรแกรมอื่น ให้ปิดโปรแกรมนั้นแล้วเปิดแอปใหม่`,
      )
      throw error
    }
    const choice = dialog.showMessageBoxSync({
      type: 'error',
      title: 'ฐานข้อมูลเสียหาย',
      message: 'ไฟล์ฐานข้อมูลเสียหาย',
      detail: `${file}\n\nเลือก "เริ่มใหม่" เพื่อเก็บไฟล์เดิมไว้ในชื่อ .corrupt แล้วสร้างฐานข้อมูลใหม่`,
      buttons: ['เริ่มใหม่', 'ปิดแอป'],
      defaultId: 1,
      cancelId: 1,
    })
    if (choice !== 0) throw error
    quarantine(file)
    connection = openFile(file)
  }
  return connection
}

export function getDb(): Db {
  if (!connection) throw new Error('Database is not open')
  return connection
}

/** Closes the connection and checkpoints the WAL back into the main file (F12-R12). */
export function closeDatabase(): void {
  connection?.close()
  connection = null
}
