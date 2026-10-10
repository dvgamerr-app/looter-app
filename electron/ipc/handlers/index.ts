import type { AppContext } from '../context'
import { registerUnimplementedChannels } from '../register'
import { registerAppHandlers } from './app'
import { registerProfileHandlers } from './profiles'
import { registerSettingsHandlers } from './settings'

/** Registers every Phase 1 handler; the rest of the contract answers "not supported yet". */
export function registerIpcHandlers(context: AppContext): void {
  registerProfileHandlers(context)
  registerSettingsHandlers(context)
  registerAppHandlers(context)
  registerUnimplementedChannels()
}
