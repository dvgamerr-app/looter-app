<script setup lang="ts">
import { useGathering } from '../stores/gathering'
import { useTracking } from '../stores/tracking'

const { targets } = useTracking()
const gathering = useGathering()

/** "จัดสรร a / b": what the shared inventory gave the target (F4-R6), not what the target holds. */
function progress(targetId: number): { allocated: number; need: number } | null {
  const entry = gathering.result.value.perTarget.find((row) => row.targetId === targetId)
  if (!entry) return null
  return {
    allocated: entry.rows.reduce((sum, row) => sum + row.allocated, 0),
    need: entry.rows.reduce((sum, row) => sum + row.need, 0),
  }
}
</script>

<template>
  <ol class="flex flex-col gap-1">
    <li
      v-for="target in targets"
      :key="target.id"
      class="flex items-center gap-3"
    >
      <span class="font-numeric w-6 text-text-muted tabular-nums">{{ target.priority }}.</span>
      <span class="min-w-0 flex-1 truncate">{{ target.label }}<template v-if="target.kind === 'recipe'"> ×{{ target.targetQty }}</template></span>
      <span
        v-if="progress(target.id)"
        class="font-numeric text-text-muted tabular-nums"
      >จัดสรร {{ progress(target.id)!.allocated }}/{{ progress(target.id)!.need }}</span>
      <span
        v-else
        class="text-caption text-status-warning"
      >ไม่ถูกนับ</span>
    </li>
  </ol>
</template>
