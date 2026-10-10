import type { AppContext } from '../context'
import { registerUnimplementedChannels } from '../register'
import { registerAppHandlers } from './app'
import { registerCaptureHandlers } from './capture'
import { registerGatheringHandlers } from './gathering'
import { registerInventoryHandlers } from './inventory'
import { registerItemHandlers } from './items'
import { registerProfileHandlers } from './profiles'
import { registerQuestHandlers } from './quests'
import { registerRecipeHandlers } from './recipes'
import { registerSettingsHandlers } from './settings'
import { registerTrackingHandlers } from './tracking'

/** Registers every handler built so far; the rest of the contract answers "not supported yet". */
export function registerIpcHandlers(context: AppContext): void {
  registerProfileHandlers(context)
  registerSettingsHandlers(context)
  registerAppHandlers(context)
  registerItemHandlers(context)
  registerRecipeHandlers(context)
  registerQuestHandlers(context)
  registerTrackingHandlers(context)
  registerInventoryHandlers(context)
  registerGatheringHandlers(context)
  registerCaptureHandlers(context)
  registerUnimplementedChannels()
}
