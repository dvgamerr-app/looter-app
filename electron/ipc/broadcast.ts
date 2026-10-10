import { BrowserWindow } from 'electron'
import type { EventChannel, EventContract } from './contracts'

// A hidden overlay is not woken for the events that fire constantly; it gets one fresh gathering push when
// it is shown (F9-R14). Settings, profile and overlay events still reach it, so nothing it shows goes stale.
const suppressed = new Set<number>()
const FREQUENT_EVENTS: ReadonlySet<EventChannel> = new Set([
  'gathering:changed',
  'inventory:changed',
  'items:changed',
  'recipes:changed',
  'quests:changed',
  'tracking:changed',
])

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
    if (suppressed.has(window.webContents.id) && FREQUENT_EVENTS.has(channel)) continue
    window.webContents.send(channel, payload)
  }
}
