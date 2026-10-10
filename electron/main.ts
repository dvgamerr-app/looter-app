import { app, BrowserWindow, dialog } from 'electron'
import { release, arch, platform } from 'node:os'
import path from 'node:path'
import { backupsDir, closeDatabase, openDatabase } from './database'
import { migrate, MigrationError, SchemaTooNewError } from './database/migrate'
import { migrations } from './database/migrations'

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

app.on('before-quit', closeDatabase)

app.whenReady().then(async () => {
  try {
    await migrate(openDatabase(), migrations, backupsDir())
  } catch (error) {
    if (error instanceof SchemaTooNewError) {
      dialog.showErrorBox('ต้องอัปเดตแอป', 'ข้อมูลนี้ถูกสร้างจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อนเปิดใช้งาน')
    } else if (error instanceof MigrationError) {
      dialog.showErrorBox(
        'อัปเดตข้อมูลไม่สำเร็จ',
        `${error.message}\n\nสำเนาก่อนอัปเดต: ${error.backupPath ?? '(ฐานข้อมูลใหม่ ไม่มีสำเนา)'}`,
      )
    } else {
      console.error(error)
    }
    closeDatabase()
    app.quit()
    return
  }
  createWindow()
})
