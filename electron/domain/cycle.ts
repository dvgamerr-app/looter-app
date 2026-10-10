import type { AggregationRecipe, AggregationRequirement } from './types'

/**
 * Skeleton for the recipe cycle check of Data Model section 8.1. Returns the item ids along the cycle
 * (starting and ending at the output item) or null. Phase 1 fixes the signature and always returns
 * null; the depth-first search lands with Recipes in Phase 2.
 */
export function findCycle(
  outputItemId: number,
  ingredients: AggregationRequirement[],
  recipesByOutputItem: Map<number, AggregationRecipe>,
): number[] | null {
  void outputItemId
  void ingredients
  void recipesByOutputItem
  return null
}
