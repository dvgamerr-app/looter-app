<script setup lang="ts">
import { formatDateTime } from '../format'
import { openCreateProfile, openDeleteProfile, openRenameProfile } from '../stores/profile-dialogs'
import { useProfiles } from '../stores/profiles'
import { useToasts } from '../stores/toasts'
import AppIcon from './AppIcon.vue'
import EmptyState from './EmptyState.vue'

const profiles = useProfiles()
const toasts = useToasts()

const columns = ['ชื่อ', 'สร้างเมื่อ', 'เปิดล่าสุด', 'Items', 'Recipes', 'Quests', ''] as const

async function activate(id: number): Promise<void> {
  const result = await profiles.switchTo(id)
  if (!result.ok) toasts.error(result.error.message)
}
</script>

<template>
  <EmptyState
    v-if="profiles.state.profiles.length === 0"
    title="ยังไม่มี Game Profile"
    description="สร้าง Profile แรกเพื่อเริ่มติดตามไอเทมของเกม"
  >
    <button
      type="button"
      class="h-(--size-hit) rounded-md bg-accent px-4 font-medium text-white hover:bg-accent-hover"
      @click="openCreateProfile"
    >
      สร้าง Profile
    </button>
  </EmptyState>

  <div
    v-else
    class="flex flex-col gap-3"
  >
    <div class="flex justify-end">
      <button
        type="button"
        class="flex h-(--size-hit) items-center gap-2 rounded-md bg-accent px-3 font-medium text-white hover:bg-accent-hover"
        @click="openCreateProfile"
      >
        <AppIcon
          name="plus"
          :size="16"
        />
        Profile ใหม่
      </button>
    </div>
    <table class="w-full border-collapse text-left">
      <thead class="text-caption text-text-muted">
        <tr>
          <th
            v-for="column in columns"
            :key="column"
            scope="col"
            class="border-b border-border px-3 py-2 font-medium"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="profile in profiles.state.profiles"
          :key="profile.id"
          class="h-10 border-b border-border hover:bg-surface-2"
          tabindex="0"
          @keydown.f2.prevent="openRenameProfile(profile)"
        >
          <th
            scope="row"
            class="px-3 font-medium"
          >
            {{ profile.name }}
            <span
              v-if="profile.id === profiles.state.activeProfileId"
              class="ml-2 text-caption text-accent-text"
            >
              ● Active
            </span>
          </th>
          <td class="px-3 text-text-muted">
            {{ formatDateTime(profile.createdAt) }}
          </td>
          <td class="px-3 text-text-muted">
            {{ formatDateTime(profile.lastOpenedAt) }}
          </td>
          <td class="font-numeric px-3 tabular-nums">
            {{ profile.itemCount }}
          </td>
          <td class="font-numeric px-3 tabular-nums">
            {{ profile.recipeCount }}
          </td>
          <td class="font-numeric px-3 tabular-nums">
            {{ profile.questCount }}
          </td>
          <td class="px-3">
            <span class="flex justify-end gap-1">
              <button
                type="button"
                class="h-7 rounded-sm px-2 text-caption hover:bg-border disabled:opacity-40"
                :disabled="profile.id === profiles.state.activeProfileId"
                @click="activate(profile.id)"
              >
                ตั้งเป็น Active
              </button>
              <button
                type="button"
                class="grid size-7 place-items-center rounded-sm text-text-muted hover:bg-border hover:text-text"
                :aria-label="`เปลี่ยนชื่อ ${profile.name}`"
                @click="openRenameProfile(profile)"
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
                @click="openDeleteProfile(profile)"
              >
                <AppIcon
                  name="delete"
                  :size="16"
                />
              </button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
