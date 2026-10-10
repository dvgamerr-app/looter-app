<script setup lang="ts">
import EmptyState from './EmptyState.vue'

defineProps<{ title: string; phase: number; description: string }>()
</script>

<template>
  <div class="p-6">
    <h1 class="mb-4 text-heading font-bold">
      {{ title }}
    </h1>
    <EmptyState
      title="ยังไม่เปิดให้ใช้งาน"
      :description="`${description} จะพร้อมใช้งานใน Phase ${phase}`"
    />
  </div>
</template>
