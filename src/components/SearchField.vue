<script setup lang="ts">
import { useTemplateRef } from 'vue'

const model = defineModel<string>({ required: true })
defineProps<{ placeholder?: string }>()
const emit = defineEmits<{ submit: [] }>()

const input = useTemplateRef<HTMLInputElement>('input')
defineExpose({ focus: (): void => input.value?.focus() })
</script>

<template>
  <input
    ref="input"
    v-model="model"
    type="search"
    :placeholder="placeholder ?? 'ค้นหา…'"
    aria-label="ค้นหา"
    class="h-(--size-hit) w-64 rounded-md border border-border bg-surface-2 px-3 text-text select-text"
    @keydown.enter="emit('submit')"
    @keydown.esc="model = ''"
  >
</template>
