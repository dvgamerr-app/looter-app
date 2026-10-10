<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AppInfo } from '../../electron/ipc/contracts'

const info = ref<AppInfo | null>(null)
onMounted(async () => {
  const result = await window.api.app.getInfo()
  if (result.ok) info.value = result.data
})

const rows = computed(() =>
  info.value
    ? ([
        ['แอป', `${info.value.name} ${info.value.version}`],
        ['Electron', info.value.electron],
        ['Chromium', info.value.chromium],
        ['Node.js', info.value.node],
        ['Schema version', String(info.value.schemaVersion)],
        ['ตำแหน่งข้อมูล', info.value.dataPath],
        ['License', 'MIT'],
      ] as const)
    : [],
)

const links = [
  { label: 'Product page', href: 'https://dvgamerr.app/looter-app' },
  { label: 'Releases และ Changelog', href: 'https://github.com/dvgamerr-app/looter-app/releases' },
  { label: 'Discord', href: 'https://discord.gg/QDccF497Mw' },
]
</script>

<template>
  <div class="flex max-w-xl flex-col gap-4">
    <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2">
      <template
        v-for="[label, value] in rows"
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

    <ul class="flex flex-col gap-1">
      <li
        v-for="link in links"
        :key="link.href"
      >
        <a
          :href="link.href"
          class="text-accent-text underline"
          target="_blank"
          rel="noopener"
        >{{ link.label }}</a>
      </li>
    </ul>

    <p class="text-text-muted">
      การตรวจสอบอัปเดตยังไม่เปิดใช้: ดาวน์โหลดเวอร์ชันใหม่ด้วยตนเองจากหน้า Releases
    </p>
  </div>
</template>
