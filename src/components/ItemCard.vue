<script setup lang="ts">
import type { ItemDto } from '../../electron/ipc/contracts'
import AppIcon from './AppIcon.vue'
import ItemThumbnail from './ItemThumbnail.vue'
import QuantityStepper from './QuantityStepper.vue'

defineProps<{ item: ItemDto; step: number }>()
const emit = defineEmits<{ edit: []; togglePin: []; adjust: [delta: number]; set: [value: number] }>()
</script>

<template>
  <article
    class="flex w-52 flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3"
    @keydown.enter.self="emit('edit')"
  >
    <button
      type="button"
      class="flex items-center gap-3 rounded-md text-left"
      :aria-label="`แก้ไข ${item.name}`"
      @click="emit('edit')"
    >
      <ItemThumbnail
        :src="item.thumbnailUrl"
        :name="item.name"
        :size="64"
      />
      <span class="min-w-0">
        <span class="block truncate font-bold">{{ item.name }}</span>
        <span class="text-caption text-text-muted">{{ item.category }}</span>
        <span
          v-if="item.hasRecipe"
          class="ml-1 text-caption text-accent-text"
          title="มี Recipe"
        >⚒</span>
      </span>
    </button>
    <div class="flex items-center justify-between">
      <QuantityStepper
        :model-value="item.owned"
        :step="step"
        :name="item.name"
        compact
        @adjust="emit('adjust', $event)"
        @set="emit('set', $event)"
      />
      <button
        type="button"
        class="grid size-7 place-items-center rounded-sm hover:bg-surface-3"
        :class="item.pinned ? 'text-accent-text' : 'text-text-muted'"
        :aria-pressed="item.pinned"
        :aria-label="item.pinned ? `เลิก Pin ${item.name}` : `Pin ${item.name}`"
        @click="emit('togglePin')"
      >
        <AppIcon
          name="pin"
          :size="16"
        />
      </button>
    </div>
  </article>
</template>
