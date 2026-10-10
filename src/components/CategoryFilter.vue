<script setup lang="ts">
import type { ItemCategory } from '../../electron/ipc/contracts'

const model = defineModel<ItemCategory | null>({ required: true })

const options: Array<{ value: ItemCategory | null; label: string }> = [
  { value: null, label: 'ทั้งหมด' },
  { value: 'material', label: 'material' },
  { value: 'equipment', label: 'equipment' },
  { value: 'consumable', label: 'consumable' },
  { value: 'quest', label: 'quest' },
  { value: 'other', label: 'other' },
]
</script>

<template>
  <div
    class="flex flex-wrap gap-1"
    role="group"
    aria-label="หมวดหมู่"
  >
    <button
      v-for="option in options"
      :key="option.label"
      type="button"
      class="h-7 rounded-full px-3 text-caption"
      :class="model === option.value ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:bg-surface-3'"
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
