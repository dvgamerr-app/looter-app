<script setup lang="ts">
import type { Bounds } from '../../../electron/ipc/contracts'

const props = defineProps<{ bounds: Bounds | null }>()
const emit = defineEmits<{ resize: [bounds: Bounds]; size: [size: string | null] }>()

let start: { x: number; y: number; bounds: Bounds } | null = null
let frame = 0

// Dragging the corner asks the main process for new bounds on every frame; the main process enforces the
// minimum size and keeps the window on a display (UI/UX Design Plan 4.5).
function down(event: PointerEvent): void {
  if (!props.bounds) return
  start = { x: event.screenX, y: event.screenY, bounds: props.bounds }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function move(event: PointerEvent): void {
  if (!start) return
  const next: Bounds = {
    ...start.bounds,
    width: start.bounds.width + (event.screenX - start.x),
    height: start.bounds.height + (event.screenY - start.y),
  }
  emit('size', `${next.width} × ${next.height}`)
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => emit('resize', next))
}

function up(): void {
  start = null
  emit('size', null)
}
</script>

<template>
  <span
    class="absolute right-0 bottom-0 grid size-4 cursor-nwse-resize place-items-center text-text-muted"
    aria-hidden="true"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
  >◢</span>
</template>
