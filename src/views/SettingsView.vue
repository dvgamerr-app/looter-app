<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AboutSection from '../components/AboutSection.vue'
import BackupPanel from '../components/BackupPanel.vue'
import HotkeysSection from '../components/HotkeysSection.vue'
import OverlaySection from '../components/OverlaySection.vue'
import ProfileTable from '../components/ProfileTable.vue'

const sections = [
  { id: 'hotkeys', label: 'Hotkeys', component: HotkeysSection },
  { id: 'overlay', label: 'Overlay', component: OverlaySection },
  { id: 'backup', label: 'Backup & Data', component: BackupPanel },
  { id: 'profiles', label: 'Profiles', component: ProfileTable },
  { id: 'about', label: 'About', component: AboutSection },
] as const

const route = useRoute()
const router = useRouter()

const current = computed(() => sections.find((section) => section.id === route.query.section) ?? sections[3])

function select(id: string): void {
  void router.replace({ name: 'settings', query: { section: id } })
}
</script>

<template>
  <div class="flex h-full">
    <nav
      class="w-45 shrink-0 border-r border-border p-3"
      aria-label="หมวดการตั้งค่า"
    >
      <h1 class="mb-3 px-2 text-heading font-bold">
        Settings
      </h1>
      <ul class="flex flex-col gap-1">
        <li
          v-for="section in sections"
          :key="section.id"
        >
          <button
            type="button"
            class="h-(--size-hit) w-full rounded-md px-2 text-left hover:bg-surface-3"
            :class="section.id === current.id ? 'bg-surface-3 font-medium' : 'text-text-muted'"
            :aria-current="section.id === current.id ? 'page' : undefined"
            @click="select(section.id)"
          >
            {{ section.label }}
          </button>
        </li>
      </ul>
    </nav>

    <section
      class="min-w-0 flex-1 overflow-auto p-6"
      :aria-labelledby="`section-${current.id}`"
    >
      <h2
        :id="`section-${current.id}`"
        class="mb-4 text-heading font-bold"
      >
        {{ current.label }}
      </h2>
      <component :is="current.component" />
    </section>
  </div>
</template>
