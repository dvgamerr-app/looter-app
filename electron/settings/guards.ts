// Hand-written type guards for the JSON stored in `app_setting` (Data Model section 3.12, F12-R10).
// Each `read*` function repairs a value field by field: a missing or wrongly typed field falls back to
// its default and `changed` tells the caller to write the repaired value back.
import type { Bounds, Hotkeys, OverlaySetting, Preferences, WindowSetting } from '../ipc/contracts'
import { AppError } from '../ipc/errors'
import {
  DEFAULT_HOTKEYS,
  DEFAULT_OVERLAY,
  DEFAULT_PREFERENCES,
  DEFAULT_WINDOW,
  MAX_OVERLAY_OPACITY,
  MIN_OVERLAY_OPACITY,
} from './defaults'

export interface Repaired<T> {
  value: T
  changed: boolean
}

type Record_ = Record<string, unknown>

export const isRecord = (value: unknown): value is Record_ =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isBounds = (value: unknown): value is Bounds =>
  isRecord(value) &&
  [value.x, value.y, value.width, value.height].every((n) => typeof n === 'number' && Number.isFinite(n)) &&
  (value.width as number) > 0 &&
  (value.height as number) > 0

export const isStepSizes = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length >= 1 &&
  value.length <= 6 &&
  value.every((n) => Number.isInteger(n) && n >= 1 && n <= 999)

const isOneOf =
  <T extends string>(...allowed: T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (allowed as string[]).includes(value)

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isString = (value: unknown): value is string => typeof value === 'string'
const isOpacity = (value: unknown): value is number =>
  typeof value === 'number' && value >= MIN_OVERLAY_OPACITY && value <= MAX_OVERLAY_OPACITY
const isNullableBounds = (value: unknown): value is Bounds | null => value === null || isBounds(value)

export type Guards<T> = { [K in keyof T]: (value: unknown) => value is T[K] }

export const HOTKEY_GUARDS: Guards<Hotkeys> = {
  toggleOverlay: isString,
  toggleOverlayMode: isString,
  startCapture: isString,
  importClipboard: isString,
  overlayNextTarget: isString,
  overlayPrevTarget: isString,
}

export const OVERLAY_GUARDS: Guards<OverlaySetting> = {
  bounds: isNullableBounds,
  opacity: isOpacity,
  mode: isOneOf('view', 'interactive'),
  compact: isBoolean,
  visible: isBoolean,
}

export const WINDOW_GUARDS: Guards<WindowSetting> = {
  bounds: isNullableBounds,
  maximized: isBoolean,
}

export const PREFERENCE_GUARDS: Guards<Preferences> = {
  theme: isOneOf('dark', 'light', 'system'),
  sort: isOneOf('missing-first', 'name', 'category'),
  hideComplete: isBoolean,
  stepSizes: isStepSizes,
  sidebarCollapsed: isBoolean,
  itemView: isOneOf('grid', 'table'),
}

function repair<T extends object>(raw: unknown, defaults: T, guards: Guards<T>): Repaired<T> {
  const source = isRecord(raw) ? raw : {}
  let changed = !isRecord(raw)
  const value = { ...defaults }
  for (const key of Object.keys(guards) as Array<keyof T>) {
    if (guards[key](source[key as string])) {
      value[key] = source[key as string] as T[keyof T]
    } else {
      changed = true
    }
  }
  return { value, changed }
}

export const readHotkeys = (raw: unknown): Repaired<Hotkeys> => repair(raw, DEFAULT_HOTKEYS, HOTKEY_GUARDS)
export const readOverlay = (raw: unknown): Repaired<OverlaySetting> => repair(raw, DEFAULT_OVERLAY, OVERLAY_GUARDS)
export const readWindow = (raw: unknown): Repaired<WindowSetting> => repair(raw, DEFAULT_WINDOW, WINDOW_GUARDS)
export const readPreferences = (raw: unknown): Repaired<Preferences> =>
  repair(raw, DEFAULT_PREFERENCES, PREFERENCE_GUARDS)

/** Rejects a partial update when it is not an object or any field is unknown or fails its guard. */
export function assertValidPatch<T extends object>(
  section: string,
  patch: unknown,
  guards: Guards<T>,
): asserts patch is Partial<T> {
  if (!isRecord(patch)) throw new AppError('VALIDATION', `ค่าตั้งค่า ${section} ไม่ถูกต้อง`, { field: section })
  const checks = guards as Record<string, ((value: unknown) => boolean) | undefined>
  for (const [key, value] of Object.entries(patch)) {
    if (!checks[key]?.(value)) {
      throw new AppError('VALIDATION', `ค่าตั้งค่า ${section}.${key} ไม่ถูกต้อง`, { field: `${section}.${key}` })
    }
  }
}
