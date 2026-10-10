<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { Bounds, OverlayState } from '../../electron/ipc/contracts'
import { statusFill, statusOf } from '../status'
import { useGathering } from '../stores/gathering'
import { step } from '../stores/inventory'
import { useSettings } from '../stores/settings'
import OverlayHeader from './components/OverlayHeader.vue'
import OverlayResizeGrip from './components/OverlayResizeGrip.vue'
import OverlayRow, { type OverlayRowData } from './components/OverlayRow.vue'

const FULL_ROW = 56
const COMPACT_ROW = 32

const gathering = useGathering()
const settings = useSettings()

// The overlay is driven only by the gathering result, inventory pushes and its own state (F9-R11).
const state = ref<OverlayState>({
  visible: true,
  mode: 'view',
  opacity: 0.9,
  compact: false,
  bounds: null,
  scope: 'all',
  scopeLabel: null,
  pinnedTargetCount: 0,
})
void window.api.overlay.getState().then((result) => {
  if (result.ok) state.value = result.data
})
const stopState = window.api.on('overlay:changed', (next) => {
  state.value = next
})
onBeforeUnmount(stopState)

const interactive = computed(() => state.value.mode === 'interactive')
const hideComplete = computed(() => settings.settings.value?.preferences.hideComplete ?? false)
const result = gathering.result

// "All" shows the pinned items only when there are any, otherwise everything, missing first (F9-R8).
const rows = computed<OverlayRowData[]>(() => {
  if (state.value.scope !== 'all') {
    const target = result.value.perTarget.find((entry) => entry.targetId === state.value.scope)
    return (target?.rows ?? []).map((row) => ({
      itemId: row.itemId,
      name: row.name,
      thumbnailUrl: row.thumbnailUrl,
      have: row.allocated,
      need: row.need,
      missing: row.missing,
    }))
  }
  const all = result.value.items
  const pinned = all.filter((row) => row.pinned)
  const source = pinned.length > 0 ? pinned : hideComplete.value ? all.filter((row) => row.missing > 0) : all
  return [...source]
    .sort((a, b) => b.missing - a.missing || a.name.localeCompare(b.name))
    .map((row) => ({
      itemId: row.itemId,
      name: row.name,
      thumbnailUrl: row.thumbnailUrl,
      have: row.owned,
      need: row.required,
      missing: row.missing,
      pinned: row.pinned,
    }))
})

const footer = computed(() => {
  if (state.value.scope === 'all') return { label: 'Overall Progress', ...result.value.overall }
  const target = result.value.perTarget.find((entry) => entry.targetId === state.value.scope)
  const owned = target?.rows.reduce((sum, row) => sum + row.allocated, 0) ?? 0
  const required = target?.rows.reduce((sum, row) => sum + row.need, 0) ?? 0
  return { label: 'จัดสรร', owned, required }
})

// Rows that do not fit are summarised as "+N รายการ"; Interactive mode scrolls instead (UI/UX Design Plan 4.1).
const list = useTemplateRef<HTMLElement>('list')
const capacity = ref(Infinity)
const rowHeight = computed(() => (state.value.compact ? COMPACT_ROW : FULL_ROW))
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!list.value) return
  observer = new ResizeObserver(([entry]) => {
    capacity.value = Math.max(1, Math.floor((entry?.contentRect.height ?? 0) / rowHeight.value))
  })
  observer.observe(list.value)
})
onBeforeUnmount(() => observer?.disconnect())

const shown = computed(() => (interactive.value ? rows.value : rows.value.slice(0, Number.isFinite(capacity.value) ? capacity.value : undefined)))
const hiddenCount = computed(() => (interactive.value ? 0 : Math.max(0, rows.value.length - shown.value.length)))

const resizing = ref<string | null>(null)

function adjust(itemId: number, delta: number): void {
  void window.api.inventory.adjust({ itemId, delta })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && interactive.value) void window.api.overlay.setMode('view')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const cycle = (direction: 1 | -1): void => void window.api.overlay.cycleScope({ direction })
const setStep = (size: number): void => {
  step.value = size
}
const setOpacity = (opacity: number): void => void window.api.overlay.setOpacity({ opacity })
const toggleCompact = (): void => void window.api.overlay.setCompact({ compact: !state.value.compact })
const openMain = (): void => void window.api.overlay.focusMainWindow()
const hideOverlay = (): void => void window.api.overlay.hide()
const setBounds = (bounds: Bounds): void => void window.api.overlay.setBounds(bounds)
const percent = computed(() => (footer.value.required > 0 ? Math.round((Math.min(footer.value.owned, footer.value.required) / footer.value.required) * 100) : 0))
</script>

<template>
  <div
    class="relative flex h-full flex-col overflow-hidden rounded-lg bg-overlay-bg text-[#f5f6f8]"
    :class="interactive ? 'border border-overlay-border' : ''"
  >
    <OverlayHeader
      :state="state"
      :step="step"
      @cycle="cycle"
      @step="setStep"
      @opacity="setOpacity"
      @toggle-compact="toggleCompact"
      @open-main="openMain"
      @hide="hideOverlay"
    />

    <div
      ref="list"
      class="min-h-0 flex-1"
      :class="interactive ? 'overflow-auto' : 'overflow-hidden'"
    >
      <p
        v-if="result.perTarget.length === 0 && state.scope === 'all'"
        class="overlay-text px-3 py-4 text-sm"
      >
        ยังไม่ได้เลือกสิ่งที่ติดตาม<br>
        <span class="text-text-muted">เปิดแอปหลักเพื่อเลือก</span>
      </p>
      <p
        v-else-if="rows.length === 0"
        class="overlay-text px-3 py-4 text-sm text-text-muted"
      >
        ไม่มีรายการ
      </p>
      <ul v-else>
        <OverlayRow
          v-for="row in shown"
          :key="row.itemId"
          :row="row"
          :compact="state.compact"
          :interactive="interactive"
          :step="step"
          :allocated="state.scope !== 'all'"
          @adjust="adjust"
        />
      </ul>
    </div>

    <footer class="flex items-center gap-2 px-3 py-1.5 pr-6">
      <span
        v-if="hiddenCount > 0"
        class="overlay-text text-caption text-text-muted"
      >+{{ hiddenCount }} รายการ</span>
      <span
        v-if="resizing"
        class="overlay-text font-numeric text-caption tabular-nums"
      >{{ resizing }}</span>
      <span class="flex-1" />
      <span class="overlay-text font-numeric text-sm font-bold tabular-nums">{{ footer.label }}: {{ footer.owned }} / {{ footer.required }}</span>
    </footer>
    <div class="mx-3 mb-2 h-1 overflow-hidden rounded-full bg-surface-3">
      <div
        class="h-full rounded-full"
        :class="statusFill[statusOf(footer.required, footer.owned)]"
        :style="{ width: `${percent}%` }"
      />
    </div>

    <OverlayResizeGrip
      v-if="interactive"
      :bounds="state.bounds"
      @resize="setBounds"
      @size="resizing = $event"
    />
  </div>
</template>
