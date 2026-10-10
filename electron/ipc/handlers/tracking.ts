import type { TrackingKind } from '../../domain/types'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { toTrackingDto } from '../mappers'
import { handle } from '../register'
import { parseBoolean, parseCount, parseId, requireRecord } from '../validate'
import type { OverlayController } from '../../windows/overlay-window'

export function registerTrackingHandlers(context: AppContext, overlay: OverlayController): void {
  const { repos } = context
  const notify = {
    // Pins decide which targets the overlay can cycle through, so it is refreshed together with the push events.
    tracking: (profileId: number): void => {
      context.notify.tracking(profileId)
      overlay.refresh()
    },
  }

  const list = (profileId: number) => repos.tracking.listLabelled(profileId).map(toTrackingDto)
  const one = (profileId: number, id: number) => {
    const target = list(profileId).find((entry) => entry.id === id)
    if (!target) throw new AppError('NOT_FOUND', 'ไม่พบ Tracking Target')
    return target
  }

  handle('tracking:list', () => list(requireActiveProfile(context)))

  handle('tracking:add', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const kind = body.kind as TrackingKind
    if (kind !== 'quest' && kind !== 'recipe') throw new AppError('VALIDATION', 'ชนิด Target ไม่ถูกต้อง', { field: 'kind' })
    const id = repos.tracking.add(profileId, {
      kind,
      ...(kind === 'quest' ? { questId: parseId(body.questId, 'Quest') } : { recipeId: parseId(body.recipeId, 'Recipe') }),
      targetQty: body.targetQty === undefined ? 1 : parseCount(body.targetQty, 'จำนวนเป้าหมาย'),
    })
    notify.tracking(profileId)
    return one(profileId, id)
  })

  handle('tracking:remove', (request) => {
    const profileId = requireActiveProfile(context)
    repos.tracking.remove(profileId, parseId(requireRecord(request).id))
    notify.tracking(profileId)
    return null
  })

  handle('tracking:update', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.tracking.updateQty(profileId, id, parseCount(body.targetQty, 'จำนวนเป้าหมาย'))
    notify.tracking(profileId)
    return one(profileId, id)
  })

  handle('tracking:reorder', (request) => {
    const profileId = requireActiveProfile(context)
    if (!Array.isArray(request)) throw new AppError('VALIDATION', 'รายการลำดับไม่ถูกต้อง', { field: 'ids' })
    repos.tracking.reorder(profileId, request.map((id) => parseId(id)))
    notify.tracking(profileId)
    return list(profileId)
  })

  handle('tracking:setPinned', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.tracking.setPinned(profileId, id, parseBoolean(body.pinned, 'pinned'))
    notify.tracking(profileId)
    return one(profileId, id)
  })
}
