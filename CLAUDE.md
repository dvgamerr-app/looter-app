# GameLooter repository guide

## Working conventions

- Use Bun 1.4.2 as the package manager and script runner, and keep `bun.lock` in sync with `package.json`. Node.js 24 LTS is needed only by `bun run typecheck`: vue-tsc patches tsc through Node's CommonJS loader, which Bun does not emulate, so under Bun alone it silently degrades to plain tsc and skips `.vue` files. When Node.js is not installed, run `ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron.exe node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.app.json`: Electron bundles Node.js 24 and this reports `.vue` errors like the real check.
- Only `electron` may run dependency lifecycle scripts (`trustedDependencies`). Bun's default trusted list would run the `electron-winstaller` install script, which needs a Node binary and only serves the unused Squirrel target.
- Preserve the renderer/main/preload boundary. Renderer code must not import Node.js or Electron APIs; it reaches the main process only through the preload bridge. Keep `contextIsolation` and `sandbox` on and `nodeIntegration` off.
- Write Electron, data-model, business-logic and IPC code in TypeScript 5.x. Do not use TypeScript 6 or 7. There is no JavaScript left in `electron/`.
- The renderer talks to the main process only through `window.api`, which `electron/preload.ts` builds from the channel allow-lists in `electron/ipc/contracts.ts`. To add a command, declare it in `InvokeContract` and `INVOKE_CHANNELS` (a compile-time check fails if they drift), then register it with `handle()` from `electron/ipc/register.ts`. Every handler validates its input and reads the active profile from the settings service; the renderer never sends a `profile_id`.
- Keep local database behavior in `electron/database/`; do not bypass it from Vue components. Schema changes are new `electron/database/migrations/NNN-name.ts` files added to `migrations/index.ts`; never edit a shipped migration. Repositories prepare their statements once and use named parameters.
- `electron/domain/` is pure business logic: ESLint forbids importing `electron`, `better-sqlite3`, Node.js modules or the database and IPC layers there. `electron/ipc/contracts.ts` is imported by the renderer as types, so it must never import Electron or Node.js.
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

### 2026-10-10 (Phases 3 to 5)

- Overlay (`electron/windows/overlay-window.ts`, `src/overlay/`): created lazily and then only hidden, View mode is click-through and unfocusable, Interactive mode takes input, topmost is re-asserted every 2 s while visible, bounds are saved with a 200 ms debounce and constrained to a connected display. A hidden overlay is excluded from `broadcast()` (`suppressEventsFor`) and gets one fresh push when shown. The app quits explicitly when the main window closes, because `window-all-closed` never fires while the hidden overlay window exists.
- Hotkeys (`electron/hotkeys/hotkey-manager.ts`): every action registers on its own and the real result feeds `settings.hotkeyStatus`; invalid, conflicting and refused accelerators keep the previous registration.
- Capture (`electron/windows/capture-window.ts`, `electron/capture/screen-capture.ts`, `src/capture/`): the display under the cursor is grabbed at physical resolution, black frames are detected by sampling a 16x16 grid, the crop multiplies the CSS rectangle by the display scale, and the result enters the pending store. The app denies every browser permission request; screen capture happens in the main process only.
- Backup (`electron/backup/backup-service.ts`, fflate): export snapshots with `db.backup()`; restore validates the manifest, entry names (zip slip) and the extracted database (`integrity_check`, `user_version`, `foreign_key_check`, migrations without a snapshot, orphan cleanup) before the data folder is swapped by two renames, with rollback. Tested against the real better-sqlite3 binary, which also caught a non-SQLite file escaping as a raw SQLite error.
- Packaging: only the `win32-x64` better-sqlite3 addon ships (the installer went from 131.7 MB to 123.6 MB) and the unused Mulish, Poppins and orphaned Open Sans font files are gone.
- Not done and needing the owner: the code-signing decision, `electron-updater` with the GitHub release workflow, the Windows 10/11 and DPI test matrix, performance measurements against a running game, and the first release. None of the windows (main, overlay, capture) has been exercised by this log's author; see the manual checklists in `docs/08-acceptance-criteria.md`.

### 2026-10-10 (Phase 2)

