import { app, BrowserWindow, dialog } from 'electron'
import path from 'node:path'
import { backupsDir, closeDatabase, DatabaseOpenError, openDatabase } from './database'
import { createGatheringService } from './gathering/service'
import { registerImageHandler, registerImageScheme } from './images/image-protocol'
import { createPendingStore } from './images/pending-store'
import { createNotifier } from './ipc/context'
import { migrate, MigrationError, SchemaTooNewError } from './database/migrate'
import { migrations } from './database/migrations'
import { createRepositories } from './database/repositories'
import { registerIpcHandlers } from './ipc/handlers'
import { createSettingsService } from './settings/settings-service'
import { createMainWindow } from './windows/main-window'

const DIST = path.join(__dirname, '../dist')
const PUBLIC_DIR = app.isPackaged ? DIST : path.join(DIST, '../public')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null

function openMainWindow(settings: ReturnType<typeof createSettingsService>): void {
  mainWindow = createMainWindow({ settings, distDir: DIST, publicDir: PUBLIC_DIR, devServerUrl: VITE_DEV_SERVER_URL })
  mainWindow.once('closed', () => {
    mainWindow = null
  })
}

function reportStartupFailure(error: unknown): void {
  if (error instanceof SchemaTooNewError) {
    dialog.showErrorBox('ต้องอัปเดตแอป', 'ข้อมูลนี้ถูกสร้างจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อนเปิดใช้งาน')
  } else if (error instanceof MigrationError) {
    dialog.showErrorBox(
      'อัปเดตข้อมูลไม่สำเร็จ',
      `${error.message}\n\nสำเนาก่อนอัปเดต: ${error.backupPath ?? '(ฐานข้อมูลใหม่ ไม่มีสำเนา)'}`,
    )
  } else if (!(error instanceof DatabaseOpenError)) {
    console.error(error)
    dialog.showErrorBox('เริ่มแอปไม่สำเร็จ', error instanceof Error ? error.message : String(error))
  }
}

// The image scheme has to be declared before the app is ready.
registerImageScheme()

// Two processes must never open the same database: the second one hands focus to the first and quits.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.on('window-all-closed', () => app.quit())
  app.on('before-quit', closeDatabase)

  // Startup order follows F12-R6: database, migrations, settings, IPC handlers, then the window.
  app
    .whenReady()
    .then(async () => {
      const db = openDatabase()
      await migrate(db, migrations, backupsDir())
      const repos = createRepositories(db)
      const settings = createSettingsService(repos.settings, repos.profiles)
      settings.load()
      const gathering = createGatheringService(repos, settings)
      const pending = createPendingStore()
      registerImageHandler()
      registerIpcHandlers({ db, repos, settings, gathering, pending, notify: createNotifier(gathering) })
      openMainWindow(settings)
    })
    .catch((error: unknown) => {
      reportStartupFailure(error)
      closeDatabase()
      app.quit()
    })
}
