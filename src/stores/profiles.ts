import { computed, reactive } from 'vue'
import type { IpcResult, ProfileDeleteSummary, ProfileDto, ProfileList } from '../../electron/ipc/contracts'

const state = reactive<{ ready: boolean; activeProfileId: number | null; profiles: ProfileDto[] }>({
  ready: false,
  activeProfileId: null,
  profiles: [],
})

let loading: Promise<void> | null = null

function apply(list: ProfileList): void {
  state.activeProfileId = list.activeProfileId
  state.profiles = list.profiles
  state.ready = true
}

/** Applies the new list on success and passes the result through so callers can show field errors. */
async function mutate(call: Promise<IpcResult<ProfileList>>): Promise<IpcResult<ProfileList>> {
  const result = await call
  if (result.ok) apply(result.data)
  return result
}

/** Loads the profiles once and keeps them in sync with `profile:changed` pushes (F1-R4). */
export function loadProfiles(): Promise<void> {
  loading ??= (async () => {
    window.api.on('profile:changed', apply)
    const result = await window.api.profiles.list()
    if (result.ok) apply(result.data)
  })()
  return loading
}

export function useProfiles() {
  return {
    state,
    activeProfile: computed(() => state.profiles.find((profile) => profile.id === state.activeProfileId) ?? null),
    create: (name: string) => mutate(window.api.profiles.create({ name })),
    rename: (id: number, name: string) => mutate(window.api.profiles.rename({ id, name })),
    remove: (id: number) => mutate(window.api.profiles.delete({ id })),
    switchTo: (id: number) => mutate(window.api.profiles.switch({ id })),
    getDeleteSummary: (id: number): Promise<IpcResult<ProfileDeleteSummary>> =>
      window.api.profiles.getDeleteSummary({ id }),
  }
}
