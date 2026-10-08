# GameLooter

GameLooter is a Vue 3 and Electron desktop app for keeping game items, loot, and reminders in one place. The current renderer is a lightweight material checklist scaffold, while the Electron main process manages the local JSON-backed data layer.

Project links:

- [Product page](https://dvgamerr.app/looter-app)
- [Releases and downloads](https://github.com/dvgamerr-app/looter-app/releases)
- [Changelog](https://github.com/dvgamerr-app/looter-app/releases)

## Requirements

- Node.js 20.12.1 or newer
- Bun 1.3.14

## Setup and development

Install the versions recorded in `bun.lock`:

```sh
bun install --frozen-lockfile
```

Start the Vite renderer and Electron development process:

```sh
bun run dev
```

## Build

Compile the renderer, Electron main process, and preload script without packaging an installer:

```sh
bun x vite build
```

Create the production bundle and platform installer with Electron Builder:

```sh
bun run build
```

Generated output is written to `dist/`, `dist-electron/`, and `release/<version>/`. These directories are intentionally ignored by Git.

## Project structure

- `src/` — Vue renderer and global Tailwind/Sass styles
- `electron/main.js` — Electron lifecycle and browser window
- `electron/preload/` — isolated renderer bridge
- `electron/database/` — local JSON-backed data access
- `electron-builder.json5` — Windows, macOS, and Linux packaging targets
- `data/` — development data excluded from version control

## Quality checks

This repository currently has no dedicated test, lint, type-check, or format script. Before submitting changes, run the available checks:

```sh
bun install --frozen-lockfile
bun x vite build
bun run build
bun audit
git diff --check
```

`bun audit` may report advisories inherited from Electron packaging and Tailwind build tooling. Review the result before releasing, even when the application build succeeds.

## Support

- Join the [Discord community](https://discord.gg/QDccF497Mw)
- Open a GitHub issue or discussion
