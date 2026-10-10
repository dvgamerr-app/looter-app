<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeExpansionDto } from '../../electron/ipc/contracts'
import { useItems } from '../stores/items'
import RecipeTreeNode from './RecipeTreeNode.vue'

const props = defineProps<{ expansion: RecipeExpansionDto }>()
const { byId } = useItems()

const nameOf = (id: number): string => byId.value.get(id)?.name ?? `#${id}`
const gross = computed(() => props.expansion.gross.map((row) => `${nameOf(row.itemId)} ${row.qty}`).join(', '))
</script>

<template>
  <div class="flex flex-col gap-3">
    <ul>
      <RecipeTreeNode :node="expansion.tree" />
    </ul>

    <p class="text-text-muted">
      วัตถุดิบรวมตามสูตร (ไม่หักของที่มี): <span class="font-numeric text-text">{{ gross || '–' }}</span>
    </p>

    <div v-if="expansion.net.items.length">
      <p class="mb-1 text-text-muted">
        หลังหักของที่มีอยู่ (คำนวณแบบเดียวกับ Gathering List):
      </p>
      <table class="w-full text-left">
        <thead class="text-caption text-text-muted">
          <tr>
            <th class="py-1 font-medium">
              Item
            </th>
            <th class="py-1 text-right font-medium">
              ต้องใช้
            </th>
            <th class="py-1 text-right font-medium">
              มี
            </th>
            <th class="py-1 text-right font-medium">
              ขาด
            </th>
          </tr>
        </thead>
        <tbody class="font-numeric tabular-nums">
          <tr
            v-for="row in expansion.net.items"
            :key="row.itemId"
          >
            <td class="py-0.5 font-sans">
              {{ nameOf(row.itemId) }}
            </td>
            <td class="text-right">
              {{ row.required }}
            </td>
            <td class="text-right">
              {{ row.owned }}
            </td>
            <td
              class="text-right"
              :class="row.missing > 0 ? 'text-status-missing' : 'text-status-ok'"
            >
              {{ row.missing }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
