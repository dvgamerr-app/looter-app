<script setup lang="ts">
import { computed } from 'vue'
import type { OverlayState } from '../../../electron/ipc/contracts'
import { useSettings } from '../../stores/settings'

const props = defineProps<{ state: OverlayState; step: number }>()
const emit = defineEmits<{ cycle: [direction: 1 | -1]; step: [size: number]; opacity: [value: number]; toggleCompact: []; openMain: []; hide: [] }>()

const interactive = computed(() => props.state.mode === 'interactive')
const settings = useSettings()
const sizes = computed(() => settings.settings.value?.preferences.stepSizes ?? [1, 5, 10])
const title = computed(() => (props.state.compact ? 'TRACKER' : 'MATERIAL TRACKER'))
const scopeText = computed(() => props.state.scopeLabel ?? 'ทั้งหมด')
</script>

<template>
  <header class="border-b border-border">
    <!-- The whole bar drags the window in Interactive mode; the buttons opt out of dragging. -->
    <div
      class="flex items-center gap-2 px-3 py-1.5"
      :class="interactive ? 'drag cursor-move' : ''"
      @dblclick="interactive && emit('toggleCompact')"
    >
      <span class="overlay-text text-caption font-bold tracking-wide whitespace-nowrap">{{ title }}</span>
      <span class="flex min-w-0 flex-1 items-center justify-center gap-1">
        <button
          v-if="interactive && state.pinnedTargetCount > 0"
          type="button"
          class="no-drag px-1"
          aria-label="Target ก่อนหน้า"
          @click="emit('cycle', -1)"
        >‹</button>
        <span class="overlay-text truncate text-caption">
          <template v-if="state.scopeLabel">จัดสรร · </template>{{ scopeText }}
        </span>
        <button
          v-if="interactive && state.pinnedTargetCount > 0"
          type="button"
          class="no-drag px-1"
          aria-label="Target ถัดไป"
          @click="emit('cycle', 1)"
        >›</button>
      </span>
      <span
        class="rounded-sm px-1.5 text-caption font-bold"
        :class="interactive ? 'bg-accent text-white' : 'bg-surface-3 text-text-muted'"
      >{{ interactive ? 'INTERACTIVE' : 'VIEW' }}</span>
    </div>

    <div
      v-if="interactive"
      class="flex flex-wrap items-center gap-2 px-3 pb-1.5 text-caption"
    >
      <span class="flex items-center gap-1">
        Step
        <button
          v-for="size in sizes"
          :key="size"
          type="button"
          class="font-numeric h-6 min-w-6 rounded-sm px-1 tabular-nums"
          :class="step === size ? 'bg-accent text-white' : 'bg-surface-3'"
          :aria-pressed="step === size"
          @click="emit('step', size)"
        >{{ size }}</button>
      </span>
      <label class="flex items-center gap-1">
        <span class="sr-only">ความโปร่งใส</span>
        <input
          type="range"
          min="20"
          max="100"
          step="5"
          :value="Math.round(state.opacity * 100)"
          aria-label="ความโปร่งใส"
          @change="emit('opacity', Number(($event.target as HTMLInputElement).value) / 100)"
        >
      </label>
      <button
        type="button"
        class="h-6 rounded-sm bg-surface-3 px-2"
        @click="emit('openMain')"
      >
        เปิดแอปหลัก
      </button>
      <button
        type="button"
        class="h-6 rounded-sm bg-surface-3 px-2"
        @click="emit('hide')"
      >
        ซ่อน
      </button>
    </div>
  </header>
</template>

<style scoped>
.drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
</style>
