import { reactive } from 'vue'
import type { ProfileDto } from '../../electron/ipc/contracts'

// One shared create/rename dialog and one delete dialog live in AppShell. Any screen opens them
// through these functions instead of keeping its own copy.
export const profileDialogs = reactive<{
  name: { open: boolean; mode: 'create' | 'rename'; profile: ProfileDto | null }
  remove: { open: boolean; profile: ProfileDto | null }
}>({
  name: { open: false, mode: 'create', profile: null },
  remove: { open: false, profile: null },
})

export function openCreateProfile(): void {
  profileDialogs.name = { open: true, mode: 'create', profile: null }
}

export function openRenameProfile(profile: ProfileDto): void {
  profileDialogs.name = { open: true, mode: 'rename', profile }
}

export function openDeleteProfile(profile: ProfileDto): void {
  profileDialogs.remove = { open: true, profile }
}
