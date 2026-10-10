<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'
import { useItems } from '../stores/items'
import { useToasts } from '../stores/toasts'
import ItemThumbnail from './ItemThumbnail.vue'

const props = withDefaults(defineProps<{ exclude?: number[]; placeholder?: string }>(), {
  exclude: () => [],
  placeholder: 'พิมพ์ชื่อ Item…',
})
const emit = defineEmits<{ select: [itemId: number] }>()

const { items } = useItems()
const toasts = useToasts()

const query = ref('')
const open = ref(false)
const listId = useId()
const input = useTemplateRef<HTMLInputElement>('input')

const matches = computed(() => {
  const text = query.value.trim().toLowerCase()
  return items.value.filter((item) => !props.exclude.includes(item.id) && (text === '' || item.name.toLowerCase().includes(text))).slice(0, 8)
})
const exactMatch = computed(() => items.value.some((item) => item.name.toLowerCase() === query.value.trim().toLowerCase()))
const canCreate = computed(() => query.value.trim() !== '' && !exactMatch.value)

function choose(id: number): void {
  query.value = ''
  open.value = false
  emit('select', id)
}

// Typing a name that does not exist and pressing Enter creates the item on the spot (UI/UX Design Plan 3.3).
async function create(): Promise<void> {
  const result = await window.api.items.create({ name: query.value })
  if (result.ok) choose(result.data.id)
  else toasts.error(result.error.message)
}

async function submit(): Promise<void> {
  const first = matches.value[0]
  if (first && (exactMatch.value || !canCreate.value)) choose(first.id)
  else if (canCreate.value) await create()
}

defineExpose({ focus: (): void => input.value?.focus() })
</script>

<template>
  <div class="relative">
    <input
      ref="input"
      v-model="query"
      type="text"
      role="combobox"
      autocomplete="off"
      :placeholder="placeholder"
      :aria-expanded="open"
      :aria-controls="listId"
      aria-label="เลือก Item"
      class="h-(--size-hit) w-full rounded-md border border-border bg-surface-2 px-3 text-text select-text"
      @focus="open = true"
      @input="open = true"
      @keydown.enter.prevent="submit"
      @keydown.esc="open = false"
      @blur="open = false"
    >
    <ul
      v-if="open && (matches.length || canCreate)"
      :id="listId"
      role="listbox"
      class="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-surface-1 py-1 shadow-lg"
    >
      <li
        v-for="item in matches"
        :key="item.id"
        role="option"
        class="flex cursor-pointer items-center gap-2 px-3 py-1 hover:bg-surface-3"
        @mousedown.prevent="choose(item.id)"
      >
        <ItemThumbnail
          :src="item.thumbnailUrl"
          :name="item.name"
          :size="24"
        />
        <span class="truncate">{{ item.name }}</span>
        <span class="ml-auto text-caption text-text-muted">{{ item.category }}</span>
      </li>
      <li
        v-if="canCreate"
        role="option"
        class="cursor-pointer px-3 py-1 text-accent-text hover:bg-surface-3"
        @mousedown.prevent="create"
      >
        สร้าง Item “{{ query.trim() }}”
      </li>
    </ul>
  </div>
</template>
