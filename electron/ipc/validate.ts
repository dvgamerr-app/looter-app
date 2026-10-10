import { AppError } from './errors'
import { isRecord } from '../settings/guards'

export const NAME_MAX_LENGTH = 100

export function requireRecord(value: unknown, label = 'คำขอ'): Record<string, unknown> {
  if (!isRecord(value)) throw new AppError('VALIDATION', `${label}ไม่ถูกต้อง`)
  return value
}

/** Trims the text and requires 1 to 100 characters (Feature Specification section 1.3 rule 6). */
export function parseName(value: unknown, label = 'ชื่อ'): string {
  if (typeof value !== 'string') throw new AppError('VALIDATION', `กรุณากรอก${label}`, { field: 'name' })
  const name = value.trim()
  if (name.length === 0) throw new AppError('VALIDATION', `กรุณากรอก${label}`, { field: 'name' })
  if (name.length > NAME_MAX_LENGTH) {
    throw new AppError('VALIDATION', `${label}ต้องยาวไม่เกิน ${NAME_MAX_LENGTH} ตัวอักษร`, { field: 'name' })
  }
  return name
}

export function parseId(value: unknown, label = 'รหัส'): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError('VALIDATION', `${label}ไม่ถูกต้อง`, { field: 'id' })
  }
  return value
}
