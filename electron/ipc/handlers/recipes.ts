import { aggregate } from '../../domain/aggregation'
import { expandRecipeTree } from '../../domain/expand'
import type { RecipeDraft } from '../../database/repositories/recipe'
import type { AppContext } from '../context'
import { requireActiveProfile } from '../context'
import { AppError } from '../errors'
import { toRecipeDtos } from '../mappers'
import { handle } from '../register'
import { parseCount, parseId, parseIngredients, parseNotes, requireRecord } from '../validate'

function parseDraft(body: Record<string, unknown>): RecipeDraft {
  return {
    outputItemId: parseId(body.outputItemId, 'Item ปลายทาง'),
    outputQty: body.outputQty === undefined ? 1 : parseCount(body.outputQty, 'จำนวนที่ได้ต่อรอบ'),
    station: parseNotes(body.station) ?? null,
    notes: parseNotes(body.notes) ?? null,
    ingredients: body.ingredients === undefined ? [] : parseIngredients(body.ingredients),
  }
}

export function registerRecipeHandlers(context: AppContext): void {
  const { repos, notify } = context

  const load = (profileId: number, recipeId: number) => {
    const [recipe] = toRecipeDtos(repos.recipes.get(profileId, recipeId), repos.tracking.listAll(profileId))
    if (!recipe) throw new AppError('NOT_FOUND', 'ไม่พบ Recipe')
    return recipe
  }

  handle('recipes:list', () => {
    const profileId = requireActiveProfile(context)
    return toRecipeDtos(repos.recipes.list(profileId), repos.tracking.listAll(profileId))
  })

  handle('recipes:get', (request) => load(requireActiveProfile(context), parseId(requireRecord(request).id)))

  handle('recipes:create', (request) => {
    const profileId = requireActiveProfile(context)
    const id = repos.recipes.save(profileId, parseDraft(requireRecord(request)), null)
    notify.recipes(profileId, [id])
    notify.items(profileId)
    return load(profileId, id)
  })

  handle('recipes:update', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const id = parseId(body.id)
    repos.recipes.save(profileId, parseDraft(body), id)
    notify.recipes(profileId, [id])
    notify.items(profileId)
    return load(profileId, id)
  })

  handle('recipes:delete', (request) => {
    const profileId = requireActiveProfile(context)
    repos.recipes.delete(profileId, parseId(requireRecord(request).id))
    notify.recipes(profileId)
    notify.tracking(profileId)
    notify.items(profileId)
    return null
  })

  // Checks a draft while the user edits it, without writing anything (F3 step 4).
  handle('recipes:validate', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    repos.recipes.validate(profileId, parseDraft(body), body.id === undefined ? null : parseId(body.id))
    return { ok: true as const }
  })

  handle('recipes:expand', (request) => {
    const profileId = requireActiveProfile(context)
    const body = requireRecord(request)
    const recipeId = parseId(body.id)
    const quantity = parseCount(body.quantity, 'จำนวนชิ้น')
    const graph = repos.recipes.loadGraph(profileId)
    const recipe = [...graph.values()].find((entry) => entry.id === recipeId)
    if (!recipe) throw new AppError('NOT_FOUND', 'ไม่พบ Recipe')

    const expansion = expandRecipeTree(recipe, quantity, graph)
    // The same single-target algorithm as the Gathering List, with the real inventory (F3-R8).
    const net = aggregate({
      targets: [{ id: 0, kind: 'recipe', priority: 1, recipeId, targetQty: quantity, requirements: recipe.ingredients }],
      recipesByOutputItem: graph,
      owned: repos.inventory.ownedMap(profileId),
    })
    return { ...expansion, recipeId, quantity, net: { items: net.items, craftPlan: net.craftPlan, overall: net.overall } }
  })
}
