import { MAX_OWNED, NOTES_MAX_LENGTH } from '../domain/limits'
import type { ItemCategory, Mode } from '../domain/types'
import type { IngredientInput } from './contracts'
import { AppError } from './errors'
import { isRecord } from '../settings/guards'

export const NAME_MAX_LENGTH = 100

const CATEGORIES: readonly ItemCategory[] = ['material', 'equipment', 'consumable', 'quest', 'other']
const MODES: readonly Mode[] = ['craft', 'gather']

export function requireRecord(value: unknown, label = 'คำขอ'): Record<string, unknown> {
  if (!isRecord(value)) throw new AppError('VALIDATION', `${label}ไม่ถูกต้อง`)
  return value
}

/** Trims the text, collapses inner whitespace and requires 1 to 100 characters (section 1.3 rule 6). */
export function parseName(value: unknown, label = 'ชื่อ'): string {
  if (typeof value !== 'string') throw new AppError('VALIDATION', `กรุณากรอก${label}`, { field: 'name' })
  const name = value.trim().replace(/\s+/g, ' ')
  if (name.length === 0) throw new AppError('VALIDATION', `กรุณากรอก${label}`, { field: 'name' })
  if (name.length > NAME_MAX_LENGTH) {
    throw new AppError('VALIDATION', `${label}ต้องยาวไม่เกิน ${NAME_MAX_LENGTH} ตัวอักษร`, { field: 'name' })
  }
  return name
}

/** Optional free text: undefined stays undefined, null or blank becomes null. */
export function parseNotes(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw new AppError('VALIDATION', 'บันทึกต้องเป็นข้อความ', { field: 'notes' })
  const text = value.trim()
  if (text.length > NOTES_MAX_LENGTH) {
    throw new AppError('VALIDATION', `บันทึกต้องยาวไม่เกิน ${NOTES_MAX_LENGTH} ตัวอักษร`, { field: 'notes' })
  }
  return text === '' ? null : text
}

export function parseId(value: unknown, label = 'รหัส'): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError('VALIDATION', `${label}ไม่ถูกต้อง`, { field: 'id' })
  }
  return value
}

/** A whole number >= min (default 1). */
export function parseCount(value: unknown, label: string, min = 1): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min) {
    throw new AppError('VALIDATION', `${label}ต้องเป็นจำนวนเต็มตั้งแต่ ${min} ขึ้นไป`, { field: label })
  }
  return value
}

/** `owned`: a whole number from 0 to MAX_OWNED (F7-R3). */
export function parseOwned(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > MAX_OWNED) {
    throw new AppError('VALIDATION', `ค่าไม่ถูกต้อง ใส่จำนวนเต็ม 0 ถึง ${MAX_OWNED.toLocaleString('en-US')}`, {
      field: 'owned',
    })
  }
  return value
}

export function parseBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new AppError('VALIDATION', `${label}ไม่ถูกต้อง`, { field: label })
  return value
}

export function parseCategory(value: unknown): ItemCategory {
  if (typeof value !== 'string' || !(CATEGORIES as readonly string[]).includes(value)) {
    throw new AppError('VALIDATION', 'หมวดหมู่ไม่ถูกต้อง', { field: 'category' })
  }
  return value as ItemCategory
}

export function parseMode(value: unknown): Mode {
  if (typeof value !== 'string' || !(MODES as readonly string[]).includes(value)) {
    throw new AppError('VALIDATION', 'โหมดไม่ถูกต้อง', { field: 'mode' })
  }
  return value as Mode
}

/** Ingredient or requirement list: each item at most once, quantities above zero (F3-R3, F4-R4). */
export function parseIngredients(value: unknown): IngredientInput[] {
  if (!Array.isArray(value)) throw new AppError('VALIDATION', 'รายการวัตถุดิบไม่ถูกต้อง', { field: 'ingredients' })
  const seen = new Set<number>()
  return value.map((entry) => {
    const body = requireRecord(entry, 'วัตถุดิบ')
    const itemId = parseId(body.itemId, 'Item')
    if (seen.has(itemId)) throw new AppError('VALIDATION', 'มี Item ซ้ำในรายการ', { field: 'ingredients', itemId })
    seen.add(itemId)
    return { itemId, qty: parseCount(body.qty, 'จำนวน'), mode: body.mode === undefined ? 'craft' : parseMode(body.mode) }
  })
}
