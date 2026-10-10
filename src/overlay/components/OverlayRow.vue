<script setup lang="ts">
import { computed } from 'vue'
import ItemThumbnail from '../../components/ItemThumbnail.vue'
import { statusOf, statusTextOverlay } from '../../status'

export interface OverlayRowData {
  itemId: number
  name: string
  thumbnailUrl: string | null
  /** Items: owned. Targets: allocated. */
  have: number
  need: number
  missing: number
  pinned?: boolean
}

const props = defineProps<{ row: OverlayRowData; compact: boolean; interactive: boolean; step: number; allocated: boolean }>()
const emit = defineEmits<{ adjust: [itemId: number, delta: number] }>()

const role = computed(() => statusOf(props.row.need, props.row.have))
const color = computed(() => statusTextOverlay[role.value])
</script>

<template>
  <li
    v-if="compact"
    class="flex h-8 items-center gap-2 px-2"
  >
    <ItemThumbnail
      :src="row.thumbnailUrl"
      :name="row.name"
      :size="24"
    />
    <span class="overlay-text min-w-0 flex-1 truncate text-[13px]">
      <span v-if="row.pinned">📌 </span>{{ row.name }}
    </span>
    <span class="overlay-text font-numeric text-sm font-bold tabular-nums">{{ row.have }}/{{ row.need }}</span>
    <span
      v-if="!interactive"
      class="overlay-text font-numeric w-10 text-right text-sm font-bold tabular-nums"
      :class="color"
    >{{ row.missing > 0 ? `−${row.missing}` : '✓' }}</span>
    <span
      v-else
      class="flex gap-1"
    >
      <button
        type="button"
        class="grid size-7 place-items-center rounded-sm bg-surface-3 text-sm hover:bg-border"
        :aria-label="`ลด ${row.name}`"
        @click="emit('adjust', row.itemId, -step)"
      >−</button>
      <button
        type="button"
        class="grid size-7 place-items-center rounded-sm bg-surface-3 text-sm hover:bg-border"
        :aria-label="`เพิ่ม ${row.name}`"
        @click="emit('adjust', row.itemId, step)"
      >+</button>
    </span>
  </li>

  <li
    v-else
    class="flex h-14 items-center gap-3 px-3"
  >
    <ItemThumbnail
      :src="row.thumbnailUrl"
      :name="row.name"
      :size="32"
    />
    <span class="min-w-0 flex-1">
      <span class="overlay-text block truncate text-sm font-semibold">
        <span v-if="row.pinned">📌 </span>{{ row.name }}
      </span>
      <span class="flex items-baseline gap-3">
        <span class="overlay-text font-numeric text-[18px] font-bold tabular-nums">
          {{ allocated ? 'จัดสรร ' : '' }}{{ row.have }} / {{ row.need }}
        </span>
        <span
          class="overlay-text text-sm"
          :class="color"
        >{{ row.missing > 0 ? `Missing ${row.missing}` : 'ครบ' }}</span>
      </span>
    </span>
    <span
      class="flex gap-2"
      :class="interactive ? '' : 'opacity-40'"
    >
      <button
        type="button"
        :disabled="!interactive"
        class="grid size-7 place-items-center rounded-sm bg-surface-3 hover:bg-border"
        :aria-label="`ลด ${row.name}`"
        @click="emit('adjust', row.itemId, -step)"
      >{{ step > 1 ? `−${step}` : '−' }}</button>
      <button
        type="button"
        :disabled="!interactive"
        class="grid size-7 place-items-center rounded-sm bg-surface-3 hover:bg-border"
        :aria-label="`เพิ่ม ${row.name}`"
        @click="emit('adjust', row.itemId, step)"
      >{{ step > 1 ? `+${step}` : '+' }}</button>
    </span>
  </li>
</template>
