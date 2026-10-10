<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { ItemCategory, ItemDto, ItemUsage } from '../../electron/ipc/contracts'
import AppIcon from '../components/AppIcon.vue'
import BaseDialog from '../components/BaseDialog.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import ItemCard from '../components/ItemCard.vue'
import ItemEditDialog from '../components/ItemEditDialog.vue'
import SearchField from '../components/SearchField.vue'
import StepSelector from '../components/StepSelector.vue'
import { step, useInventory } from '../stores/inventory'
import { useItems } from '../stores/items'
import { useToasts } from '../stores/toasts'

const { items, loaded, byId } = useItems()
const inventory = useInventory()
const toasts = useToasts()

const search = ref('')
const category = ref<ItemCategory | null>(null)
const pinnedOnly = ref(false)
const searchField = useTemplateRef<InstanceType<typeof SearchField>>('searchField')

const visible = computed(() => {
  const text = search.value.trim().toLowerCase()
  return items.value.filter(
    (item) =>
      (category.value === null || item.category === category.value) &&
      (!pinnedOnly.value || item.pinned) &&
      (text === '' || item.name.toLowerCase().includes(text)),
  )
})

// ----- create and edit -----
const editOpen = ref(false)
const editing = ref<ItemDto | null>(null)
const initialName = ref('')

function openCreate(name = ''): void {
  editing.value = null
  initialName.value = name
  editOpen.value = true
}

function openEdit(item: ItemDto): void {
  editing.value = item
  editOpen.value = true
}

function openById(id: number): void {
  const item = byId.value.get(id)
  if (item) openEdit(item)
}

async function togglePin(item: ItemDto): Promise<void> {
  const result = await window.api.items.setPinned({ id: item.id, pinned: !item.pinned })
  if (!result.ok) toasts.error(result.error.message)
}

// ----- delete (F2-R12 to F2-R15) -----
const deleteTarget = ref<ItemDto | null>(null)
const deleteUsages = ref<ItemUsage[]>([])
const deleteOpen = ref(false)

const blockers = computed(() => deleteUsages.value.filter((usage) => usage.kind !== 'recipe_output'))
const cascadeRecipes = computed(() => deleteUsages.value.filter((usage) => usage.kind === 'recipe_output'))

async function askDelete(item: ItemDto): Promise<void> {
  const result = await window.api.items.getUsage({ id: item.id })
  if (!result.ok) {
    toasts.error(result.error.message)
    return
  }
  deleteTarget.value = item
  deleteUsages.value = result.data
  editOpen.value = false
  deleteOpen.value = true
}

async function confirmDelete(): Promise<void> {
  const item = deleteTarget.value
  if (!item) return
  const result = await window.api.items.delete({ id: item.id })
  deleteOpen.value = false
  if (result.ok) toasts.success(`ลบ “${item.name}” แล้ว`)
  else toasts.error(result.error.message)
}

const usageText = (usage: ItemUsage): string =>
  usage.kind === 'recipe' ? `Recipe “${usage.label}” ใช้เป็นวัตถุดิบ` : `Quest “${usage.label}” ใช้เป็น Requirement`

// ----- keyboard -----
function onKeydown(event: KeyboardEvent): void {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)
  if (event.key === '/' && !typing) {
    event.preventDefault()
    searchField.value?.focus()
  } else if (event.ctrlKey && event.key.toLowerCase() === 'n') {
    event.preventDefault()
    openCreate()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="mr-2 text-heading font-bold">
        Items
      </h1>
      <SearchField
        ref="searchField"
        v-model="search"
        placeholder="ค้นหา Item…  ( / )"
        @submit="visible.length === 0 && search.trim() && openCreate(search.trim())"
      />
      <CategoryFilter v-model="category" />
      <label class="flex items-center gap-2 text-caption text-text-muted">
        <input
          v-model="pinnedOnly"
          type="checkbox"
        >
        <AppIcon
          name="pin"
          :size="14"
        />Pinned เท่านั้น
      </label>
      <StepSelector v-model="step" />
      <button
        type="button"
        class="ml-auto flex h-(--size-hit) items-center gap-2 rounded-md bg-accent px-3 font-medium text-white hover:bg-accent-hover"
        title="สร้าง Item ใหม่ (Ctrl+N)"
        @click="openCreate()"
      >
        <AppIcon
          name="plus"
          :size="16"
        />Item ใหม่
      </button>
    </div>

    <div
      v-if="!loaded"
      class="flex flex-wrap gap-4"
      aria-busy="true"
    >
      <div
        v-for="n in 8"
        :key="n"
        class="h-32 w-52 animate-pulse rounded-lg bg-surface-2"
      />
    </div>

    <EmptyState
      v-else-if="items.length === 0"
      title="ยังไม่มี Item ใน Profile นี้"
      description="เพิ่ม Item ทีละรายการ พร้อมรูปจากไฟล์หรือ Clipboard ได้"
    >
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
        @click="openCreate()"
      >
        สร้างด้วยมือ
      </button>
    </EmptyState>

    <EmptyState
      v-else-if="visible.length === 0"
      :title="`ไม่พบ Item ที่ตรงกับ “${search}”`"
    >
      <button
        v-if="search.trim()"
        type="button"
        class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
        @click="openCreate(search.trim())"
      >
        สร้าง Item “{{ search.trim() }}”
      </button>
    </EmptyState>

    <div
      v-else
      class="flex flex-wrap gap-4"
    >
      <ItemCard
        v-for="item in visible"
        :key="item.id"
        :item="item"
        :step="step"
        @edit="openEdit(item)"
        @toggle-pin="togglePin(item)"
        @adjust="inventory.adjust(item.id, $event)"
        @set="inventory.set(item.id, $event)"
      />
    </div>

    <ItemEditDialog
      :open="editOpen"
      :item="editing"
      :initial-name="initialName"
      @close="editOpen = false"
      @saved="editOpen = false"
      @delete="askDelete"
      @open-item="openById"
    />

    <!-- An item that something still uses cannot be deleted; list where it is used instead (F2-R12). -->
    <BaseDialog
      :open="deleteOpen && blockers.length > 0"
      title="ลบ Item ไม่ได้"
      @close="deleteOpen = false"
    >
      <p>“{{ deleteTarget?.name }}” ยังถูกใช้งานอยู่ ต้องเอาออกจากที่เหล่านี้ก่อน:</p>
      <ul class="list-disc pl-6 text-text-muted">
        <li
          v-for="usage in blockers"
          :key="`${usage.kind}-${usage.id}`"
        >
          {{ usageText(usage) }}
        </li>
      </ul>
      <div class="flex justify-end">
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
          @click="deleteOpen = false"
        >
          ปิด
        </button>
      </div>
    </BaseDialog>

    <ConfirmDialog
      :open="deleteOpen && blockers.length === 0"
      title="ลบ Item"
      confirm-label="ลบ"
      destructive
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    >
      <p>ลบ “{{ deleteTarget?.name }}” ถาวร</p>
      <p v-if="deleteTarget && deleteTarget.owned > 0">
        จำนวนที่ถืออยู่ {{ deleteTarget.owned }} จะหายไปด้วย
      </p>
      <p v-if="cascadeRecipes.length">
        Recipe ที่สร้าง Item นี้จะถูกลบตามไปด้วย (พร้อมวัตถุดิบและการติดตาม):
        {{ cascadeRecipes.map((usage) => `“${usage.label}”`).join(', ') }}
      </p>
    </ConfirmDialog>
  </div>
</template>
