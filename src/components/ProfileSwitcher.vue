<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateTime, initialOf } from '../format'
import { openCreateProfile } from '../stores/profile-dialogs'
import { useProfiles } from '../stores/profiles'
import { useToasts } from '../stores/toasts'
import AppIcon from './AppIcon.vue'

const profiles = useProfiles()
const toasts = useToasts()
const router = useRouter()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menuId = useId()

async function choose(id: number): Promise<void> {
  open.value = false
  if (id === profiles.state.activeProfileId) return
  const result = await profiles.switchTo(id)
  if (!result.ok) toasts.error(result.error.message)
}

function create(): void {
  open.value = false
  openCreateProfile()
}

function manage(): void {
  open.value = false
  void router.push({ name: 'settings', query: { section: 'profiles' } })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'p') {
    event.preventDefault()
    open.value = !open.value
  } else if (event.key === 'Escape') {
    open.value = false
  }
}

function onPointerDown(event: PointerEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      type="button"
      class="flex h-8 max-w-64 items-center gap-2 rounded-md bg-surface-2 px-2 hover:bg-surface-3"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="menuId"
      title="เลือก Game Profile (Ctrl+P)"
      @click="open = !open"
    >
      <span
        class="grid size-5 place-items-center rounded-sm bg-surface-3 text-caption font-bold"
        aria-hidden="true"
      >
        {{ profiles.activeProfile.value ? initialOf(profiles.activeProfile.value.name) : '+' }}
      </span>
      <span class="truncate">{{ profiles.activeProfile.value?.name ?? 'ยังไม่มี Profile' }}</span>
      <AppIcon
        name="chevronDown"
        :size="16"
      />
    </button>

    <ul
      v-if="open"
      :id="menuId"
      role="menu"
      class="absolute top-full left-0 z-40 mt-1 w-64 rounded-md border border-border bg-surface-1 py-1 shadow-lg"
    >
      <li
        v-for="profile in profiles.state.profiles"
        :key="profile.id"
        role="none"
      >
        <button
          type="button"
          role="menuitemradio"
          :aria-checked="profile.id === profiles.state.activeProfileId"
          class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-3"
          @click="choose(profile.id)"
        >
          <span class="w-4 text-accent-text">
            <AppIcon
              v-if="profile.id === profiles.state.activeProfileId"
              name="check"
              :size="16"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ profile.name }}</span>
            <span class="text-caption text-text-muted">{{ formatDateTime(profile.lastOpenedAt) }}</span>
          </span>
        </button>
      </li>
      <li
        role="separator"
        class="my-1 border-t border-border"
      />
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="w-full px-3 py-1.5 text-left hover:bg-surface-3"
          @click="create"
        >
          สร้าง Profile ใหม่…
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="w-full px-3 py-1.5 text-left hover:bg-surface-3"
          @click="manage"
        >
          จัดการ Profile…
        </button>
      </li>
    </ul>
  </div>
</template>
