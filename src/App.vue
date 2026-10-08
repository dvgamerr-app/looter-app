<script setup lang="ts">
import Lists from './components/Lists.vue'
</script>

<template>
  <nav class="title border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
    <div class="drag-region mx-auto flex h-10 max-w-(--breakpoint-xl) items-center p-1">
      <span class="self-center whitespace-nowrap pl-2 font-semibold dark:text-white">GameLooter</span>
    </div>
  </nav>
  <Lists class="desktop" />
</template>

<style scoped>
.drag-region {
  user-select: none;
  -webkit-app-region: drag;
}

.title,
.desktop {
  outline: 1px solid #ffffff55;
}
.title {
  grid-area: title;
  user-select: none;
}
.desktop {
  grid-area: desktop;
  overflow: auto;
}
</style>
