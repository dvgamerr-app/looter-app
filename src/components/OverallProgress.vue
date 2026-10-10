<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'

defineProps<{ owned: number; required: number; missingCount?: number }>()
</script>

<template>
  <div class="flex items-center gap-4">
    <span class="font-medium whitespace-nowrap">Overall Progress</span>
    <div class="flex-1">
      <ProgressBar
        :owned="owned"
        :required="required"
      />
    </div>
    <span class="font-numeric whitespace-nowrap tabular-nums">{{ owned }} / {{ required }}</span>
    <span
      v-if="missingCount !== undefined"
      class="whitespace-nowrap text-text-muted"
    >ขาด {{ missingCount }} รายการ</span>
  </div>
</template>
