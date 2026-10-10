import { computed } from 'vue'
import type { ItemDto } from '../../electron/ipc/contracts'
import { createResource } from './resource'

const resource = createResource<ItemDto[]>([], () => window.api.items.list(), ['items:changed', 'recipes:changed'])

/**
 * Every item of the active profile, kept in sync by `items:changed`. The library, the pickers and the
 * name lookups of the other screens all read this one list. `inventory:changed` patches the owned
 * counts in place so pressing + does not reload the whole list.
 */
export function useItems() {
  resource.start()
  watchOwned()
  return {
    items: resource.data,
    loaded: resource.loaded,
    reload: resource.reload,
    byId: computed(() => new Map(resource.data.value.map((item) => [item.id, item]))),
  }
}

let patching = false
export function watchOwned(): void {
  if (patching) return
  patching = true
  window.api.on('inventory:changed', ({ changes }) => {
    const owned = new Map(changes.map((change) => [change.itemId, change.owned]))
    resource.data.value = resource.data.value.map((item) =>
      owned.has(item.id) ? { ...item, owned: owned.get(item.id)! } : item,
    )
  })
}
