import { app, BrowserWindow } from 'electron'
import { release, arch, platform } from 'node:os'
import path from 'node:path'
import { createTable, Relink, JSONPath } from './database'
import { onWindowPositionEvent } from './settings'

const DIST = path.join(__dirname, '../dist')
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public')
process.env.DIST = DIST
process.env.VITE_PUBLIC = VITE_PUBLIC

let win: BrowserWindow | null = null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  console.info({
    os: {
      arch: arch(),
      platform: platform(),
      release: release(),
    },
  })

  win = new BrowserWindow({
    movable: true,
    resizable: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1f2937',
      symbolColor: '#0f766e',
    },
    icon: path.join(VITE_PUBLIC, 'looter.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const onPositionChanged = onWindowPositionEvent(win)
  win.on('moved', onPositionChanged)
  win.on('maximize', onPositionChanged)
  win.on('unmaximize', onPositionChanged)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', async () => {
    const data = await JSONPath('$')
    win?.webContents.send('main-process-message', data)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!BrowserWindow.getAllWindows().length) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  await createTable('Game', 'Item', 'ItemCraft', 'Recipe')
  await Relink()
}).then(createWindow)
