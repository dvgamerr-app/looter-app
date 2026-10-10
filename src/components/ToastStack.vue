<script setup lang="ts">
import { useToasts } from '../stores/toasts'
import AppIcon from './AppIcon.vue'

const { toasts, dismiss } = useToasts()

const accent = { info: 'border-l-accent', success: 'border-l-status-ok', error: 'border-l-status-missing' } as const
</script>

<template>
  <div
    class="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
    role="status"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="flex items-start gap-2 rounded-md border border-l-4 border-border bg-surface-2 p-3 shadow-lg"
      :class="accent[toast.kind]"
    >
      <p class="flex-1 break-words">
        {{ toast.message }}
      </p>
      <button
        type="button"
        class="rounded-sm p-1 text-text-muted hover:text-text"
        aria-label="ปิดข้อความ"
        @click="dismiss(toast.id)"
      >
        <AppIcon
          name="close"
          :size="16"
        />
      </button>
    </div>
  </div>
</template>
