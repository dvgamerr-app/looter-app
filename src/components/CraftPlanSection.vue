<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GatheringCraftRow } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import ItemThumbnail from './ItemThumbnail.vue'

const props = defineProps<{ rows: GatheringCraftRow[] }>()
defineEmits<{ craft: [row: GatheringCraftRow] }>()

const { byId } = useItems()
const open = ref(true)

const describe = computed(() =>
  props.rows.map((row) => ({
    row,
    ingredients: row.ingredientsPerRun.map((ingredient) => `${byId.value.get(ingredient.itemId)?.name ?? `#${ingredient.itemId}`} ×${ingredient.qty}`).join(', '),
  })),
)
</script>

<template>
  <section class="border-t border-border">
    <button
      type="button"
      class="flex w-full items-center gap-2 py-2 text-left font-medium"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
      Craft plan
      <span class="text-caption font-normal text-text-muted">(Item ระดับกลางที่ต้อง Craft)</span>
    </button>
    <div v-if="open">
      <p
        v-if="rows.length === 0"
        class="pb-3 text-text-muted"
      >
        ไม่มี Item ระดับกลางที่ต้อง Craft
      </p>
      <ul class="flex flex-col gap-1 pb-3">
        <li
          v-for="entry in describe"
          :key="entry.row.recipeId"
          class="flex items-center gap-3 rounded-md bg-surface-2 p-2"
        >
          <ItemThumbnail
            :src="entry.row.outputThumbnailUrl"
            :name="entry.row.outputName"
            :size="32"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ entry.row.outputName }} × {{ entry.row.runs }} รอบ</span>
            <span class="block truncate text-caption text-text-muted">ต่อรอบ: {{ entry.ingredients || '–' }}</span>
          </span>
          <span class="font-numeric tabular-nums text-text-muted">Required {{ entry.row.required }} / Owned {{ entry.row.owned }}</span>
          <button
            type="button"
            class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
            @click="$emit('craft', entry.row)"
          >
            Craft
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
