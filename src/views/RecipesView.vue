<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import ItemThumbnail from '../components/ItemThumbnail.vue'
import RecipeEditor from '../components/RecipeEditor.vue'
import SearchField from '../components/SearchField.vue'
import { useItems } from '../stores/items'
import { useRecipes } from '../stores/recipes'

const { byId } = useItems()
const { recipes, loaded } = useRecipes()

const search = ref('')
const selectedId = ref<number | null>(null)
// `creating` shows an empty editor for a recipe that does not exist yet.
const creating = ref(false)
const editor = useTemplateRef<InstanceType<typeof RecipeEditor>>('editor')
const nameOf = (itemId: number): string => byId.value.get(itemId)?.name ?? `#${itemId}`

const filtered = computed(() => {
  const text = search.value.trim().toLowerCase()
  return recipes.value
    .filter((recipe) => text === '' || nameOf(recipe.outputItemId).toLowerCase().includes(text))
    .sort((a, b) => nameOf(a.outputItemId).localeCompare(nameOf(b.outputItemId)))
})

const selected = computed(() => recipes.value.find((recipe) => recipe.id === selectedId.value) ?? null)

// Leaving an edited recipe asks first so changes are not lost by accident.
const pendingMove = ref<(() => void) | null>(null)
function guard(action: () => void): void {
  if (editor.value?.dirty) pendingMove.value = action
  else action()
}

const select = (id: number): void => guard(() => {
  selectedId.value = id
  creating.value = false
})
const createNew = (): void => guard(() => {
  selectedId.value = null
  creating.value = true
})

function saved(id: number): void {
  selectedId.value = id
  creating.value = false
}

function deleted(): void {
  selectedId.value = null
  creating.value = false
}

function discard(): void {
  const move = pendingMove.value
  pendingMove.value = null
  move?.()
}
</script>

<template>
  <div class="flex h-full">
    <aside class="flex w-75 shrink-0 flex-col gap-3 border-r border-border p-4">
      <h1 class="text-heading font-bold">
        Recipes
      </h1>
      <SearchField
        v-model="search"
        placeholder="ค้นหา Recipe…"
      />
      <button
        type="button"
        class="flex h-(--size-hit) items-center justify-center gap-2 rounded-md bg-accent font-medium text-white hover:bg-accent-hover"
        @click="createNew"
      >
        <AppIcon
          name="plus"
          :size="16"
        />Recipe ใหม่
      </button>
      <ul class="flex flex-col gap-1 overflow-auto">
        <li
          v-for="recipe in filtered"
          :key="recipe.id"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-surface-3"
            :class="recipe.id === selectedId ? 'bg-surface-3' : ''"
            :aria-current="recipe.id === selectedId ? 'true' : undefined"
            @click="select(recipe.id)"
          >
            <ItemThumbnail
              :src="byId.get(recipe.outputItemId)?.thumbnailUrl ?? null"
              :name="nameOf(recipe.outputItemId)"
              :size="40"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ nameOf(recipe.outputItemId) }}</span>
              <span class="text-caption text-text-muted">×{{ recipe.outputQty }} · {{ recipe.ingredients.length }} วัตถุดิบ</span>
            </span>
            <span
              v-if="recipe.trackingTargetId !== null"
              class="text-accent-text"
              title="ถูกติดตามอยู่"
            >⊙</span>
          </button>
        </li>
      </ul>
    </aside>

    <section class="min-w-0 flex-1 overflow-auto p-6">
      <RecipeEditor
        v-if="selected || creating"
        ref="editor"
        :key="selected?.id ?? 'new'"
        :recipe="selected"
        @saved="saved"
        @deleted="deleted"
        @open-recipe="select"
      />
      <EmptyState
        v-else-if="loaded && recipes.length === 0"
        title="สร้าง Recipe แรก"
        description="Recipe บอกว่า Item หนึ่งชิ้นใช้วัตถุดิบอะไรและเท่าไร รองรับสูตรซ้อนกันและกันวงวน"
      >
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
          @click="createNew"
        >
          สร้าง Recipe
        </button>
      </EmptyState>
      <EmptyState
        v-else
        title="เลือก Recipe ทางซ้าย หรือสร้างใหม่"
      />
    </section>

    <ConfirmDialog
      :open="pendingMove !== null"
      title="ทิ้งการแก้ไข?"
      confirm-label="ทิ้ง"
      destructive
      @confirm="discard"
      @cancel="pendingMove = null"
    >
      <p>Recipe นี้มีการแก้ไขที่ยังไม่ได้บันทึก</p>
    </ConfirmDialog>
  </div>
</template>
