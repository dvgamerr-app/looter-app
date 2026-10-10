<script setup lang="ts">
import { liveMessage } from '../stores/announcer'
import AppIcon from './AppIcon.vue'
import ProfileSwitcher from './ProfileSwitcher.vue'
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
        disabled
        class="flex h-8 items-center gap-2 rounded-md px-2 text-text-muted opacity-50"
        title="Capture จะพร้อมใช้งานใน Phase 4"
      >
        <AppIcon
          name="capture"
          :size="16"
        />
        Capture
      </button>
      <button
        type="button"
        disabled
        class="flex h-8 items-center gap-2 rounded-md px-2 text-text-muted opacity-50"
        title="Overlay จะพร้อมใช้งานใน Phase 3"
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
