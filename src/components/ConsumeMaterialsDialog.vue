<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { InventoryPlan, InventoryPlanRow } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import { useToasts } from '../stores/toasts'
import BaseDialog from './BaseDialog.vue'
import ItemThumbnail from './ItemThumbnail.vue'

const props = defineProps<{
  open: boolean
  mode: 'consume' | 'craft'
  /** Quest id (consume) or recipe id (craft). */
  targetId: number | null
  title: string
  /** Craft only: the number of crafts the plan suggests. */
  suggestedRuns?: number
}>()
const emit = defineEmits<{ close: []; done: [] }>()

const { byId } = useItems()
const toasts = useToasts()

const plan = ref<InventoryPlan | null>(null)
const runs = ref(1)
const completeQuest = ref(true)
const reduceTarget = ref(true)
const busy = ref(false)
const failure = ref('')

const nameOf = (id: number): string => byId.value.get(id)?.name ?? `#${id}`
const thumbOf = (id: number): string | null => byId.value.get(id)?.thumbnailUrl ?? null
const rows = computed<InventoryPlanRow[]>(() => (plan.value ? [...plan.value.rows, ...(plan.value.output ? [plan.value.output] : [])] : []))
const canConfirm = computed(() => plan.value?.ok === true && !busy.value && (props.mode === 'craft' || (plan.value?.rows.length ?? 0) > 0))

// The plan always comes from the main process with the current numbers (dry run, F8-R9).
async function refresh(): Promise<void> {
  if (props.targetId === null) return
  const result =
    props.mode === 'consume'
      ? await window.api.inventory.consume({ questId: props.targetId, dryRun: true })
      : await window.api.inventory.craft({ recipeId: props.targetId, runs: runs.value, dryRun: true })
  if (result.ok) {
    plan.value = result.data
    failure.value = ''
  } else {
    plan.value = null
    failure.value = result.error.message
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    runs.value = Math.max(1, props.suggestedRuns ?? 1)
    completeQuest.value = true
    reduceTarget.value = true
    busy.value = false
    void refresh()
  },
)
watch(runs, () => props.open && void refresh())

// The numbers follow changes made on other screens while the dialog stays open (F8-R4).
const stopListening = window.api.on('inventory:changed', () => props.open && void refresh())
onBeforeUnmount(stopListening)

async function confirm(): Promise<void> {
  if (props.targetId === null || busy.value) return
  busy.value = true
  const result =
    props.mode === 'consume'
      ? await window.api.inventory.consume({ questId: props.targetId, completeQuest: completeQuest.value && plan.value?.questStatus !== 'completed' })
      : await window.api.inventory.craft({ recipeId: props.targetId, runs: runs.value, reduceTarget: reduceTarget.value && plan.value?.target != null })
  busy.value = false
  if (result.ok) {
    toasts.success(props.mode === 'consume' ? 'หักวัตถุดิบแล้ว' : 'Craft แล้ว')
    emit('done')
    return
  }
  // A shortage found at the last moment keeps the dialog open with fresh numbers (F8-R5).
  failure.value = result.error.message
  await refresh()
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="title"
    @close="emit('close')"
  >
    <p class="text-text-muted">
      จะ{{ mode === 'consume' ? 'หัก' : 'ใช้' }}จำนวนต่อไปนี้ใน 1 Transaction ถ้ามีรายการใดไม่พอ ระบบจะไม่หักรายการใดเลย
    </p>

    <label
      v-if="mode === 'craft'"
      class="flex items-center gap-2"
    >
      <span>จำนวนรอบ</span>
      <input
        v-model.number="runs"
        type="number"
        min="1"
        class="font-numeric h-(--size-hit) w-24 rounded-md border border-border bg-surface-2 px-2 text-text select-text"
      >
      <span
        v-if="plan?.maxRuns != null"
        class="text-caption text-text-muted"
      >ทำได้สูงสุด {{ plan.maxRuns }} รอบจากของที่มี</span>
    </label>

    <ul class="flex flex-col gap-1">
      <li
        v-for="row in rows"
        :key="`${row.itemId}-${row.delta}`"
        class="flex items-center gap-3 rounded-md bg-surface-2 p-2"
      >
        <ItemThumbnail
          :src="thumbOf(row.itemId)"
          :name="nameOf(row.itemId)"
          :size="32"
        />
        <span class="min-w-0 flex-1 truncate">{{ nameOf(row.itemId) }}</span>
        <span
          class="font-numeric tabular-nums"
          :class="row.after < 0 ? 'text-status-missing' : ''"
        >
          {{ row.before }} → {{ row.after }} ({{ row.delta > 0 ? '+' : '' }}{{ row.delta }})
        </span>
        <span
          v-if="row.after < 0"
          class="text-caption text-status-missing"
        >✖ ไม่พอ ขาด {{ -row.after }}</span>
      </li>
    </ul>
    <p
      v-if="plan && plan.rows.length === 0 && mode === 'consume'"
      class="text-caption text-text-muted"
    >
      Quest นี้ไม่มี Requirement ให้หัก
    </p>
    <p
      v-if="plan && mode === 'craft' && plan.rows.length === 0"
      class="text-caption text-text-muted"
    >
      Recipe นี้ไม่มีวัตถุดิบ จะบวกเฉพาะผลลัพธ์
    </p>

    <p
      v-if="plan && !plan.ok && plan.missing.length"
      class="text-status-missing"
      role="alert"
    >
      ⚠ มี {{ plan.missing.length }} รายการที่จะติดลบ ระบบจะไม่หักรายการใดเลย ปรับ Inventory ก่อนแล้วกลับมาที่หน้านี้ได้
    </p>
    <p
      v-if="failure"
      class="rounded-md border border-status-missing p-2 text-status-missing"
      role="alert"
    >
      {{ failure }}
    </p>

    <label
      v-if="mode === 'consume' && plan?.questStatus !== 'completed'"
      class="flex items-center gap-2"
    >
      <input
        v-model="completeQuest"
        type="checkbox"
      >
      ตั้งสถานะ Quest เป็น Completed ด้วย
    </label>
    <label
      v-if="mode === 'craft' && plan?.target"
      class="flex items-center gap-2"
    >
      <input
        v-model="reduceTarget"
        type="checkbox"
      >
      ลดจำนวนเป้าหมายของ Recipe ตามจำนวนที่ Craft
    </label>

    <!-- The confirm button is deliberately not the default for Enter (F8-R12): it needs a click or Tab. -->
    <div class="flex justify-end gap-2">
      <button
        type="button"
        autofocus
        class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
        @click="emit('close')"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        :disabled="!canConfirm"
        class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        @click="confirm"
      >
        {{ mode === 'consume' ? 'ยืนยันการหัก' : 'ยืนยัน Craft' }}
      </button>
    </div>
  </BaseDialog>
</template>
