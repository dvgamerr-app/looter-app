<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { IngredientInput, RecipeDto, RecipeExpansionDto } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import { useToasts } from '../stores/toasts'
import ConfirmDialog from './ConfirmDialog.vue'
import ConsumeMaterialsDialog from './ConsumeMaterialsDialog.vue'
import CycleErrorBanner from './CycleErrorBanner.vue'
import IngredientList from './IngredientList.vue'
import ItemPicker from './ItemPicker.vue'
import ItemThumbnail from './ItemThumbnail.vue'
import QuantityStepper from './QuantityStepper.vue'
import RecipePreviewTree from './RecipePreviewTree.vue'

const props = defineProps<{ recipe: RecipeDto | null }>()
const emit = defineEmits<{ saved: [id: number]; deleted: []; openRecipe: [id: number] }>()

const { byId } = useItems()
const toasts = useToasts()

const outputItemId = ref<number | null>(null)
const outputQty = ref(1)
const station = ref('')
const notes = ref('')
const ingredients = ref<IngredientInput[]>([])

const cyclePath = ref<string[]>([])
const cycleIds = ref<number[]>([])
const outputError = ref('')
const duplicateId = ref<number | null>(null)
const busy = ref(false)

const previewQty = ref(1)
const expansion = ref<RecipeExpansionDto | null>(null)
const trackQty = ref(1)
const confirmDelete = ref(false)
const craftOpen = ref(false)

const snapshot = (): string =>
  JSON.stringify([outputItemId.value, outputQty.value, station.value, notes.value, ingredients.value])
let original = ''

const dirty = computed(() => snapshot() !== original)
defineExpose({ dirty })

function load(): void {
  const recipe = props.recipe
  outputItemId.value = recipe?.outputItemId ?? null
  outputQty.value = recipe?.outputQty ?? 1
  station.value = recipe?.station ?? ''
  notes.value = recipe?.notes ?? ''
  ingredients.value = recipe ? recipe.ingredients.map(({ itemId, qty, mode }) => ({ itemId, qty, mode })) : []
  cyclePath.value = []
  cycleIds.value = []
  outputError.value = ''
  duplicateId.value = null
  expansion.value = null
  previewQty.value = recipe?.outputQty ?? 1
  trackQty.value = 1
  original = snapshot()
  void refreshPreview()
}

watch(() => props.recipe, load)
onMounted(load)

// The draft is checked on every change so a loop is reported before the user presses save (F3 step 4).
async function validate(): Promise<void> {
  cyclePath.value = []
  cycleIds.value = []
  if (outputItemId.value === null) return
  const result = await window.api.recipes.validate({
    ...(props.recipe ? { id: props.recipe.id } : {}),
    outputItemId: outputItemId.value,
    ingredients: ingredients.value,
  })
  if (!result.ok && result.error.code === 'CYCLE') {
    const details = result.error.details as { path: string[]; itemIds: number[] }
    cyclePath.value = details.path
    cycleIds.value = details.itemIds
  }
}
watch([outputItemId, ingredients], () => void validate(), { deep: true })

async function refreshPreview(): Promise<void> {
  if (!props.recipe) {
    expansion.value = null
    return
  }
  const result = await window.api.recipes.expand({ id: props.recipe.id, quantity: Math.max(1, previewQty.value) })
  expansion.value = result.ok ? result.data : null
}
watch(previewQty, () => void refreshPreview())
// Inventory and item changes elsewhere change the "after owned" numbers of the preview.
const stopPreview = window.api.on('gathering:changed', () => void refreshPreview())
onBeforeUnmount(stopPreview)

async function save(): Promise<void> {
  if (busy.value || outputItemId.value === null) {
    outputError.value = 'เลือก Item ปลายทางก่อน'
    return
  }
  busy.value = true
  outputError.value = ''
  duplicateId.value = null
  const body = {
    outputItemId: outputItemId.value,
    outputQty: outputQty.value,
    station: station.value,
    notes: notes.value,
    ingredients: ingredients.value,
  }
  const result = props.recipe ? await window.api.recipes.update({ id: props.recipe.id, ...body }) : await window.api.recipes.create(body)
  busy.value = false
  if (result.ok) {
    original = snapshot()
    toasts.success('บันทึก Recipe แล้ว')
    emit('saved', result.data.id)
    return
  }
  if (result.error.code === 'CYCLE') {
    const details = result.error.details as { path: string[]; itemIds: number[] }
    cyclePath.value = details.path
    cycleIds.value = details.itemIds
  } else if (result.error.code === 'DUPLICATE_RECIPE') {
    outputError.value = result.error.message
    duplicateId.value = (result.error.details as { id: number }).id
  } else {
    toasts.error(result.error.message)
  }
}

async function remove(): Promise<void> {
  if (!props.recipe) return
  confirmDelete.value = false
  const result = await window.api.recipes.delete({ id: props.recipe.id })
  if (result.ok) {
    toasts.success('ลบ Recipe แล้ว')
    emit('deleted')
  } else {
    toasts.error(result.error.message)
  }
}

async function toggleTrack(): Promise<void> {
  if (!props.recipe) return
  const tracked = props.recipe.trackingTargetId
  const result =
    tracked === null
      ? await window.api.tracking.add({ kind: 'recipe', recipeId: props.recipe.id, targetQty: Math.max(1, trackQty.value) })
      : await window.api.tracking.remove({ id: tracked })
  if (!result.ok) toasts.error(result.error.message)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.ctrlKey && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void save()
  }
}
</script>

