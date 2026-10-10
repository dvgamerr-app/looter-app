<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { GatheringCraftRow, GatheringItemRow, ItemCategory } from '../../electron/ipc/contracts'
import CategoryFilter from '../components/CategoryFilter.vue'
import ConsumeMaterialsDialog from '../components/ConsumeMaterialsDialog.vue'
import CraftPlanSection from '../components/CraftPlanSection.vue'
import EmptyState from '../components/EmptyState.vue'
import ItemEditDialog from '../components/ItemEditDialog.vue'
import GatheringTable from '../components/GatheringTable.vue'
import OverallProgress from '../components/OverallProgress.vue'
import SearchField from '../components/SearchField.vue'
import StepSelector from '../components/StepSelector.vue'
import TargetChip from '../components/TargetChip.vue'
import TargetPicker from '../components/TargetPicker.vue'
import { useGathering } from '../stores/gathering'
import { step, useInventory } from '../stores/inventory'
import { useQuests } from '../stores/quests'
import { useRecipes } from '../stores/recipes'
import { useSettings } from '../stores/settings'
import { useToasts } from '../stores/toasts'
import { useTracking } from '../stores/tracking'

const gathering = useGathering()
const { targets } = useTracking()
const { quests } = useQuests()
const { recipes } = useRecipes()
const settings = useSettings()
const inventory = useInventory()
const toasts = useToasts()

// View filters change what is shown, never the allocation, and are not saved (F6-R12).
const search = ref('')
const category = ref<ItemCategory | null>(null)
const pinnedOnly = ref(false)
const onlyTarget = ref<number | null>(null)
const pickerOpen = ref(false)
const searchField = useTemplateRef<InstanceType<typeof SearchField>>('searchField')

const preferences = computed(() => settings.settings.value?.preferences)
const sort = computed(() => preferences.value?.sort ?? 'missing-first')
const hideComplete = computed(() => preferences.value?.hideComplete ?? false)

function visibleRows(): GatheringItemRow[] {
  const text = search.value.trim().toLowerCase()
  const limit = onlyTarget.value === null ? null : new Set(gathering.result.value.perTarget.find((entry) => entry.targetId === onlyTarget.value)?.leafRows.map((row) => row.itemId))
  return gathering.result.value.items.filter(
    (row) =>
      (text === '' || row.name.toLowerCase().includes(text)) &&
      (category.value === null || row.category === category.value) &&
      (!pinnedOnly.value || row.pinned) &&
      (limit === null || limit.has(row.itemId)),
  )
}

const sorted = computed(() => {
  const rows = visibleRows()
  const byName = (a: GatheringItemRow, b: GatheringItemRow): number => a.name.localeCompare(b.name)
  if (sort.value === 'name') return rows.sort(byName)
  if (sort.value === 'category') return rows.sort((a, b) => a.category.localeCompare(b.category) || byName(a, b))
  return rows.sort((a, b) => b.missing - a.missing || byName(a, b))
})

const incomplete = computed(() => sorted.value.filter((row) => row.missing > 0))
const complete = computed(() => sorted.value.filter((row) => row.missing === 0))
const missingCount = computed(() => gathering.result.value.items.filter((row) => row.missing > 0).length)
const showComplete = ref(false)

async function togglePin(itemId: number, pinned: boolean): Promise<void> {
  const result = await window.api.items.setPinned({ id: itemId, pinned })
  if (!result.ok) toasts.error(result.error.message)
}

const craftRow = ref<GatheringCraftRow | null>(null)

// Quick item creation without leaving the list (AC-F8-11).
const quickOpen = ref(false)

