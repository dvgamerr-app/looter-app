import { computed } from 'vue'
import type { QuestDto } from '../../electron/ipc/contracts'
import { createResource } from './resource'

const resource = createResource<QuestDto[]>([], () => window.api.quests.list(), [
  'quests:changed',
  'tracking:changed',
])

export function useQuests() {
  resource.start()
  return {
    quests: resource.data,
    loaded: resource.loaded,
    reload: resource.reload,
    byId: computed(() => new Map(resource.data.value.map((quest) => [quest.id, quest]))),
  }
}
