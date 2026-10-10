<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IpcResult, ItemCategory, ItemDto, ItemUsage, PendingImage } from '../../electron/ipc/contracts'
import { useToasts } from '../stores/toasts'
import AppIcon from './AppIcon.vue'
import BaseDialog from './BaseDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import ItemThumbnail from './ItemThumbnail.vue'

const props = defineProps<{
  open: boolean
  /** The item being edited, or null to create one. */
  item: ItemDto | null
  /** Name typed into the search field when the dialog was opened to create an item. */
  initialName?: string
}>()
const emit = defineEmits<{ close: []; saved: [item: ItemDto]; delete: [item: ItemDto]; openItem: [id: number] }>()

const toasts = useToasts()

const categories: ItemCategory[] = ['material', 'equipment', 'consumable', 'quest', 'other']

const name = ref('')
const category = ref<ItemCategory>('material')
const notes = ref('')
const pending = ref<PendingImage | null>(null)
const removeImage = ref(false)
const error = ref('')
const clashId = ref<number | null>(null)
const busy = ref(false)
const usages = ref<ItemUsage[]>([])
const confirmReplace = ref(false)
const waitingPick = ref<(() => Promise<void>) | null>(null)

const isEdit = computed(() => props.item !== null)
const hasImage = computed(() => props.item?.imageUrl != null && !removeImage.value)
const previewSrc = computed(() => pending.value?.previewDataUrl ?? (removeImage.value ? null : (props.item?.thumbnailUrl ?? null)))

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    name.value = props.item?.name ?? props.initialName ?? ''
    category.value = props.item?.category ?? 'material'
    notes.value = props.item?.notes ?? ''
    pending.value = null
    removeImage.value = false
    error.value = ''
    clashId.value = null
    usages.value = []
    if (props.item) {
      const result = await window.api.items.getUsage({ id: props.item.id })
      if (result.ok) usages.value = result.data
    }
  },
)

/** Picking a new image over an existing one asks first (F2-R9). */
function pick(action: () => Promise<void>): void {
  if (hasImage.value || pending.value) {
    waitingPick.value = action
    confirmReplace.value = true
  } else {
    void action()
  }
}

async function receive(result: IpcResult<PendingImage | null>): Promise<void> {
  if (!result.ok) {
    toasts.error(result.error.message)
    return
  }
  if (result.data) {
    if (pending.value) void window.api.capture.discard({ pendingImageId: pending.value.id })
    pending.value = result.data
    removeImage.value = false
  }
}

const fromClipboard = (): Promise<void> => window.api.capture.fromClipboard().then(receive)
const fromFile = (): Promise<void> => window.api.capture.importFile().then(receive)

async function runConfirmedPick(): Promise<void> {
  confirmReplace.value = false
  const action = waitingPick.value
  waitingPick.value = null
  if (action) await action()
}

async function save(): Promise<void> {
  if (busy.value) return
  busy.value = true
  error.value = ''
  clashId.value = null
  const fields = { name: name.value, category: category.value, notes: notes.value }
  let result
  if (props.item) {
    result = await window.api.items.update({ id: props.item.id, ...fields })
    if (result.ok && pending.value) {
      result = await window.api.items.attachImage({ id: props.item.id, pendingImageId: pending.value.id, replace: true })
    } else if (result.ok && removeImage.value && props.item.imageUrl) {
      result = await window.api.items.removeImage({ id: props.item.id })
    }
  } else {
    result = await window.api.items.create({ ...fields, ...(pending.value ? { pendingImageId: pending.value.id } : {}) })
  }
  busy.value = false
  if (result.ok) {
    toasts.success(isEdit.value ? 'บันทึก Item แล้ว' : 'สร้าง Item แล้ว')
    emit('saved', result.data)
    return
  }
  error.value = result.error.message
  const details = result.error.details as { id?: number | null } | undefined
  if (result.error.code === 'DUPLICATE_NAME' && details?.id) clashId.value = details.id
}

