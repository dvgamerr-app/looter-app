import { computed, ref } from 'vue'
import type { IpcResult, Preferences, SettingsState, SettingsUpdate } from '../../electron/ipc/contracts'

const settings = ref<SettingsState | null>(null)

let loading: Promise<void> | null = null

/** Loads the settings once and keeps them in sync with `settings:changed` pushes. */
export function loadSettings(): Promise<void> {
  loading ??= (async () => {
    window.api.on('settings:changed', (state) => {
      settings.value = state
    })
    const result = await window.api.settings.get()
    if (result.ok) settings.value = result.data
  })()
  return loading
}

export function useSettings() {
  async function update(patch: SettingsUpdate): Promise<IpcResult<SettingsState>> {
    const result = await window.api.settings.update(patch)
    if (result.ok) settings.value = result.data
    return result
  }

  return {
    settings,
    sidebarCollapsed: computed(() => settings.value?.preferences.sidebarCollapsed ?? false),
    update,
    updatePreferences: (preferences: Partial<Preferences>) => update({ preferences }),
  }
}
