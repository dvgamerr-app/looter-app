import type { QuestStatus } from '../contracts'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { toQuestDtos } from '../mappers'
import { handle } from '../register'
import { parseBoolean, parseId, parseIngredients, parseName, parseNotes, requireRecord } from '../validate'

const STATUSES: readonly QuestStatus[] = ['active', 'paused', 'completed']

function parseStatus(value: unknown): QuestStatus {
  if (typeof value !== 'string' || !(STATUSES as readonly string[]).includes(value)) {
    throw new AppError('VALIDATION', 'สถานะ Quest ไม่ถูกต้อง', { field: 'status' })
  }
  return value as QuestStatus
}

export function registerQuestHandlers(context: AppContext): void {
  const { db, repos, notify } = context

  const load = (profileId: number, questId: number) => {
    const [quest] = toQuestDtos(repos.quests.get(profileId, questId))
    if (!quest) throw new AppError('NOT_FOUND', 'ไม่พบ Quest')
    return quest
  }

  handle('quests:list', (request) => {
    const profileId = requireActiveProfile(context)
    const body = request === undefined ? {} : requireRecord(request)
    return toQuestDtos(repos.quests.list(profileId, body.status === undefined ? undefined : parseStatus(body.status)))
  })

  handle('quests:get', (request) => load(requireActiveProfile(context), parseId(requireRecord(request).id)))

  handle('quests:create', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const track = body.track === undefined ? false : parseBoolean(body.track, 'track')
    const id = db.transaction(() => {
      const created = repos.quests.create(profileId, {
        name: parseName(body.name, 'ชื่อ Quest'),
        notes: parseNotes(body.notes) ?? null,
        requirements: body.requirements === undefined ? [] : parseIngredients(body.requirements),
      })
      if (track) repos.tracking.add(profileId, { kind: 'quest', questId: created, targetQty: 1 })
      return created
    })()
    notify.quests(profileId, [id])
    if (track) notify.tracking(profileId)
    return load(profileId, id)
  })

  handle('quests:update', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.quests.update(profileId, id, {
      ...(body.name === undefined ? {} : { name: parseName(body.name, 'ชื่อ Quest') }),
      ...(body.notes === undefined ? {} : { notes: parseNotes(body.notes) ?? null }),
      ...(body.requirements === undefined ? {} : { requirements: parseIngredients(body.requirements) }),
    })
    notify.quests(profileId, [id])
    return load(profileId, id)
  })

  // The status changes the quest only; the inventory is never touched (F4-R3).
  handle('quests:setStatus', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.quests.setStatus(profileId, id, parseStatus(body.status))
    notify.quests(profileId, [id])
    notify.tracking(profileId)
    return load(profileId, id)
  })

  handle('quests:delete', (request) => {
    const profileId = requireActiveProfile(context)
    repos.quests.delete(profileId, parseId(requireRecord(request).id))
    notify.quests(profileId)
    notify.tracking(profileId)
    return null
  })
}
