<script setup lang="ts">
import { computed } from 'vue'
import type { IpcResult, TrackingTargetDto } from '../../electron/ipc/contracts'
import { useGathering } from '../stores/gathering'
import { useQuests } from '../stores/quests'
import { useRecipes } from '../stores/recipes'
import { useToasts } from '../stores/toasts'
import { useTracking } from '../stores/tracking'
import { useItems } from '../stores/items'
import AppIcon from './AppIcon.vue'

defineEmits<{ close: [] }>()

const { targets } = useTracking()
const { quests } = useQuests()
const { recipes } = useRecipes()
const { byId } = useItems()
const gathering = useGathering()
const toasts = useToasts()

const untrackedQuests = computed(() => quests.value.filter((quest) => quest.trackingTargetId === null))
const untrackedRecipes = computed(() => recipes.value.filter((recipe) => recipe.trackingTargetId === null))

/** "จัดสรร a / b": what the shared inventory gave this target, not what the target holds (F4-R6). */
function allocationText(target: TrackingTargetDto): string {
  const entry = gathering.result.value.perTarget.find((row) => row.targetId === target.id)
  if (!entry) return 'ไม่ถูกนับ'
  const allocated = entry.rows.reduce((sum, row) => sum + row.allocated, 0)
  const need = entry.rows.reduce((sum, row) => sum + row.need, 0)
  return `จัดสรร ${allocated}/${need}`
}

async function run(call: Promise<IpcResult<unknown>>): Promise<void> {
  const result = await call
  if (!result.ok) toasts.error(result.error.message)
}

const updateQty = (id: number, targetQty: number): Promise<void> => run(window.api.tracking.update({ id, targetQty }))
const togglePin = (target: TrackingTargetDto): Promise<void> => run(window.api.tracking.setPinned({ id: target.id, pinned: !target.pinned }))
const removeTarget = (id: number): Promise<void> => run(window.api.tracking.remove({ id }))

// Reordering is saved at once (F5-R6); the buttons double as the keyboard route (Alt+Up and Alt+Down).
function move(index: number, direction: -1 | 1): void {
  const ids = targets.value.map((target) => target.id)
  const swap = index + direction
  if (swap < 0 || swap >= ids.length) return
  ;[ids[index], ids[swap]] = [ids[swap]!, ids[index]!]
  void run(window.api.tracking.reorder(ids))
}

const trackQuest = (questId: number): Promise<void> => run(window.api.tracking.add({ kind: 'quest', questId }))
const trackRecipe = (recipeId: number): Promise<void> => run(window.api.tracking.add({ kind: 'recipe', recipeId, targetQty: 1 }))
</script>

<template>
  <aside
    class="flex h-full w-90 shrink-0 flex-col gap-4 overflow-auto border-l border-border bg-surface-1 p-4"
    aria-label="Tracking Targets"
  >
    <header class="flex items-center justify-between">
      <h2 class="text-heading font-bold">
        Tracking Targets
      </h2>
      <button
        type="button"
        class="grid size-7 place-items-center rounded-sm hover:bg-surface-3"
        aria-label="ปิด"
        @click="$emit('close')"
      >
        <AppIcon
          name="close"
          :size="16"
        />
      </button>
    </header>
    <p class="text-caption text-text-muted">
      บนสุดได้รับการจัดสรรก่อน เลื่อนลำดับด้วยปุ่มลูกศรหรือ Alt+↑/↓
    </p>

    <ul class="flex flex-col gap-1">
      <li
        v-for="(target, index) in targets"
        :key="target.id"
        class="flex items-center gap-2 rounded-md bg-surface-2 p-2"
        tabindex="0"
        @keydown.alt.up.prevent="move(index, -1)"
        @keydown.alt.down.prevent="move(index, 1)"
      >
        <span class="flex flex-col">
          <button
            type="button"
            class="text-text-muted hover:text-text disabled:opacity-30"
            :disabled="index === 0"
            :aria-label="`เลื่อน ${target.label} ขึ้น`"
            @click="move(index, -1)"
          >
            <AppIcon
              name="arrowUp"
              :size="14"
            />
          </button>
          <button
            type="button"
            class="text-text-muted hover:text-text disabled:opacity-30"
            :disabled="index === targets.length - 1"
            :aria-label="`เลื่อน ${target.label} ลง`"
            @click="move(index, 1)"
          >
            <AppIcon
              name="arrowDown"
              :size="14"
            />
          </button>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate">{{ target.label }}</span>
          <span class="text-caption text-text-muted">
            {{ target.kind }} · #{{ target.priority }} ·
            <template v-if="target.questStatus && target.questStatus !== 'active'">ไม่ถูกนับ ({{ target.questStatus }})</template>
            <template v-else>{{ allocationText(target) }}</template>
          </span>
        </span>
        <label
          v-if="target.kind === 'recipe'"
          class="flex items-center text-caption text-text-muted"
        >
          ×
          <input
            :value="target.targetQty"
            type="number"
            min="1"
            :aria-label="`จำนวนเป้าหมายของ ${target.label}`"
            class="font-numeric h-7 w-14 rounded-sm border border-border bg-surface-3 px-1 select-text"
            @change="updateQty(target.id, Number(($event.target as HTMLInputElement).value))"
          >
        </label>
        <button
          type="button"
          class="grid size-7 place-items-center rounded-sm hover:bg-surface-3"
          :class="target.pinned ? 'text-accent-text' : 'text-text-muted'"
          :aria-pressed="target.pinned"
          :aria-label="target.pinned ? `เลิก Pin ${target.label}` : `Pin ${target.label}`"
          @click="togglePin(target)"
        >
          <AppIcon
            name="pin"
            :size="14"
          />
        </button>
        <button
          type="button"
          class="grid size-7 place-items-center rounded-sm text-text-muted hover:bg-surface-3 hover:text-status-missing"
          :aria-label="`เอา ${target.label} ออกจากการติดตาม`"
          @click="removeTarget(target.id)"
        >
          <AppIcon
            name="close"
            :size="14"
          />
        </button>
      </li>
      <li
        v-if="targets.length === 0"
        class="text-text-muted"
      >
        ยังไม่ได้เลือกสิ่งที่ติดตาม
      </li>
    </ul>

    <section v-if="untrackedQuests.length">
      <h3 class="mb-1 font-medium">
        Quests
      </h3>
      <ul class="flex flex-col gap-1">
        <li
          v-for="quest in untrackedQuests"
          :key="quest.id"
          class="flex items-center gap-2"
        >
          <span class="min-w-0 flex-1 truncate">{{ quest.name }}</span>
          <span class="text-caption text-text-muted">{{ quest.status }}</span>
          <button
            type="button"
            class="h-7 rounded-md bg-surface-3 px-2 text-caption hover:bg-border"
            @click="trackQuest(quest.id)"
          >
            Track
          </button>
        </li>
      </ul>
    </section>

    <section v-if="untrackedRecipes.length">
      <h3 class="mb-1 font-medium">
        Recipes
      </h3>
      <ul class="flex flex-col gap-1">
        <li
          v-for="recipe in untrackedRecipes"
          :key="recipe.id"
          class="flex items-center gap-2"
        >
          <span class="min-w-0 flex-1 truncate">{{ byId.get(recipe.outputItemId)?.name ?? `#${recipe.outputItemId}` }}</span>
          <button
            type="button"
            class="h-7 rounded-md bg-surface-3 px-2 text-caption hover:bg-border"
            @click="trackRecipe(recipe.id)"
          >
            Track
          </button>
        </li>
      </ul>
    </section>
  </aside>
</template>
