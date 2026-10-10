<script setup lang="ts">
import type { Mode } from '../../electron/ipc/contracts'

const model = defineModel<Mode>({ required: true })
defineProps<{ name: string; noRecipe?: boolean }>()

const modes: Mode[] = ['craft', 'gather']
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <span
      class="inline-flex overflow-hidden rounded-md border border-border"
      role="group"
      :aria-label="`โหมดของ ${name}`"
    >
      <button
        v-for="mode in modes"
        :key="mode"
        type="button"
        class="h-7 px-2 text-caption disabled:opacity-50"
        :class="model === mode ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:bg-surface-3'"
        :aria-pressed="model === mode"
        :disabled="noRecipe && mode === 'craft'"
        @click="model = mode"
      >
        {{ mode }}
      </button>
    </span>
    <span
      v-if="noRecipe"
      class="text-caption text-status-warning"
    >ไม่มี Recipe</span>
  </span>
</template>
