import { BrowserWindow, dialog } from 'electron'
import type { BackupService } from '../../backup/backup-service'
import { AppError } from '../errors'
import { handle } from '../register'
import { requireRecord } from '../validate'

const defaultName = (): string => {
  const now = new Date()
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `gamelooter-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.zip`
}

const requirePath = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') throw new AppError('VALIDATION', 'ต้องระบุตำแหน่งไฟล์', { field: 'path' })
  return value
}

export function registerBackupHandlers(backup: BackupService): void {
  handle('backup:pickPath', async (request, event) => {
    const mode = requireRecord(request).mode
    const parent = BrowserWindow.fromWebContents(event.sender)
    if (mode === 'save') {
      const options = { title: 'สร้าง Backup', defaultPath: defaultName(), filters: [{ name: 'GameLooter backup', extensions: ['zip'] }] }
      const result = parent ? await dialog.showSaveDialog(parent, options) : await dialog.showSaveDialog(options)
      return result.canceled || !result.filePath ? null : result.filePath
    }
    if (mode === 'open') {
      const options = { title: 'เลือกไฟล์ Backup', properties: ['openFile' as const], filters: [{ name: 'GameLooter backup', extensions: ['zip'] }] }
      const result = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)
      return result.canceled || !result.filePaths[0] ? null : result.filePaths[0]
    }
    throw new AppError('VALIDATION', 'โหมดไม่ถูกต้อง', { field: 'mode' })
  })

  handle('backup:export', (request) => backup.exportTo(requirePath(request)))
  handle('backup:inspect', (request) => backup.inspect(requirePath(request)))

  handle('backup:restore', async (request) => {
    await backup.restore(requirePath(request))
    return null
  })
}
