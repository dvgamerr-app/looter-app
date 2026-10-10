import type {
  AggregationInput,
  AggregationRecipe,
  AggregationRequirement,
  AggregationResult,
  CraftPlanRow,
  GatheringRow,
  TargetAllocation,
} from './types'

export type {
  AggregationInput,
  AggregationRecipe,
  AggregationRequirement,
  AggregationResult,
  AggregationTarget,
  CraftPlanRow,
  GatheringRow,
  TargetAllocation,
} from './types'

const add = (map: Map<number, number>, key: number, amount: number): void => {
  map.set(key, (map.get(key) ?? 0) + amount)
}

/**
 * Global material aggregation (Data Model section 7).
 *
 * Targets are walked in priority order and draw from one shared pool that starts as the inventory.
 * Whatever a target takes is allocated to it and removed from the pool, so an item is never counted
 * twice. A shortfall of an item that has a recipe (mode `craft`) becomes crafting runs whose
 * ingredients are resolved recursively; the surplus of the last run goes back into the pool.
 */
export function aggregate(input: AggregationInput): AggregationResult {
  const available = new Map(input.owned)
  const gatherRequired = new Map<number, number>()
  const craftRequired = new Map<number, number>()
  const craftRuns = new Map<number, number>()
  const warnings: AggregationResult['warnings'] = []
  const recipesById = new Map<number, AggregationRecipe>()
  for (const recipe of input.recipesByOutputItem.values()) recipesById.set(recipe.id, recipe)

  const perTarget: TargetAllocation[] = []

  for (const target of input.targets) {
    const allocated = new Map<number, number>()
    const allocatedLeaf = new Map<number, number>()

    const resolve = (itemId: number, need: number, mode: AggregationRequirement['mode'], path: number[]): void => {
      const take = Math.min(available.get(itemId) ?? 0, need)
      available.set(itemId, (available.get(itemId) ?? 0) - take)
      add(allocated, itemId, take)
      const remaining = need - take

      const recipe = input.recipesByOutputItem.get(itemId)
      if (mode === 'craft' && recipe) {
        if (path.includes(itemId)) {
          warnings.push({ code: 'CYCLE_GUARD', path: [...path, itemId] })
        } else {
          add(craftRequired, itemId, need)
          if (remaining === 0) return
          const runs = Math.ceil(remaining / recipe.outputQty)
          add(craftRuns, recipe.id, runs)
          add(available, itemId, runs * recipe.outputQty - remaining)
          for (const ingredient of recipe.ingredients) {
            resolve(ingredient.itemId, ingredient.qty * runs, ingredient.mode, [...path, itemId])
          }
          return
        }
      }

      add(gatherRequired, itemId, need)
      add(allocatedLeaf, itemId, take)
    }

    const recipe = target.kind === 'recipe' && target.recipeId !== undefined ? recipesById.get(target.recipeId) : undefined
    const runs = recipe ? Math.ceil(target.targetQty / recipe.outputQty) : 1
    const requirements = target.requirements.map((requirement) => ({ ...requirement, qty: requirement.qty * runs }))

    for (const requirement of requirements) resolve(requirement.itemId, requirement.qty, requirement.mode, [])

    perTarget.push({
      targetId: target.id,
      rows: requirements.map((requirement) => {
        const got = allocated.get(requirement.itemId) ?? 0
        return {
          itemId: requirement.itemId,
          need: requirement.qty,
          allocated: Math.min(got, requirement.qty),
          missing: Math.max(0, requirement.qty - got),
        }
      }),
      leafRows: [...allocatedLeaf].map(([itemId, got]) => ({ itemId, allocated: got })),
    })
  }

  const owned = (itemId: number): number => input.owned.get(itemId) ?? 0

  const items: GatheringRow[] = [...gatherRequired]
    .map(([itemId, required]) => ({
      itemId,
      required,
      owned: owned(itemId),
      missing: Math.max(0, required - owned(itemId)),
    }))
    .sort((a, b) => a.itemId - b.itemId)

  const craftPlan: CraftPlanRow[] = []
  for (const [itemId, required] of craftRequired) {
    const recipe = input.recipesByOutputItem.get(itemId)
    const runs = recipe ? (craftRuns.get(recipe.id) ?? 0) : 0
    if (recipe && runs > 0) craftPlan.push({ recipeId: recipe.id, outputItemId: itemId, runs, required, owned: owned(itemId) })
  }
  craftPlan.sort((a, b) => a.recipeId - b.recipeId)

  return {
    items,
    craftPlan,
    perTarget,
    overall: {
      owned: items.reduce((sum, row) => sum + Math.min(row.owned, row.required), 0),
      required: items.reduce((sum, row) => sum + row.required, 0),
    },
    warnings,
  }
}

