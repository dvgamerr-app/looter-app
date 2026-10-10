import type { OverlayController } from '../../windows/overlay-window'
import { AppError } from '../errors'
import { handle } from '../register'
import { parseBoolean, requireRecord } from '../validate'

const finite = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new AppError('VALIDATION', `${label}ไม่ถูกต้อง`, { field: label })
  return value
}

/** Overlay commands (F9). Every command returns the new state, which `overlay:changed` also pushes. */
export function registerOverlayHandlers(overlay: OverlayController): void {
  handle('overlay:show', () => overlay.show())
  handle('overlay:hide', () => overlay.hide())
  handle('overlay:toggle', () => overlay.toggle())
  handle('overlay:getState', () => overlay.state())
  handle('overlay:resetLayout', () => overlay.resetLayout())

  handle('overlay:setMode', (request) => {
    if (request !== 'view' && request !== 'interactive') throw new AppError('VALIDATION', 'โหมดไม่ถูกต้อง')
    return overlay.setMode(request)
  })

  handle('overlay:setOpacity', (request) => overlay.setOpacity(finite(requireRecord(request).opacity, 'opacity')))

  handle('overlay:setCompact', (request) => overlay.setCompact(parseBoolean(requireRecord(request).compact, 'compact')))

  handle('overlay:cycleScope', (request) => {
    const direction = requireRecord(request).direction
    if (direction !== 1 && direction !== -1) throw new AppError('VALIDATION', 'ทิศทางไม่ถูกต้อง')
    return overlay.cycleScope(direction)
  })

  handle('overlay:focusMainWindow', () => {
    overlay.focusMainWindow()
    return null
  })

  handle('overlay:setBounds', (request) => {
    const body = requireRecord(request)
    return overlay.setBounds({
      x: Math.round(finite(body.x, 'x')),
      y: Math.round(finite(body.y, 'y')),
      width: Math.round(finite(body.width, 'width')),
      height: Math.round(finite(body.height, 'height')),
    })
  })
}
