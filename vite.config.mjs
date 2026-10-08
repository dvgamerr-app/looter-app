import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.js',
      },
      preload: {
        // Shortcut of `build.rolldownOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rolldownOptions.input` instead `build.lib.entry`.
        input: path.join(import.meta.dirname, 'electron/preload/index.js'),
      },
      // The renderer never uses Node.js APIs: it talks to the main process through the preload bridge only.
    }),
  ],
})
