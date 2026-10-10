import { computed, ref, shallowRef } from 'vue'
import type { GatheringResult } from '../../electron/ipc/contracts'

const EMPTY: GatheringResult = { items: [], craftPlan: [], perTarget: [], overall: { owned: 0, required: 0 }, warnings: [] }

const result = shallowRef<GatheringResult>(EMPTY)
const loaded = ref(false)
let started = false

/**
 * The gathering list computed by the main process. The renderer only displays the latest payload:
 * it never recalculates anything (F6-R13).
 */
export function useGathering() {
  if (!started) {
    started = true
    window.api.on('gathering:changed', (payload) => {
      result.value = payload
      loaded.value = true
    })
    window.api.on('profile:changed', () => {
      result.value = EMPTY
      loaded.value = false
    })
    void window.api.gathering.get().then((response) => {
      if (response.ok) {
        result.value = response.data
        loaded.value = true
      }
    })
  }
  return {
    result,
    loaded,
    allocationOf: (targetId: number) => computed(() => result.value.perTarget.find((entry) => entry.targetId === targetId)),
  }
}
