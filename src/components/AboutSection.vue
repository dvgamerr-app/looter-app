<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AppInfo, UpdateInfo, UpdateProgress } from '../../electron/ipc/contracts'

const info = ref<AppInfo | null>(null)
onMounted(async () => {
  const result = await window.api.app.getInfo()
  if (result.ok) info.value = result.data
})

const update = ref<UpdateInfo | null>(null)
const checking = ref(false)
const updateError = ref('')

const progress = ref<UpdateProgress | null>(null)
const stopProgress = window.api.on('update:changed', (event) => {
  progress.value = event
})
onBeforeUnmount(stopProgress)

async function downloadUpdate(): Promise<void> {
  updateError.value = ''
  const result = await window.api.app.downloadUpdate()
  if (!result.ok) updateError.value = result.error.message
}

async function installUpdate(): Promise<void> {
  const result = await window.api.app.installUpdate()
  if (!result.ok) updateError.value = result.error.message
}

async function checkUpdate(): Promise<void> {
  checking.value = true
  updateError.value = ''
  const result = await window.api.app.checkUpdate()
  checking.value = false
  if (result.ok) update.value = result.data
  else updateError.value = result.error.message
}

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

    <section class="flex flex-col gap-2">
      <div>
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border disabled:opacity-40"
          :disabled="checking"
          @click="checkUpdate"
        >
          ตรวจสอบอัปเดต
        </button>
      </div>
      <p
        v-if="update"
        role="status"
      >
        <template v-if="update.latest === null">
          ยังไม่มีเวอร์ชันที่เผยแพร่บน GitHub
        </template>
        <template v-else-if="update.updateAvailable">
          มีเวอร์ชันใหม่ {{ update.latest }} (ตอนนี้ {{ update.current }}) ·
          <a
            :href="update.url"
            class="text-accent-text underline"
            target="_blank"
            rel="noopener"
          >ดูหน้า Release</a>
          <button
            v-if="progress?.phase !== 'downloading' && progress?.phase !== 'downloaded'"
            type="button"
            class="ml-2 h-8 rounded-md bg-accent px-3 font-medium text-white hover:bg-accent-hover"
            @click="downloadUpdate"
          >
            ดาวน์โหลดอัปเดต
          </button>
        </template>
        <template v-else>
          คุณใช้เวอร์ชันล่าสุดแล้ว ({{ update.current }})
        </template>
      </p>
      <p
        v-if="progress?.phase === 'downloading'"
        role="status"
      >
        กำลังดาวน์โหลด {{ progress.version }} … {{ progress.percent }}%
      </p>
      <div
        v-if="progress?.phase === 'downloaded'"
        class="flex items-center gap-2"
      >
        <span role="status">ดาวน์โหลด {{ progress.version }} เสร็จแล้ว</span>
        <button
          type="button"
          class="h-8 rounded-md bg-accent px-3 font-medium text-white hover:bg-accent-hover"
          @click="installUpdate"
        >
          ติดตั้งและเปิดแอปใหม่
        </button>
      </div>
      <p
        v-if="progress?.phase === 'error'"
        class="text-status-missing"
        role="alert"
      >
        {{ progress.message }}
      </p>
      <p
        v-if="updateError"
        class="text-status-missing"
        role="alert"
      >
        {{ updateError }}
      </p>
      <p class="text-caption text-text-muted">
        อัปเดตเกิดขึ้นเมื่อคุณกดเท่านั้น ตัวติดตั้งยังไม่ได้ sign (ตรวจความสมบูรณ์ด้วย SHA-512 จาก release) และข้อมูลของคุณจะอยู่ครบหลังติดตั้ง
      </p>
    </section>
  </div>
</template>
