import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import globals from 'globals'

export default withVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,js,mjs,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      'dist/**',
      'dist-electron/**',
      'release/**',
      'node_modules/**',
      'data/**',
      // Legacy JavaScript data layer from the scaffold. Phase 1 replaces it with the SQLite data layer.
      'electron/database/**',
      'electron/settings/**',
      'electron/helper.js',
    ],
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/main-process',
    files: ['electron/**/*.ts', 'vite.config.mts', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    name: 'app/domain-purity',
    files: ['electron/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['electron', 'electron/*', 'better-sqlite3', 'node:*', '../database/*', '../ipc/*'],
              message: 'Domain logic must stay pure: do not import Electron, SQLite, Node.js or other layers.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'app/renderer',
    files: ['src/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
)
