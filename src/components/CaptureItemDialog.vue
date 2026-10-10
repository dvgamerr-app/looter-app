<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import type { ItemCategory, ItemDto, PendingImage } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import { useToasts } from '../stores/toasts'
import BaseDialog from './BaseDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import ItemPicker from './ItemPicker.vue'
import ItemThumbnail from './ItemThumbnail.vue'

const props = defineProps<{ pending: PendingImage | null }>()
const emit = defineEmits<{ done: []; cancel: [] }>()

const toasts = useToasts()
const { items, byId } = useItems()

const categories: ItemCategory[] = ['material', 'equipment', 'consumable', 'quest', 'other']

const mode = ref<'new' | 'attach'>('new')
const name = ref('')
const category = ref<ItemCategory>('material')
const attachId = ref<number | null>(null)
const error = ref('')
const busy = ref(false)
const confirmReplace = ref(false)
const nameField = useTemplateRef<HTMLInputElement>('nameField')

const attachTarget = computed<ItemDto | null>(() => (attachId.value === null ? null : (byId.value.get(attachId.value) ?? null)))
// A name that already exists offers to attach the picture to that item instead (F2 edge cases).
const clash = computed(() => items.value.find((item) => item.name.toLowerCase() === name.value.trim().toLowerCase()) ?? null)

watch(
  () => props.pending?.id,
  async (id) => {
    if (!id) return
    mode.value = 'new'
    name.value = ''
    category.value = 'material'
    attachId.value = null
    error.value = ''
    busy.value = false
    await nextTick()
    nameField.value?.focus()
  },
  { immediate: true },
)

function useExisting(item: ItemDto): void {
  mode.value = 'attach'
  attachId.value = item.id
}

async function save(continueCapturing: boolean): Promise<void> {
  const image = props.pending
  if (!image || busy.value) return
  if (mode.value === 'attach' && attachTarget.value?.imageUrl && !confirmReplace.value) {
    confirmReplace.value = true
    return
  }
  confirmReplace.value = false
  busy.value = true
  error.value = ''
  const result =
    mode.value === 'new'
      ? await window.api.items.create({ name: name.value, category: category.value, pendingImageId: image.id })
      : attachId.value === null
        ? null
        : await window.api.items.attachImage({ id: attachId.value, pendingImageId: image.id, replace: true })
  busy.value = false
  if (!result) {
    error.value = 'เลือก Item ที่จะผูกภาพก่อน'
    return
  }
  if (!result.ok) {
    error.value = result.error.message
    return
  }
  toasts.success(`บันทึก ${result.data.name} แล้ว`)
  emit('done')
  if (continueCapturing) void window.api.capture.start()
}

function cancel(): void {
  if (props.pending) void window.api.capture.discard({ pendingImageId: props.pending.id })
  emit('cancel')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault()
    void save(true)
  }
}
</script>

<template>
  <BaseDialog
    :open="pending !== null"
    title="บันทึกภาพ Item"
    @close="cancel"
  >
    <form
      v-if="pending"
      class="flex flex-col gap-4"
      @submit.prevent="save(false)"
      @keydown="onKeydown"
    >
      <div class="flex items-center gap-4">
        <img
          :src="pending.previewDataUrl"
          alt="ภาพที่ได้"
          class="max-h-64 max-w-64 rounded-md border border-border bg-surface-2 object-contain"
        >
        <ItemThumbnail
          :src="pending.previewDataUrl"
          name="thumbnail"
          :size="64"
        />
        <span class="text-caption text-text-muted">ต้นฉบับ {{ pending.width }} × {{ pending.height }} px · Thumbnail 64 px</span>
      </div>

      <div
        class="flex gap-4"
        role="radiogroup"
      >
        <label class="flex items-center gap-2">
          <input
            v-model="mode"
            type="radio"
            value="new"
          >สร้าง Item ใหม่
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="mode"
            type="radio"
            value="attach"
          >ผูกกับ Item ที่มีอยู่
        </label>
      </div>

      <template v-if="mode === 'new'">
        <label class="flex flex-col gap-1">
          <span class="text-caption text-text-muted">ชื่อ</span>
          <input
            ref="nameField"
            v-model="name"
            type="text"
            maxlength="100"
            autocomplete="off"
            class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-3 text-text select-text"
          >
        </label>
        <p
          v-if="clash"
          class="flex items-center gap-2 text-status-warning"
        >
          ⚠ มี Item ชื่อ “{{ clash.name }}” อยู่แล้ว
          <button
            type="button"
            class="rounded-sm bg-surface-3 px-2 py-0.5 text-text hover:bg-border"
            @click="useExisting(clash)"
          >
            ผูกรูปกับ Item นั้นแทน
          </button>
        </p>
        <label class="flex flex-col gap-1">
          <span class="text-caption text-text-muted">หมวดหมู่</span>
          <select
            v-model="category"
            class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-2"
          >
            <option
              v-for="entry in categories"
              :key="entry"
              :value="entry"
            >{{ entry }}</option>
          </select>
        </label>
      </template>

      <template v-else>
        <div class="flex flex-col gap-2">
          <ItemPicker
            placeholder="ค้นหา Item…"
            @select="attachId = $event"
          />
          <p
            v-if="attachTarget"
            class="flex items-center gap-2"
          >
            <ItemThumbnail
              :src="attachTarget.thumbnailUrl"
              :name="attachTarget.name"
              :size="32"
            />
            {{ attachTarget.name }}
            <span
              v-if="attachTarget.imageUrl"
              class="text-caption text-status-warning"
            >(มีรูปอยู่แล้ว จะแทนที่)</span>
          </p>
        </div>
      </template>

      <p
        v-if="error"
        class="text-status-missing"
        role="alert"
      >
        {{ error }}
      </p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
          @click="cancel"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          :disabled="busy"
          class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border disabled:opacity-40"
          @click="save(true)"
        >
          บันทึกและ Capture ต่อ (Ctrl+Enter)
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

    <ConfirmDialog
      :open="confirmReplace"
      title="แทนที่รูปเดิม"
      confirm-label="แทนที่"
      @confirm="save(false)"
      @cancel="confirmReplace = false"
    >
      <p>Item นี้มีรูปอยู่แล้ว ต้องการแทนที่หรือไม่</p>
    </ConfirmDialog>
  </BaseDialog>
</template>
