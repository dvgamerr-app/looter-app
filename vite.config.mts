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
      },
      preload: {
        // Shortcut of `build.rolldownOptions.input`. Emitted as dist-electron/preload.js.
        input: path.join(import.meta.dirname, 'electron/preload.ts'),
      },
      // The renderer never uses Node.js APIs: it talks to the main process through the preload bridge only.
    }),
  ],
})
