import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { EVENT_CHANNELS, INVOKE_CHANNELS, type Api, type EventChannel } from './ipc/contracts'

// Builds `window.api` from the channel allow-lists in contracts.ts: 'profiles:list' becomes
// `api.profiles.list()`. The raw ipcRenderer is never exposed, so the renderer can only reach the
// channels that are declared there.
const api: Record<string, unknown> = {}

for (const channel of INVOKE_CHANNELS) {
  const [domain, action] = channel.split(':') as [string, string]
  const namespace = (api[domain] ??= {}) as Record<string, unknown>
  namespace[action] = (request?: unknown) => ipcRenderer.invoke(channel, request)
}

api.on = (event: EventChannel, listener: (payload: unknown) => void): (() => void) => {
  if (!(EVENT_CHANNELS as readonly string[]).includes(event)) throw new Error(`Unknown event channel: ${event}`)
  const wrapped = (_event: IpcRendererEvent, payload: unknown) => listener(payload)
  ipcRenderer.on(event, wrapped)
  return () => {
    ipcRenderer.off(event, wrapped)
  }
}

contextBridge.exposeInMainWorld('api', api as unknown as Api)
