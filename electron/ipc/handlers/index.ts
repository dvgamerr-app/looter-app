import type { HotkeyManager } from '../../hotkeys/hotkey-manager'
import type { OverlayController } from '../../windows/overlay-window'
import type { AppContext } from '../context'
import { registerUnimplementedChannels } from '../register'
import { registerAppHandlers } from './app'
import { registerCaptureHandlers } from './capture'
import { registerGatheringHandlers } from './gathering'
import { registerInventoryHandlers } from './inventory'
import { registerItemHandlers } from './items'
import { registerOverlayHandlers } from './overlay'
import { registerProfileHandlers } from './profiles'
import { registerQuestHandlers } from './quests'
import { registerRecipeHandlers } from './recipes'
import { registerSettingsHandlers } from './settings'
import { registerTrackingHandlers } from './tracking'

export interface HandlerServices {
  hotkeys: HotkeyManager
  overlay: OverlayController
}

/** Registers every handler built so far; the rest of the contract answers "not supported yet". */
export function registerIpcHandlers(context: AppContext, services: HandlerServices): void {
  registerProfileHandlers(context, services.overlay)
  registerSettingsHandlers(context, services.hotkeys)
  registerAppHandlers(context)
  registerItemHandlers(context)
  registerRecipeHandlers(context)
  registerQuestHandlers(context)
  registerTrackingHandlers(context, services.overlay)
  registerInventoryHandlers(context)
  registerGatheringHandlers(context)
  registerCaptureHandlers(context)
  registerOverlayHandlers(services.overlay)
  registerUnimplementedChannels()
}
