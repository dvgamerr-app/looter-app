# GameLooter repository guide

## Working conventions

- Use Bun 1.3.14 and keep `bun.lock` in sync with `package.json`.
- Preserve the renderer/main/preload boundary. Renderer code must not import Node.js or Electron APIs directly.
- Keep local database behavior in `electron/database/`; do not bypass it from Vue components.
- Prefer semantic HTML and data-driven Vue templates over repeated markup or presentation-only wrappers.
- Reuse Tailwind utilities already in the project. Add Sass only for global behavior that utilities cannot express clearly.
- Do not commit generated `dist/`, `dist-electron/`, `release/`, `data/`, or `node_modules/` content.

## Validation

Run the checks supported by this repository:

```sh
bun install --frozen-lockfile
bun x vite build
bun run build
bun audit
git diff --check
```

There are currently no project scripts for tests, linting, type-checking, or formatting. Do not claim those checks ran unless the corresponding tooling is added first.

## Optimization and technical-debt log

### 2026-08-02

- Replaced three duplicated checklist item templates with a single `v-for` driven by typed-in-place static data while preserving the existing labels, details, IDs, and checkbox names.
- Removed presentation-only wrappers from the title bar, checklist header, form, and list rows. Vue template source elements fell from 32 to 14, and the rendered page uses approximately eight fewer DOM elements for the current three items.
- Removed the unused component prop, reactive counter, commented navigation block, dead scoped selectors, stale Sass comments, and unused scrollbar selectors.
- Preserved the existing grid areas and spacing by applying `title` and `desktop` classes directly to the semantic root elements.
- Updated compatible Vue, CSS, YAML, and Vite tooling versions; moved JSONPath Plus to 10.4.0 and validated its query API with a focused smoke test.
- Updated Electron, Electron Builder, and its Windows packager peer to versions that remove the audit's critical dependency chain. `bun audit` improved from 95 findings (3 critical) to 53 findings (0 critical); remaining findings are transitive advisories in Electron/Tailwind/build tooling.
- Production renderer CSS fell from 24.53 kB to 21.84 kB before gzip after removing dead styles and simplifying the component markup.

## Known build notes

- Vite leaves the font URLs from `src/fonts.scss` for runtime resolution and reports them as unresolved at build time. This predates the current refactor and should be addressed separately with a focused asset-path/font-loading pass.
- The full packaging build can require network access when Electron Builder has not already cached Electron or platform packaging binaries.
