<script setup lang="ts">
import type { ProfileDto } from '../../electron/ipc/contracts'
import { formatDateTime, initialOf } from '../format'
import AppIcon from './AppIcon.vue'

defineProps<{ profile: ProfileDto; active: boolean }>()
const emit = defineEmits<{ select: []; rename: []; remove: [] }>()
</script>

<template>
  <!-- Enter selects (native button), F2 renames and Delete removes while focus is inside the card. -->
  <article
    class="relative flex w-55 flex-col rounded-lg border bg-surface-2 transition-colors hover:bg-surface-3"
    :class="active ? 'border-accent-text' : 'border-border'"
    @keydown.f2.prevent="emit('rename')"
    @keydown.delete.prevent="emit('remove')"
  >
    <button
      type="button"
      class="flex flex-1 flex-col gap-2 rounded-lg p-3 text-left"
      :aria-current="active ? 'true' : undefined"
      @click="emit('select')"
    >
      <span class="flex items-center gap-3">
        <span
          class="grid size-12 shrink-0 place-items-center rounded-md bg-surface-3 text-heading font-bold text-text-muted"
          aria-hidden="true"
        >
          {{ initialOf(profile.name) }}
        </span>
        <span class="min-w-0">
          <span class="block truncate font-bold">{{ profile.name }}</span>
          <span
            v-if="active"
            class="text-caption font-medium text-accent-text"
          >● Active</span>
          <span
            v-else
            class="text-caption text-text-muted"
          >เปิดล่าสุด {{ formatDateTime(profile.lastOpenedAt) }}</span>
        </span>
      </span>
      <span class="font-numeric text-text-muted tabular-nums">
        {{ profile.itemCount }} Items · {{ profile.recipeCount }} Recipes · {{ profile.questCount }} Quests
      </span>
      <span class="text-caption text-text-muted">
        {{ profile.progress.required > 0 ? `${profile.progress.owned} / ${profile.progress.required}` : 'ยังไม่มีเป้าหมาย' }}
      </span>
    </button>
    <div class="absolute top-2 right-2 flex gap-1">
      <button
        type="button"
        class="grid size-7 place-items-center rounded-sm text-text-muted hover:bg-border hover:text-text"
        :aria-label="`เปลี่ยนชื่อ ${profile.name}`"
        @click="emit('rename')"
      >
        <AppIcon
          name="edit"
          :size="16"
        />
      </button>
      <button
        type="button"
        class="grid size-7 place-items-center rounded-sm text-text-muted hover:bg-border hover:text-status-missing"
        :aria-label="`ลบ ${profile.name}`"
        @click="emit('remove')"
      >
        <AppIcon
          name="delete"
          :size="16"
        />
      </button>
    </div>
  </article>
</template>
