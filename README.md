# GameLooter

GameLooter is a Vue 3 and Electron desktop app for tracking game items, crafting materials and quest requirements across many games, with a Windows overlay for use while playing. All five phases of the roadmap are written: a SQLite data layer with typed IPC, game profiles, items, recipes and quests with a shared gathering list, a Windows overlay with global hotkeys, region capture with clipboard and file import, and backup and restore. The window, overlay and capture flows still need a manual pass against a real game (see the checklists in `docs/08-acceptance-criteria.md`). The planning documents in `docs/` describe the target product and the development roadmap.

Project links:

- [Product page](https://dvgamerr.app/looter-app)
- [Releases and downloads](https://github.com/dvgamerr-app/looter-app/releases)
- [Changelog](https://github.com/dvgamerr-app/looter-app/releases)

## Requirements

- Windows 10 or 11, x64, for the packaged application
- Bun 1.4.2 as the package manager and script runner
- Node.js 24 LTS, needed only by `bun run typecheck` because vue-tsc cannot run under Bun

## Setup and development

Install the versions recorded in `bun.lock`:

```sh
bun install --frozen-lockfile
```

Start the Vite renderer and the Electron development process:

```sh
bun run dev
```

## Build

Compile the renderer, Electron main process, and preload script without packaging an installer:

```sh
bun x vite build
```

Create the production bundle and the Windows NSIS installer with Electron Builder:

```sh
bun run build
```

Generated output is written to `dist/`, `dist-electron/`, and `release/<version>/`. These directories are intentionally ignored by Git.

## Project structure

- `src/` — Vue renderer: `router.ts`, `views/` (one per screen), `components/`, `stores/` (composables over `window.api`) and the Tailwind CSS 4 stylesheet
- `electron/main.ts` — startup order: single-instance lock, database, migrations, settings, IPC handlers, main window
- `electron/preload.ts` — builds `window.api` from the channel allow-list in `electron/ipc/contracts.ts`; the raw `ipcRenderer` is never exposed
- `electron/ipc/` — typed contracts, handler registration with input validation, and the handlers per domain
- `electron/database/` — SQLite connection, migrations and repositories
- `electron/domain/` — pure business logic (aggregation, cycle check) with no Electron or SQLite imports
- `electron/settings/` — settings store over the `app_setting` table
- `electron/windows/` — window creation and bounds handling
- `docs/` — repository audit, architecture, feature specification, data model, UI/UX plan, roadmap, risks and acceptance criteria
- `electron-builder.json5` — Windows x64 packaging
- `data/` — development data excluded from version control

## Data and migrations

The app stores everything in one SQLite database, `%APPDATA%\looter-app\data\gamelooter.sqlite` (WAL mode, foreign keys on), and Item images under `data\images\<profile_id>\`. Only the main process opens the database; the renderer reaches it through `window.api` and never receives a profile id, because every handler reads the active profile in the main process.

The schema version lives in `PRAGMA user_version`. To change the schema, add `electron/database/migrations/NNN-name.ts` with the next number, export a `Migration` (`version`, `name`, `up(db)`), and append it to `electron/database/migrations/index.ts`. Never edit a migration that has shipped. Before applying anything to an existing database the runner saves a snapshot to `%APPDATA%\looter-app\backups\` (the latest five are kept), runs each migration in its own transaction and refuses to open a database written by a newer app version.

## Quality checks

There is no test suite yet. Before submitting changes, run the available checks:

```sh
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun x vite build
bun run build
bun audit
git diff --check
```

`bun run typecheck` runs vue-tsc under Node.js for the renderer and tsc under Bun for the Electron code. Without Node.js installed, `ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron.exe node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.app.json` runs the renderer check with the Node.js bundled in Electron. `bun audit` reports advisories inherited from Electron packaging and lint tooling; review the result before releasing, even when the application build succeeds.

## Support

- Join the [Discord community](https://discord.gg/QDccF497Mw)
- Open a GitHub issue or discussion
