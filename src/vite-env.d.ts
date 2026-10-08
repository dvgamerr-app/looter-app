/// <reference types="vite/client" />

/** Bridge exposed by electron/preload.ts. Phase 1 replaces it with typed IPC contracts. */
interface Window {
  ipcRenderer: {
    on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown
    off(channel: string, listener?: (...args: unknown[]) => void): unknown
    send(channel: string, ...args: unknown[]): void
    invoke(channel: string, ...args: unknown[]): Promise<unknown>
  }
}
