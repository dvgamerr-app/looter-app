<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { IpcError, PendingImage } from '../../electron/ipc/contracts'
import { useToasts } from '../stores/toasts'
import BaseDialog from './BaseDialog.vue'
import CaptureItemDialog from './CaptureItemDialog.vue'

const toasts = useToasts()

// Pending images wait in a queue and the naming dialog shows one at a time (F10-R8).
const queue = ref<PendingImage[]>([])
const current = computed(() => queue.value[0] ?? null)
const failure = ref<IpcError | null>(null)

function enqueue(image: PendingImage): void {
  if (!queue.value.some((entry) => entry.id === image.id)) queue.value = [...queue.value, image]
  failure.value = null
}

const stop = window.api.on('capture:changed', (event) => {
  if (event.phase === 'captured' && event.pending) enqueue(event.pending)
  else if (event.phase === 'failed' && event.error) failure.value = event.error
})
onBeforeUnmount(stop)

// Images captured before this window finished loading are still waiting in the main process.
onMounted(async () => {
  const result = await window.api.capture.listPending()
  if (result.ok) result.data.forEach(enqueue)
})

function next(): void {
  queue.value = queue.value.slice(1)
}

async function paste(): Promise<void> {
  const result = await window.api.capture.fromClipboard()
  if (!result.ok) toasts.error(result.error.message)
}

async function importFile(): Promise<void> {
  const result = await window.api.capture.importFile()
  if (!result.ok) toasts.error(result.error.message)
}

const advice = computed(() =>
  failure.value?.code === 'CLIPBOARD_EMPTY'
    ? failure.value.message
    : [failure.value?.message ?? '', 'หรือกด Win+Shift+S เลือกบริเวณ Item แล้วกด Paste จาก Clipboard'].filter(Boolean).join(' '),
)
</script>

<template>
  <CaptureItemDialog
    :pending="current"
    @done="next"
    @cancel="next"
  />

  <BaseDialog
    :open="failure !== null"
    title="จับภาพไม่สำเร็จ"
    @close="failure = null"
  >
    <p>{{ advice }}</p>
    <div class="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
        @click="failure = null"
      >
        ปิด
      </button>
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
        @click="importFile"
      >
        Import ไฟล์…
      </button>
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
        @click="paste"
      >
        Paste จาก Clipboard
      </button>
    </div>
  </BaseDialog>
</template>
