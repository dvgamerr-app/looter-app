import { app, shell } from 'electron'
import { dataDir } from '../../database'
import { cleanupOrphanImages } from '../../images/orphans'
import { checkForUpdate } from '../../updater/check-update'
import type { AppContext } from '../context'
import { AppError } from '../errors'
import { handle } from '../register'

export function registerAppHandlers({ db, notify, settings }: AppContext): void {
  handle('app:getInfo', () => ({
    name: 'GameLooter',
    version: app.getVersion(),
    electron: process.versions.electron,
    chromium: process.versions.chrome,
    node: process.versions.node,
    schemaVersion: db.pragma('user_version', { simple: true }) as number,
    dataPath: dataDir(),
  }))

  handle('app:openDataFolder', async () => {
    const failure = await shell.openPath(dataDir())
    if (failure) throw new AppError('IO', 'เปิดโฟลเดอร์ข้อมูลไม่สำเร็จ', { reason: failure })
    return null
  })

  handle('app:checkUpdate', () => checkForUpdate())

  // Manual cleanup: files nothing refers to are deleted and items whose file is gone lose their image paths.
  handle('app:cleanImages', () => {
    const result = cleanupOrphanImages(db, dataDir())
    const profileId = settings.getActiveProfileId()
    if (profileId !== null && result.clearedItems > 0) notify.items(profileId)
    return result
  })
}