- Added items, recipes, quests, tracking targets, manual inventory and the gathering list. `electron/domain/aggregation.ts`, `cycle.ts` and `expand.ts` are pure functions; the aggregation reproduces every worked example of Data Model section 7.4 (Requirement 3.5: 45/20/25, 28/68; nested, gather-override, surplus and priority-swap cases).
- Consume and craft are single transactions that re-check the inventory inside the transaction and write nothing when anything is short; the handler composes them with completing a quest or lowering a recipe target in the same outer transaction.
- Images: `electron/images/` holds the store (atomic writes, 64x64 padded thumbnail), the in-memory pending store (10 minutes, 5 images, 64 MB, dropped on profile switch) and the `looter-img://` protocol, which only serves `images/<profile>/...png` files. Clipboard import uses the Electron 44 `clipboard.read()` API.
- `electron/gathering/service.ts` recomputes after every mutation (16 ms debounce) and pushes `gathering:changed`; the renderer never recalculates. Renderer stores (`src/stores/`) reload on the matching push events and clear on `profile:changed`.
- Not verified by running the window: the image protocol, the clipboard path and every screen need a manual pass. Region capture, drag and drop of files and the Settings sections for hotkeys, overlay and backup are later phases.

### 2026-10-10

- Replaced the JSON data layer with SQLite (better-sqlite3 13.0.3): `electron/database/` opens the single connection (WAL, foreign keys, `quick_check`, quarantine of a corrupt file), `migrate.ts` snapshots an existing database before migrating and applies each migration in its own transaction, and `001-initial.ts` creates the nine tables of the data model. Repositories exist for every entity; profile and setting are complete, the rest are read-only until Phase 2.
- Replaced the generic `window.ipcRenderer` bridge with typed IPC: `electron/ipc/contracts.ts` declares every channel of Feature Specification section 14, `register.ts` validates and normalises errors into `{ ok, data | error }` and rejects windows the app did not create, and channels whose feature has not been built answer with an `INTERNAL` "not supported yet" error.
- Moved settings and window bounds into `app_setting` with per-field repair of invalid values, added the single-instance lock, the production CSP and the Game Profile handlers.
- Built the app shell (hash router with six screens, title bar, collapsible sidebar, profile switcher, dialogs, toasts) and Game Profile create, rename, delete and switch. Phase 2 screens are placeholders.
- Removed `electron/database/index.js`, `electron/settings/index.js`, `electron/helper.js`, `MaterialList.vue`, `jsonpath-plus` and `yaml`, plus the ESLint ignores and `allowJs` that supported them.
- Verification: lint, `typecheck:main`, the renderer type check (through Electron's bundled Node.js), `vite build` and `bun run build` pass, and the packaged app contains `app.asar.unpacked/node_modules/better-sqlite3`. The migration runner, repositories and settings guards were exercised against the real better-sqlite3 binary under Electron 44's Node.js (fresh database, idempotent rerun, backup, rollback, downgrade refusal, numbering gap). The window itself has not been launched, so the CSP, the title bar overlay and the dialogs still need a manual pass.
- `bun audit` still reports the same three build-time advisories (braces, sprintf-js, tmp).

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

- `public/looter.ico` holds seven sizes from 16 to 256 px (PNG-compressed entries), generated by a script as a gem on a dark tile, and `win.icon` points at it. Replace it with the final artwork when one exists.
- No code-signing certificate is configured. Windows SmartScreen warns on the unsigned installer.
- The packaging build downloads Electron, 7-Zip and NSIS on first run, so it needs network access until those are cached.
- Electron 44 exposes the clipboard only in the main process and only through the Promise-based W3C-style API (`clipboard.read()` returning `ClipboardItem` objects); `readImage` and the other narrow helpers no longer exist.
- The Content-Security-Policy in `index.html` is the production value; `vite.config.mts` relaxes `style-src` and `connect-src` only under `vite serve` for HMR. It has not yet been observed in a running window, so confirm there is no CSP violation in the DevTools console and no Electron security warning the first time the app is launched.
- The packaged app unpacks every platform prebuild of better-sqlite3 (about 8 `.node` files); trimming it to `win32-x64` is a Phase 5 packaging task.
- Run the application with `ELECTRON_RUN_AS_NODE` unset: it is set in some shells (including the VS Code extension host) and makes `electron.exe` behave as plain Node.js, so `app` is undefined.
