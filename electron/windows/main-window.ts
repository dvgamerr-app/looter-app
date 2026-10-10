import { BrowserWindow, shell } from 'electron'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { trustSender } from '../ipc/register'
import type { SettingsService } from '../settings/settings-service'
import { debounce } from '../utils/debounce'
import { isBoundsVisible } from './bounds'

// Keep these in sync with --color-surface-1 and --color-text in src/index.css.
const TITLE_BAR_COLOR = '#171a21'
const TITLE_BAR_SYMBOL_COLOR = '#e8eaf0'
const TITLE_BAR_HEIGHT = 40

const BOUNDS_SAVE_DELAY_MS = 200

export interface MainWindowOptions {
  settings: SettingsService
  /** Directory holding index.html and the built assets. */
  distDir: string
  /** Directory holding looter.ico. */
  publicDir: string
  devServerUrl?: string
}

export function createMainWindow({ settings, distDir, publicDir, devServerUrl }: MainWindowOptions): BrowserWindow {
  const saved = settings.getWindowState()
  const restored = saved.bounds && isBoundsVisible(saved.bounds) ? saved.bounds : null

  const win = new BrowserWindow({
    ...(restored ?? { width: 1200, height: 800 }),
    minWidth: 900,
    minHeight: 600,
    show: false,
    movable: true,
    resizable: true,
    backgroundColor: '#0f1115',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: TITLE_BAR_COLOR, symbolColor: TITLE_BAR_SYMBOL_COLOR, height: TITLE_BAR_HEIGHT },
    icon: path.join(publicDir, 'looter.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  trustSender(win.webContents)

  // Links open in the user's browser and the window never navigates away from the app's own pages.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  const appOrigin = devServerUrl ?? pathToFileURL(distDir).toString()
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appOrigin)) event.preventDefault()
  })
  if (saved.maximized) win.maximize()
  win.once('ready-to-show', () => win.show())

  // Window geometry changes in bursts, so writes are debounced. `close` fires before the window is
  // destroyed, on a normal close and on quit alike, so the last change is never lost (F12-R12).
  const saveBounds = debounce(() => {
    settings.setWindowState({ bounds: win.getNormalBounds(), maximized: win.isMaximized() })
  }, BOUNDS_SAVE_DELAY_MS)
  win.on('moved', saveBounds)
  win.on('resized', saveBounds)
  win.on('maximize', saveBounds)
  win.on('unmaximize', saveBounds)
  win.on('close', saveBounds.flush)

  if (devServerUrl) {
    void win.loadURL(devServerUrl)
    win.webContents.openDevTools()
  } else {
    void win.loadFile(path.join(distDir, 'index.html'))
  }
  return win
}
