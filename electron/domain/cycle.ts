import type { AggregationRecipe, AggregationRequirement } from './types'

/**
 * Looks for a circular dependency before a recipe is saved (Data Model section 8.1).
 *
 * The graph is "item -> the items its recipe uses", built from every ingredient row of the profile
 * regardless of `mode`, because a mode can be changed later and the structure must stay acyclic.
 * `recipesByOutputItem` must describe the database as it is now; the recipe being saved needs no
 * special handling because reaching its own output item already counts as a cycle.
 *
 * Returns the item ids along the cycle, starting and ending with the output item, or null.
 */
export function findCycle(
  outputItemId: number,
  ingredients: AggregationRequirement[],
  recipesByOutputItem: Map<number, AggregationRecipe>,
): number[] | null {
  const visited = new Set<number>()

  const walk = (itemId: number, path: number[]): number[] | null => {
    const recipe = recipesByOutputItem.get(itemId)
    if (!recipe) return null
    for (const ingredient of recipe.ingredients) {
      if (ingredient.itemId === outputItemId) return [...path, outputItemId]
      if (visited.has(ingredient.itemId)) continue
      visited.add(ingredient.itemId)
      const found = walk(ingredient.itemId, [...path, ingredient.itemId])
      if (found) return found
    }
    return null
  }

  for (const ingredient of ingredients) {
    if (ingredient.itemId === outputItemId) return [outputItemId, ingredient.itemId]
    visited.add(ingredient.itemId)
    const found = walk(ingredient.itemId, [outputItemId, ingredient.itemId])
    if (found) return found
  }
  return null
}
