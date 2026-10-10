<script setup lang="ts">
import type { GatheringItemRow } from '../../electron/ipc/contracts'
import AppIcon from './AppIcon.vue'
import ItemThumbnail from './ItemThumbnail.vue'
import ProgressBar from './ProgressBar.vue'
import QuantityStepper from './QuantityStepper.vue'
import StatusBadge from './StatusBadge.vue'

defineProps<{ rows: GatheringItemRow[]; step: number }>()
defineEmits<{ adjust: [itemId: number, delta: number]; set: [itemId: number, value: number]; togglePin: [itemId: number, pinned: boolean] }>()
</script>

<template>
  <table class="w-full border-collapse text-left">
    <thead class="sticky top-0 bg-surface-0 text-caption text-text-muted">
      <tr>
        <th class="w-12 border-b border-border py-2" />
        <th class="border-b border-border py-2 font-medium">
          Item
        </th>
        <th class="border-b border-border py-2 text-right font-medium">
          Required
        </th>
        <th class="border-b border-border px-4 py-2 font-medium">
          Owned
        </th>
        <th class="border-b border-border py-2 font-medium">
          Missing
        </th>
        <th class="w-48 border-b border-border py-2 font-medium">
          Progress
        </th>
        <th class="w-10 border-b border-border py-2" />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row.itemId"
        class="h-12 border-b border-border hover:bg-surface-1"
      >
        <td class="py-1">
          <ItemThumbnail
            :src="row.thumbnailUrl"
            :name="row.name"
            :size="40"
          />
        </td>
        <th
          scope="row"
          class="font-medium"
        >
          {{ row.name }}
          <span class="ml-1 text-caption font-normal text-text-muted">{{ row.category }}</span>
        </th>
        <td class="font-numeric text-right text-number tabular-nums">
          {{ row.required }}
        </td>
        <td class="px-4">
          <QuantityStepper
            :model-value="row.owned"
            :step="step"
            :name="row.name"
            @adjust="$emit('adjust', row.itemId, $event)"
            @set="$emit('set', row.itemId, $event)"
          />
        </td>
        <td>
          <StatusBadge
            :required="row.required"
            :owned="row.owned"
            :missing="row.missing"
          />
        </td>
        <td>
          <ProgressBar
            :owned="row.owned"
            :required="row.required"
          />
        </td>
        <td>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-sm hover:bg-surface-3"
            :class="row.pinned ? 'text-accent-text' : 'text-text-muted'"
            :aria-pressed="row.pinned"
            :aria-label="row.pinned ? `เลิก Pin ${row.name}` : `Pin ${row.name}`"
            @click="$emit('togglePin', row.itemId, !row.pinned)"
          >
            <AppIcon
              name="pin"
              :size="16"
            />
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
