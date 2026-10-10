import { desktopCapturer, screen, type Display, type NativeImage } from 'electron'
import { AppError } from '../ipc/errors'

export interface ScreenFrame {
  image: NativeImage
  display: Display
}

/** Grid of sampled points (F10-R10); a frame where every sample is almost black is treated as a failed capture. */
const SAMPLE_GRID = 16
const BLACK_THRESHOLD = 12

/** True when the image is black everywhere we look, as with Fullscreen Exclusive games or protected content. */
export function isBlackFrame(image: NativeImage): boolean {
  const { width, height } = image.getSize()
  if (width === 0 || height === 0) return true
  const bitmap = image.toBitmap()
  for (let row = 0; row < SAMPLE_GRID; row++) {
    for (let column = 0; column < SAMPLE_GRID; column++) {
      const x = Math.min(width - 1, Math.floor(((column + 0.5) * width) / SAMPLE_GRID))
      const y = Math.min(height - 1, Math.floor(((row + 0.5) * height) / SAMPLE_GRID))
      const offset = (y * width + x) * 4
      // Bitmap order is BGRA; any channel above the threshold means there is real content.
      if (bitmap[offset]! > BLACK_THRESHOLD || bitmap[offset + 1]! > BLACK_THRESHOLD || bitmap[offset + 2]! > BLACK_THRESHOLD) {
        return false
      }
    }
  }
  return true
}

/**
 * Grabs the display under the cursor at its physical resolution (F10-R2): the thumbnail size is the
 * display size times its scale factor, so nothing is blurred on a 125% or 150% screen.
 */
export async function grabDisplayUnderCursor(): Promise<ScreenFrame> {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  if (!display) throw new AppError('CAPTURE_FAILED', 'ไม่พบจอที่จะจับภาพ', { reason: 'no-display' })

  const width = Math.round(display.bounds.width * display.scaleFactor)
  const height = Math.round(display.bounds.height * display.scaleFactor)

  let sources
  try {
    sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width, height } })
  } catch (error) {
    throw new AppError('CAPTURE_FAILED', 'ระบบไม่อนุญาตให้จับภาพหน้าจอ', { reason: 'permission', cause: (error as Error).message })
  }
  if (sources.length === 0) throw new AppError('CAPTURE_FAILED', 'ระบบไม่อนุญาตให้จับภาพหน้าจอ', { reason: 'permission' })

  // A source belongs to a display through `display_id`; with a single screen the id can be empty.
  const source = sources.find((candidate) => candidate.display_id === String(display.id)) ?? (sources.length === 1 ? sources[0] : undefined)
  if (!source || source.thumbnail.isEmpty()) throw new AppError('CAPTURE_FAILED', 'ไม่พบจอที่จะจับภาพ', { reason: 'no-display' })

  return { image: source.thumbnail, display }
}
