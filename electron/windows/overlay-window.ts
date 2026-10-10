import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import type { Repositories } from '../database/repositories'
import type { GatheringService } from '../gathering/service'
import { broadcast, resumeEventsFor, suppressEventsFor } from '../ipc/broadcast'
import type { Bounds, OverlayState } from '../ipc/contracts'
import { trustSender } from '../ipc/register'
import { MAX_OVERLAY_OPACITY, MIN_OVERLAY_OPACITY } from '../settings/defaults'
import type { SettingsService } from '../settings/settings-service'
import { debounce } from '../utils/debounce'
import { isBoundsVisible } from './bounds'

const MIN_WIDTH = 220
const MIN_HEIGHT = 160
const FULL_SIZE = { width: 320, height: 420 }
const COMPACT_SIZE = { width: 280, height: 240 }
const MARGIN = 16
const BOUNDS_SAVE_DELAY_MS = 200
// Some games re-assert their own topmost window; the overlay claims the top again at this interval (F9-R12).
const TOPMOST_INTERVAL_MS = 2000

export interface OverlayDeps {
  settings: SettingsService
  repos: Repositories
  gathering: GatheringService
  getMainWindow: () => BrowserWindow | null
  distDir: string
  devServerUrl?: string
}

/**
 * The overlay window and everything that changes it (Feature Specification F9). The window is created
 * the first time it is shown and afterwards only hidden, so showing it again is instant (F9-R1).
 */
