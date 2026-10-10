import { BrowserWindow } from 'electron'
import type { EventChannel, EventContract } from './contracts'

// A hidden overlay should not be woken for every change; it is sent one fresh update when it is shown (F9-R14).
const suppressed = new Set<number>()

export const suppressEventsFor = (webContentsId: number): void => {
  suppressed.add(webContentsId)
}
export const resumeEventsFor = (webContentsId: number): void => {
  suppressed.delete(webContentsId)
}

/** Pushes an event to every open window (Feature Specification section 14.1). */
export function broadcast<E extends EventChannel>(channel: E, payload: EventContract[E]): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed() || window.webContents.isDestroyed()) continue
    if (suppressed.has(window.webContents.id)) continue
    window.webContents.send(channel, payload)
  }
}