<template>
  <section
    class="flex flex-col gap-4"
    @keydown="onKeydown"
  >
    <h2 class="text-heading font-bold">
      {{ recipe ? (byId.get(recipe.outputItemId)?.name ?? 'Recipe') : 'Recipe ใหม่' }}
      <span
        v-if="dirty"
        class="text-status-warning"
        title="ยังไม่ได้บันทึก"
      >●</span>
    </h2>

    <div class="flex flex-wrap items-start gap-4">
      <div class="flex w-72 flex-col gap-1">
        <span class="text-caption text-text-muted">Item ปลายทาง</span>
        <div
          v-if="outputItemId !== null"
          class="flex items-center gap-2"
        >
          <ItemThumbnail
            :src="byId.get(outputItemId)?.thumbnailUrl ?? null"
            :name="byId.get(outputItemId)?.name ?? '?'"
            :size="40"
          />
          <span class="flex-1 truncate">{{ byId.get(outputItemId)?.name }}</span>
          <button
            type="button"
            class="text-caption underline"
            @click="outputItemId = null"
          >
            เปลี่ยน
          </button>
        </div>
        <ItemPicker
          v-else
          @select="outputItemId = $event"
        />
        <span
          v-if="outputError"
          class="text-caption text-status-missing"
          role="alert"
        >
          {{ outputError }}
          <button
            v-if="duplicateId"
            type="button"
            class="ml-2 underline"
            @click="emit('openRecipe', duplicateId)"
          >แก้ Recipe ที่มีอยู่</button>
        </span>
      </div>

      <div class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">ได้ต่อรอบ</span>
        <QuantityStepper
          :model-value="outputQty"
          name="จำนวนที่ได้ต่อรอบ"
          :min="1"
          @adjust="outputQty = Math.max(1, outputQty + $event)"
          @set="Number.isNaN($event) || $event < 1 ? undefined : (outputQty = $event)"
        />
      </div>

      <label class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">Station</span>
        <input
          v-model="station"
          type="text"
          maxlength="100"
          class="h-(--size-hit) w-48 rounded-md border border-border bg-surface-2 px-3 text-text select-text"
        >
      </label>
    </div>

    <CycleErrorBanner
      v-if="cyclePath.length"
      :path="cyclePath"
    />

    <IngredientList
      v-model="ingredients"
      label="วัตถุดิบ"
      :highlight-ids="cycleIds"
      :exclude-ids="outputItemId === null ? [] : [outputItemId]"
    />

    <label class="flex flex-col gap-1">
      <span class="text-caption text-text-muted">Notes</span>
      <textarea
        v-model="notes"
        rows="2"
        maxlength="2000"
        class="rounded-md border border-border bg-surface-2 p-2 text-text select-text"
      />
    </label>

    <section
      v-if="recipe"
      class="flex flex-col gap-2 rounded-lg border border-border bg-surface-1 p-4"
    >
      <h3 class="flex items-center gap-2 font-medium">
        Nested Preview สำหรับ
        <input
          v-model.number="previewQty"
          type="number"
          min="1"
          aria-label="จำนวนชิ้นที่ต้องการ"
          class="font-numeric h-7 w-20 rounded-sm border border-border bg-surface-2 px-2 select-text"
        >
        ชิ้น
      </h3>
      <RecipePreviewTree
        v-if="expansion"
        :expansion="expansion"
      />
    </section>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="recipe"
        type="button"
        class="h-(--size-hit) rounded-md px-3 text-status-missing hover:bg-surface-3"
        @click="confirmDelete = true"
      >
        ลบ Recipe
      </button>
      <span class="flex-1" />
      <template v-if="recipe">
        <label
          v-if="recipe.trackingTargetId === null"
          class="flex items-center gap-1 text-caption text-text-muted"
        >
          Track ×
          <input
            v-model.number="trackQty"
            type="number"
            min="1"
            aria-label="จำนวนเป้าหมาย"
            class="font-numeric h-7 w-16 rounded-sm border border-border bg-surface-2 px-2 select-text"
          >
        </label>
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="toggleTrack"
        >
          {{ recipe.trackingTargetId === null ? 'Track' : 'Untrack' }}
        </button>
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="craftOpen = true"
        >
          ⚒ Craft
        </button>
      </template>
      <button
        type="button"
        :disabled="busy || cyclePath.length > 0"
        class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        title="บันทึก (Ctrl+S)"
        @click="save"
      >
        บันทึก
      </button>
    </div>

    <ConfirmDialog
      :open="confirmDelete"
      title="ลบ Recipe"
      confirm-label="ลบ"
      destructive
      @confirm="remove"
      @cancel="confirmDelete = false"
    >
      <p v-if="recipe?.trackingTargetId !== null">
        Recipe นี้ถูกติดตามอยู่ และจะถูกเอาออกจากรายการติดตามด้วย
      </p>
      <p>Item ปลายทางและวัตถุดิบจะไม่ถูกลบ</p>
    </ConfirmDialog>

    <ConsumeMaterialsDialog
      :open="craftOpen"
      mode="craft"
      :target-id="recipe?.id ?? null"
      :title="`Craft — ${recipe ? (byId.get(recipe.outputItemId)?.name ?? '') : ''}`"
      @close="craftOpen = false"
      @done="craftOpen = false"
    />
  </section>
</template>
