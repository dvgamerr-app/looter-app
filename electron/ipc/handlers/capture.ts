import { BrowserWindow, dialog, nativeImage } from 'electron'
import { readClipboardImage } from '../../capture/clipboard-image'
import type { CaptureController } from '../../windows/capture-window'
import { broadcast } from '../broadcast'
import type { Bounds, PendingImage } from '../contracts'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { handle } from '../register'
import { parseCount, requireRecord } from '../validate'

/** Brings a clipboard image in as a pending image, announcing the result (hotkey and button share this). */
export async function importFromClipboard(context: AppContext): Promise<PendingImage> {
  const profileId = requireActiveProfile(context)
  const image = context.pending.add(profileId, 'clipboard', await readClipboardImage())
  broadcast('capture:changed', { phase: 'captured', pending: image })
  return image
}

export function registerCaptureHandlers(context: AppContext, capture: CaptureController): void {
  const { pending } = context

  const announce = (image: PendingImage): PendingImage => {
    broadcast('capture:changed', { phase: 'captured', pending: image })
    return image
  }

  handle('capture:start', async () => {
    requireActiveProfile(context)
    await capture.start()
    return null
  })

  handle('capture:cancel', () => {
    capture.cancel()
    return null
  })

  handle('capture:commitSelection', (request) => {
    const rect = requireRecord(requireRecord(request).rect, 'บริเวณที่เลือก')
    const bounds: Bounds = {
      x: parseCount(rect.x, 'x', 0),
      y: parseCount(rect.y, 'y', 0),
      width: parseCount(rect.width, 'width'),
      height: parseCount(rect.height, 'height'),
    }
    return capture.commit(bounds)
  })

  handle('capture:fromClipboard', () => importFromClipboard(context))

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
    if (image.isEmpty()) throw new AppError('UNSUPPORTED_IMAGE', 'อ่านไฟล์ภาพนี้ไม่ได้ ลองใช้ PNG, JPG, WebP หรือ BMP')
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
