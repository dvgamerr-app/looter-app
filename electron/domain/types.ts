// Pure domain types. This module must not import `electron` or `better-sqlite3` (enforced by ESLint).

export type ItemCategory = 'material' | 'equipment' | 'consumable' | 'quest' | 'other'

/** `craft` expands through the ingredient's own recipe; `gather` always counts it as a raw material. */
export type Mode = 'craft' | 'gather'

export type TrackingKind = 'quest' | 'recipe'

export interface AggregationRequirement {
  itemId: number
  qty: number
  mode: Mode
}

export interface AggregationTarget {
  /** tracking_target.id */
  id: number
  kind: TrackingKind
  priority: number
  questId?: number
  recipeId?: number
  /** 1 for quests. */
  targetQty: number
  /** Quest: quest_requirement rows. Recipe: ingredients (not yet multiplied by runs). */
  requirements: AggregationRequirement[]
}

export interface AggregationRecipe {
  id: number
  outputItemId: number
  outputQty: number
  ingredients: AggregationRequirement[]
}

export interface AggregationInput {
  /** Sorted by priority. */
  targets: AggregationTarget[]
  recipesByOutputItem: Map<number, AggregationRecipe>
  /** item_id -> inventory.owned (a missing row means 0). */
  owned: Map<number, number>
}

export interface GatheringRow {
  itemId: number
  required: number
  owned: number
  missing: number
}

/** Only rows with runs > 0. */
export interface CraftPlanRow {
  recipeId: number
  outputItemId: number
  runs: number
  required: number
  owned: number
}

export interface TargetAllocation {
  targetId: number
  /** Direct requirements of the target; missing = need - allocated. */
  rows: Array<{ itemId: number; need: number; allocated: number; missing: number }>
  /** Raw materials allocated to this target (expanded view). */
  leafRows: Array<{ itemId: number; allocated: number }>
}

export interface AggregationResult {
  items: GatheringRow[]
  craftPlan: CraftPlanRow[]
  perTarget: TargetAllocation[]
  /** Sum of min(owned, required) and sum of required. */
  overall: { owned: number; required: number }
  warnings: Array<{ code: 'CYCLE_GUARD'; path: number[] }>
}
