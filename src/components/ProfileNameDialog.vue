<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { profileDialogs } from '../stores/profile-dialogs'
import { useProfiles } from '../stores/profiles'
import { useToasts } from '../stores/toasts'
import BaseDialog from './BaseDialog.vue'

const profiles = useProfiles()
const toasts = useToasts()

const name = ref('')
const error = ref('')
const busy = ref(false)
const input = useTemplateRef<HTMLInputElement>('input')

const state = computed(() => profileDialogs.name)
const title = computed(() => (state.value.mode === 'create' ? 'สร้าง Game Profile' : 'เปลี่ยนชื่อ Game Profile'))

watch(
  () => state.value.open,
  async (open) => {
    if (!open) return
    name.value = state.value.mode === 'rename' ? (state.value.profile?.name ?? '') : ''
    error.value = ''
    await nextTick()
    input.value?.select()
  },
)

function close(): void {
  profileDialogs.name.open = false
}

async function submit(): Promise<void> {
  if (busy.value) return
  busy.value = true
  error.value = ''
  const { mode, profile } = state.value
  const result =
    mode === 'rename' && profile ? await profiles.rename(profile.id, name.value) : await profiles.create(name.value)
  busy.value = false
  if (result.ok) {
    toasts.success(mode === 'create' ? 'สร้าง Game Profile แล้ว' : 'เปลี่ยนชื่อแล้ว')
    close()
  } else {
    error.value = result.error.message
  }
}
</script>

<template>
  <BaseDialog
    :open="state.open"
    :title="title"
    @close="close"
  >
    <form
      class="flex flex-col gap-4"
      @submit.prevent="submit"
    >
      <label class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">ชื่อเกม</span>
        <input
          ref="input"
          v-model="name"
          type="text"
          maxlength="100"
          autocomplete="off"
          :aria-invalid="error !== ''"
          class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-3 text-text"
        >
        <span
          v-if="error"
          role="alert"
          class="text-caption text-status-missing"
        >{{ error }}</span>
      </label>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
          @click="close"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          :disabled="busy"
          class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        >
          บันทึก
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
