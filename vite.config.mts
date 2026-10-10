import { defineConfig, type Plugin } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// index.html carries the production Content-Security-Policy. The dev server needs a WebSocket for HMR
// and injects styles at runtime, so only `vite serve` relaxes those two directives.
const relaxCspForDevServer = {
  name: 'relax-csp-for-dev-server',
  apply: 'serve',
  transformIndexHtml(html: string) {
    return html
      .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
      .replace("connect-src 'self'", "connect-src 'self' ws:")
  },
} satisfies Plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    relaxCspForDevServer,
    vue(),
    tailwindcss(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
        vite: {
          build: {
            // better-sqlite3 locates its native addon relative to its own files and electron-updater loads its
            // dependencies dynamically, so both stay runtime requires and are never bundled into dist-electron/main.js.
            rolldownOptions: { external: ['better-sqlite3', 'electron-updater'] },
          },
        },
      },
      preload: {
        // Shortcut of `build.rolldownOptions.input`. Emitted as dist-electron/preload.js.
        input: path.join(import.meta.dirname, 'electron/preload.ts'),
      },
      // The renderer never uses Node.js APIs: it talks to the main process through the preload bridge only.
    }),
  ],
  build: {
    // Two renderer pages: the main window and the overlay, each its own entry (F9-R1).
    rolldownOptions: {
      input: {
        main: path.join(import.meta.dirname, 'index.html'),
        overlay: path.join(import.meta.dirname, 'overlay.html'),
        capture: path.join(import.meta.dirname, 'capture.html'),
      },
    },
  },
})
