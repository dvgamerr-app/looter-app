<script setup lang="ts">
import { computed } from 'vue'
import { statusFill, statusOf } from '../status'

const props = defineProps<{ owned: number; required: number }>()

const percent = computed(() =>
  props.required > 0 ? Math.round((Math.min(props.owned, props.required) / props.required) * 100) : 0,
)
const fill = computed(() => statusFill[statusOf(props.required, props.owned)])
</script>

<template>
  <div
    class="flex items-center gap-2"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <span class="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
      <span
        class="block h-full rounded-full"
        :class="fill"
        :style="{ width: `${percent}%` }"
      />
    </span>
    <span class="font-numeric w-10 text-right text-caption tabular-nums text-text-muted">{{ percent }}%</span>
  </div>
</template>
