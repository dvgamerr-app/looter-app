<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '../stores/settings'

const model = defineModel<number>({ required: true })

const { settings } = useSettings()
const sizes = computed(() => settings.value?.preferences.stepSizes ?? [1, 5, 10])
</script>

<template>
  <div
    class="flex items-center gap-1"
    role="group"
    aria-label="ขั้นของปุ่ม + และ −"
  >
    <span class="text-caption text-text-muted">Step</span>
    <button
      v-for="size in sizes"
      :key="size"
      type="button"
      class="font-numeric h-7 min-w-8 rounded-sm px-2 tabular-nums"
      :class="model === size ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:bg-surface-3'"
      :aria-pressed="model === size"
      @click="model = size"
    >
      {{ size }}
    </button>
  </div>
</template>
