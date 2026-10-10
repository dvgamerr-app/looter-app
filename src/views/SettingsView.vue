<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AppInfo } from '../../electron/ipc/contracts'
import EmptyState from '../components/EmptyState.vue'
import HotkeysSection from '../components/HotkeysSection.vue'
import OverlaySection from '../components/OverlaySection.vue'
import ProfileTable from '../components/ProfileTable.vue'
import { useToasts } from '../stores/toasts'

interface Section {
  id: string
  label: string
  /** Phase that delivers the section; omitted when it already works. */
  phase?: number
}

const sections: Section[] = [
  { id: 'hotkeys', label: 'Hotkeys' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'backup', label: 'Backup & Data', phase: 5 },
  { id: 'profiles', label: 'Profiles' },
  { id: 'about', label: 'About' },
]

const route = useRoute()
const router = useRouter()
const toasts = useToasts()

const current = computed(() => sections.find((section) => section.id === route.query.section) ?? sections[3]!)

function select(id: string): void {
  void router.replace({ name: 'settings', query: { section: id } })
}

const info = ref<AppInfo | null>(null)
onMounted(async () => {
  const result = await window.api.app.getInfo()
  if (result.ok) info.value = result.data
})

async function openDataFolder(): Promise<void> {
  const result = await window.api.app.openDataFolder()
  if (!result.ok) toasts.error(result.error.message)
}

const aboutRows = computed(() =>
  info.value
    ? ([
        ['แอป', `${info.value.name} ${info.value.version}`],
        ['Electron', info.value.electron],
        ['Chromium', info.value.chromium],
        ['Node.js', info.value.node],
        ['Schema version', String(info.value.schemaVersion)],
        ['ตำแหน่งข้อมูล', info.value.dataPath],
      ] as const)
    : [],
)
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

      <HotkeysSection v-if="current.id === 'hotkeys'" />

      <OverlaySection v-else-if="current.id === 'overlay'" />

      <ProfileTable v-else-if="current.id === 'profiles'" />

      <div
        v-else-if="current.id === 'about'"
        class="flex flex-col gap-4"
      >
        <dl class="grid max-w-xl grid-cols-[10rem_1fr] gap-x-4 gap-y-2">
          <template
            v-for="[label, value] in aboutRows"
            :key="label"
          >
            <dt class="text-text-muted">
              {{ label }}
            </dt>
            <dd class="font-numeric break-all select-text">
              {{ value }}
            </dd>
          </template>
        </dl>
        <div>
          <button
            type="button"
            class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
            @click="openDataFolder"
          >
            เปิดโฟลเดอร์ข้อมูล
          </button>
        </div>
        <p class="text-text-muted">
          การตรวจสอบอัปเดตยังไม่เปิดใช้ใน Phase 1
        </p>
      </div>

      <EmptyState
        v-else
        title="ยังไม่เปิดให้ใช้งาน"
        :description="`หมวด ${current.label} จะพร้อมใช้งานใน Phase ${current.phase}`"
      />
    </section>
  </div>
</template>