function onKeydown(event: KeyboardEvent): void {
  if ((event.target as HTMLElement).tagName === 'INPUT') return
  if (event.key === '/') {
    event.preventDefault()
    searchField.value?.focus()
  } else if (event.key.toLowerCase() === 't') pickerOpen.value = !pickerOpen.value
  else if (event.key.toLowerCase() === 'h') void settings.updatePreferences({ hideComplete: !hideComplete.value })
  else if (event.key.toLowerCase() === 's') {
    const sizes = preferences.value?.stepSizes ?? [1, 5, 10]
    step.value = sizes[(sizes.indexOf(step.value) + 1) % sizes.length] ?? 1
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const nothingToTrack = computed(() => quests.value.length === 0 && recipes.value.length === 0)
</script>

<template>
  <div class="flex h-full">
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex flex-col gap-3 p-6 pb-3">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="mr-2 text-heading font-bold">
            Gathering List
          </h1>
          <TargetChip
            v-for="target in targets"
            :key="target.id"
            :target="target"
            :selected="onlyTarget === target.id"
            @select="onlyTarget = onlyTarget === target.id ? null : target.id"
          />
          <button
            type="button"
            class="h-7 rounded-full bg-surface-3 px-3 text-caption hover:bg-border"
            @click="pickerOpen = !pickerOpen"
          >
            เลือก Targets… (T)
          </button>
          <button
            type="button"
            class="h-7 rounded-full bg-surface-3 px-3 text-caption hover:bg-border"
            @click="quickOpen = true"
          >
            + เพิ่ม Item เร็ว
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <SearchField
            ref="searchField"
            v-model="search"
            placeholder="ค้นหา…  ( / )"
          />
          <CategoryFilter v-model="category" />
          <label class="flex items-center gap-2 text-caption text-text-muted">
            <input
              v-model="pinnedOnly"
              type="checkbox"
            >Pinned เท่านั้น
          </label>
          <StepSelector v-model="step" />
          <label class="flex items-center gap-2 text-caption text-text-muted">
            เรียง
            <select
              :value="sort"
              class="h-7 rounded-sm border border-border bg-surface-2 px-1 text-text"
              @change="settings.updatePreferences({ sort: ($event.target as HTMLSelectElement).value as 'missing-first' | 'name' | 'category' })"
            >
              <option value="missing-first">ขาดก่อน</option>
              <option value="name">ชื่อ</option>
              <option value="category">หมวดหมู่</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-caption text-text-muted">
            <input
              type="checkbox"
              :checked="hideComplete"
              @change="settings.updatePreferences({ hideComplete: ($event.target as HTMLInputElement).checked })"
            >ซ่อนที่ครบแล้ว (H)
          </label>
        </div>
        <p
          v-if="gathering.result.value.warnings.length"
          class="text-status-warning"
          role="alert"
        >
          ⚠ พบ Recipe ที่วนกลับมาหาตัวเองในข้อมูล ระบบนับเป็นวัตถุดิบดิบและข้ามการขยาย
        </p>
      </header>

      <div class="min-h-0 flex-1 overflow-auto px-6">
        <EmptyState
          v-if="targets.length === 0"
          title="ยังไม่ได้เลือกสิ่งที่ติดตาม"
          :description="nothingToTrack ? 'สร้าง Recipe หรือ Quest ก่อน แล้วเลือกมาติดตามที่นี่' : 'เลือก Quest และ Recipe ที่จะทำเพื่อให้ระบบรวมวัตถุดิบ'"
        >
          <button
            type="button"
            class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
            @click="pickerOpen = true"
          >
            เลือก Targets…
          </button>
        </EmptyState>

        <template v-else>
          <p
            v-if="sorted.length === 0 && gathering.result.value.items.length > 0"
            class="py-6 text-text-muted"
          >
            ไม่พบ Item ที่ตรงกับตัวกรองในรายการที่ติดตาม
          </p>
          <GatheringTable
            :rows="hideComplete ? incomplete : sorted"
            :step="step"
            @adjust="inventory.adjust"
            @set="inventory.set"
            @toggle-pin="togglePin"
          />
          <section
            v-if="hideComplete && complete.length"
            class="py-3"
          >
            <button
              type="button"
              class="text-text-muted"
              :aria-expanded="showComplete"
              @click="showComplete = !showComplete"
            >
              {{ showComplete ? '▾' : '▸' }} ครบแล้ว ({{ complete.length }})
            </button>
            <GatheringTable
              v-if="showComplete"
              :rows="complete"
              :step="step"
              @adjust="inventory.adjust"
              @set="inventory.set"
              @toggle-pin="togglePin"
            />
          </section>
          <p
            v-if="gathering.result.value.items.length > 0 && incomplete.length === 0 && !search && category === null"
            class="py-3 text-status-ok"
          >
            ครบทุกรายการแล้ว ({{ gathering.result.value.items.length }} รายการ)
          </p>
          <CraftPlanSection
            :rows="gathering.result.value.craftPlan"
            @craft="craftRow = $event"
          />
        </template>
      </div>

      <footer class="border-t border-border p-4">
        <OverallProgress
          :owned="gathering.result.value.overall.owned"
          :required="gathering.result.value.overall.required"
          :missing-count="missingCount"
        />
      </footer>
    </div>

    <TargetPicker
      v-if="pickerOpen"
      @close="pickerOpen = false"
    />

    <ItemEditDialog
      :open="quickOpen"
      :item="null"
      @close="quickOpen = false"
      @saved="quickOpen = false"
    />

    <ConsumeMaterialsDialog
      :open="craftRow !== null"
      mode="craft"
      :target-id="craftRow?.recipeId ?? null"
      :title="`Craft — ${craftRow?.outputName ?? ''}`"
      :suggested-runs="craftRow?.runs"
      @close="craftRow = null"
      @done="craftRow = null"
    />
  </div>
</template>
