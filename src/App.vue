<script setup lang="ts">
import HelloWorld from './components/Lists.vue'
</script>

<template>
  <div class="title">
    <nav class="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-1">
        <div class="flex items-center h-8 space-x-3 rtl:space-x-reverse">
          <span class="self-center font-semibold whitespace-nowrap dark:text-white pl-2">GameLooter</span>
        </div>
        <!-- <div class="hidden w-full sm:block sm:w-10" id="navbar-solid-bg">
          <ul class="flex flex-col font-medium mt-4 rounded-lg bg-gray-50 sm:space-x-8 rtl:space-x-reverse sm:flex-row sm:mt-0 sm:border-0 sm:bg-transparent dark:bg-gray-800 sm:dark:bg-transparent dark:border-gray-700">
            <li>
              <a href="#" class="block py-2 px-3 sm:p-0 text-white bg-blue-700 rounded sm:bg-transparent sm:text-blue-700 sm:dark:text-blue-500 dark:bg-blue-600 sm:dark:bg-transparent" aria-current="page">Home</a>
            </li>
            <li>
              <a href="#" class="block py-2 px-3 sm:p-0 text-gray-900 rounded hover:bg-gray-100 sm:hover:bg-transparent sm:border-0 sm:hover:text-blue-700 dark:text-white sm:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white sm:dark:hover:bg-transparent">Services</a>
            </li>
            <li>
              <a href="#" class="block py-2 px-3 sm:p-0 text-gray-900 rounded hover:bg-gray-100 sm:hover:bg-transparent sm:border-0 sm:hover:text-blue-700 dark:text-white sm:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white sm:dark:hover:bg-transparent">Pricing</a>
            </li>
            <li>
              <a href="#" class="block py-2 px-3 sm:p-0 text-gray-900 rounded hover:bg-gray-100 sm:hover:bg-transparent sm:border-0 sm:hover:text-blue-700 dark:text-white sm:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white sm:dark:hover:bg-transparent">Contact</a>
            </li>
          </ul>
        </div>
        <div class="hidden w-full sm:block sm:w-10"></div> -->
      </div>
    </nav>
    
  </div>
  <div class="desktop">
    <HelloWorld msg="Vite + Vue" />
  </div>
</template>

<style lang="scss" scoped>
.max-w-screen-xl {
  grid-area: title;
  user-select: none;
  -webkit-app-region: drag;
}

.title, .desktop {
  outline: 1px solid #ffffff55;
}
.title {
  grid-area: title;
  user-select: none;

  > .bar {
    background-color: #1c1c1f;
    height: var(--system-titleBar-height);
    align-items: center;
    position: absolute;
    display: flex;
    gap: 0.25em;
    margin: -8px 0 0 -8px;
    width: 100%;
    
    .text {
      padding-left: 16px;
    }
  }

  .logo {
    font-size: 0.75rem;
    font-family: 'Mulish';
    font-weight: 700;
  }

}
.desktop {
  grid-area: desktop;
  overflow: auto;
}
</style>
