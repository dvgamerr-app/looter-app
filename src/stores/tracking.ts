import type { TrackingTargetDto } from '../../electron/ipc/contracts'
import { createResource } from './resource'

const resource = createResource<TrackingTargetDto[]>([], () => window.api.tracking.list(), [
  'tracking:changed',
  'quests:changed',
  'recipes:changed',
])

/** Tracking targets in priority order (F5). */
export function useTracking() {
  resource.start()
  return { targets: resource.data, loaded: resource.loaded, reload: resource.reload }
}
