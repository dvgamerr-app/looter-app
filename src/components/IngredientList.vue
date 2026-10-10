<script setup lang="ts">
import type { IngredientInput } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import AppIcon from './AppIcon.vue'
import ItemPicker from './ItemPicker.vue'
import ItemThumbnail from './ItemThumbnail.vue'
import ModeToggle from './ModeToggle.vue'
import QuantityStepper from './QuantityStepper.vue'

const model = defineModel<IngredientInput[]>({ required: true })
defineProps<{
  /** Heading of the list: "วัตถุดิบ" for a recipe, "Requirements" for a quest. */
  label: string
  /** Rows to flag, for example the ingredient that closes a recipe cycle. */
  highlightIds?: number[]
  /** Items that cannot be added, for example the recipe's own output. */
  excludeIds?: number[]
}>()

const { byId } = useItems()

function add(itemId: number): void {
  if (model.value.some((entry) => entry.itemId === itemId)) return
  model.value = [...model.value, { itemId, qty: 1, mode: 'craft' }]
}

function patch(index: number, change: Partial<IngredientInput>): void {
  model.value = model.value.map((entry, position) => (position === index ? { ...entry, ...change } : entry))
}

function remove(index: number): void {
  model.value = model.value.filter((_, position) => position !== index)
}

function move(index: number, direction: -1 | 1): void {
  const target = index + direction
  if (target < 0 || target >= model.value.length) return
  const next = [...model.value]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  model.value = next
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <h3 class="font-medium">
      {{ label }}
    </h3>

    <ul class="flex flex-col gap-1">
      <li
        v-for="(entry, index) in model"
        :key="entry.itemId"
        class="flex items-center gap-3 rounded-md border bg-surface-2 p-2"
        :class="highlightIds?.includes(entry.itemId) ? 'border-status-missing' : 'border-border'"
        @keydown.alt.up.prevent="move(index, -1)"
        @keydown.alt.down.prevent="move(index, 1)"
      >
        <span class="flex flex-col">
          <button
            type="button"
            class="rounded-sm text-text-muted hover:text-text disabled:opacity-30"
            :disabled="index === 0"
            :aria-label="`เลื่อน ${byId.get(entry.itemId)?.name ?? ''} ขึ้น`"
            @click="move(index, -1)"
          >
            <AppIcon
              name="arrowUp"
              :size="14"
            />
          </button>
          <button
            type="button"
            class="rounded-sm text-text-muted hover:text-text disabled:opacity-30"
            :disabled="index === model.length - 1"
            :aria-label="`เลื่อน ${byId.get(entry.itemId)?.name ?? ''} ลง`"
            @click="move(index, 1)"
          >
            <AppIcon
              name="arrowDown"
              :size="14"
            />
          </button>
        </span>
        <ItemThumbnail
          :src="byId.get(entry.itemId)?.thumbnailUrl ?? null"
          :name="byId.get(entry.itemId)?.name ?? '?'"
          :size="40"
        />
        <span class="min-w-0 flex-1 truncate">{{ byId.get(entry.itemId)?.name ?? `#${entry.itemId}` }}</span>
        <QuantityStepper
          :model-value="entry.qty"
          :name="byId.get(entry.itemId)?.name ?? ''"
          :min="1"
          compact
          @adjust="patch(index, { qty: entry.qty + $event })"
          @set="Number.isNaN($event) || $event < 1 ? undefined : patch(index, { qty: $event })"
        />
        <ModeToggle
          :model-value="entry.mode"
          :name="byId.get(entry.itemId)?.name ?? ''"
          :no-recipe="!byId.get(entry.itemId)?.hasRecipe"
          @update:model-value="patch(index, { mode: $event })"
        />
        <button
          type="button"
          class="grid size-7 place-items-center rounded-sm text-text-muted hover:bg-surface-3 hover:text-status-missing"
          :aria-label="`เอา ${byId.get(entry.itemId)?.name ?? ''} ออก`"
          @click="remove(index)"
        >
          <AppIcon
            name="close"
            :size="16"
          />
        </button>
      </li>
    </ul>

    <p
      v-if="model.length === 0"
      class="text-caption text-text-muted"
    >
      ยังไม่มีรายการ
    </p>

    <ItemPicker
      :exclude="[...model.map((entry) => entry.itemId), ...(excludeIds ?? [])]"
      placeholder="+ เพิ่ม Item (พิมพ์ชื่อแล้วกด Enter เพื่อเลือกหรือสร้างใหม่)"
      @select="add"
    />
  </section>
</template>
