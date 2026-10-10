<script setup lang="ts">
import type { RecipeTreeNode as Node } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import ItemThumbnail from './ItemThumbnail.vue'

defineProps<{ node: Node }>()
const { byId } = useItems()
</script>

<template>
  <li>
    <div class="flex items-center gap-2 py-0.5">
      <ItemThumbnail
        :src="byId.get(node.itemId)?.thumbnailUrl ?? null"
        :name="byId.get(node.itemId)?.name ?? '?'"
        :size="24"
      />
      <span>{{ byId.get(node.itemId)?.name ?? `#${node.itemId}` }}</span>
      <span class="font-numeric tabular-nums text-text-muted">×{{ node.qty }}</span>
      <span
        v-if="node.recipeId !== null"
        class="text-caption text-accent-text"
      >
        craft {{ node.runs }} รอบ<template v-if="node.surplus > 0"> · เหลือ {{ node.surplus }}</template>
      </span>
    </div>
    <ul
      v-if="node.children.length"
      class="ml-6 border-l border-border pl-3"
    >
      <RecipeTreeNode
        v-for="child in node.children"
        :key="`${child.itemId}-${child.recipeId}`"
        :node="child"
      />
    </ul>
  </li>
</template>
