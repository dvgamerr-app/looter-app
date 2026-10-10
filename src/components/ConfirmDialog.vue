<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  open: boolean
  title: string
  confirmLabel: string
  /** Styles the confirm button as a destructive action (never the default button, F1-R8). */
  destructive?: boolean
  /** When set, the user must type this text before the confirm button is enabled. */
  requireText?: string
  busy?: boolean
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const typed = ref('')
watch(
  () => props.open,
  () => {
    typed.value = ''
  },
)
const canConfirm = computed(() => !props.busy && (!props.requireText || typed.value.trim() === props.requireText))
</script>

<template>
  <BaseDialog
    :open="open"
    :title="title"
    @close="emit('cancel')"
  >
    <div class="flex flex-col gap-3 text-text-muted">
      <slot />
    </div>
    <label
      v-if="requireText"
      class="flex flex-col gap-1"
    >
      <span class="text-caption text-text-muted">พิมพ์ “{{ requireText }}” เพื่อยืนยัน</span>
      <input
        v-model="typed"
        type="text"
        autocomplete="off"
        class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-3 text-text"
      >
    </label>
    <div class="flex justify-end gap-2">
      <!-- The safe choice is first in the tab order and takes the initial focus. -->
      <button
        type="button"
        autofocus
        class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
        @click="emit('cancel')"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        :disabled="!canConfirm"
        class="h-(--size-hit) rounded-md px-4 font-medium text-white disabled:opacity-40"
        :class="destructive ? 'bg-status-missing hover:bg-red-600' : 'bg-accent hover:bg-accent-hover'"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </BaseDialog>
</template>
