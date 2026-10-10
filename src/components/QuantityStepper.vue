<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{ modelValue: number; step?: number; name: string; min?: number; max?: number; compact?: boolean }>(),
  { step: 1, min: 0, max: 999_999, compact: false },
)
const emit = defineEmits<{
  /** Relative change from the + and − buttons. */
  adjust: [delta: number]
  /** A whole number typed into the field; NaN when the text was invalid (the field shows the old value again). */
  set: [value: number]
}>()

const draft = ref(String(props.modelValue))
watch(
  () => props.modelValue,
  (value) => {
    draft.value = String(value)
  },
)

function commit(): void {
  const text = draft.value.trim()
  // An empty field cancels the edit and keeps the old value (F7 edge cases).
  if (text === '' || text === String(props.modelValue)) {
    draft.value = String(props.modelValue)
    return
  }
  const value = Number(text)
  if (!/^\d+$/.test(text) || value < props.min || value > props.max) {
    draft.value = String(props.modelValue)
    emit('set', Number.NaN)
    return
  }
  emit('set', value)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    draft.value = String(props.modelValue)
    ;(event.target as HTMLInputElement).blur()
  }
}
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <button
      type="button"
      class="grid place-items-center rounded-sm bg-surface-3 hover:bg-border disabled:opacity-40"
      :class="compact ? 'size-6' : 'size-8'"
      :disabled="modelValue <= min"
      :aria-label="`ลด ${name} ทีละ ${step}`"
      @click="emit('adjust', -step)"
    >
      <AppIcon
        name="minus"
        :size="14"
      />
    </button>
    <input
      v-model="draft"
      type="text"
      inputmode="numeric"
      :aria-label="`จำนวน ${name}`"
      class="font-numeric rounded-sm border border-border bg-surface-2 text-center tabular-nums select-text"
      :class="compact ? 'h-6 w-12' : 'h-8 w-16'"
      @focus="($event.target as HTMLInputElement).select()"
      @blur="commit"
      @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      @keydown="onKeydown"
    >
    <button
      type="button"
      class="grid place-items-center rounded-sm bg-surface-3 hover:bg-border disabled:opacity-40"
      :class="compact ? 'size-6' : 'size-8'"
      :disabled="modelValue >= max"
      :aria-label="`เพิ่ม ${name} ทีละ ${step}`"
      @click="emit('adjust', step)"
    >
      <AppIcon
        name="plus"
        :size="14"
      />
    </button>
  </span>
</template>
