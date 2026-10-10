<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '../stores/settings'
import { useToasts } from '../stores/toasts'

const { settings } = useSettings()
const toasts = useToasts()

const overlay = computed(() => settings.value?.overlay)

async function run(call: Promise<{ ok: boolean; error?: { message: string } }>): Promise<void> {
  const result = await call
  if (!result.ok && result.error) toasts.error(result.error.message)
}

// Each control goes through the overlay commands so a visible overlay changes at once (F11-R7).
const setOpacity = (event: Event): Promise<void> =>
  run(window.api.overlay.setOpacity({ opacity: Number((event.target as HTMLInputElement).value) / 100 }))
const setCompact = (event: Event): Promise<void> =>
  run(window.api.overlay.setCompact({ compact: (event.target as HTMLInputElement).checked }))
const setMode = (event: Event): Promise<void> =>
  run(window.api.overlay.setMode((event.target as HTMLSelectElement).value as 'view' | 'interactive'))
const setVisible = (event: Event): Promise<void> =>
  run((event.target as HTMLInputElement).checked ? window.api.overlay.show() : window.api.overlay.hide())
const resetLayout = (): Promise<void> => run(window.api.overlay.resetLayout())
</script>

<template>
  <div
    v-if="overlay"
    class="flex max-w-xl flex-col gap-5"
  >
    <label class="flex flex-col gap-1">
      <span>ความโปร่งใส <span class="font-numeric tabular-nums text-text-muted">{{ Math.round(overlay.opacity * 100) }}%</span></span>
      <input
        type="range"
        min="20"
        max="100"
        step="5"
        :value="Math.round(overlay.opacity * 100)"
        @change="setOpacity"
      >
    </label>

    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        :checked="overlay.compact"
        @change="setCompact"
      >
      Compact mode
    </label>

    <label class="flex flex-col gap-1">
      <span>โหมดเริ่มต้นเมื่อแสดง</span>
      <select
        :value="overlay.mode"
        class="h-(--size-hit) w-56 rounded-md border border-border bg-surface-2 px-2"
        @change="setMode"
      >
        <option value="view">View (คลิกทะลุ)</option>
        <option value="interactive">Interactive</option>
      </select>
    </label>

    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        :checked="overlay.visible"
        @change="setVisible"
      >
      แสดง Overlay เมื่อเปิดแอป
    </label>

    <div>
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
        @click="resetLayout"
      >
        รีเซ็ตตำแหน่งและความโปร่งใส
      </button>
    </div>

    <p class="text-caption text-text-muted">
      Overlay ใช้ได้กับเกมแบบ Borderless Windowed เท่านั้น เกมแบบ Fullscreen Exclusive จะไม่แสดง Overlay
      (ข้อจำกัดของ Windows) ให้เปลี่ยนเกมเป็น Borderless Windowed ในการตั้งค่าภาพของเกม
    </p>
  </div>
</template>
