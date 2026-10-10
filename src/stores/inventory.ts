import { ref } from 'vue'
import { useToasts } from './toasts'

/** The + and − step shared by every list on screen. It is screen state and is not saved (F7-R4). */
export const step = ref(1)

/** Manual inventory commands. The new counts arrive back through `inventory:changed`. */
export function useInventory() {
  const toasts = useToasts()

  async function adjust(itemId: number, delta: number): Promise<void> {
    const result = await window.api.inventory.adjust({ itemId, delta })
    if (!result.ok) toasts.error(result.error.message)
  }

  /** NaN means the field already rejected the text; the field shows the previous number again. */
  async function set(itemId: number, owned: number): Promise<boolean> {
    if (Number.isNaN(owned)) {
      toasts.error('ค่าไม่ถูกต้อง ใส่จำนวนเต็ม 0 ถึง 999,999')
      return false
    }
    const result = await window.api.inventory.set({ itemId, owned })
    if (!result.ok) toasts.error(result.error.message)
    return result.ok
  }

  return { step, adjust, set }
}
