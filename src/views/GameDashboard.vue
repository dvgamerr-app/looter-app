<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { ProfileDto } from '../../electron/ipc/contracts'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import ProfileCard from '../components/ProfileCard.vue'
import { announce } from '../stores/announcer'
import { openCreateProfile, openDeleteProfile, openRenameProfile } from '../stores/profile-dialogs'
import { useProfiles } from '../stores/profiles'
import { useToasts } from '../stores/toasts'

const profiles = useProfiles()
const toasts = useToasts()

const firstName = ref('')
const firstError = ref('')
const creating = ref(false)

// First run: the profile is created inline, without a dialog, and becomes active right away (F1-R3).
async function createFirst(): Promise<void> {
  if (creating.value) return
  creating.value = true
  firstError.value = ''
  const result = await profiles.create(firstName.value)
  creating.value = false
  if (result.ok) firstName.value = ''
  else firstError.value = result.error.message
}

async function select(profile: ProfileDto): Promise<void> {
  if (profile.id === profiles.state.activeProfileId) return
  const result = await profiles.switchTo(profile.id)
  if (result.ok) announce(`สลับไปที่ ${profile.name}`)
  else toasts.error(result.error.message)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'n') {
    event.preventDefault()
    openCreateProfile()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex flex-col gap-8 p-6">
    <!-- Loading: skeleton cards instead of a spinner; the data comes from the local database. -->
    <div
      v-if="!profiles.state.ready"
      class="flex gap-4"
      aria-busy="true"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="h-32 w-55 animate-pulse rounded-lg bg-surface-2"
      />
    </div>

    <EmptyState
      v-else-if="profiles.state.profiles.length === 0"
      title="เริ่มต้นด้วยการสร้าง Game Profile"
      description="ตั้งชื่อเกมที่คุณเล่น แล้วข้อมูลไอเทมและเควสของเกมนั้นจะถูกแยกไว้ต่างหาก"
    >
      <form
        class="flex w-full flex-col gap-2"
        @submit.prevent="createFirst"
      >
        <label class="flex flex-col gap-1 text-left">
          <span class="text-caption text-text-muted">ชื่อเกม</span>
          <input
            v-model="firstName"
            type="text"
            maxlength="100"
            autofocus
            autocomplete="off"
            :aria-invalid="firstError !== ''"
            class="h-(--size-hit) rounded-md border border-border bg-surface-2 px-3 text-text"
          >
          <span
            v-if="firstError"
            role="alert"
            class="text-caption text-status-missing"
          >{{ firstError }}</span>
        </label>
        <button
          type="submit"
          :disabled="creating"
          class="h-(--size-hit) rounded-md bg-accent font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        >
          สร้าง
        </button>
      </form>
    </EmptyState>

    <template v-else>
      <section
        class="flex flex-col gap-4"
        aria-labelledby="profiles-heading"
      >
        <div class="flex items-center justify-between">
          <h1
            id="profiles-heading"
            class="text-heading font-bold"
          >
            Game Profiles
          </h1>
          <button
            type="button"
            class="flex h-(--size-hit) items-center gap-2 rounded-md bg-accent px-3 font-medium text-white hover:bg-accent-hover"
            title="สร้าง Profile ใหม่ (Ctrl+N)"
            @click="openCreateProfile"
          >
            <AppIcon
              name="plus"
              :size="16"
            />
            Profile ใหม่
          </button>
        </div>
        <div class="flex flex-wrap gap-4">
          <ProfileCard
            v-for="profile in profiles.state.profiles"
            :key="profile.id"
            :profile="profile"
            :active="profile.id === profiles.state.activeProfileId"
            @select="select(profile)"
            @rename="openRenameProfile(profile)"
            @remove="openDeleteProfile(profile)"
          />
        </div>
      </section>

      <section
        v-if="profiles.activeProfile.value"
        class="flex flex-col gap-2 rounded-lg border border-border bg-surface-1 p-4"
        aria-labelledby="active-heading"
      >
        <h2
          id="active-heading"
          class="text-heading font-bold"
        >
          {{ profiles.activeProfile.value.name }}
        </h2>
        <EmptyState
          title="ยังไม่มีสิ่งที่ติดตาม"
          description="เพิ่ม Item, Recipe และ Quest แล้วความคืบหน้าของเกมนี้จะแสดงที่นี่ (เปิดใช้ใน Phase 2)"
        />
      </section>
    </template>
  </div>
</template>
