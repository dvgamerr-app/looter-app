import { app, BrowserWindow, dialog, session } from 'electron'
import path from 'node:path'
import { createBackupService } from './backup/backup-service'
import { backupsDir, closeDatabase, dataDir, DatabaseOpenError, openDatabase } from './database'
import { createGatheringService } from './gathering/service'
import { registerImageHandler, registerImageScheme } from './images/image-protocol'
import { createPendingStore } from './images/pending-store'
import { broadcast } from './ipc/broadcast'
import { createNotifier } from './ipc/context'
import { AppError } from './ipc/errors'
import { importFromClipboard } from './ipc/handlers/capture'
import { migrate, MigrationError, SchemaTooNewError } from './database/migrate'
import { migrations } from './database/migrations'
import { createRepositories } from './database/repositories'
import { registerIpcHandlers } from './ipc/handlers'
import { createSettingsService } from './settings/settings-service'
import { createMainWindow } from './windows/main-window'
import { createCaptureController } from './windows/capture-window'
import { createOverlayController } from './windows/overlay-window'
import { createHotkeyManager } from './hotkeys/hotkey-manager'

const DIST = path.join(__dirname, '../dist')
const PUBLIC_DIR = app.isPackaged ? DIST : path.join(DIST, '../public')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null

function openMainWindow(settings: ReturnType<typeof createSettingsService>): void {
  mainWindow = createMainWindow({ settings, distDir: DIST, publicDir: PUBLIC_DIR, devServerUrl: VITE_DEV_SERVER_URL })
  // Closing the main window ends the app. `window-all-closed` would not fire while the hidden overlay
  // window still exists, so the app is quit explicitly.
  mainWindow.once('closed', () => {
    mainWindow = null
    app.quit()
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
      const overlay = createOverlayController({
        settings,
        repos,
        gathering,
        getMainWindow: () => mainWindow,
        distDir: DIST,
        devServerUrl: VITE_DEV_SERVER_URL,
      })
      const context = { db, repos, settings, gathering, pending, notify: createNotifier(gathering) }
      const capture = createCaptureController({
        pending,
        overlay,
        getActiveProfileId: () => settings.getActiveProfileId(),
        getMainWindow: () => mainWindow,
        distDir: DIST,
        devServerUrl: VITE_DEV_SERVER_URL,
      })

      // A failed hotkey action has no caller to return an error to, so it is announced like any capture failure.
      const reportCaptureFailure = (error: unknown): void => {
        const known = error instanceof AppError ? error.toJSON() : { code: 'INTERNAL' as const, message: 'จับภาพไม่สำเร็จ' }
        broadcast('capture:changed', { phase: 'failed', error: known })
        overlay.focusMainWindow()
      }

      const hotkeys = createHotkeyManager(settings, {
        toggleOverlay: () => overlay.toggle(),
        toggleOverlayMode: () => overlay.toggleMode(),
        overlayNextTarget: () => overlay.cycleScope(1),
        overlayPrevTarget: () => overlay.cycleScope(-1),
        startCapture: () => void capture.start().catch(reportCaptureFailure),
        importClipboard: () =>
          void importFromClipboard(context)
            .then(() => overlay.focusMainWindow())
            .catch(reportCaptureFailure),
      })
      const backup = createBackupService({
        getDb: () => db,
        migrations,
        appVersion: app.getVersion(),
        userDataDir: app.getPath('userData'),
        dataDir: dataDir(),
        backupsDir: backupsDir(),
        // The folders are about to be swapped, so everything that holds a file open lets go of it first.
        prepareForSwap: () => {
          hotkeys.unregisterAll()
          capture.cancel()
          overlay.destroy()
          closeDatabase()
        },
        relaunch: () => {
          app.relaunch()
          app.exit(0)
        },
      })
      registerIpcHandlers(context, { hotkeys, overlay, capture, backup })

      // The app never asks for browser permissions; screen capture happens in the main process only (F10-R11).
      session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
      session.defaultSession.setPermissionCheckHandler(() => false)
      hotkeys.registerAll()
      openMainWindow(settings)
      overlay.restoreOnStart()
      // Order matters: the overlay flushes its last bounds into the database, so the database closes last (F12-R12).
      app.on('before-quit', () => {
        hotkeys.unregisterAll()
        overlay.destroy()
        closeDatabase()
      })
    })
    .catch((error: unknown) => {
      reportStartupFailure(error)
      closeDatabase()
      app.quit()
    })
}
