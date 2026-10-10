import { computed } from 'vue'
import type { RecipeDto } from '../../electron/ipc/contracts'
import { createResource } from './resource'

const resource = createResource<RecipeDto[]>([], () => window.api.recipes.list(), [
  'recipes:changed',
  'tracking:changed',
  'items:changed',
])

export function useRecipes() {
  resource.start()
  return {
    recipes: resource.data,
    loaded: resource.loaded,
    reload: resource.reload,
    byId: computed(() => new Map(resource.data.value.map((recipe) => [recipe.id, recipe]))),
    byOutputItem: computed(() => new Map(resource.data.value.map((recipe) => [recipe.outputItemId, recipe]))),
  }
}
