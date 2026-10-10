import type { SettingRepository } from '../database/repositories/setting'
import type {
  HotkeyAction,
  HotkeyStatus,
  Hotkeys,
  OverlaySetting,
  Preferences,
  SettingsState,
  SettingsUpdate,
  WindowSetting,
} from '../ipc/contracts'
import { AppError } from '../ipc/errors'
import {
  assertValidPatch,
  isRecord,
  OVERLAY_GUARDS,
  PREFERENCE_GUARDS,
  readHotkeys,
  readOverlay,
  readPreferences,
  readWindow,
} from './guards'

export interface ProfileLookup {
  exists(id: number): boolean
  mostRecentId(): number | null
}

/**
 * In-memory view of `app_setting` (Data Model section 11.8). Every change is written through to the
 * database immediately (autosave) and announced to the listener.
 */
export function createSettingsService(repo: SettingRepository, profiles: ProfileLookup) {
  let activeProfileId: number | null = null
  let hotkeys: Hotkeys
  let overlay: OverlaySetting
  let windowState: WindowSetting
  let preferences: Preferences
  let listener: ((state: SettingsState) => void) | null = null
  let statusProvider: (() => Record<HotkeyAction, HotkeyStatus>) | null = null

  const hotkeyStatus = (): Record<HotkeyAction, HotkeyStatus> => {
    if (statusProvider) return statusProvider()
    const status = {} as Record<HotkeyAction, HotkeyStatus>
    for (const [action, accelerator] of Object.entries(hotkeys) as Array<[HotkeyAction, string]>) {
      status[action] = accelerator === '' ? 'disabled' : 'pending'
    }
    return status
  }

  const getState = (): SettingsState => ({
    hotkeys: { ...hotkeys },
    hotkeyStatus: hotkeyStatus(),
    overlay: { ...overlay },
    preferences: { ...preferences, stepSizes: [...preferences.stepSizes] },
  })

  function loadRepaired<T>(key: string, read: (raw: unknown) => { value: T; changed: boolean }): T {
    const { value, changed } = read(repo.get(key))
    if (changed) repo.set(key, value)
    return value
  }

  function resolveActiveProfile(): number | null {
    const stored = repo.get('active_profile_id')
    const valid = typeof stored === 'number' && profiles.exists(stored)
    const resolved = valid ? stored : profiles.mostRecentId()
    if (resolved !== stored) repo.set('active_profile_id', resolved)
    return resolved
  }

  return {
    /** Reads every key, repairs invalid fields (F12-R10) and resolves the active profile (F1-R5). */
    load(): void {
      hotkeys = loadRepaired('hotkeys', readHotkeys)
      overlay = loadRepaired('overlay', readOverlay)
      windowState = loadRepaired('window', readWindow)
      preferences = loadRepaired('preferences', readPreferences)
      activeProfileId = resolveActiveProfile()
    },

    onChange(callback: (state: SettingsState) => void): void {
      listener = callback
    },

    getState,
    getHotkeys: (): Hotkeys => ({ ...hotkeys }),
    getOverlay: (): OverlaySetting => ({ ...overlay }),

    /** The hotkey manager reports the real registration result through this provider (F11-R4). */
    setHotkeyStatusProvider(provider: () => Record<HotkeyAction, HotkeyStatus>): void {
      statusProvider = provider
    },

    /** Saves the accelerators and announces the new state, including the registration status. */
    setHotkeys(next: Hotkeys): void {
      hotkeys = { ...next }
      repo.set('hotkeys', hotkeys)
      listener?.(getState())
    },

    /** Announces a change that did not go through `update`, such as a hotkey registration result. */
    notify(): void {
      listener?.(getState())
    },

    getActiveProfileId: (): number | null => activeProfileId,
    getWindowState: (): WindowSetting => ({ ...windowState }),

    setActiveProfileId(id: number | null): void {
      activeProfileId = id
      repo.set('active_profile_id', id)
    },

    setWindowState(next: WindowSetting): void {
      windowState = next
      repo.set('window', next)
    },

    /** Merges a partial update (settings:update). An invalid field rejects the whole update. */
    update(patch: SettingsUpdate): SettingsState {
      if (!isRecord(patch)) throw new AppError('VALIDATION', 'ข้อมูลการตั้งค่าไม่ถูกต้อง')
      const nextPreferences = patch.preferences
      const nextOverlay = patch.overlay
      if (nextPreferences !== undefined) assertValidPatch('preferences', nextPreferences, PREFERENCE_GUARDS)
      if (nextOverlay !== undefined) assertValidPatch('overlay', nextOverlay, OVERLAY_GUARDS)
      if (nextPreferences) {
        preferences = { ...preferences, ...nextPreferences }
        repo.set('preferences', preferences)
      }
      if (nextOverlay) {
        overlay = { ...overlay, ...nextOverlay }
        repo.set('overlay', overlay)
      }
      const state = getState()
      listener?.(state)
      return state
    },
  }
}

export type SettingsService = ReturnType<typeof createSettingsService>
