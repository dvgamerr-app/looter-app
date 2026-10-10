import type { ErrorCode, IpcError } from './contracts'

/** Expected failure that is reported to the renderer as `{ ok: false, error }`. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON(): IpcError {
    return { code: this.code, message: this.message, ...(this.details === undefined ? {} : { details: this.details }) }
  }
}

/** Maps SQLite failures to the error codes of Feature Specification section 14.2. */
export function mapDatabaseError(error: unknown, duplicateMessage = 'ชื่อนี้ถูกใช้แล้ว'): AppError {
  if (error instanceof AppError) return error
  const sqlite = error as { code?: string; message?: string }
  if (sqlite.code === 'SQLITE_CONSTRAINT_UNIQUE') return new AppError('DUPLICATE_NAME', duplicateMessage)
  if (sqlite.code?.startsWith('SQLITE_CONSTRAINT')) return new AppError('VALIDATION', sqlite.message ?? 'Constraint failed')
  if (sqlite.code?.startsWith('SQLITE_')) return new AppError('IO', sqlite.message ?? 'Database error')
  return new AppError('INTERNAL', 'เกิดข้อผิดพลาดที่ไม่คาดคิด')
}
