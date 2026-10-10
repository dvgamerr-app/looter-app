import { BrowserWindow } from 'electron'
import type { EventChannel, EventContract } from './contracts'

/** Pushes an event to every open window (Feature Specification section 14.1). */
export function broadcast<E extends EventChannel>(channel: E, payload: EventContract[E]): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) window.webContents.send(channel, payload)
  }
}
