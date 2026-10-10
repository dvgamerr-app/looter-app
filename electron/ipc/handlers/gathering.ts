import type { AppContext } from '../context'
import { handle } from '../register'

export function registerGatheringHandlers({ gathering }: AppContext): void {
  handle('gathering:get', () => gathering.get())
}
