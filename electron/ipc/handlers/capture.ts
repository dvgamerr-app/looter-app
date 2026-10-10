import { BrowserWindow, dialog, nativeImage } from 'electron'
import { readClipboardImage } from '../../capture/clipboard-image'
import { broadcast } from '../broadcast'
import type { PendingImage } from '../contracts'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { handle } from '../register'
import { requireRecord } from '../validate'

// Phase 2 covers the two ways to bring an image in without the screen: a file and the clipboard.
// Region capture (capture:start and friends) arrives with Phase 4.
export function registerCaptureHandlers(context: AppContext): void {
  const { pending } = context

  const announce = (image: PendingImage): PendingImage => {
    broadcast('capture:changed', { phase: 'captured', pending: image })
    return image
  }

  handle('capture:fromClipboard', async () => {
    const profileId = requireActiveProfile(context)
    return announce(pending.add(profileId, 'clipboard', await readClipboardImage()))
  })

  handle('capture:importFile', async (_request, event) => {
    const profileId = requireActiveProfile(context)
    const options: Electron.OpenDialogOptions = {
      title: 'เลือกไฟล์ภาพ',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
    }
    const parent = BrowserWindow.fromWebContents(event.sender)
    const result = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options)
    const file = result.filePaths[0]
    if (result.canceled || !file) return null
    const image = nativeImage.createFromPath(file)
    if (image.isEmpty()) throw new AppError('UNSUPPORTED_IMAGE', 'อ่านไฟล์ภาพนี้ไม่ได้ ลองใช้ PNG หรือ JPEG')
    return announce(pending.add(profileId, 'file', image))
  })

  handle('capture:listPending', () => pending.list(requireActiveProfile(context)))

  handle('capture:discard', (request) => {
    const id = requireRecord(request).pendingImageId
    if (typeof id !== 'string') throw new AppError('VALIDATION', 'ไม่พบภาพที่จะทิ้ง')
    pending.discard(id)
    return null
  })
}
