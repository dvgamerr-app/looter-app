<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ change: [accelerator: string] }>()

const recording = ref(false)

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph'])
const NAMED_KEYS: Record<string, string> = {
  ' ': 'Space',
  Enter: 'Return',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Escape: 'Esc',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Tab: 'Tab',
}

/** Builds an Electron accelerator from the keys that were pressed, for example `CommandOrControl+Shift+O`. */
function toAccelerator(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null
  const key = NAMED_KEYS[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key)
  const parts: string[] = []
  if (event.ctrlKey) parts.push('CommandOrControl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push('Super')
  return [...parts, key].join('+')
}

function onKeydown(event: KeyboardEvent): void {
  event.preventDefault()
  if (event.key === 'Escape') {
    recording.value = false
    return
  }
  // Backspace clears the shortcut, which turns the action off (F11-R6).
  if (event.key === 'Backspace') {
    recording.value = false
    emit('change', '')
    return
  }
  const accelerator = toAccelerator(event)
  if (!accelerator) return
  recording.value = false
  emit('change', accelerator)
}
</script>

<template>
  <button
    type="button"
    class="font-numeric h-(--size-hit) min-w-56 rounded-md border px-3 text-left"
    :class="recording ? 'border-accent-text bg-surface-3' : 'border-border bg-surface-2 hover:bg-surface-3'"
    :aria-label="`ตั้งปุ่มลัดของ ${label}`"
    @click="recording = true"
    @keydown="recording && onKeydown($event)"
    @blur="recording = false"
  >
    <template v-if="recording">
      กดปุ่มที่ต้องการ… (Esc ยกเลิก, Backspace ปิดใช้งาน)
    </template>
    <template v-else>
      {{ modelValue || 'ปิดใช้งาน' }}
    </template>
  </button>
</template>
