<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navItems } from '../navigation'
import { useProfiles } from '../stores/profiles'
import AppSidebar from './AppSidebar.vue'
import AppTitleBar from './AppTitleBar.vue'
import CaptureHost from './CaptureHost.vue'
import ProfileDeleteDialog from './ProfileDeleteDialog.vue'
import ProfileNameDialog from './ProfileNameDialog.vue'
import ToastStack from './ToastStack.vue'

const router = useRouter()
const route = useRoute()
const profiles = useProfiles()

// Ctrl+1 to Ctrl+6 jump to the six screens; pages that need a profile are skipped until one exists.
function onKeydown(event: KeyboardEvent): void {
  if (!event.ctrlKey || event.shiftKey || event.altKey) return
  const item = navItems.find((candidate) => String(candidate.shortcut) === event.key)
  if (!item) return
  event.preventDefault()
  if (item.needsProfile && profiles.state.activeProfileId === null) return
  void router.push({ name: item.name })
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// Deleting the last profile while on a profile page returns to the dashboard onboarding (F1-R10).
watch(
  () => profiles.state.activeProfileId,
  (id) => {
    if (id === null && route.meta.needsProfile) void router.replace({ name: 'dashboard' })
  },
)
</script>

<template>
  <AppTitleBar />
  <AppSidebar />
  <main class="min-h-0 overflow-auto [grid-area:desktop]">
    <RouterView />
  </main>
  <ToastStack />
  <ProfileNameDialog />
  <ProfileDeleteDialog />
  <CaptureHost />
</template>
