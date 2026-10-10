import { clipboard, nativeImage, type NativeImage } from 'electron'
import { AppError } from '../ipc/errors'

/**
 * Reads an image from the system clipboard with the Promise-based W3C-style API of Electron 44
 * (`readImage` no longer exists). Anything the platform exposes as an `image/*` type is converted to a
 * NativeImage, so a copy from Win+Shift+S or from an image viewer both work.
 */
export async function readClipboardImage(): Promise<NativeImage> {
  const items = await clipboard.read()
  for (const item of items) {
    const type = item.types.find((candidate) => candidate === 'image/png') ?? item.types.find((candidate) => candidate.startsWith('image/'))
    if (!type) continue
    const blob = (await item.getType(type)) as Blob
    const image = nativeImage.createFromBuffer(Buffer.from(await blob.arrayBuffer()))
    if (!image.isEmpty()) return image
  }
  throw new AppError('CLIPBOARD_EMPTY', 'Clipboard ไม่มีภาพ ลองกด Win+Shift+S เพื่อจับภาพหน้าจอก่อน')
}
