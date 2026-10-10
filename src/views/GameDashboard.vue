<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ProfileDto } from '../../electron/ipc/contracts'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import ProfileCard from '../components/ProfileCard.vue'
import ItemThumbnail from '../components/ItemThumbnail.vue'
import OverallProgress from '../components/OverallProgress.vue'
import StatusBadge from '../components/StatusBadge.vue'
import TargetSummaryList from '../components/TargetSummaryList.vue'
import { useGathering } from '../stores/gathering'
import { useTracking } from '../stores/tracking'
import { announce } from '../stores/announcer'
import { openCreateProfile, openDeleteProfile, openRenameProfile } from '../stores/profile-dialogs'
import { useProfiles } from '../stores/profiles'
import { useToasts } from '../stores/toasts'

const profiles = useProfiles()
const toasts = useToasts()
const gathering = useGathering()
const { targets } = useTracking()

// The five items still missing the most (UI/UX Design Plan 3.1).
const topMissing = computed(() =>
  gathering.result.value.items
    .filter((row) => row.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 5),
)

const quickLinks = [
  { name: 'gathering', label: 'Gathering List' },
  { name: 'items', label: 'Item Library' },
  { name: 'recipes', label: 'Recipes' },
  { name: 'quests', label: 'Quests' },
] as const

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
          v-if="targets.length === 0"
          title="ยังไม่มีสิ่งที่ติดตาม"
          description="สร้าง Recipe หรือ Quest แล้วเลือกมาติดตามเพื่อดูความคืบหน้าของเกมนี้ที่นี่"
        >
          <div class="flex gap-2">
            <RouterLink
              :to="{ name: 'recipes' }"
              class="h-(--size-hit) rounded-md bg-accent px-4 leading-8 font-medium text-white hover:bg-accent-hover"
            >
              สร้าง Recipe
            </RouterLink>
            <RouterLink
              :to="{ name: 'quests' }"
              class="h-(--size-hit) rounded-md bg-accent px-4 leading-8 font-medium text-white hover:bg-accent-hover"
            >
              สร้าง Quest
            </RouterLink>
          </div>
        </EmptyState>
        <template v-else>
          <OverallProgress
            :owned="gathering.result.value.overall.owned"
            :required="gathering.result.value.overall.required"
          />
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <h3 class="mb-2 font-medium">
                ยังขาดมากที่สุด
              </h3>
              <ul class="flex flex-col gap-1">
                <li
                  v-for="row in topMissing"
                  :key="row.itemId"
                  class="flex items-center gap-3"
                >
                  <ItemThumbnail
                    :src="row.thumbnailUrl"
                    :name="row.name"
                    :size="32"
                  />
                  <span class="min-w-0 flex-1 truncate">{{ row.name }}</span>
                  <span class="font-numeric tabular-nums text-text-muted">{{ row.owned }} / {{ row.required }}</span>
                  <StatusBadge
                    :required="row.required"
                    :owned="row.owned"
                    :missing="row.missing"
                  />
                </li>
                <li
                  v-if="topMissing.length === 0"
                  class="text-status-ok"
                >
                  ไม่มีรายการที่ขาด
                </li>
              </ul>
            </div>
            <div>
              <h3 class="mb-2 font-medium">
                Active Tracking Targets
              </h3>
              <TargetSummaryList />
            </div>
          </div>
        </template>
        <nav
          class="flex flex-wrap gap-2 pt-2"
          aria-label="ทางลัด"
        >
          <RouterLink
            v-for="link in quickLinks"
            :key="link.name"
            :to="{ name: link.name }"
            class="h-8 rounded-md bg-surface-3 px-3 leading-8 hover:bg-border"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
      </section>
    </template>
  </div>
</template>
