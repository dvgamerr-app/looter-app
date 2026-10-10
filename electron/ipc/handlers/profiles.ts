import type { ProfileRow } from '../../database/repositories/profile'
import type { ProfileDto, ProfileList } from '../contracts'
import { broadcast } from '../broadcast'
import type { AppContext } from '../context'
import { AppError } from '../errors'
import { handle } from '../register'
import { parseId, parseName, requireRecord } from '../validate'
import type { OverlayController } from '../../windows/overlay-window'

const toDto = (row: ProfileRow, progress: ProfileDto['progress']): ProfileDto => ({
  id: row.id,
  name: row.name,
  // icon_path is always NULL in Phase 1 (F1-R12); the renderer shows the first letter instead.
  iconUrl: null,
  createdAt: row.createdAt,
  lastOpenedAt: row.lastOpenedAt,
  itemCount: row.itemCount,
  recipeCount: row.recipeCount,
  questCount: row.questCount,
  // Overall progress of the gathering list (F1-R6); the dashboard shows it per profile.
  progress,
})

export function registerProfileHandlers({ db, repos, settings, pending, gathering }: AppContext, overlay: OverlayController): void {
  const snapshot = (): ProfileList => ({
    activeProfileId: settings.getActiveProfileId(),
    profiles: repos.profiles.list().map((row) => toDto(row, gathering.progress(row.id))),
  })

  /** Saves the new active profile and its last_opened_at in one transaction (F1-R4). */
  const activate = (id: number | null): void => {
    db.transaction(() => {
      if (id !== null) repos.profiles.touchLastOpened(id)
      settings.setActiveProfileId(id)
    })()
    // Pending images belong to the previous profile and are dropped (F1-R13).
    pending.clear()
    // The overlay shows the new profile at once, or hides itself when none is left (F1-R10).
    overlay.refresh({ profileChanged: true })
  }

  const publish = (): ProfileList => {
    const list = snapshot()
    broadcast('profile:changed', list)
    gathering.schedule()
    return list
  }

  handle('profiles:list', () => snapshot())

  handle('profiles:getActive', () => {
    const id = settings.getActiveProfileId()
    const row = id === null ? undefined : repos.profiles.get(id)
    return row ? toDto(row, gathering.progress(row.id)) : null
  })

  handle('profiles:create', (request) => {
    const name = parseName(requireRecord(request).name, 'ชื่อเกม')
    const id = repos.profiles.create(name)
    // The first profile becomes active immediately (F1-R3).
    if (settings.getActiveProfileId() === null) activate(id)
    return publish()
  })

  handle('profiles:rename', (request) => {
    const body = requireRecord(request)
    repos.profiles.rename(parseId(body.id), parseName(body.name, 'ชื่อเกม'))
    return publish()
  })

  handle('profiles:getDeleteSummary', (request) => repos.profiles.getDeleteSummary(parseId(requireRecord(request).id)))

  handle('profiles:delete', (request) => {
    const id = parseId(requireRecord(request).id)
    repos.profiles.delete(id)
    // Deleting the active profile moves to the most recently opened one, or back to onboarding (F1-R10).
    if (settings.getActiveProfileId() === id) activate(repos.profiles.mostRecentId())
    return publish()
  })

  handle('profiles:switch', (request) => {
    const id = parseId(requireRecord(request).id)
    if (!repos.profiles.exists(id)) throw new AppError('NOT_FOUND', 'ไม่พบ Game Profile')
    activate(id)
    return publish()
  })
}
