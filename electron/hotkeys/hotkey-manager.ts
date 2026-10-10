import { globalShortcut } from 'electron'
import type { HotkeyAction, HotkeyStatus, Hotkeys } from '../ipc/contracts'
import { AppError } from '../ipc/errors'
import { DEFAULT_HOTKEYS } from '../settings/defaults'
import type { SettingsService } from '../settings/settings-service'

const MODIFIERS = new Set([
  'command', 'cmd', 'commandorcontrol', 'cmdorctrl', 'control', 'ctrl', 'alt', 'option', 'altgr', 'shift', 'super', 'meta',
])
const ACTIONS = Object.keys(DEFAULT_HOTKEYS) as HotkeyAction[]

export const isHotkeyAction = (value: unknown): value is HotkeyAction =>
  typeof value === 'string' && (ACTIONS as string[]).includes(value)

/** One key plus at least one modifier, so a bare letter is never taken from the game (F11-R2). */
export function isValidAccelerator(accelerator: string): boolean {
  const parts = accelerator.split('+').map((part) => part.trim())
  if (parts.some((part) => part === '')) return false
  const modifiers = parts.filter((part) => MODIFIERS.has(part.toLowerCase()))
  return modifiers.length >= 1 && parts.length - modifiers.length === 1
}

const normalise = (accelerator: string): string => accelerator.toLowerCase().replace(/\s+/g, '')

/**
 * Owns the global shortcuts. Every action is registered on its own and the result is remembered, so
 * a shortcut that the game or another program already holds shows as failed instead of breaking the
 * others (F11-R4). Actions without a handler yet (capture, until Phase 4) are registered all the same.
 */
export function createHotkeyManager(settings: SettingsService, handlers: Partial<Record<HotkeyAction, () => void>>) {
  const status = {} as Record<HotkeyAction, HotkeyStatus>
  const registered = new Map<HotkeyAction, string>()
  for (const action of ACTIONS) status[action] = 'disabled'

  function unregister(action: HotkeyAction): void {
    const accelerator = registered.get(action)
    if (accelerator) globalShortcut.unregister(accelerator)
    registered.delete(action)
  }

  /** Returns whether the operating system accepted the shortcut. */
  function register(action: HotkeyAction, accelerator: string): boolean {
    unregister(action)
    if (accelerator === '') {
      status[action] = 'disabled'
      return true
    }
    let ok: boolean
    try {
      ok = globalShortcut.register(accelerator, () => handlers[action]?.())
    } catch {
      // An accelerator the platform cannot parse is reported as a failed registration.
      ok = false
    }
    status[action] = ok ? 'registered' : 'failed'
    if (ok) registered.set(action, accelerator)
    return ok
  }

  function conflictWith(action: HotkeyAction, accelerator: string): HotkeyAction | null {
    if (accelerator === '') return null
    const hotkeys = settings.getHotkeys()
    return ACTIONS.find((other) => other !== action && normalise(hotkeys[other]) === normalise(accelerator)) ?? null
  }

  settings.setHotkeyStatusProvider(() => ({ ...status }))

  return {
    /** Registers every configured hotkey; call once the app is ready. */
    registerAll(): void {
      const hotkeys = settings.getHotkeys()
      for (const action of ACTIONS) register(action, hotkeys[action])
    },

    setHotkey(action: HotkeyAction, accelerator: string): void {
      const next = accelerator.trim()
      if (next !== '' && !isValidAccelerator(next)) {
        throw new AppError('VALIDATION', 'ต้องมีปุ่ม Ctrl, Alt หรือ Shift อย่างน้อยหนึ่งปุ่มร่วมกับปุ่มหลักหนึ่งปุ่ม', { field: 'accelerator' })
      }
      const other = conflictWith(action, next)
      if (other) throw new AppError('HOTKEY_CONFLICT', 'ปุ่มนี้ถูกใช้กับรายการอื่นในแอปแล้ว', { action: other })

      const previous = settings.getHotkeys()[action]
      if (!register(action, next)) {
        // Keep the old shortcut working when the new one is refused (F11-R4).
        register(action, previous)
        settings.notify()
        throw new AppError('HOTKEY_REGISTER_FAILED', 'ลงทะเบียนปุ่มนี้ไม่สำเร็จ อาจถูกโปรแกรมอื่นหรือเกมใช้อยู่', { action })
      }
      settings.setHotkeys({ ...settings.getHotkeys(), [action]: next })
    },

    /** Restores one action or all of them to the defaults (F11-R5). */
    reset(action?: HotkeyAction): void {
      const targets = action ? [action] : ACTIONS
      const next: Hotkeys = { ...settings.getHotkeys() }
      for (const target of targets) next[target] = DEFAULT_HOTKEYS[target]
      // A default that another, untouched action still holds would be refused by the OS as already taken.
      for (const target of targets) {
        const holder = ACTIONS.find((other) => !targets.includes(other) && normalise(next[other]) === normalise(next[target]) && next[target] !== '')
        if (holder) throw new AppError('HOTKEY_CONFLICT', 'ปุ่มเริ่มต้นนี้ถูกใช้กับรายการอื่นอยู่ ให้เปลี่ยนรายการนั้นก่อน', { action: holder })
      }
      // Let go of every affected key first so the defaults cannot collide with each other while swapping back.
      for (const target of targets) unregister(target)
      for (const target of targets) register(target, next[target])
      settings.setHotkeys(next)
    },

    /** Tries again for every hotkey that failed, for example after the game that held it closed. */
    retry(): void {
      const hotkeys = settings.getHotkeys()
      for (const action of ACTIONS) if (status[action] === 'failed') register(action, hotkeys[action])
      settings.notify()
    },

    unregisterAll(): void {
      globalShortcut.unregisterAll()
      registered.clear()
    },
  }
}

export type HotkeyManager = ReturnType<typeof createHotkeyManager>
