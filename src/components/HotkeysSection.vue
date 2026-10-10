<script setup lang="ts">
import { ref } from 'vue'
import type { HotkeyAction, HotkeyStatus } from '../../electron/ipc/contracts'
import { useSettings } from '../stores/settings'
import { useToasts } from '../stores/toasts'
import ConfirmDialog from './ConfirmDialog.vue'
import HotkeyRecorder from './HotkeyRecorder.vue'

const { settings } = useSettings()
const toasts = useToasts()

const actions: Array<{ id: HotkeyAction; label: string; note?: string }> = [
  { id: 'toggleOverlay', label: 'เปิด/ปิด Overlay' },
  { id: 'toggleOverlayMode', label: 'สลับโหมด Overlay (View/Interactive)' },
  { id: 'startCapture', label: 'เริ่ม Capture', note: 'ใช้งานได้ใน Phase 4' },
  { id: 'importClipboard', label: 'Import จาก Clipboard', note: 'ใช้งานได้ใน Phase 4' },
  { id: 'overlayNextTarget', label: 'Overlay: Target ถัดไป' },
  { id: 'overlayPrevTarget', label: 'Overlay: Target ก่อนหน้า' },
]

const statusText: Record<HotkeyStatus, string> = {
  registered: '● ใช้งานได้',
  failed: '✖ ลงทะเบียนไม่สำเร็จ',
  disabled: '○ ปิดใช้งาน',
  pending: '… รอลงทะเบียน',
}
const statusClass: Record<HotkeyStatus, string> = {
  registered: 'text-status-ok',
  failed: 'text-status-missing',
  disabled: 'text-text-muted',
  pending: 'text-text-muted',
}

const confirmReset = ref(false)

async function change(action: HotkeyAction, accelerator: string): Promise<void> {
  const result = await window.api.settings.setHotkey({ action, accelerator })
  if (!result.ok) toasts.error(result.error.message)
}

async function resetOne(action: HotkeyAction): Promise<void> {
  const result = await window.api.settings.resetHotkeys({ action })
  if (!result.ok) toasts.error(result.error.message)
}

async function resetAll(): Promise<void> {
  confirmReset.value = false
  const result = await window.api.settings.resetHotkeys()
  if (!result.ok) toasts.error(result.error.message)
}

async function retry(): Promise<void> {
  const result = await window.api.settings.retryHotkeys()
  if (!result.ok) toasts.error(result.error.message)
}
</script>

<template>
  <div
    v-if="settings"
    class="flex flex-col gap-3"
  >
    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-surface-3 px-3 hover:bg-border"
        @click="retry"
      >
        ลองลงทะเบียนอีกครั้ง
      </button>
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-surface-3 px-3 hover:bg-border"
        @click="confirmReset = true"
      >
        คืนค่าเริ่มต้นทั้งหมด
      </button>
    </div>

    <table class="w-full text-left">
      <thead class="text-caption text-text-muted">
        <tr>
          <th class="border-b border-border py-2 font-medium">
            Action
          </th>
          <th class="border-b border-border py-2 font-medium">
            Shortcut
          </th>
          <th class="border-b border-border py-2 font-medium">
            สถานะ
          </th>
          <th class="border-b border-border py-2" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="action in actions"
          :key="action.id"
          class="border-b border-border"
        >
          <th
            scope="row"
            class="py-2 font-normal"
          >
            {{ action.label }}
            <span
              v-if="action.note"
              class="block text-caption text-text-muted"
            >{{ action.note }}</span>
          </th>
          <td class="py-2">
            <HotkeyRecorder
              :model-value="settings.hotkeys[action.id]"
              :label="action.label"
              @change="change(action.id, $event)"
            />
          </td>
          <td
            class="py-2"
            :class="statusClass[settings.hotkeyStatus[action.id]]"
          >
            {{ statusText[settings.hotkeyStatus[action.id]] }}
            <span
              v-if="settings.hotkeyStatus[action.id] === 'failed'"
              class="block text-caption text-text-muted"
            >อาจถูกโปรแกรมอื่นหรือเกมใช้อยู่ กดเพื่อตั้งปุ่มใหม่</span>
          </td>
          <td class="py-2 text-right">
            <button
              type="button"
              class="h-7 rounded-sm px-2 text-caption hover:bg-surface-3"
              @click="resetOne(action.id)"
            >
              คืนค่า
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfirmDialog
      :open="confirmReset"
      title="คืนค่า Hotkey เริ่มต้น"
      confirm-label="คืนค่าทั้งหมด"
      @confirm="resetAll"
      @cancel="confirmReset = false"
    >
      <p>Hotkey ทั้ง 6 รายการจะกลับเป็นค่าเริ่มต้น</p>
    </ConfirmDialog>
  </div>
</template>
