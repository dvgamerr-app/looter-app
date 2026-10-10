import { ref, shallowRef } from 'vue'
import type { EventChannel, IpcResult } from '../../electron/ipc/contracts'

/**
 * A list that is loaded from the main process on first use and reloaded whenever one of `events` is
 * pushed. Reloads that arrive together collapse into one request. A profile switch empties the list
 * first so one game's data is never shown under another (F1-R4).
 */
export function createResource<T>(initial: T, fetcher: () => Promise<IpcResult<T>>, events: EventChannel[]) {
  const data = shallowRef<T>(initial)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  let started = false
  let queued = false

  async function reload(): Promise<void> {
    const result = await fetcher()
    if (result.ok) {
      data.value = result.data
      loaded.value = true
      error.value = null
    } else {
      error.value = result.error.message
    }
  }

  function scheduleReload(): void {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      void reload()
    })
  }

  /** Safe to call from every component that uses the list; only the first call subscribes. */
  function start(): void {
    if (started) return
    started = true
    for (const event of events) window.api.on(event, scheduleReload)
    window.api.on('profile:changed', () => {
      data.value = initial
      loaded.value = false
      scheduleReload()
    })
    void reload()
  }

  return { data, loaded, error, start, reload }
}
