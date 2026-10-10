import { nativeImage, type NativeImage } from 'electron'
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { dataDir } from '../database'
import type { ItemFiles } from '../database/repositories/item'
import { AppError } from '../ipc/errors'

export const IMAGE_SCHEME = 'looter-img'
const THUMBNAIL_SIZE = 64

/**
 * Turns a path stored in the database (relative to the data folder, with `/`) into an absolute one.
 * Anything that would leave the data folder is refused (Data Model section 5.2).
 */
export function resolveDataPath(relative: string): string {
  const root = path.resolve(dataDir())
  const absolute = path.resolve(root, relative)
  if (!absolute.startsWith(root + path.sep)) throw new AppError('IO', 'ตำแหน่งไฟล์ไม่ถูกต้อง')
  return absolute
}

/** URL the renderer uses for a stored image; `?v=` busts the cache when the image is replaced (F2-R9). */
export function imageUrl(relative: string | null, updatedAt: string): string | null {
  return relative ? `${IMAGE_SCHEME}://data/${relative}?v=${encodeURIComponent(updatedAt)}` : null
}

/** Writes through a temporary file so an interrupted write never leaves half an image behind. */
function writeAtomic(absolute: string, data: Buffer): void {
  mkdirSync(path.dirname(absolute), { recursive: true })
  const temporary = `${absolute}.tmp`
  writeFileSync(temporary, data)
  renameSync(temporary, absolute)
}

/** 64x64 PNG: the longest side is scaled down to 64 (never up) and the rest is transparent padding. */
export function buildThumbnail(image: NativeImage): NativeImage {
  const { width, height } = image.getSize()
  const scale = Math.min(1, THUMBNAIL_SIZE / Math.max(width, height))
  const scaled = scale < 1
    ? image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), quality: 'good' })
    : image
  const size = scaled.getSize()
  const source = scaled.toBitmap()
  const target = Buffer.alloc(THUMBNAIL_SIZE * THUMBNAIL_SIZE * 4)
  const left = Math.floor((THUMBNAIL_SIZE - size.width) / 2)
  const top = Math.floor((THUMBNAIL_SIZE - size.height) / 2)
  for (let row = 0; row < size.height; row++) {
    source.copy(target, ((top + row) * THUMBNAIL_SIZE + left) * 4, row * size.width * 4, (row + 1) * size.width * 4)
  }
  return nativeImage.createFromBitmap(target, { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE })
}

/**
 * Writes the original and the thumbnail for an item and returns their relative paths. Files are written
 * before the database row is updated (F12-R13); if anything fails, the files already written are removed.
 */
export function saveItemImage(profileId: number, itemId: number, image: NativeImage): ItemFiles {
  if (image.isEmpty()) throw new AppError('UNSUPPORTED_IMAGE', 'อ่านข้อมูลภาพไม่ได้')
  const imagePath = `images/${profileId}/${itemId}.png`
  const thumbnailPath = `images/${profileId}/thumbs/${itemId}.png`
  try {
    writeAtomic(resolveDataPath(imagePath), image.toPNG())
    writeAtomic(resolveDataPath(thumbnailPath), buildThumbnail(image).toPNG())
  } catch (error) {
    deleteImageFiles({ imagePath, thumbnailPath })
    throw new AppError('IO', 'บันทึกไฟล์ภาพไม่สำเร็จ', { reason: (error as Error).message })
  }
  return { imagePath, thumbnailPath }
}

/** Removes image files after the database change has committed; failures are logged, never thrown (F1-R9). */
export function deleteImageFiles(files: ItemFiles): void {
  for (const relative of [files.imagePath, files.thumbnailPath]) {
    if (!relative) continue
    try {
      rmSync(resolveDataPath(relative), { force: true })
    } catch (error) {
      console.error(`Could not remove ${relative}`, error)
    }
  }
}
