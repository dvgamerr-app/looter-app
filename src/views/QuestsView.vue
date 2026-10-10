<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuestDto, QuestStatus } from '../../electron/ipc/contracts'
import AppIcon from '../components/AppIcon.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ConsumeMaterialsDialog from '../components/ConsumeMaterialsDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import QuestCard from '../components/QuestCard.vue'
import QuestEditDialog from '../components/QuestEditDialog.vue'
import SearchField from '../components/SearchField.vue'
import { useGathering } from '../stores/gathering'
import { useQuests } from '../stores/quests'
import { useToasts } from '../stores/toasts'
import { useTracking } from '../stores/tracking'

const { quests, loaded } = useQuests()
const { targets } = useTracking()
const gathering = useGathering()
const toasts = useToasts()

type Filter = 'open' | QuestStatus
const filter = ref<Filter>('open')
const search = ref('')

const counts = computed(() => ({
  active: quests.value.filter((quest) => quest.status === 'active').length,
  paused: quests.value.filter((quest) => quest.status === 'paused').length,
  completed: quests.value.filter((quest) => quest.status === 'completed').length,
}))

// By default active and paused quests are shown and the completed ones sit in their own section (F4-R11).
const shown = computed(() => {
  const text = search.value.trim().toLowerCase()
  return quests.value
    .filter((quest) => text === '' || quest.name.toLowerCase().includes(text))
    .filter((quest) => (filter.value === 'open' ? quest.status !== 'completed' : quest.status === filter.value))
})
const completed = computed(() =>
  filter.value === 'open' ? quests.value.filter((quest) => quest.status === 'completed' && quest.name.toLowerCase().includes(search.value.trim().toLowerCase())) : [],
)

const targetOf = (questId: number) => targets.value.find((target) => target.questId === questId)
const allocationOf = (questId: number) => {
  const target = targetOf(questId)
  return target ? gathering.result.value.perTarget.find((entry) => entry.targetId === target.id) : undefined
}

// ----- editing -----
const editOpen = ref(false)
const editing = ref<QuestDto | null>(null)

function openEdit(quest: QuestDto | null): void {
  editing.value = quest
  editOpen.value = true
}

async function setStatus(quest: QuestDto, status: QuestStatus): Promise<void> {
  const result = await window.api.quests.setStatus({ id: quest.id, status })
  if (!result.ok) toasts.error(result.error.message)
}

async function track(quest: QuestDto): Promise<void> {
  const result = await window.api.tracking.add({ kind: 'quest', questId: quest.id })
  if (!result.ok) toasts.error(result.error.message)
}

async function untrack(quest: QuestDto): Promise<void> {
  const target = targetOf(quest.id)
  if (!target) return
  const result = await window.api.tracking.remove({ id: target.id })
  if (!result.ok) toasts.error(result.error.message)
}

// ----- consume -----
const consumeQuest = ref<QuestDto | null>(null)

// ----- delete -----
const deleteQuest = ref<QuestDto | null>(null)

async function confirmDelete(): Promise<void> {
  const quest = deleteQuest.value
  deleteQuest.value = null
  if (!quest) return
  const result = await window.api.quests.delete({ id: quest.id })
  if (result.ok) toasts.success(`ลบ “${quest.name}” แล้ว`)
  else toasts.error(result.error.message)
}

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'open', label: 'ที่ยังไม่เสร็จ' },
  { id: 'active', label: 'active' },
  { id: 'paused', label: 'paused' },
  { id: 'completed', label: 'completed' },
]
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="mr-2 text-heading font-bold">
        Quests
      </h1>
      <div
        class="flex gap-1"
        role="group"
        aria-label="สถานะ"
      >
        <button
          v-for="entry in filters"
          :key="entry.id"
          type="button"
          class="h-7 rounded-full px-3 text-caption"
          :class="filter === entry.id ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:bg-surface-3'"
          :aria-pressed="filter === entry.id"
          @click="filter = entry.id"
        >
          {{ entry.label }}<template v-if="entry.id !== 'open'">
            {{ counts[entry.id] }}
          </template>
        </button>
      </div>
      <SearchField
        v-model="search"
        placeholder="ค้นหา Quest…"
      />
      <button
        type="button"
        class="ml-auto flex h-(--size-hit) items-center gap-2 rounded-md bg-accent px-3 font-medium text-white hover:bg-accent-hover"
        @click="openEdit(null)"
      >
        <AppIcon
          name="plus"
          :size="16"
        />Quest ใหม่
      </button>
    </div>

    <EmptyState
      v-if="loaded && quests.length === 0"
      title="สร้าง Quest แรก"
      description="ตัวอย่าง: Ancient Equipment ต้องการ Iron Ore ×10, Wood ×5, Magic Crystal ×8"
    >
      <button
        type="button"
        class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
        @click="openEdit(null)"
      >
        สร้าง Quest
      </button>
    </EmptyState>

    <EmptyState
      v-else-if="loaded && shown.length === 0 && completed.length === 0"
      title="ไม่มี Quest ที่ตรงกับตัวกรอง"
    />

    <div class="flex flex-col gap-3">
      <QuestCard
        v-for="quest in shown"
        :key="quest.id"
        :quest="quest"
        :priority="targetOf(quest.id)?.priority ?? null"
        :allocation="allocationOf(quest.id)"
        @edit="openEdit(quest)"
        @consume="consumeQuest = quest"
        @set-status="setStatus(quest, $event)"
        @track="track(quest)"
        @untrack="untrack(quest)"
        @remove="deleteQuest = quest"
      />
    </div>

    <section
      v-if="completed.length"
      class="flex flex-col gap-3"
    >
      <h2 class="font-medium text-text-muted">
        Completed ({{ completed.length }})
      </h2>
      <QuestCard
        v-for="quest in completed"
        :key="quest.id"
        :quest="quest"
        :priority="targetOf(quest.id)?.priority ?? null"
        :allocation="undefined"
        :expanded="false"
        @edit="openEdit(quest)"
        @consume="consumeQuest = quest"
        @set-status="setStatus(quest, $event)"
        @track="track(quest)"
        @untrack="untrack(quest)"
        @remove="deleteQuest = quest"
      />
    </section>

    <QuestEditDialog
      :open="editOpen"
      :quest="editing"
      @close="editOpen = false"
      @saved="editOpen = false"
    />

    <ConsumeMaterialsDialog
      :open="consumeQuest !== null"
      mode="consume"
      :target-id="consumeQuest?.id ?? null"
      :title="`Consume materials — ${consumeQuest?.name ?? ''}`"
      @close="consumeQuest = null"
      @done="consumeQuest = null"
    />

    <ConfirmDialog
      :open="deleteQuest !== null"
      title="ลบ Quest"
      confirm-label="ลบ"
      destructive
      @confirm="confirmDelete"
      @cancel="deleteQuest = null"
    >
      <p>ลบ “{{ deleteQuest?.name }}” พร้อม Requirement และการติดตาม</p>
      <p>Item และ Inventory จะไม่ถูกแตะ</p>
    </ConfirmDialog>
  </div>
</template>
