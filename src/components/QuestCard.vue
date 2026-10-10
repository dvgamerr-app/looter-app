<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuestDto, QuestStatus, TargetAllocation } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import ItemThumbnail from './ItemThumbnail.vue'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{
  quest: QuestDto
  /** Priority of the quest's tracking target, when it is tracked. */
  priority: number | null
  allocation: TargetAllocation | undefined
  expanded?: boolean
}>()
const emit = defineEmits<{
  edit: []
  consume: []
  setStatus: [status: QuestStatus]
  track: []
  untrack: []
  remove: []
}>()

const { byId } = useItems()
const open = ref(props.expanded ?? props.priority !== null)

const counted = computed(() => props.quest.status === 'active' && props.priority !== null)
const total = computed(() => ({
  allocated: props.allocation?.rows.reduce((sum, row) => sum + row.allocated, 0) ?? 0,
  need: props.allocation?.rows.reduce((sum, row) => sum + row.need, 0) ?? 0,
}))
const rowFor = (itemId: number) => props.allocation?.rows.find((row) => row.itemId === itemId)

const statusLabel: Record<QuestStatus, string> = { active: '● active', paused: '‖ paused', completed: '✓ completed' }
</script>

<template>
  <article class="rounded-lg border border-border bg-surface-2">
    <header class="flex flex-wrap items-center gap-3 p-3">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
        :aria-expanded="open"
        @click="open = !open"
      >
        <span aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
        <span class="truncate font-bold">{{ quest.name }}</span>
      </button>
      <span class="text-caption text-text-muted">{{ statusLabel[quest.status] }}</span>
      <span
        v-if="priority !== null"
        class="text-caption text-accent-text"
      >⊙ Tracked (#{{ priority }})</span>
      <span
        v-if="priority !== null && !counted"
        class="text-caption text-status-warning"
      >ไม่ถูกนับ ({{ quest.status }})</span>
    </header>

    <div
      v-if="counted && total.need > 0"
      class="px-3 pb-2"
    >
      <div class="mb-1 flex items-center gap-2 text-caption text-text-muted">
        <span>จัดสรร (allocated) <span class="font-numeric tabular-nums text-text">{{ total.allocated }} / {{ total.need }}</span></span>
        <span
          class="cursor-help"
          title="จำนวนนี้มาจาก Inventory กลางของ Profile ที่จัดสรรตามลำดับ Priority ไม่ใช่ของที่ Quest นี้ถือไว้"
        >ⓘ</span>
      </div>
      <ProgressBar
        :owned="total.allocated"
        :required="total.need"
      />
    </div>

    <div
      v-if="open"
      class="flex flex-col gap-2 border-t border-border p-3"
    >
      <p
        v-if="quest.notes"
        class="text-text-muted"
      >
        {{ quest.notes }}
      </p>
      <ul class="flex flex-col gap-1">
        <li
          v-for="requirement in quest.requirements"
          :key="requirement.itemId"
          class="flex items-center gap-3"
        >
          <ItemThumbnail
            :src="byId.get(requirement.itemId)?.thumbnailUrl ?? null"
            :name="byId.get(requirement.itemId)?.name ?? '?'"
            :size="32"
          />
          <span class="min-w-0 flex-1 truncate">{{ byId.get(requirement.itemId)?.name ?? `#${requirement.itemId}` }}</span>
          <span
            v-if="counted && rowFor(requirement.itemId)"
            class="font-numeric tabular-nums"
          >
            จัดสรร {{ rowFor(requirement.itemId)!.allocated }} / {{ rowFor(requirement.itemId)!.need }}
            <span
              :class="rowFor(requirement.itemId)!.missing > 0 ? 'text-status-missing' : 'text-status-ok'"
            >{{ rowFor(requirement.itemId)!.missing > 0 ? `ขาด ${rowFor(requirement.itemId)!.missing}` : 'ครบ' }}</span>
          </span>
          <span
            v-else
            class="font-numeric tabular-nums text-text-muted"
          >×{{ requirement.qty }}</span>
          <span class="text-caption text-text-muted">{{ requirement.mode }}</span>
        </li>
        <li
          v-if="quest.requirements.length === 0"
          class="text-caption text-text-muted"
        >
          Quest นี้ยังไม่มี Requirement
        </li>
      </ul>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="emit('edit')"
        >
          แก้ไข
        </button>
        <button
          type="button"
          class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border disabled:opacity-40"
          :disabled="quest.requirements.length === 0"
          @click="emit('consume')"
        >
          Consume materials
        </button>
        <button
          v-if="priority === null"
          type="button"
          class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="emit('track')"
        >
          Track
        </button>
        <button
          v-else
          type="button"
          class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="emit('untrack')"
        >
          Untrack
        </button>
        <button
          v-if="quest.status !== 'paused'"
          type="button"
          class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="emit('setStatus', 'paused')"
        >
          พัก
        </button>
        <button
          v-if="quest.status !== 'active'"
          type="button"
          class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
          @click="emit('setStatus', 'active')"
        >
          กลับมาทำ
        </button>
        <span
          v-if="quest.status !== 'completed'"
          class="flex flex-col"
        >
          <button
            type="button"
            class="h-8 rounded-md bg-surface-3 px-3 hover:bg-border"
            @click="emit('setStatus', 'completed')"
          >
            ทำเสร็จแล้ว
          </button>
          <span class="text-center text-caption text-text-muted">ไม่หักวัตถุดิบ</span>
        </span>
        <button
          type="button"
          class="ml-auto h-8 rounded-md px-3 text-status-missing hover:bg-surface-3"
          @click="emit('remove')"
        >
          ลบ
        </button>
      </div>
    </div>
  </article>
</template>
