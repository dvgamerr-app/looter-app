import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { broadcast } from '../ipc/broadcast'
import type { UpdateProgress } from '../ipc/contracts'
import { AppError } from '../ipc/errors'

/**
 * Downloads and installs a newer version, only when the user asks for it. Nothing is fetched in the
 * background and nothing is installed on quit by itself. The installer is not code signed yet, so the
 * integrity check is the SHA-512 in `latest.yml` served over HTTPS from the GitHub release.
 */
export function createUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowPrerelease = false

  let version: string | null = null
  let downloaded = false

  const publish = (progress: Partial<UpdateProgress> & Pick<UpdateProgress, 'phase'>): void => {
    broadcast('update:changed', { percent: 0, version, ...progress })
  }

  autoUpdater.on('download-progress', (info) => publish({ phase: 'downloading', percent: Math.round(info.percent) }))
  autoUpdater.on('update-downloaded', () => {
    downloaded = true
    publish({ phase: 'downloaded', percent: 100 })
  })
  autoUpdater.on('error', (error) => publish({ phase: 'error', message: error.message }))

  const requirePackaged = (): void => {
    // electron-updater needs the installed app's metadata; a development run has none.
    if (!app.isPackaged) throw new AppError('IO', 'อัปเดตอัตโนมัติใช้ได้เฉพาะแอปที่ติดตั้งแล้ว')
  }

  return {
    /** Finds the update described by `latest.yml` and downloads it. Progress arrives as `update:changed`. */
    async download(): Promise<void> {
      requirePackaged()
      try {
        const result = await autoUpdater.checkForUpdates()
        if (!result?.isUpdateAvailable) throw new AppError('NOT_FOUND', 'ไม่พบเวอร์ชันใหม่ให้ดาวน์โหลด')
        version = result.updateInfo.version
        publish({ phase: 'downloading', percent: 0 })
        await autoUpdater.downloadUpdate()
      } catch (error) {
        if (error instanceof AppError) throw error
        publish({ phase: 'error', message: (error as Error).message })
        throw new AppError('IO', 'ดาวน์โหลดอัปเดตไม่สำเร็จ', { reason: (error as Error).message })
      }
    },

    /** Closes the app, runs the installer and starts the new version (data in %APPDATA% is kept). */
    install(): void {
      requirePackaged()
      if (!downloaded) throw new AppError('VALIDATION', 'ยังไม่ได้ดาวน์โหลดอัปเดต')
      autoUpdater.quitAndInstall(false, true)
    },
  }
}

export type Updater = ReturnType<typeof createUpdater>
