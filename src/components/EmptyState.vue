<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section class="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-12 text-center">
    <h2 class="text-heading font-bold">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="text-text-muted"
    >
      {{ description }}
    </p>
    <slot />
  </section>
</template>
