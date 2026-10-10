import { screen } from 'electron'
import type { Bounds } from '../ipc/contracts'

const MIN_VISIBLE_WIDTH = 100
const MIN_VISIBLE_HEIGHT = 40

/**
 * True when enough of the rectangle lies on a display that is currently connected. A saved position
 * from a disconnected monitor (or from a backup made on another machine) is therefore ignored (F12-R11).
 */
export function isBoundsVisible(bounds: Bounds): boolean {
  return screen.getAllDisplays().some(({ workArea }) => {
    const width = Math.min(bounds.x + bounds.width, workArea.x + workArea.width) - Math.max(bounds.x, workArea.x)
    const height = Math.min(bounds.y + bounds.height, workArea.y + workArea.height) - Math.max(bounds.y, workArea.y)
    return width >= MIN_VISIBLE_WIDTH && height >= MIN_VISIBLE_HEIGHT
  })
}
