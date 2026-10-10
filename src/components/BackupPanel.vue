<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { BackupSummary } from '../../electron/ipc/contracts'
import { formatDateTime } from '../format'
import { useToasts } from '../stores/toasts'
import ConfirmDialog from './ConfirmDialog.vue'

const toasts = useToasts()

const dataPath = ref('')
const busy = ref(false)
const status = ref('')
const banner = ref('')

const restoreFile = ref<string | null>(null)
const restoreSummary = ref<BackupSummary | null>(null)

onMounted(async () => {
  const result = await window.api.app.getInfo()
  if (result.ok) dataPath.value = result.data.dataPath
})

const megabytes = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`

async function openFolder(): Promise<void> {
  const result = await window.api.app.openDataFolder()
  if (!result.ok) toasts.error(result.error.message)
}

async function exportBackup(): Promise<void> {
  const picked = await window.api.backup.pickPath({ mode: 'save' })
  if (!picked.ok || picked.data === null) return
  busy.value = true
  status.value = 'กำลังสร้าง Backup…'
  banner.value = ''
  const result = await window.api.backup.export(picked.data)
  busy.value = false
  status.value = ''
  if (result.ok) {
    toasts.success(`สร้าง Backup แล้ว: ${result.data.profileCount} Profile, ${result.data.itemCount} Items (${megabytes(result.data.bytes)}) ที่ ${result.data.path}`)
  } else {
    toasts.error(result.error.message)
  }
}

// The file is inspected first so the user sees what will replace the current data (F11-R11).
async function chooseRestore(): Promise<void> {
  const picked = await window.api.backup.pickPath({ mode: 'open' })
  if (!picked.ok || picked.data === null) return
  banner.value = ''
  const result = await window.api.backup.inspect(picked.data)
  if (!result.ok) {
    banner.value =
      result.error.code === 'BACKUP_TOO_NEW'
        ? 'Backup นี้สร้างจากเวอร์ชันที่ใหม่กว่า ต้องอัปเดตแอปก่อน'
        : 'ไฟล์ไม่ใช่ Backup ของ GameLooter หรือ manifest.json เสียหาย'
    return
  }
  restoreFile.value = picked.data
  restoreSummary.value = result.data
}

async function confirmRestore(): Promise<void> {
  const file = restoreFile.value
  restoreFile.value = null
  if (!file) return
  busy.value = true
  status.value = 'กำลังกู้คืนข้อมูล แอปจะเปิดใหม่เมื่อเสร็จ…'
  const result = await window.api.backup.restore(file)
  // On success the app restarts and this line is never reached.
  busy.value = false
  status.value = ''
  if (!result.ok) banner.value = result.error.message
}

async function cleanImages(): Promise<void> {
  busy.value = true
  const result = await window.api.app.cleanImages()
  busy.value = false
  if (result.ok) {
    toasts.success(`ลบไฟล์ภาพที่ไม่ถูกใช้ ${result.data.removedFiles} ไฟล์ และล้างรูปที่ไฟล์หายของ ${result.data.clearedItems} Items`)
  } else {
    toasts.error(result.error.message)
  }
}
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-5">
    <p
      v-if="banner"
      class="rounded-md border border-status-missing p-3 text-status-missing"
      role="alert"
    >
      {{ banner }}
    </p>

    <section class="flex flex-col gap-2">
      <h3 class="font-medium">
        ที่เก็บข้อมูล
      </h3>
      <p class="font-numeric break-all text-text-muted select-text">
        {{ dataPath }}
      </p>
      <div>
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border disabled:opacity-40"
          :disabled="busy"
          @click="openFolder"
        >
          เปิดโฟลเดอร์ข้อมูล
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <h3 class="font-medium">
        Backup และกู้คืน
      </h3>
      <p class="text-text-muted">
        Backup เป็นไฟล์ .zip เดียวที่รวมข้อมูลทุก Profile และรูปทั้งหมด การกู้คืนจะแทนที่ข้อมูลปัจจุบันทั้งหมด (ไม่ Merge)
        และเก็บข้อมูลเดิมไว้ใน backups\pre-restore-… ก่อน
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-40"
          :disabled="busy"
          @click="exportBackup"
        >
          Export Backup (.zip)…
        </button>
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border disabled:opacity-40"
          :disabled="busy"
          @click="chooseRestore"
        >
          Import / Restore…
        </button>
      </div>
      <p
        v-if="status"
        class="text-text-muted"
        role="status"
      >
        {{ status }}
      </p>
    </section>

    <section class="flex flex-col gap-2">
      <h3 class="font-medium">
        ไฟล์ภาพ
      </h3>
      <p class="text-text-muted">
        ลบไฟล์ภาพที่ไม่มี Item ใดใช้ และล้างรูปของ Item ที่ไฟล์หายไปแล้ว
      </p>
      <div>
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border disabled:opacity-40"
          :disabled="busy"
          @click="cleanImages"
        >
          ล้างไฟล์ภาพที่ไม่ถูกใช้
        </button>
      </div>
    </section>

    <ConfirmDialog
      :open="restoreFile !== null && restoreSummary !== null"
      title="กู้คืนจาก Backup"
      confirm-label="กู้คืนและเปิดแอปใหม่"
      destructive
      @confirm="confirmRestore"
      @cancel="restoreFile = null"
    >
      <p>
        Backup จากแอปเวอร์ชัน {{ restoreSummary?.appVersion }} (schema {{ restoreSummary?.schemaVersion }})
        สร้างเมื่อ {{ formatDateTime(restoreSummary?.exportedAt ?? null) }}
      </p>
      <p>มี {{ restoreSummary?.profileCount }} Profile และ {{ restoreSummary?.itemCount }} Items</p>
      <p class="text-status-warning">
        ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ และถูกสำรองไว้ใน backups\pre-restore-… ก่อน
      </p>
    </ConfirmDialog>
  </div>
</template>
