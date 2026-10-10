import { randomUUID } from 'node:crypto'
import { nativeImage, type NativeImage } from 'electron'
import type { PendingImage } from '../ipc/contracts'
import { AppError } from '../ipc/errors'

const MAX_PENDING = 5
const MAX_BYTES = 64 * 1024 * 1024
const MAX_AGE_MS = 10 * 60 * 1000
const PREVIEW_SIZE = 256

interface Pending {
  id: string
  profileId: number
  source: PendingImage['source']
  png: Buffer
  width: number
  height: number
  createdAt: number
}

/**
 * Images waiting to be attached to an item. They live in memory only, are tied to the profile that was
 * active when they were created and expire after ten minutes (F10-R8, F1-R13).
 */
export function createPendingStore() {
  const pending = new Map<string, Pending>()

  const purge = (): void => {
    const now = Date.now()
    for (const [id, entry] of pending) if (now - entry.createdAt > MAX_AGE_MS) pending.delete(id)
  }

  /** Drops the oldest entries while the store holds too many images or too many bytes. */
  const enforceLimits = (): void => {
    const total = (): number => [...pending.values()].reduce((sum, entry) => sum + entry.png.length, 0)
    while (pending.size > MAX_PENDING || (pending.size > 1 && total() > MAX_BYTES)) {
      const oldest = [...pending.values()].sort((a, b) => a.createdAt - b.createdAt)[0]
      if (!oldest) break
      pending.delete(oldest.id)
    }
  }

  const preview = (image: NativeImage): string => {
    const { width, height } = image.getSize()
    const scale = Math.min(1, PREVIEW_SIZE / Math.max(width, height))
    const small = scale < 1 ? image.resize({ width: Math.round(width * scale), height: Math.round(height * scale) }) : image
    return small.toDataURL()
  }

  const toDto = (entry: Pending): PendingImage => ({
    id: entry.id,
    source: entry.source,
    width: entry.width,
    height: entry.height,
    previewDataUrl: preview(nativeImage.createFromBuffer(entry.png)),
  })

  return {
    add(profileId: number, source: PendingImage['source'], image: NativeImage): PendingImage {
      if (image.isEmpty()) throw new AppError('UNSUPPORTED_IMAGE', 'อ่านข้อมูลภาพไม่ได้')
      purge()
      const { width, height } = image.getSize()
      const entry: Pending = { id: randomUUID(), profileId, source, png: image.toPNG(), width, height, createdAt: Date.now() }
      pending.set(entry.id, entry)
      enforceLimits()
      return toDto(entry)
    },

    /** The image for an item, still kept until `discard` so a failed save can be retried. */
    get(id: string, profileId: number): NativeImage {
      purge()
      const entry = pending.get(id)
      if (!entry || entry.profileId !== profileId) throw new AppError('NOT_FOUND', 'ภาพที่รอบันทึกหมดอายุแล้วหรือไม่พบ')
      return nativeImage.createFromBuffer(entry.png)
    },

    list(profileId: number): PendingImage[] {
      purge()
      return [...pending.values()].filter((entry) => entry.profileId === profileId).map(toDto)
    },

    discard(id: string): void {
      pending.delete(id)
    },

    /** Called when the active profile changes: pending images belong to the previous one (F1-R13). */
    clear(): void {
      pending.clear()
    },
  }
}

export type PendingStore = ReturnType<typeof createPendingStore>
