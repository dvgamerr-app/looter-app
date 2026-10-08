<script setup lang="ts">
const items = [
  { id: 'todo1', title: 'Finish project proposal', detail: 'Due on 4/1/23' },
  { id: 'todo2', title: 'Buy groceries', detail: 'Bananas, milk, bread' },
  { id: 'todo3', title: 'Go for a run', detail: '3 miles' },
]
</script>

<template>
  <section class="mt-6 overflow-hidden">
    <h1 class="px-4 py-2 text-2xl font-bold uppercase text-gray-800">Material</h1>
    <form class="mx-auto flex w-full items-center border-b-2 border-teal-500 px-4 py-4">
      <input
        class="mr-3 w-full appearance-none border-none bg-transparent px-2 py-1 leading-tight text-gray-700 focus:outline-none"
        type="text"
        placeholder="Add a task"
      >
      <button
        class="flex-shrink-0 rounded border-4 border-teal-500 bg-teal-500 px-2 py-1 text-sm text-white hover:border-teal-700 hover:bg-teal-700"
        type="button"
      >
        Add
      </button>
    </form>
    <ul class="divide-y divide-gray-200 px-4">
      <li v-for="item in items" :key="item.id" class="flex items-center py-4">
        <input
          :id="item.id"
          :name="item.id"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        >
        <label :for="item.id" class="ml-3 block text-gray-900">
          <span class="text-lg font-medium">{{ item.title }}</span>
          <span class="text-sm font-light text-gray-500">{{ item.detail }}</span>
        </label>
      </li>
    </ul>
  </section>
</template>
