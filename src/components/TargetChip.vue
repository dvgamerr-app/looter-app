<script setup lang="ts">
import type { TrackingTargetDto } from '../../electron/ipc/contracts'

defineProps<{ target: TrackingTargetDto; selected: boolean }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="h-7 rounded-full px-3 text-caption"
    :class="[
      selected ? 'bg-accent text-white' : 'bg-surface-2 hover:bg-surface-3',
      target.questStatus && target.questStatus !== 'active' ? 'text-text-muted line-through' : '',
    ]"
    :aria-pressed="selected"
    :title="target.questStatus && target.questStatus !== 'active' ? `ไม่ถูกนับ (${target.questStatus})` : 'ดูเฉพาะ Target นี้'"
    @click="$emit('select')"
  >
    ⊙ {{ target.label }}<template v-if="target.kind === 'recipe'">
      ×{{ target.targetQty }}
    </template> #{{ target.priority }}
  </button>
</template>
