<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { liveMessage } from '../stores/announcer'
import { useProfiles } from '../stores/profiles'
import { useSettings } from '../stores/settings'
import { useToasts } from '../stores/toasts'
import AppIcon from './AppIcon.vue'
import ProfileSwitcher from './ProfileSwitcher.vue'

const profiles = useProfiles()
const { settings } = useSettings()
const toasts = useToasts()

// The button mirrors the overlay: pressed while it is on screen (UI/UX Design Plan 2.3).
const overlayVisible = ref(false)
void window.api.overlay.getState().then((result) => {
  if (result.ok) overlayVisible.value = result.data.visible
})
const stop = window.api.on('overlay:changed', (state) => {
  overlayVisible.value = state.visible
})
onBeforeUnmount(stop)

const hasProfile = computed(() => profiles.state.activeProfileId !== null)
const hotkey = computed(() => settings.value?.hotkeys.toggleOverlay ?? '')
const captureHotkey = computed(() => settings.value?.hotkeys.startCapture ?? '')

async function startCapture(): Promise<void> {
  const result = await window.api.capture.start()
  if (!result.ok) toasts.error(result.error.message)
}

async function toggleOverlay(): Promise<void> {
  const result = await window.api.overlay.toggle()
  if (!result.ok) toasts.error(result.error.message)
}
</script>

<template>
  <!-- The strip stops at the Windows caption buttons: titlebar-area-width excludes them (UI/UX Design Plan 2.1). -->
  <header class="[grid-area:title] border-b border-border bg-surface-1">
    <div class="drag-region flex h-full w-[env(titlebar-area-width,100%)] items-center gap-3 pl-3">
      <span class="font-bold whitespace-nowrap select-none">GameLooter</span>
      <ProfileSwitcher />
      <span class="flex-1" />
      <button
        type="button"
        :disabled="!hasProfile"
        class="flex h-8 items-center gap-2 rounded-md px-2 text-text-muted hover:bg-surface-3 disabled:opacity-50"
        :title="hasProfile ? `จับภาพ Item จากหน้าจอ${captureHotkey ? ` (${captureHotkey})` : ''}` : 'สร้าง Game Profile ก่อน'"
        @click="startCapture"
      >
        <AppIcon
          name="capture"
          :size="16"
        />
        Capture
      </button>
      <button
        type="button"
        :disabled="!hasProfile"
        class="flex h-8 items-center gap-2 rounded-md px-2 disabled:opacity-50"
        :class="overlayVisible ? 'bg-accent text-white' : 'text-text-muted hover:bg-surface-3'"
        :aria-pressed="overlayVisible"
        :title="hasProfile ? `แสดง/ซ่อน Overlay${hotkey ? ` (${hotkey})` : ''}` : 'สร้าง Game Profile ก่อน'"
        @click="toggleOverlay"
      >
        <AppIcon
          name="overlay"
          :size="16"
        />
        Overlay
      </button>
    </div>
    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ liveMessage }}
    </p>
  </header>
</template>

<style scoped>
.drag-region {
  -webkit-app-region: drag;
}
</style>
