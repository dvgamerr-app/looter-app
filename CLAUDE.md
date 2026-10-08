# GameLooter repository guide

## Working conventions

- Use Bun 1.4.2 as the package manager and script runner, and keep `bun.lock` in sync with `package.json`. Node.js 24 LTS is needed only by `bun run typecheck`: vue-tsc patches tsc through Node's CommonJS loader, which Bun does not emulate, so under Bun alone it silently degrades to plain tsc and skips `.vue` files.
- Only `electron` may run dependency lifecycle scripts (`trustedDependencies`). Bun's default trusted list would run the `electron-winstaller` install script, which needs a Node binary and only serves the unused Squirrel target.
- Preserve the renderer/main/preload boundary. Renderer code must not import Node.js or Electron APIs; it reaches the main process only through the preload bridge. Keep `contextIsolation` and `sandbox` on and `nodeIntegration` off.
- Write Electron, data-model, business-logic and IPC code in TypeScript 5.x. Do not use TypeScript 6 or 7. The legacy JavaScript modules `electron/database/`, `electron/settings/` and `electron/helper.js` are ESLint-ignored and type-checked with `checkJs: false` until the SQLite data layer replaces them; do not extend them.
- Keep local database behavior in `electron/database/`; do not bypass it from Vue components.
- Prefer semantic HTML and data-driven Vue templates over repeated markup or presentation-only wrappers. Components need multi-word names (`vue/multi-word-component-names`).
- Style with Tailwind CSS 4 utilities. Tailwind is configured in `src/index.css` through `@import 'tailwindcss'` and the `@tailwindcss/vite` plugin; there is no `tailwind.config.js`, PostCSS or Sass. Add plain CSS with native nesting only for global behavior that utilities cannot express clearly.
- Packaging targets Windows x64 only in `electron-builder.json5`. When a native module such as better-sqlite3 is added, keep it in `dependencies` and set `npmRebuild: false`, because the N-API prebuilds need no rebuild and the machine has no Python or build tools.
- Do not commit generated `dist/`, `dist-electron/`, `release/`, `data/`, or `node_modules/` content. Delete stale `dist-electron/` files when entry points move; a stale `preload.js` once hid a broken preload path.
- The planning documents in `docs/` are written in Thai with English technical terms. Update them when a decision changes.

## Validation

Run the checks supported by this repository:

```sh
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun x vite build
bun run build
bun audit
git diff --check
```

`bun run typecheck` needs Node.js on PATH for the renderer part and fails loudly without it. There are no test scripts. Do not create or modify test scripts for new features unless explicitly asked, and do not claim that tests ran.

## Optimization and technical-debt log

### 2026-10-08

- Upgraded dependencies one group at a time with a build after each: Electron 35.7.5 to 44.7.0 with Electron Builder 26.17.0; Vite 6.4.3 to 8.3.3 with @vitejs/plugin-vue 6 and vite-plugin-electron 1.1.2, removing vite-plugin-electron-renderer; Tailwind CSS 3.4.19 to 4.3.3 through @tailwindcss/vite, removing Sass, PostCSS and Autoprefixer; Vue 3.5.43, yaml 2.9.1 and jsonpath-plus 11.2.0.
- Added TypeScript 5.9.3, vue-tsc 3.3.12, @vue/tsconfig, ESLint 10.12.0 with eslint-plugin-vue and @vue/eslint-config-typescript. Entry points are now `electron/main.ts`, `electron/preload.ts`, `src/main.ts` and `vite.config.mts`, with `tsconfig.app.json` for the renderer and `tsconfig.node.json` for the Electron side.
- Fixed the preload output name to `dist-electron/preload.js`, attached the move and maximize listeners to the window instead of the app object, enabled the window security options explicitly, and fixed the font paths that produced 54 unresolved-URL warnings per build.
- Removed the dead `electron/config.js`, `electron/preload/dom.js`, `src/assets/vue.svg` and the missing `/vite.svg` favicon reference.
- `bun audit` went from 68 advisories to 3 after `bun audit fix`; the remaining braces, sprintf-js and tmp advisories are transitive build-time dependencies of the lint and packaging tooling.
- Verified in a scratch project that better-sqlite3 13.0.3 loads in Electron 44 in development and inside the packaged asar without a rebuild, with WAL, foreign keys and transactions working. Electron Builder must run with `npmRebuild: false` or it tries node-gyp and fails without Python.

### 2026-08-02

- Replaced three duplicated checklist item templates with a single `v-for` driven by typed-in-place static data while preserving the existing labels, details, IDs, and checkbox names.
- Removed presentation-only wrappers from the title bar, checklist header, form, and list rows. Vue template source elements fell from 32 to 14, and the rendered page uses approximately eight fewer DOM elements for the current three items.
- Removed the unused component prop, reactive counter, commented navigation block, dead scoped selectors, stale Sass comments, and unused scrollbar selectors.
- Preserved the existing grid areas and spacing by applying `title` and `desktop` classes directly to the semantic root elements.
- Updated compatible Vue, CSS, YAML, and Vite tooling versions; moved JSONPath Plus to 10.4.0 and validated its query API with a focused smoke test.
- Updated Electron, Electron Builder, and its Windows packager peer to versions that remove the audit's critical dependency chain.

## Known build notes

- `public/looter.ico` is 128x128 and Electron Builder requires at least 256x256 for `win.icon`, so the installer uses the default Electron icon until a larger asset exists.
- No code-signing certificate is configured. Windows SmartScreen warns on the unsigned installer.
- The packaging build downloads Electron, 7-Zip and NSIS on first run, so it needs network access until those are cached.
- Electron 44 exposes the clipboard only in the main process and only through the Promise-based W3C-style API (`clipboard.read()` returning `ClipboardItem` objects); `readImage` and the other narrow helpers no longer exist.
- The renderer has no Content-Security-Policy yet; Electron logs a security warning at startup. Add one when the typed IPC layer lands.
