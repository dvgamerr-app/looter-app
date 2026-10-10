import type { NativeImage } from 'electron'
import { deleteImageFiles, saveItemImage } from '../../images/image-store'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { toItemDto } from '../mappers'
import { handle } from '../register'
import { parseBoolean, parseCategory, parseId, parseName, parseNotes, requireRecord } from '../validate'

export function registerItemHandlers(context: AppContext): void {
  const { repos, pending, notify } = context

  /** Writes the image files first, then points the row at them (F12-R13). */
  function attach(profileId: number, itemId: number, image: NativeImage): void {
    const previous = repos.items.require(profileId, itemId)
    const files = saveItemImage(profileId, itemId, image)
    repos.items.setImage(profileId, itemId, files)
    // Same file names are reused, so nothing stale is left behind when an image is replaced.
    if (previous.imagePath && previous.imagePath !== files.imagePath) {
      deleteImageFiles({ imagePath: previous.imagePath, thumbnailPath: previous.thumbnailPath })
    }
  }

  handle('items:list', (request) => {
    const profileId = requireActiveProfile(context)
    const body = request === undefined ? {} : requireRecord(request)
    return repos.items
      .list({
        profileId,
        search: typeof body.search === 'string' ? body.search : '',
        category: body.category === undefined ? null : parseCategory(body.category),
        pinnedOnly: body.pinnedOnly === true,
      })
      .map(toItemDto)
  })

  handle('items:get', (request) => {
    const profileId = requireActiveProfile(context)
    return toItemDto(repos.items.require(profileId, parseId(requireRecord(request).id)))
  })

  handle('items:create', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = repos.items.create(profileId, {
      name: parseName(body.name, 'ชื่อ Item'),
      category: body.category === undefined ? 'material' : parseCategory(body.category),
      notes: parseNotes(body.notes) ?? null,
    })
    if (typeof body.pendingImageId === 'string') {
      try {
        attach(profileId, id, pending.get(body.pendingImageId, profileId))
        pending.discard(body.pendingImageId)
      } catch (error) {
        // The item exists without its image; the user can attach it again from the Item Library.
        notify.items(profileId, [id])
        throw error instanceof AppError ? new AppError(error.code, `สร้าง Item แล้ว แต่ใส่ภาพไม่สำเร็จ: ${error.message}`, { id }) : error
      }
    }
    notify.items(profileId, [id])
    return toItemDto(repos.items.require(profileId, id))
  })

  handle('items:update', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.items.update(profileId, id, {
      ...(body.name === undefined ? {} : { name: parseName(body.name, 'ชื่อ Item') }),
      ...(body.category === undefined ? {} : { category: parseCategory(body.category) }),
      ...(body.notes === undefined ? {} : { notes: parseNotes(body.notes) ?? null }),
    })
    notify.items(profileId, [id])
    return toItemDto(repos.items.require(profileId, id))
  })

  handle('items:setPinned', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.items.setPinned(profileId, id, parseBoolean(body.pinned, 'pinned'))
    notify.items(profileId, [id])
    return toItemDto(repos.items.require(profileId, id))
  })

  handle('items:attachImage', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    if (typeof body.pendingImageId !== 'string') throw new AppError('VALIDATION', 'ไม่พบภาพที่จะผูก')
    const current = repos.items.require(profileId, id)
    // Replacing an existing image needs the user's confirmation (F2-R9); the renderer states it with `replace`.
    if (current.imagePath && body.replace !== true) {
      throw new AppError('VALIDATION', 'Item นี้มีภาพอยู่แล้ว ต้องการแทนที่หรือไม่', { reason: 'IMAGE_EXISTS' })
    }
    attach(profileId, id, pending.get(body.pendingImageId, profileId))
    pending.discard(body.pendingImageId)
    notify.items(profileId, [id])
    return toItemDto(repos.items.require(profileId, id))
  })

  handle('items:removeImage', (request) => {
    const profileId = requireActiveProfile(context)
    const id = parseId(requireRecord(request).id)
    const current = repos.items.require(profileId, id)
    repos.items.setImage(profileId, id, { imagePath: null, thumbnailPath: null })
    deleteImageFiles({ imagePath: current.imagePath, thumbnailPath: current.thumbnailPath })
    notify.items(profileId, [id])
    return toItemDto(repos.items.require(profileId, id))
  })

  handle('items:getUsage', (request) => {
    const profileId = requireActiveProfile(context)
    const id = parseId(requireRecord(request).id)
    repos.items.require(profileId, id)
    return repos.items.getUsage(id)
  })

  handle('items:delete', (request) => {
    const profileId = requireActiveProfile(context)
    const id = parseId(requireRecord(request).id)
    // Recipes that have this item as output go with it, so their tracking and gathering results change too.
    const files = repos.items.delete(profileId, id)
    deleteImageFiles(files)
    notify.items(profileId, [id])
    notify.recipes(profileId)
    notify.tracking(profileId)
    return null
  })
}
