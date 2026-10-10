/// <reference types="vite/client" />

interface Window {
  /** Typed bridge built by electron/preload.ts from electron/ipc/contracts.ts. */
  api: import('../electron/ipc/contracts').Api
}
