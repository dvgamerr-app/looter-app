<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProfileDeleteSummary } from '../../electron/ipc/contracts'
import { profileDialogs } from '../stores/profile-dialogs'
import { useProfiles } from '../stores/profiles'
import { useToasts } from '../stores/toasts'
import ConfirmDialog from './ConfirmDialog.vue'

const profiles = useProfiles()
const toasts = useToasts()

const summary = ref<ProfileDeleteSummary | null>(null)
const busy = ref(false)

const state = computed(() => profileDialogs.remove)

// The summary is read from the main process each time the dialog opens, so the numbers are current (F1-R8).
watch(
  () => state.value.open,
  async (open) => {
    summary.value = null
    const profile = state.value.profile
    if (!open || !profile) return
    const result = await profiles.getDeleteSummary(profile.id)
    if (result.ok) summary.value = result.data
    else {
      toasts.error(result.error.message)
      close()
    }
  },
)

const counts = computed(() => {
  const data = summary.value
  if (!data) return ''
  return `${data.items} Items, ${data.recipes} Recipes, ${data.quests} Quests, ${data.targets} Tracking Targets และไฟล์ภาพ ${data.imageFiles} ไฟล์`
})

function close(): void {
  profileDialogs.remove.open = false
}

async function confirm(): Promise<void> {
  const profile = state.value.profile
  if (!profile || busy.value) return
  busy.value = true
  const result = await profiles.remove(profile.id)
  busy.value = false
  if (result.ok) toasts.success(`ลบ “${profile.name}” แล้ว`)
  else toasts.error(result.error.message)
  close()
}
</script>

<template>
  <ConfirmDialog
    :open="state.open && summary !== null"
    title="ลบ Game Profile"
    confirm-label="ลบถาวร"
    destructive
    :require-text="summary?.name"
    :busy="busy"
    @confirm="confirm"
    @cancel="close"
  >
    <p>จะลบ “{{ summary?.name }}” พร้อมข้อมูลทั้งหมด: {{ counts }}</p>
    <p>การลบเป็นการถาวร และกู้คืนไม่ได้นอกจากจะมี Backup</p>
  </ConfirmDialog>
</template>
