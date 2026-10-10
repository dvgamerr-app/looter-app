<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { EventContract } from '../../electron/ipc/contracts'

const MIN_DEVICE_PX = 8
const HANDLES = [
  { id: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
  { id: 'n', x: 0.5, y: 0, cursor: 'ns-resize' },
  { id: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
  { id: 'e', x: 1, y: 0.5, cursor: 'ew-resize' },
  { id: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
  { id: 's', x: 0.5, y: 1, cursor: 'ns-resize' },
  { id: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
  { id: 'w', x: 0, y: 0.5, cursor: 'ew-resize' },
] as const

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const frame = ref<EventContract['capture:frame'] | null>(null)
const selection = ref<Rect | null>(null)
const cursor = ref({ x: 0, y: 0 })
const mode = ref<'idle' | 'drawing' | 'resizing' | 'moving' | 'selected'>('idle')
const busy = ref(false)

// The frame is sent to this window once it has loaded (Feature Specification 14.1).
const stopFrame = window.api.on('capture:frame', (payload) => {
  frame.value = payload
})
onBeforeUnmount(stopFrame)

/** Device pixels per CSS pixel of the captured display. */
const scale = computed(() => (frame.value ? frame.value.imageWidth / frame.value.displayBounds.width : 1))
const deviceSize = computed(() =>
  selection.value
    ? { width: Math.round(selection.value.width * scale.value), height: Math.round(selection.value.height * scale.value) }
    : null,
)
const tooSmall = computed(() => !!deviceSize.value && (deviceSize.value.width < MIN_DEVICE_PX || deviceSize.value.height < MIN_DEVICE_PX))

let anchor = { x: 0, y: 0 }
let resizeHandle: (typeof HANDLES)[number] | null = null
let moveOffset = { x: 0, y: 0 }
let spaceHeld = false

const normalise = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
})

function down(event: PointerEvent): void {
  if (event.button === 2) return
  const point = { x: event.clientX, y: event.clientY }
  const rect = selection.value
  if (rect && mode.value === 'selected' && spaceHeld) {
    mode.value = 'moving'
    moveOffset = { x: point.x - rect.x, y: point.y - rect.y }
  } else {
    anchor = point
    selection.value = { ...point, width: 0, height: 0 }
    mode.value = 'drawing'
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function startResize(event: PointerEvent, handle: (typeof HANDLES)[number]): void {
  const rect = selection.value
  if (!rect) return
  event.stopPropagation()
  // The corner opposite to the handle stays where it is while the other edges follow the pointer.
  anchor = {
    x: handle.x === 0 ? rect.x + rect.width : handle.x === 1 ? rect.x : rect.x,
    y: handle.y === 0 ? rect.y + rect.height : handle.y === 1 ? rect.y : rect.y,
  }
  resizeHandle = handle
  mode.value = 'resizing'
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function move(event: PointerEvent): void {
  const point = { x: event.clientX, y: event.clientY }
  cursor.value = point
  const rect = selection.value
  if (mode.value === 'drawing') {
    selection.value = normalise(anchor, point)
  } else if (mode.value === 'resizing' && rect && resizeHandle) {
    const horizontal = resizeHandle.x === 0.5
    const vertical = resizeHandle.y === 0.5
    const opposite = { x: horizontal ? rect.x : anchor.x, y: vertical ? rect.y : anchor.y }
    const corner = { x: horizontal ? rect.x + rect.width : point.x, y: vertical ? rect.y + rect.height : point.y }
    selection.value = normalise(opposite, corner)
  } else if (mode.value === 'moving' && rect && frame.value) {
    const { width, height } = frame.value.displayBounds
    selection.value = {
      ...rect,
      x: Math.min(Math.max(0, point.x - moveOffset.x), width - rect.width),
      y: Math.min(Math.max(0, point.y - moveOffset.y), height - rect.height),
    }
  }
}

function up(): void {
  if (mode.value === 'idle' || mode.value === 'selected') return
  mode.value = selection.value && selection.value.width > 2 && selection.value.height > 2 ? 'selected' : 'idle'
  if (mode.value === 'idle') selection.value = null
  resizeHandle = null
}

async function confirm(): Promise<void> {
  const rect = selection.value
  if (!rect || tooSmall.value || busy.value) return
  busy.value = true
  const result = await window.api.capture.commitSelection({
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
  })
  // The main process closes this window on success; stay open only when the selection was refused.
  busy.value = false
  if (!result.ok) console.warn(result.error.message)
}

const cancel = (): void => void window.api.capture.cancel()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') cancel()
  else if (event.key === 'Enter') void confirm()
  else if (event.key === ' ') {
    spaceHeld = true
    event.preventDefault()
  }
}
const onKeyup = (event: KeyboardEvent): void => {
  if (event.key === ' ') spaceHeld = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
})

const readoutStyle = computed(() => {
  const width = window.innerWidth
  const height = window.innerHeight
  // Keep the readout inside the screen: flip it to the other side of the cursor near an edge.
  const left = cursor.value.x + 160 > width ? cursor.value.x - 150 : cursor.value.x + 16
  const top = cursor.value.y + 70 > height ? cursor.value.y - 60 : cursor.value.y + 16
  return { left: `${left}px`, top: `${top}px` }
})
const selectionStyle = computed(() => {
  const rect = selection.value
  return rect ? { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` } : {}
})
const handleStyle = (handle: (typeof HANDLES)[number]) => {
  const rect = selection.value!
  return { left: `${rect.x + rect.width * handle.x - 4}px`, top: `${rect.y + rect.height * handle.y - 4}px`, cursor: handle.cursor }
}
</script>

<template>
  <div
    class="fixed inset-0 cursor-crosshair overflow-hidden bg-black"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @contextmenu.prevent="cancel"
    @dblclick="confirm"
  >
    <img
      v-if="frame"
      :src="frame.frameUrl"
      alt=""
      class="pointer-events-none absolute inset-0 size-full select-none"
      draggable="false"
    >
    <!-- The screen is dimmed everywhere except the chosen region, which keeps the real picture (UI/UX Design Plan 5.1). -->
    <div
      v-if="!selection"
      class="pointer-events-none absolute inset-0 bg-black/45"
    />
    <div
      v-else
      class="pointer-events-none absolute border border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
      :style="selectionStyle"
    />

    <template v-if="mode !== 'drawing' && mode !== 'moving'">
      <div
        class="pointer-events-none absolute top-0 h-full w-px bg-white/60"
        :style="{ left: `${cursor.x}px` }"
      />
      <div
        class="pointer-events-none absolute left-0 h-px w-full bg-white/60"
        :style="{ top: `${cursor.y}px` }"
      />
    </template>

    <template v-if="selection && mode === 'selected'">
      <span
        v-for="handle in HANDLES"
        :key="handle.id"
        class="absolute size-2 border border-black bg-white"
        :style="handleStyle(handle)"
        @pointerdown="startResize($event, handle)"
      />
      <button
        type="button"
        class="absolute rounded-sm bg-accent px-3 py-1 text-caption font-medium text-white"
        :style="{ left: `${selection.x}px`, top: `${selection.y + selection.height + 8}px` }"
        @pointerdown.stop
        @click="confirm"
      >
        ยืนยัน (Enter)
      </button>
    </template>

    <p
      v-if="!selection"
      class="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 rounded-md bg-black/70 px-4 py-2 text-white"
    >
      ลากเพื่อเลือกบริเวณ Item · Enter ยืนยัน · Esc ยกเลิก
    </p>

    <div
      v-if="deviceSize"
      class="font-numeric pointer-events-none absolute rounded-sm bg-black/80 px-2 py-1 text-caption tabular-nums text-white"
      :style="readoutStyle"
    >
      <div>{{ Math.round((selection?.x ?? 0) * scale) }}, {{ Math.round((selection?.y ?? 0) * scale) }}</div>
      <div>{{ deviceSize.width }} × {{ deviceSize.height }} px</div>
      <div
        v-if="tooSmall"
        class="text-status-missing-overlay"
      >
        เล็กเกินไป
      </div>
    </div>
  </div>
</template>
