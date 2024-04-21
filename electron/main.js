import { app, BrowserWindow } from 'electron'
import { createTable, Relink, JSONPath } from './database'
import { release, arch, platform } from 'node:os'
import path from 'node:path'

import { onWindowPositionEvent } from './settings'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win = null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  console.info({
    os: {
      arch: arch(),
      platform: platform(),
      release: release(),
    }
  })

  win = new BrowserWindow({
    movable: true,
    resizable: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1f2937',
      symbolColor: '#0f766e'
    },
    icon: path.join(process.env.VITE_PUBLIC, 'looter.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', async () => {
    const data = await JSONPath('$')
    win?.webContents.send('main-process-message', data)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}


app.on('unmaximize', onWindowPositionEvent(win))
app.on('maximize', onWindowPositionEvent(win))
app.on('moved', onWindowPositionEvent(win))

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