// Capture ends in the shared naming dialog, where the picture can be attached to this item (F10-R6).
async function captureScreen(): Promise<void> {
  cancel()
  const result = await window.api.capture.start()
  if (!result.ok) toasts.error(result.error.message)
}

function cancel(): void {
  if (pending.value) void window.api.capture.discard({ pendingImageId: pending.value.id })
  emit('close')
}

const usageText = (usage: ItemUsage): string =>
  usage.kind === 'recipe' ? `Recipe “${usage.label}”` : usage.kind === 'quest' ? `Quest “${usage.label}”` : `ผลลัพธ์ของ Recipe “${usage.label}”`
</script>

<template>
  <BaseDialog
    :open="open"
    :title="isEdit ? 'แก้ไข Item' : 'Item ใหม่'"
    @close="cancel"
  >
    <form
      class="flex flex-col gap-4"
      @submit.prevent="save"
    >
      <div class="flex gap-4">
        <ItemThumbnail
          :src="previewSrc"
          :name="name || '?'"
          :size="64"
        />
        <div class="flex flex-1 flex-col gap-1">
          <label class="text-caption text-text-muted">ชื่อ</label>
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
          >
            {{ error }}
            <button
              v-if="clashId"
              type="button"
              class="ml-2 underline"
              @click="emit('openItem', clashId)"
            >เปิด Item นั้น</button>
          </span>
        </div>
      </div>

      <label class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">หมวดหมู่</span>
        <select
          v-model="category"
          class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-2 text-text"
        >
          <option
            v-for="entry in categories"
            :key="entry"
            :value="entry"
          >{{ entry }}</option>
        </select>
      </label>

      <div class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">รูป</span>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            title="จับภาพจากหน้าจอ แล้วผูกภาพในหน้าต่างที่เปิดขึ้นมา"
            class="h-(--size-hit) rounded-md bg-surface-3 px-3 hover:bg-border"
            @click="captureScreen"
          >
            Capture
          </button>
          <button
            type="button"
            class="flex h-(--size-hit) items-center gap-2 rounded-md bg-surface-3 px-3 hover:bg-border"
            @click="pick(fromClipboard)"
          >
            <AppIcon
              name="image"
              :size="16"
            />Paste จาก Clipboard
          </button>
          <button
            type="button"
            class="h-(--size-hit) rounded-md bg-surface-3 px-3 hover:bg-border"
            @click="pick(fromFile)"
          >
            Import ไฟล์…
          </button>
          <button
            v-if="hasImage || pending"
            type="button"
            class="h-(--size-hit) rounded-md px-3 text-status-missing hover:bg-surface-3"
            @click="pending ? (pending = null) : (removeImage = true)"
          >
            ลบรูป
          </button>
        </div>
      </div>

      <label class="flex flex-col gap-1">
        <span class="text-caption text-text-muted">Notes</span>
        <textarea
          v-model="notes"
          rows="2"
          maxlength="2000"
          class="rounded-md border border-border bg-surface-2 p-2 text-text select-text"
        />
      </label>

      <p
        v-if="usages.length"
        class="text-caption text-text-muted"
      >
        ใช้ใน: {{ usages.map(usageText).join(', ') }}
      </p>

      <div class="flex items-center justify-between gap-2">
        <button
          v-if="item"
          type="button"
          class="h-(--size-hit) rounded-md px-3 text-status-missing hover:bg-surface-3"
          @click="emit('delete', item)"
        >
          ลบ Item
        </button>
        <span v-else />
        <span class="flex gap-2">
          <button
            type="button"
            class="h-(--size-hit) rounded-md bg-surface-3 px-4 hover:bg-border"
            @click="cancel"
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
        </span>
      </div>
    </form>

    <ConfirmDialog
      :open="confirmReplace"
      title="แทนที่รูปเดิม"
      confirm-label="แทนที่"
      @confirm="runConfirmedPick"
      @cancel="confirmReplace = false"
    >
      <p>Item นี้มีรูปอยู่แล้ว ต้องการแทนที่หรือไม่</p>
    </ConfirmDialog>
  </BaseDialog>
</template>
