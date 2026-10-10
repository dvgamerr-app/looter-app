<script setup lang="ts">
import { onMounted, useId, useTemplateRef, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

// The native <dialog> gives us the focus trap, Esc to close and focus restoration on close.
function sync(open: boolean): void {
  const element = dialog.value
  if (!element) return
  if (open && !element.open) element.showModal()
  else if (!open && element.open) element.close()
}

onMounted(() => sync(props.open))
watch(() => props.open, sync, { flush: 'post' })
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="m-auto w-full max-w-[560px] rounded-lg border border-border bg-surface-1 p-0 text-text backdrop:bg-black/60"
    @close="emit('close')"
    @click.self="emit('close')"
  >
    <div class="flex flex-col gap-4 p-5">
      <h2
        :id="titleId"
        class="text-heading font-bold"
      >
        {{ title }}
      </h2>
      <slot />
    </div>
  </dialog>
</template>
