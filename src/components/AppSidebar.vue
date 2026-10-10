<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { navItems } from '../navigation'
import { useProfiles } from '../stores/profiles'
import { useSettings } from '../stores/settings'
import AppIcon from './AppIcon.vue'

const NARROW_WINDOW_PX = 1100

const profiles = useProfiles()
const settings = useSettings()

const narrow = ref(window.innerWidth < NARROW_WINDOW_PX)
const onResize = (): void => {
  narrow.value = window.innerWidth < NARROW_WINDOW_PX
}
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

// The sidebar also collapses on its own when the window is narrow (UI/UX Design Plan 10.1).
const collapsed = computed(() => settings.sidebarCollapsed.value || narrow.value)
const hasProfile = computed(() => profiles.state.activeProfileId !== null)
</script>

<template>
  <nav
    class="flex flex-col gap-1 border-r border-border bg-surface-1 p-2 [grid-area:sidebar]"
    :class="collapsed ? 'w-(--size-sidebar-collapsed)' : 'w-(--size-sidebar)'"
    aria-label="เมนูหลัก"
  >
    <template
      v-for="item in navItems"
      :key="item.name"
    >
      <span
        v-if="item.needsProfile && !hasProfile"
        class="flex h-10 items-center gap-3 rounded-md px-3 text-text-muted opacity-40"
        aria-disabled="true"
        title="สร้าง Game Profile ก่อน"
      >
        <AppIcon
          :name="item.icon"
          :size="24"
        />
        <span v-if="!collapsed">{{ item.label }}</span>
      </span>
      <RouterLink
        v-else
        :to="{ name: item.name }"
        class="flex h-10 items-center gap-3 rounded-md px-3 text-text-muted hover:bg-surface-3 hover:text-text"
        active-class="bg-surface-3 !text-text"
        :title="`${item.label} (Ctrl+${item.shortcut})`"
      >
        <AppIcon
          :name="item.icon"
          :size="24"
        />
        <span v-if="!collapsed">{{ item.label }}</span>
        <span
          v-else
          class="sr-only"
        >{{ item.label }}</span>
      </RouterLink>
    </template>

    <button
      type="button"
      class="mt-auto flex h-10 items-center gap-3 rounded-md px-3 text-text-muted hover:bg-surface-3 hover:text-text disabled:opacity-40"
      :disabled="narrow"
      :aria-label="collapsed ? 'ขยายเมนู' : 'ยุบเมนู'"
      @click="settings.updatePreferences({ sidebarCollapsed: !settings.sidebarCollapsed.value })"
    >
      <AppIcon
        :name="collapsed ? 'chevronRight' : 'chevronLeft'"
        :size="24"
      />
      <span v-if="!collapsed">ยุบเมนู</span>
    </button>
  </nav>
</template>
