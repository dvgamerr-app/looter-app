import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rolldownOptions.input`. Emitted as dist-electron/preload.js.
        input: path.join(import.meta.dirname, 'electron/preload.ts'),
      },
      // The renderer never uses Node.js APIs: it talks to the main process through the preload bridge only.
    }),
  ],
})
