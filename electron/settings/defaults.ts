import type { Hotkeys, OverlaySetting, Preferences, WindowSetting } from '../ipc/contracts'

export const DEFAULT_HOTKEYS: Hotkeys = {
  toggleOverlay: 'CommandOrControl+Shift+O',
  toggleOverlayMode: 'CommandOrControl+Shift+M',
  startCapture: 'CommandOrControl+Shift+X',
  importClipboard: 'CommandOrControl+Shift+V',
  overlayNextTarget: 'CommandOrControl+Shift+]',
  overlayPrevTarget: 'CommandOrControl+Shift+[',
}

export const DEFAULT_OVERLAY: OverlaySetting = {
  bounds: null,
  opacity: 0.9,
  mode: 'view',
  compact: false,
  visible: false,
}

export const DEFAULT_WINDOW: WindowSetting = { bounds: null, maximized: false }

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  sort: 'missing-first',
  hideComplete: false,
  stepSizes: [1, 5, 10],
  sidebarCollapsed: false,
  itemView: 'grid',
}

export const MIN_OVERLAY_OPACITY = 0.2
export const MAX_OVERLAY_OPACITY = 1
