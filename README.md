# GameLooter

GameLooter is a Vue 3 and Electron desktop app for tracking game items, crafting materials and quest requirements across many games, with a Windows overlay for use while playing. The current renderer is a placeholder checklist, and the Electron main process owns the local data layer. The planning documents in `docs/` describe the target product and the development roadmap.

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

- `src/` — Vue renderer, Tailwind CSS 4 utilities and the global stylesheet
- `electron/main.ts` — Electron lifecycle and the application window
- `electron/preload.ts` — sandboxed bridge between the renderer and the main process
- `electron/database/` — legacy JSON data layer, scheduled to be replaced by SQLite
- `docs/` — repository audit, architecture, feature specification, data model, UI/UX plan, roadmap, risks and acceptance criteria
- `electron-builder.json5` — Windows x64 packaging
- `data/` — development data excluded from version control

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

`bun run typecheck` runs vue-tsc under Node.js for the renderer and tsc under Bun for the Electron code. `bun audit` reports advisories inherited from Electron packaging and lint tooling; review the result before releasing, even when the application build succeeds.

## Support

- Join the [Discord community](https://discord.gg/QDccF497Mw)
- Open a GitHub issue or discussion
