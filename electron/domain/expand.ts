import type { AggregationRecipe, Mode } from './types'

export interface RecipeTreeNode {
  itemId: number
  /** Units of this item needed by the parent (or wanted, for the root). */
  qty: number
  mode: Mode
  /** Set when the node is expanded through its own recipe. */
  recipeId: number | null
  /** Crafts of that recipe needed to cover `qty`: ceil(qty / output_qty). */
  runs: number
  /** Units produced beyond `qty` because output_qty does not divide it. */
  surplus: number
  children: RecipeTreeNode[]
}

export interface RecipeExpansion {
  runs: number
  surplus: number
  tree: RecipeTreeNode
  /** Raw materials needed in total, ignoring the inventory ("ตามสูตร"). */
  gross: Array<{ itemId: number; qty: number }>
}

/**
 * Expands a recipe for `quantity` output units into a tree down to the raw materials (F3-R8, F3-R9).
 * Only ingredients with `mode = 'craft'` that have a recipe are expanded; a visited path guards
 * against cycles even though saving a recipe already rejects them (F3-R10).
 */
export function expandRecipeTree(
  recipe: AggregationRecipe,
  quantity: number,
  recipesByOutputItem: Map<number, AggregationRecipe>,
): RecipeExpansion {
  const gross = new Map<number, number>()

  const build = (current: AggregationRecipe, qty: number, mode: Mode, path: number[]): RecipeTreeNode => {
    const runs = Math.ceil(qty / current.outputQty)
    const children = current.ingredients.map((ingredient): RecipeTreeNode => {
      const need = ingredient.qty * runs
      const child = recipesByOutputItem.get(ingredient.itemId)
      const nextPath = [...path, current.outputItemId]
      if (ingredient.mode === 'craft' && child && !nextPath.includes(ingredient.itemId)) {
        return build(child, need, ingredient.mode, nextPath)
      }
      gross.set(ingredient.itemId, (gross.get(ingredient.itemId) ?? 0) + need)
      return { itemId: ingredient.itemId, qty: need, mode: ingredient.mode, recipeId: null, runs: 0, surplus: 0, children: [] }
    })
    return {
      itemId: current.outputItemId,
      qty,
      mode,
      recipeId: current.id,
      runs,
      surplus: runs * current.outputQty - qty,
      children,
    }
  }

  const tree = build(recipe, quantity, 'craft', [])
  return {
    runs: tree.runs,
    surplus: tree.surplus,
    tree,
    gross: [...gross].map(([itemId, qty]) => ({ itemId, qty })).sort((a, b) => a.itemId - b.itemId),
  }
}