export function createOverlayController(deps: OverlayDeps) {
  const { settings, repos, gathering, getMainWindow, distDir, devServerUrl } = deps

  let win: BrowserWindow | null = null
  let scope: 'all' | number = 'all'
  let topmostTimer: ReturnType<typeof setInterval> | null = null
  let suspended = false
  let watchingMain = false

  const pinnedTargets = () => {
    const profileId = settings.getActiveProfileId()
    return profileId === null ? [] : repos.tracking.listLabelled(profileId).filter((target) => target.pinned === 1)
  }

  const isShown = (): boolean => win !== null && !win.isDestroyed() && win.isVisible()

  function state(): OverlayState {
    const saved = settings.getOverlay()
    const pinned = pinnedTargets()
    const target = scope === 'all' ? undefined : pinned.find((entry) => entry.id === scope)
    return {
      visible: isShown(),
      mode: saved.mode,
      opacity: saved.opacity,
      compact: saved.compact,
      bounds: win && !win.isDestroyed() ? win.getBounds() : saved.bounds,
      scope: target ? scope : 'all',
      scopeLabel: target?.label ?? null,
      pinnedTargetCount: pinned.length,
    }
  }

  const publish = (): OverlayState => {
    const current = state()
    broadcast('overlay:changed', current)
    return current
  }

  /** Top right of the primary display, away from the edges (UI/UX Design Plan 4.5). */
  function defaultBounds(): Bounds {
    const size = settings.getOverlay().compact ? COMPACT_SIZE : FULL_SIZE
    const area = screen.getPrimaryDisplay().workArea
    return { x: area.x + area.width - size.width - MARGIN, y: area.y + MARGIN, ...size }
  }

  /** Enforces the minimum size and keeps the window on a connected display (F9-R5). */
  function constrain(bounds: Bounds): Bounds {
    const next = { ...bounds, width: Math.max(MIN_WIDTH, bounds.width), height: Math.max(MIN_HEIGHT, bounds.height) }
    if (isBoundsVisible(next)) return next
    const area = screen.getDisplayMatching(next).workArea
    return {
      ...next,
      x: Math.min(Math.max(next.x, area.x), area.x + area.width - next.width),
      y: Math.min(Math.max(next.y, area.y), area.y + area.height - next.height),
    }
  }

  const saveBounds = debounce(() => {
    if (win && !win.isDestroyed()) settings.update({ overlay: { bounds: win.getBounds() } })
  }, BOUNDS_SAVE_DELAY_MS)

  /** View lets every click through to the game and never takes focus; Interactive does the opposite (F9-R3). */
  function applyMode(): void {
    if (!win || win.isDestroyed()) return
    if (settings.getOverlay().mode === 'view') {
      win.setIgnoreMouseEvents(true, { forward: true })
      win.setFocusable(false)
    } else {
      win.setIgnoreMouseEvents(false)
      win.setFocusable(true)
      win.focus()
    }
  }

  function ensureTopmost(): void {
    if (isShown()) win!.setAlwaysOnTop(true, 'screen-saver')
  }

  function startTopmostTimer(): void {
    if (!topmostTimer) topmostTimer = setInterval(ensureTopmost, TOPMOST_INTERVAL_MS)
  }

  function stopTopmostTimer(): void {
    if (topmostTimer) clearInterval(topmostTimer)
    topmostTimer = null
  }

  function ensureWindow(): BrowserWindow {
    if (win && !win.isDestroyed()) return win
    const saved = settings.getOverlay()
    const bounds = constrain(saved.bounds ?? defaultBounds())
    win = new BrowserWindow({
      ...bounds,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      hasShadow: false,
      fullscreenable: false,
      minimizable: false,
      maximizable: false,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    })
    trustSender(win.webContents)
    win.setOpacity(saved.opacity)
    win.setAlwaysOnTop(true, 'screen-saver')
    win.on('moved', saveBounds)
    win.on('resized', saveBounds)
    win.on('closed', () => {
      saveBounds.cancel()
      stopTopmostTimer()
      win = null
    })
    if (devServerUrl) void win.loadURL(new URL('overlay.html', devServerUrl).toString())
    else void win.loadFile(path.join(distDir, 'overlay.html'))
    return win
  }

  function hideWindow(): void {
    if (!win || win.isDestroyed()) return
    suppressEventsFor(win.webContents.id)
    stopTopmostTimer()
    win.hide()
  }

  function showWindow(): void {
    const window = ensureWindow()
    resumeEventsFor(window.webContents.id)
    applyMode()
    if (settings.getOverlay().mode === 'view') window.showInactive()
    else window.show()
    ensureTopmost()
    startTopmostTimer()
    // The hidden window missed the updates; one fresh push brings it up to date (F9-R14).
    gathering.schedule()
  }

  // The main window losing focus is the moment a game most often takes the top back.
  const watchMainWindow = (): void => {
    const main = getMainWindow()
    if (!main || watchingMain) return
    watchingMain = true
    main.on('blur', ensureTopmost)
    main.once('closed', () => {
      watchingMain = false
    })
  }

  const api = {
    state,

    show(): OverlayState {
      // Without an active profile there is nothing to show; the wish to see it is kept (F1-R10).
      if (settings.getActiveProfileId() === null) return state()
      settings.update({ overlay: { visible: true } })
      showWindow()
      watchMainWindow()
      return publish()
    },

    hide(): OverlayState {
      settings.update({ overlay: { visible: false } })
      hideWindow()
      return publish()
    },

    toggle(): OverlayState {
      return isShown() ? api.hide() : api.show()
    },

    setMode(mode: 'view' | 'interactive'): OverlayState {
      settings.update({ overlay: { mode } })
      applyMode()
      return publish()
    },

    toggleMode(): OverlayState {
      return api.setMode(settings.getOverlay().mode === 'view' ? 'interactive' : 'view')
    },

    setOpacity(opacity: number): OverlayState {
      const clamped = Math.min(MAX_OVERLAY_OPACITY, Math.max(MIN_OVERLAY_OPACITY, opacity))
      settings.update({ overlay: { opacity: clamped } })
      if (win && !win.isDestroyed()) win.setOpacity(clamped)
      return publish()
    },

    setCompact(compact: boolean): OverlayState {
      settings.update({ overlay: { compact } })
      return publish()
    },

    resetLayout(): OverlayState {
      const bounds = defaultBounds()
      settings.update({ overlay: { bounds, opacity: 0.9 } })
      if (win && !win.isDestroyed()) {
        win.setBounds(bounds)
        win.setOpacity(0.9)
      }
      return publish()
    },

    setBounds(bounds: Bounds): OverlayState {
      const next = constrain(bounds)
      if (win && !win.isDestroyed()) win.setBounds(next)
      saveBounds()
      return publish()
    },

    /** Steps through "all" and the pinned targets in priority order (F9-R9). */
    cycleScope(direction: 1 | -1): OverlayState {
      const sequence: Array<'all' | number> = ['all', ...pinnedTargets().map((target) => target.id)]
      if (sequence.length > 1) {
        const index = Math.max(0, sequence.indexOf(scope))
        scope = sequence[(index + direction + sequence.length) % sequence.length]!
      }
      return publish()
    },

    /** Hides the overlay for a moment without changing the saved wish to see it, for example during a capture (F10-R15). */
    suspend(): void {
      if (!isShown()) return
      suspended = true
      hideWindow()
    },

    resume(): void {
      if (!suspended) return
      suspended = false
      if (settings.getOverlay().visible && settings.getActiveProfileId() !== null) showWindow()
    },

    focusMainWindow(): void {
      const main = getMainWindow()
      if (!main) return
      if (main.isMinimized()) main.restore()
      main.show()
      main.focus()
    },

    /** Call when pins or the active profile change: keeps the scope valid and the window in step. */
    refresh({ profileChanged = false }: { profileChanged?: boolean } = {}): void {
      if (profileChanged) scope = 'all'
      if (settings.getActiveProfileId() === null) {
        hideWindow()
      } else if (settings.getOverlay().visible && !isShown()) {
        showWindow()
      }
      if (win && !win.isDestroyed()) publish()
    },

    /** Reopens the overlay when it was left open last time. */
    restoreOnStart(): void {
      if (settings.getOverlay().visible && settings.getActiveProfileId() !== null) {
        showWindow()
        watchMainWindow()
      }
    },

    destroy(): void {
      stopTopmostTimer()
      saveBounds.flush()
      if (win && !win.isDestroyed()) win.destroy()
    },
  }
  return api
}

export type OverlayController = ReturnType<typeof createOverlayController>
