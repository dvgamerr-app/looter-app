<script setup lang="ts">
import { computed } from 'vue'
import { statusFill, statusOf, statusText } from '../status'

const props = defineProps<{ required: number; owned: number; missing: number }>()

const role = computed(() => statusOf(props.required, props.owned))
</script>

<template>
  <span
    class="font-numeric inline-flex items-center gap-2 tabular-nums"
    :class="statusText[role]"
  >
    <span
      class="size-2 rounded-full"
      :class="statusFill[role]"
      aria-hidden="true"
    />
    <template v-if="role === 'ok'">ครบ</template>
    <template v-else-if="role === 'neutral'">–</template>
    <template v-else>ขาด {{ missing }}</template>
  </span>
</template>
