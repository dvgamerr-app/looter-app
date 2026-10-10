<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { initialOf } from '../format'

const props = withDefaults(defineProps<{ src: string | null; name: string; size?: number }>(), { size: 40 })

// A missing or unreadable file falls back to the placeholder with the first letter (F2-R11).
const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
const box = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="name"
    :style="box"
    class="shrink-0 rounded-sm bg-surface-2 object-contain"
    @error="failed = true"
  >
  <span
    v-else
    :style="box"
    class="grid shrink-0 place-items-center rounded-sm bg-surface-3 font-bold text-text-muted"
    aria-hidden="true"
  >
    {{ initialOf(name) }}
  </span>
</template>
