<script setup lang="ts">
defineProps<{ path: string[] }>()
</script>

<template>
  <div
    class="rounded-md border border-status-missing bg-surface-2 p-3 text-status-missing"
    role="alert"
  >
    Recipe วนกลับมาหาตัวเอง: {{ path.join(' → ') }}
    <p class="mt-1 text-caption text-text-muted">
      เอาวัตถุดิบตัวใดตัวหนึ่งในเส้นทางนี้ออกเพื่อตัดวง ระบบจะยังไม่บันทึกจนกว่าจะแก้
    </p>
  </div>
</template>
