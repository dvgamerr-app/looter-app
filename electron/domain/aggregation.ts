import type { AggregationInput, AggregationResult } from './types'

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

/**
 * Skeleton for the material aggregation of Data Model section 7. Phase 1 only fixes the signature and
 * returns an empty result; the algorithm lands with the Gathering List in Phase 2 (P2-14).
 */
export function aggregate(input: AggregationInput): AggregationResult {
  void input
  return { items: [], craftPlan: [], perTarget: [], overall: { owned: 0, required: 0 }, warnings: [] }
}
