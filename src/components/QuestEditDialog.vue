<script setup lang="ts">
import { ref, watch } from 'vue'
import type { IngredientInput, QuestDto } from '../../electron/ipc/contracts'
import { useToasts } from '../stores/toasts'
import BaseDialog from './BaseDialog.vue'
import IngredientList from './IngredientList.vue'

const props = defineProps<{ open: boolean; quest: QuestDto | null }>()
const emit = defineEmits<{ close: []; saved: [quest: QuestDto] }>()

const toasts = useToasts()

const name = ref('')
const notes = ref('')
const requirements = ref<IngredientInput[]>([])
const trackNow = ref(true)
const error = ref('')
const busy = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.quest?.name ?? ''
    notes.value = props.quest?.notes ?? ''
    requirements.value = props.quest ? props.quest.requirements.map(({ itemId, qty, mode }) => ({ itemId, qty, mode })) : []
    trackNow.value = true
    error.value = ''
    busy.value = false
  },
)

async function save(): Promise<void> {
  if (busy.value) return
  busy.value = true
  error.value = ''
  const result = props.quest
    ? await window.api.quests.update({
        id: props.quest.id,
        name: name.value,
        notes: notes.value,
        requirements: requirements.value,
      })
    : await window.api.quests.create({
        name: name.value,
        notes: notes.value,
        requirements: requirements.value,
        track: trackNow.value,
      })
  busy.value = false
  if (result.ok) {
    toasts.success('บันทึก Quest แล้ว')
    emit('saved', result.data)
  } else {
    error.value = result.error.message
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="quest ? 'แก้ไข Quest' : 'Quest ใหม่'"
    @close="emit('close')"
  >
    <form
      class="flex flex-col gap-4"
      @submit.prevent="save"
    >
      <label class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">ชื่อ Quest</span>
        <input
          v-model="name"
          type="text"
          maxlength="100"
          autocomplete="off"
          :aria-invalid="error !== ''"
          class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-3 text-text select-text"
        >
        <span
          v-if="error"
          role="alert"
          class="text-caption text-status-missing"
        >{{ error }}</span>
      </label>

      <IngredientList
        v-model="requirements"
        label="Requirements"
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

      <label
        v-if="!quest"
        class="flex items-center gap-2"
      >
        <input
          v-model="trackNow"
          type="checkbox"
        >
        Track ทันทีหลังบันทึก
      </label>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
          @click="emit('close')"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          :disabled="busy"
          class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        >
          บันทึก
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
