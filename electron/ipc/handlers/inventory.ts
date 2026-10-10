import type { InventoryPlan } from '../contracts'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { handle } from '../register'
import { parseBoolean, parseCount, parseId, parseOwned, requireRecord } from '../validate'

export function registerInventoryHandlers(context: AppContext): void {
  const { db, repos, notify } = context

  const flag = (value: unknown, label: string): boolean => (value === undefined ? false : parseBoolean(value, label))

  /** Rows that changed, in the shape of the `inventory:changed` event. */
  const changesOf = (plan: InventoryPlan): Array<{ itemId: number; owned: number }> =>
    [...plan.rows, ...(plan.output ? [plan.output] : [])].map((row) => ({ itemId: row.itemId, owned: row.after }))

  handle('inventory:adjust', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const itemId = parseId(body.itemId, 'Item')
    if (typeof body.delta !== 'number' || !Number.isSafeInteger(body.delta)) {
      throw new AppError('VALIDATION', 'ค่าที่ปรับต้องเป็นจำนวนเต็ม', { field: 'delta' })
    }
    const owned = repos.inventory.adjust(profileId, itemId, body.delta)
    notify.inventory(profileId, [{ itemId, owned }])
    return { itemId, owned }
  })

  handle('inventory:set', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const itemId = parseId(body.itemId, 'Item')
    const owned = repos.inventory.set(profileId, itemId, parseOwned(body.owned))
    notify.inventory(profileId, [{ itemId, owned }])
    return { itemId, owned }
  })

  // Deducts a quest's requirements; optionally completes the quest in the same transaction (F8-R7).
  handle('inventory:consume', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const questId = parseId(body.questId, 'Quest')
    if (flag(body.dryRun, 'dryRun')) return repos.inventory.planConsume(profileId, questId)

    const complete = flag(body.completeQuest, 'completeQuest')
    const plan = db.transaction(() => {
      const done = repos.inventory.consume(profileId, questId)
      if (complete && done.questStatus !== 'completed') repos.quests.setStatus(profileId, questId, 'completed')
      return done
    })()
    notify.inventory(profileId, changesOf(plan))
    if (complete) {
      notify.quests(profileId, [questId])
      notify.tracking(profileId)
    }
    return plan
  })

  // Deducts ingredients x runs and adds the output; optionally lowers the recipe's target (F8-R11).
  handle('inventory:craft', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const recipeId = parseId(body.recipeId, 'Recipe')
    const runs = parseCount(body.runs, 'จำนวนรอบ')
    if (flag(body.dryRun, 'dryRun')) return repos.inventory.planCraft(profileId, recipeId, runs)

    const reduce = flag(body.reduceTarget, 'reduceTarget')
    const recipe = repos.recipes.get(profileId, recipeId)[0]
    const plan = db.transaction(() => {
      const done = repos.inventory.craft(profileId, recipeId, runs)
      if (reduce && recipe) repos.tracking.reduceRecipeTarget(profileId, recipeId, recipe.outputQty * runs)
      return done
    })()
    notify.inventory(profileId, changesOf(plan))
    if (reduce) notify.tracking(profileId)
    return plan
  })
}
