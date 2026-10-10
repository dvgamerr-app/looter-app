import type { HotkeyManager } from '../../hotkeys/hotkey-manager'
import { isHotkeyAction } from '../../hotkeys/hotkey-manager'
import { broadcast } from '../broadcast'
import type { AppContext } from '../context'
import { AppError } from '../errors'
import { handle } from '../register'
import { requireRecord } from '../validate'

export function registerSettingsHandlers({ settings }: AppContext, hotkeys: HotkeyManager): void {
  settings.onChange((state) => broadcast('settings:changed', state))

  handle('settings:get', () => settings.getState())
  handle('settings:update', (request) => settings.update(request))

  handle('settings:setHotkey', (request) => {
    const body = requireRecord(request)
    if (!isHotkeyAction(body.action)) throw new AppError('VALIDATION', 'ไม่รู้จักรายการ Hotkey นี้', { field: 'action' })
    if (typeof body.accelerator !== 'string') throw new AppError('VALIDATION', 'ปุ่มลัดไม่ถูกต้อง', { field: 'accelerator' })
    hotkeys.setHotkey(body.action, body.accelerator)
    return settings.getState()
  })

  handle('settings:resetHotkeys', (request) => {
    const action = request === undefined ? undefined : requireRecord(request).action
    if (action !== undefined && !isHotkeyAction(action)) throw new AppError('VALIDATION', 'ไม่รู้จักรายการ Hotkey นี้', { field: 'action' })
    hotkeys.reset(action)
    return settings.getState()
  })

  handle('settings:retryHotkeys', () => {
    hotkeys.retry()
    return settings.getState()
  })
}
