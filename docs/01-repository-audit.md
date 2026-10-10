# Repository Audit Report

รายงานผลการตรวจสอบ Repository `looter-app` ก่อนเริ่ม Phase 1 — Foundation: โครงสร้างปัจจุบัน, Dependencies ที่อัปเดตแล้ว, ผลการตรวจสอบ, โค้ดที่นำกลับมาใช้ได้, ปัญหาที่ยังเหลือ และข้อเสนอแนะก่อนเริ่ม Implementation

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง:

- [Architecture Proposal](02-architecture-proposal.md)
- [Feature Specification](03-feature-specification.md)
- [Data Model](04-data-model.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Development Roadmap](06-development-roadmap.md)
- [Risks & Limitations](07-risks-and-limitations.md)
- [Acceptance Criteria](08-acceptance-criteria.md)
- [sqlite.dbml](sqlite.dbml) (Schema อ้างอิงเดิม ซึ่งเอกสาร Data Model จะเขียนใหม่)

ข้อเท็จจริงทั้งหมดในเอกสารนี้ตรวจสอบจาก Repository `E:\.dvgamerr\looter-app` บน Branch `feat/phase1-foundation` เมื่อ 2026-10-08 ด้วยคำสั่ง `git log`, `git show --stat`, `git diff --stat`, `git ls-files` และการอ่านไฟล์โดยตรง ข้อมูลที่ไม่สามารถยืนยันได้จะระบุว่า "ต้องตรวจสอบ"

---

## 1. สรุปผู้บริหาร

### 1.1 Repository เดิมเป็นอย่างไร

- เป็น Scaffold จาก Template ของ `vite-plugin-electron` (Commit `0ec4852 refactor: init project electronjs`) เขียนด้วย JavaScript ทั้งหมด ไม่มี Lint, ไม่มี Type Check, ไม่มี Test
- Dependencies ที่ `0ec4852` อยู่ที่ Electron `^30.0.1`, Vite `^5.2.10`, Vue `^3.4.23`, Tailwind CSS `^3.4.3`, electron-builder `^24.13.3` และใช้ `pnpm-lock.yaml` ทั้งที่ Script `build` เรียก `vue-tsc` ซึ่งไม่ได้อยู่ใน `devDependencies` และไม่มี `tsconfig` ใด ๆ
- มีงานค้างจากวันที่ 2026-08-02 ที่ยังไม่ได้ Commit (ย้ายไป Bun, อัปเดต Dependencies ขึ้นมาถึง Electron 35.7.5 / Vite 6.4.3 / Tailwind 3.4.19, ลดความซ้ำซ้อนของ Template ใน Renderer และเขียน README/CLAUDE.md)
- Renderer เป็น Checklist ตัวอย่าง 3 รายการ (ไม่ใช่โค้ดผลิตภัณฑ์) ส่วน Main Process มี Data Layer แบบ JSON ที่มีบั๊กหลายจุดจนใช้งานจริงไม่ได้ (รายละเอียดในหัวข้อ 6.4)
- Preload Script ถูก Build ไปที่ชื่อไฟล์ที่ Main Process ไม่ได้โหลด (ทำงานได้เฉพาะในเครื่องที่มีไฟล์ `dist-electron/preload.js` ค้างจากปี 2024)

### 1.2 Repository ปัจจุบันเป็นอย่างไร

- Branch `feat/phase1-foundation` แตกจาก `main` ที่ `7bab884` หลังจากตรวจสอบและ Commit งานค้างแล้ว (Merge-base ยืนยันแล้วว่าเป็น `7bab884`)
- Stack: Electron 44.7.0 (Chromium 152, Node 24.21.0, N-API 10, ABI 149), Vite 8.3.3 (Rolldown), Vue 3.5.43, Tailwind CSS 4.3.3 ผ่าน `@tailwindcss/vite`, TypeScript 5.9.3, ESLint 10.12.0, Bun 1.4.2 เป็น Package Manager และ Script Runner
- Packaging เหลือเฉพาะ Windows x64 NSIS; Window Security Baseline (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`) เปิดใช้แล้วใน `electron/main.ts`
- Entry Point ทั้งหมดเป็น TypeScript (`electron/main.ts`, `electron/preload.ts`, `src/main.ts`, `vite.config.mts`) ส่วน Data Layer เดิมยังเป็น JavaScript ที่ ESLint ข้ามการตรวจไว้ รอการแทนที่ด้วย SQLite ใน Phase 1
- `bun run lint` ผ่าน 0 ปัญหา, `bun x vite build` ผ่านโดยไม่มี Warning, `bun run build` สร้าง `release/1.0.0/GameLooter-Windows-1.0.0-Setup.exe` ได้, `bun audit` เหลือ 3 Advisories ที่เป็น Build-time เท่านั้น

### 1.3 คำตัดสินความพร้อม

Repository **พร้อมสำหรับเริ่ม Phase 1 implementation** ในระดับ Scaffold: Toolchain, Build, Packaging และ Security Baseline ทำงานได้และตรวจสอบแล้ว เงื่อนไขที่ต้องรับทราบก่อนเริ่ม:

1. เครื่องพัฒนาไม่มี Node.js จึงรัน `bun run typecheck` (ส่วน `typecheck:renderer` ที่ใช้ vue-tsc) ในเครื่องไม่ได้จนกว่าจะติดตั้ง Node.js 24 LTS (หัวข้อ 7.1)
2. Data Layer เดิม (`electron/database/index.js`, `electron/settings/index.js`, `electron/helper.js`) ต้องถูกแทนที่ทั้งชุด ไม่ใช่แก้ทีละจุด (Owner Decision 8)
3. Preload Bridge ยังเป็นแบบ Generic (`window.ipcRenderer` ทุก Channel) ต้องแทนที่ด้วย Typed API `window.api` ก่อนมี Feature จริง
4. ยังไม่มี Content-Security-Policy, Icon ยังเป็น 128×128 และไม่มี Code Signing ซึ่งไม่ขวาง Phase 1 แต่ต้องปิดก่อน Release (หัวข้อ 7)
5. `origin/main` มี Commit `6590336` ที่ไม่อยู่ใน Branch นี้ ต้อง Rebase หรือ Merge ก่อนเปิด PR และควรตัดสินใจก่อนที่โค้ด Phase 1 จะทับซ้อนไฟล์เดียวกัน (หัวข้อ 4.5 และ 7.12)

---

## 2. โครงสร้าง Repository ปัจจุบัน

ตรวจสอบจาก `git ls-files` และ Working Tree เมื่อ 2026-10-08 (ไม่รวม `node_modules/`, `dist/`, `dist-electron/`, `release/` ซึ่งเป็นไฟล์ที่สร้างขึ้นและอยู่ใน `.gitignore`)

```
looter-app/
├── .github/
│   ├── FUNDING.yml              # ลิงก์สนับสนุนโครงการบน GitHub
│   └── dependabot.yml           # Dependabot สำหรับ ecosystem github-actions เท่านั้น (ยังไม่มี .github/workflows/)
├── .vscode/
│   └── extensions.json          # แนะนำ Extension Vue.volar (ไฟล์อื่นใน .vscode/ ถูก ignore)
├── .gitignore                   # ignore node_modules, dist, dist-electron, release, data, *.local, .DS_Store ฯลฯ
├── CLAUDE.md                    # คู่มือ Repository: Working conventions, Validation, Technical-debt log (มีการแก้ไขที่ยังไม่ Commit)
├── LICENSE                      # MIT
├── README.md                    # วิธีติดตั้ง, พัฒนา, Build และ Quality checks (มีการแก้ไขที่ยังไม่ Commit)
├── bun.lock                     # Lockfile ของ Bun (แทน pnpm-lock.yaml ที่ลบไป)
├── package.json                 # Scripts, Dependencies, packageManager bun@1.4.2, engines, trustedDependencies
├── electron-builder.json5       # Packaging: appId, productName GameLooter, asar, NSIS x64, output release/${version}
├── eslint.config.mjs            # ESLint 10 Flat Config: @eslint/js + eslint-plugin-vue flat/recommended + withVueTs
├── index.html                   # Renderer entry ของ Main Window; favicon /looter.ico; โหลด /src/main.ts
├── tsconfig.json                # Project references ไปยัง tsconfig.app.json และ tsconfig.node.json
├── tsconfig.app.json            # Renderer: extends @vue/tsconfig/tsconfig.dom.json, include src/**
├── tsconfig.node.json           # Main/Preload: extends @vue/tsconfig/tsconfig.json, lib ES2024, types node, allowJs, checkJs false
├── vite.config.mts              # Vite 8: plugin vue + tailwindcss + electron (simple API: main entry, preload input)
├── electron/
│   ├── main.ts                  # app lifecycle, BrowserWindow (titleBarStyle hidden + titleBarOverlay), โหลด dist/index.html หรือ VITE_DEV_SERVER_URL
│   ├── preload.ts               # contextBridge เปิด window.ipcRenderer {on, off, send, invoke} (Generic bridge ของ Scaffold รอแทนที่ด้วย Typed API)
│   ├── helper.js                # debounce() (JavaScript, ESLint-ignored)
│   ├── database/index.js        # Legacy JSON "tables" ใน %APPDATA%/looter-app/Database/*.json (มีบั๊ก ดูหัวข้อ 6.4, ESLint-ignored, checkJs off)
│   └── settings/index.js        # Window position handler ที่ทำได้แค่ console.log; initilizeApp อ้าง config ที่ไม่ได้ประกาศ (Legacy, ESLint-ignored)
├── src/
│   ├── main.ts                  # createApp(App).mount('#app'); subscribe 'main-process-message'
│   ├── App.vue                  # Title bar (drag region) + <MaterialList class="desktop" />
│   ├── components/
│   │   └── MaterialList.vue     # Checklist ตัวอย่าง 3 รายการแบบ static (ไม่ใช่โค้ดผลิตภัณฑ์)
│   ├── index.css                # @import './fonts.css'; @import 'tailwindcss'; :root, grid #app (title/desktop), scrollbar
│   ├── fonts.css                # 54 @font-face (Mulish, Open Sans, Poppins, Roboto) ชี้ไป /fonts/*.woff2; ยังไม่มี font-family ถูกใช้
│   └── vite-env.d.ts            # ประกาศ type ของ Window.ipcRenderer
├── public/
│   ├── fonts/*.woff2            # 78 ไฟล์ (1,675,428 bytes) ถูกอ้างอิงจาก fonts.css 54 ไฟล์ อีก 24 ไฟล์ไม่ถูกอ้างอิง (622,008 bytes)
│   ├── looter.ico               # ICO 5 ขนาด: 128, 64, 48, 32, 16 px (ใหญ่สุด 128×128)
│   └── looter-48/64/128.png     # PNG ขนาด 48, 64, 128 px
├── docs/
│   ├── README.md                # ดัชนีเอกสารแผนงาน (ยังไม่ Commit)
│   ├── sqlite.dbml              # Schema SQLite เดิม: Game, Item(Own, Loot, Image blob), ItemCraft(CraftId, ItemId, Qty), Recipe(ItemId, Qty, Done)
│   └── 01..08-*.md              # เอกสารแผนงานชุดนี้ (ยังไม่ Commit)
└── data/                        # gitignored: ตัวอย่างข้อมูลพัฒนาสำหรับ "V-Rising" (Game.csv, Item.csv, ItemCraft.csv) มีเฉพาะในเครื่องพัฒนา
```

ข้อสังเกตจากการเทียบกับ Working Tree จริง:

- ไฟล์ที่ Git ติดตามทั้งหมดตรงกับผังด้านบน; ไฟล์ `.DS_Store` ที่ root และใน `src/` มีอยู่บนดิสก์แต่ถูก ignore
- `data/` อยู่ใน `.gitignore` จึงไม่ได้อยู่ใน Version Control; `Item.csv` ในโฟลเดอร์นี้มีทั้งส่วน Game, Item และ ItemCraft รวมในไฟล์เดียว ส่วน `ItemCraft.csv` มีคอลัมน์ `Id,Want` (1 แถว) ซึ่งเป็นแนวคิด "จำนวนที่ต้องการสร้าง" ที่ตรงกับ `tracking_target.target_qty` ใน Data Model ใหม่
- Window Security Baseline ใน `electron/main.ts`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, Preload ที่ `dist-electron/preload.js`
- Renderer ใช้ Base `./` (ตั้งโดย vite-plugin-electron) ทำให้ Asset ใน `public/` resolve ได้ภายใต้ `file://`
- `%APPDATA%\looter-app\Database\` บนเครื่องพัฒนามีไฟล์ `Game.json`, `Item.json`, `ItemCraft.json`, `Recipe.json` และ `publuc.json` (ชื่อสะกดผิดที่ `createTable` สร้างขึ้นเอง ดูหัวข้อ 6.4) ขนาด 16–21 bytes ต่อไฟล์ ซึ่ง Legacy Layer สร้างระหว่าง Runtime Smoke เมื่อ 2026-10-08; ไฟล์เหล่านี้ไม่เคยมีข้อมูลผู้ใช้จริงและไม่ต้อง Migrate (ตำแหน่งจัดเก็บใหม่อยู่ใน [Data Model](04-data-model.md))

---

## 3. Dependencies

### 3.1 ตารางเปรียบเทียบ Before / After

"Before" คือสถานะ `main @ 7bab884` (= `0ec4852` บวกงานค้างจาก 2026-08-02 ที่ Commit แล้ว) และ "After" คือ `feat/phase1-foundation` เวอร์ชันที่ Resolve จริงยืนยันจาก `bun.lock` และ `node_modules/*/package.json`

| Package | Before (main @ 7bab884) | After (feat/phase1-foundation) | เหตุผล | Breaking changes ที่จัดการ |
|---|---|---|---|---|
| `electron` | ^35.7.5 | 44.7.0 (pin) | Stable ล่าสุดที่ Compatible; ได้ Chromium 152, Node 24.21.0, N-API 10, ABI 149 | Electron 42+ ไม่ดาวน์โหลด Binary ใน `postinstall` แต่ดาวน์โหลดเมื่อรัน CLI ครั้งแรก (`bun x electron --version`) ซึ่งเข้ากับ Bun; Electron 44 เปลี่ยน `clipboard` เป็น Promise/`ClipboardItem` และอยู่ใน Main Process เท่านั้น (ยังไม่มีโค้ดใช้ จึงต้องเขียนตาม API ใหม่ตั้งแต่ต้น); Sandboxed Preload `require` ได้เฉพาะ `electron` (Preload เดิมบางอยู่แล้ว); ตัด Windows ia32 (เราใช้ x64 เท่านั้น); Permission Request ของ Screen Capture รายงานเป็น `display-capture` |
| `electron-builder` | ^26.15.3 | 26.17.0 (pin) | Patch ล่าสุดของสาย 26 | ไม่มี Config เปลี่ยน; ตรวจพบว่า electron-builder ตรวจเจอ Bun แล้วใช้การไล่ `node_modules` แบบ Manual |
| `electron-builder-squirrel-windows` | 26.15.3 | 26.17.0 (pin) | เป็น Hard Peer ของ `app-builder-lib@26.17.0` (`peerDependencies` ระบุ `26.17.0` ตรงตัว) จึงต้องยกเวอร์ชันพร้อมกันแม้ไม่ได้ใช้ Target Squirrel | Install Script ของ `electron-winstaller@5.4.0` (Transitive) ต้องการ `node` ซึ่งไม่มีในเครื่อง → จัดการด้วย `trustedDependencies` (หัวข้อ 3.3) |
| `vite` | ^6.4.3 | 8.3.3 | Vite 8 ใช้ Rolldown เป็น Bundler; รองรับโดย vite-plugin-electron 1.x | Config เปลี่ยนชื่อไฟล์เป็น `vite.config.mts` ในกลุ่ม Toolchain; ใช้ `import.meta.dirname` แทน `__dirname`; Option ของ Preload เป็น `build.rolldownOptions.input` (vite-plugin-electron 1.x จัดการให้) |
| `@vitejs/plugin-vue` | ^5.2.4 | 6.0.9 | รุ่นที่ไปกับ Vite 8 | ไม่ต้องแก้โค้ด |
| `vite-plugin-electron` | ^0.28.8 | 1.1.2 | รองรับ Vite 7 และ 8; ยังใช้ `simple` API เดิม | Preload ต้องกำหนด `input` เป็น Path เต็มของ `electron/preload.ts` และได้ Output `dist-electron/preload.js`; ตัด Option `renderer: {}` ออก |
| `vite-plugin-electron-renderer` | ^0.14.7 | ลบ | ปลั๊กอินนี้ Polyfill Node.js API ใน Renderer ซึ่งขัดกับ Security Baseline (`nodeIntegration: false`, `sandbox: true`) | ลบ Option `renderer` ออกจาก `vite.config.mts`; Renderer ติดต่อ Main Process ผ่าน Preload เท่านั้น |
| `vue` | ^3.5.40 | 3.5.43 | Patch ล่าสุด | ไม่มี |
| `tailwindcss` | ^3.4.19 | 4.3.3 | Tailwind 4 ตั้งค่าใน CSS ผ่าน Vite Plugin; ลด Toolchain (ไม่ต้องมี PostCSS/Autoprefixer) | ลบ `tailwind.config.js` และ `postcss.config.js`; `@tailwind base/components/utilities` → `@import 'tailwindcss'`; เปลี่ยนชื่อ Utility: `max-w-screen-xl` → `max-w-(--breakpoint-xl)`, `flex-shrink-0` → `shrink-0`, `focus:outline-none` → `focus:outline-hidden`; ค่าเริ่มต้นของ `dark:` ใน Tailwind 4 ใช้ `prefers-color-scheme` ซึ่งตรงกับ `darkMode: 'media'` เดิม |
| `@tailwindcss/vite` | ไม่มี | 4.3.3 | Plugin ของ Tailwind 4 สำหรับ Vite | ลงทะเบียนใน `vite.config.mts` (`tailwindcss()`) |
| `postcss` | ^8.5.25 | ลบ | Tailwind 4 ผ่าน Vite Plugin ไม่ต้องใช้ | ลบ `postcss.config.js` |
| `autoprefixer` | ^10.5.4 | ลบ | Tailwind 4 จัดการ Vendor Prefix เอง | ไม่มี |
| `sass` | ^1.102.0 | ลบ | Tailwind 4 ไม่รองรับ Sass และโปรเจกต์ใช้ Sass แค่ Nesting กับ `@import` | `src/index.scss` → `src/index.css` (CSS Nesting แบบ Native), `src/fonts.scss` → `src/fonts.css` |
| `yaml` | ^2.9.0 | 2.9.1 | Patch ล่าสุด | ไม่มี; ใช้เฉพาะใน `electron/settings/index.js` (Legacy) คาดว่าจะถูกลบเมื่อ SQLite Layer มาแทน |
| `jsonpath-plus` | ^10.4.0 | 11.2.0 | Major ล่าสุด | ไม่ต้องแก้โค้ดเพราะใช้เฉพาะใน `electron/database/index.js` (Legacy, ESLint-ignored) ซึ่งจะถูกลบทั้งโมดูล; Build ผ่าน |
| `typescript` | ไม่มี | ~5.9.3 | Owner Decision 4: ใช้ TypeScript 5.x; ห้าม TypeScript 6/7 (typescript-eslint ยังไม่รองรับ) | เปลี่ยน Entry Point เป็น `.ts`/`.mts` และเพิ่ม `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` |
| `vue-tsc` | ไม่มี | 3.3.12 | Type Check ไฟล์ `.vue` | ต้องรันด้วย Node.js (หัวข้อ 3.4) |
| `@vue/tsconfig` | ไม่มี | 0.9.1 | Base tsconfig สำหรับ Vue 3 | ไม่มี |
| `@types/node` | ไม่มี | 24.19.1 | Type ของ Node 24 ให้ตรงกับ Node ที่ฝังใน Electron 44 | ไม่มี |
| `eslint` | ไม่มี | 10.12.0 | Lint ด้วย Flat Config | ไม่มี Config เดิม |
| `@eslint/js` | ไม่มี | 10.0.1 | Preset `recommended` | ไม่มี |
| `eslint-plugin-vue` | ไม่มี | 10.11.1 | Preset `flat/recommended` | เปลี่ยนชื่อ `Lists.vue` → `MaterialList.vue` ตามกฎ `vue/multi-word-component-names` |
| `@vue/eslint-config-typescript` | ไม่มี | 14.9.0 | `withVueTs` + `vueTsConfigs.recommended` | ไม่มี |
| `globals` | ไม่มี | 17.13.0 | Globals ของ Node (Main/Preload/Config) และ Browser (Renderer) | ไม่มี |
| Package Manager | `pnpm-lock.yaml` (ลบใน `c4ca8ba`) + `packageManager: bun@1.3.14` | `packageManager: bun@1.4.2`, `engines: { bun: ">=1.4.2", node: ">=20.19.0" }`, `trustedDependencies: ["electron"]` | Bun 1.4.2 คือรุ่นที่ติดตั้งและตรวจสอบแล้วในเครื่อง (`bun --version` = 1.4.2) | ดูหัวข้อ 3.3 |
| Packaging targets | win nsis x64 + mac dmg + linux AppImage | win nsis x64 เท่านั้น | Owner Decision 5 | ลบ Block `mac` และ `linux` ออกจาก `electron-builder.json5` (Commit `b80ad55`) |

Script ใน `package.json` หลังเตรียม:

```json
"dev": "vite",
"build": "vite build && electron-builder",
"preview": "vite preview",
"typecheck": "bun run typecheck:renderer && bun run typecheck:main",
"typecheck:renderer": "node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.app.json",
"typecheck:main": "tsc --noEmit -p tsconfig.node.json",
"lint": "eslint ."
```

### 3.2 ลำดับการอัปเกรดทีละกลุ่ม และการตรวจสอบหลังแต่ละกลุ่ม

ทำตาม Owner Decision 3 (แยกอัปเกรดทีละกลุ่ม ตรวจ Breaking Changes และ Build หลังแต่ละกลุ่ม) โดยแต่ละกลุ่มเป็น Commit แยก และรัน Build (`bun x vite build`) ให้ผ่านก่อนไปกลุ่มถัดไป:

| ลำดับ | กลุ่ม | Commit | สิ่งที่เปลี่ยน | การตรวจสอบหลังกลุ่ม |
|---|---|---|---|---|
| 1 | Electron | `7f9d777` | Electron 35.7.5 → 44.7.0, electron-builder และ electron-builder-squirrel-windows 26.15.3 → 26.17.0 | Build ผ่าน (ตั้งแต่ Electron 42 Binary ถูกดึงเมื่อรัน CLI ครั้งแรก ไม่ใช่ใน `postinstall` ตามที่บันทึกในข้อความ Commit) |
| 2 | Vite | `f519af6` | Vite 6.4.3 → 8.3.3, @vitejs/plugin-vue 5 → 6, vite-plugin-electron 0.28 → 1.1.2, ลบ vite-plugin-electron-renderer, แก้ `vite.config.mjs` (`import.meta.dirname`, ตัด `renderer`) | Build ผ่าน |
| 2a | Bun lifecycle | `146fae2` | เพิ่ม `trustedDependencies: ["electron"]` เพราะ `bun install` จากโฟลเดอร์สะอาดล้มเหลวที่ Install Script ของ `electron-winstaller` | `bun install --frozen-lockfile` จาก `node_modules` ที่ลบแล้วผ่าน |
| 3 | Tailwind | `f2aa196` + `e2fa6bd` | Tailwind 3.4.19 → 4.3.3 ผ่าน `@tailwindcss/vite`, ลบ Sass/PostCSS/Autoprefixer และไฟล์ Config, แปลง `.scss` → `.css`, เปลี่ยนชื่อ Utility; แก้ Path Font จาก `../fonts/` เป็น `/fonts/` | Build ผ่าน; Warning "unresolved URL" 54 รายการต่อ Build หายไป |
| 4 | Dependencies อื่น | `87b491c` | Vue 3.5.43, yaml 2.9.1, jsonpath-plus 11.2.0 | Build ผ่าน |
| 5 | Toolchain | `212016e` | TypeScript 5.9.3, vue-tsc, @vue/tsconfig, @types/node, ESLint 10 และ Preset; แปลง Entry Point เป็น TypeScript; แก้บั๊ก Preload Path และ Window Event; เปิด Security Options | `bun run lint` 0 ปัญหา; `typecheck:main` ผ่านใต้ Bun; `typecheck:renderer` ผ่านเมื่อมี Node.js (ทดสอบด้วย Portable Node ในโฟลเดอร์ Scratch); Build ผ่าน |
| 6 | Cleanup / Packaging / Audit | `30327bb`, `b80ad55`, `6c25dec`, `237b7c2` | ลบโมดูลที่ไม่ได้ใช้, เหลือ Target Windows x64, `bun audit fix` (แก้เฉพาะ Lockfile), ประกาศ Bun 1.4.2 และ Node floor | ชุดตรวจสอบเต็มในหัวข้อ 5.1 |

### 3.3 Bun 1.4.2, `packageManager`, `engines` และ `trustedDependencies`

- `packageManager: "bun@1.4.2"` และ `engines.bun: ">=1.4.2"` ตรงกับรุ่นที่ติดตั้งในเครื่อง (ตรวจด้วย `bun --version`); `engines.node: ">=20.19.0"` ประกาศไว้เพราะ vue-tsc ต้องใช้ Node.js (Commit `237b7c2`) ส่วน README และ CLAUDE.md ระบุ Node.js 24 LTS เป็นรุ่นที่แนะนำ
- Bun ไม่รัน Lifecycle Script ของ Dependencies โดยค่าเริ่มต้น ยกเว้นแพ็กเกจใน Default Trusted List ของ Bun เอง ซึ่งรวม `electron-winstaller` ที่ Install Script ต้องการ Binary `node` → `bun install` ล้มเหลวในเครื่องที่ไม่มี Node.js
- Target NSIS ไม่ได้ใช้ `electron-winstaller` เลย (ใช้เฉพาะ Target Squirrel) แต่ลบแพ็กเกจไม่ได้เพราะ `electron-builder-squirrel-windows` เป็น Hard Peer ของ `app-builder-lib` → แก้ด้วย `"trustedDependencies": ["electron"]` ซึ่งทำให้ **เฉพาะ** `electron` รัน Script ได้ (และตั้งแต่ Electron 42 Script นั้นก็ไม่ดาวน์โหลด Binary แล้ว; Binary ถูกดึงเมื่อรัน `bun x electron` ครั้งแรก)
- ผลลัพธ์: `bun install --frozen-lockfile` จาก `node_modules` ที่ลบทิ้งผ่าน (หัวข้อ 5.1); electron-builder ดาวน์โหลด Electron ของตัวเองแยกต่างหากสำหรับ Packaging
- เมื่อเพิ่ม `better-sqlite3@13` ใน Phase 1 ไม่ต้องแก้ `trustedDependencies` เพราะ v13 ไม่มี Install Script (หัวข้อ 5.2)

### 3.4 Node.js กับ vue-tsc

- vue-tsc ทำงานโดย Patch `tsc` ผ่านการดัก `fs.readFileSync` ใน CommonJS Loader ของ Node.js; Bun ใช้ Native Loader ที่ไม่ผ่านจุดนี้ ทำให้เมื่อรันใต้ Bun vue-tsc **เงียบ** และตรวจเฉพาะไฟล์ `.ts` โดยข้าม `.vue` ทั้งหมด (ผ่านโดยไม่ได้ตรวจจริง)
- จึงกำหนด `typecheck:renderer` ให้เรียก `node node_modules/vue-tsc/bin/vue-tsc.js` ตรง ๆ: เมื่อไม่มี Node.js จะล้มเหลวทันทีด้วย "command not found: node" แทนที่จะผ่านแบบหลอก; `typecheck:main` ใช้ `tsc` ธรรมดาซึ่งรันใต้ Bun ได้
- บนเครื่องพัฒนาปัจจุบัน **ไม่มี Node.js** (ยืนยันซ้ำ 2026-10-08: `node: command not found`) การตรวจสอบในหัวข้อ 5.1 ใช้ Portable Node 24.21.0 ในโฟลเดอร์ Scratch เพื่อยืนยันว่า Script ทำงานได้ ทางเลือกอยู่ในหัวข้อ 7.1 และ 7.10

---

## 4. ขั้นตอนที่ทำและ Commit list

### 4.1 การตรวจสอบงานค้างจาก 2026-08-02 และการแยก Commit ก่อนแตก Branch

ตาม Owner Decision 1 (ตรวจ Diff ทั้งหมด ห้าม Reset ทิ้ง แยก Commit งาน Dependency เป็น `chore` หลัง Build ผ่าน) และ Decision 2 (แตก Feature Branch จากสถานะที่ตรวจสอบแล้ว):

1. ตรวจ Diff ที่ยังไม่ Commit ทั้งหมดเทียบกับ `0ec4852`: พบงาน 3 เรื่องที่ไม่เกี่ยวข้องกันปนอยู่ ได้แก่ การย้าย Package Manager/อัปเดต Dependencies, การลดความซ้ำซ้อนของ Template ใน Renderer และการเขียนเอกสาร ไม่พบการเปลี่ยน Business Logic และไม่พบงานที่ทำค้างครึ่งทาง
2. Build ผ่านบนสถานะนั้นก่อน Commit
3. แยกเป็น 3 Commit บน `main` ตามประเภทของงาน:

| Commit | ข้อความ | ไฟล์ |
|---|---|---|
| `c4ca8ba` | chore: migrate to bun and update dependencies | `bun.lock` (+1096), `package.json`, `pnpm-lock.yaml` (ลบ 3492 บรรทัด): ย้ายไป Bun, ตัด `vue-tsc` ออกจาก Script `build` ที่ไม่มี tsconfig, ยก Vue/Vite/Electron/electron-builder/Tailwind/Sass/jsonpath-plus ขึ้นรุ่น Stable ณ ตอนนั้น |
| `ec244e1` | refactor: simplify renderer templates and global styles | `src/App.vue`, `src/components/Lists.vue`, `src/index.scss`: Render Checklist ด้วย `v-for` เดียว, ลบ Wrapper ที่มีไว้เพื่อการแสดงผลอย่างเดียว, ลบ Prop/Selector/Comment ที่ไม่ได้ใช้ |
| `7bab884` | docs: rewrite README and add repository guide | `CLAUDE.md` (ใหม่), `README.md` |

4. สร้าง Branch `feat/phase1-foundation` จาก `7bab884` (ยืนยันด้วย `git merge-base main feat/phase1-foundation` = `7bab884`; `main` ในเครื่องยังชี้ที่ `7bab884` ส่วนสถานะของ `origin/main` ดูหัวข้อ 4.5)

### 4.2 Commit บน `feat/phase1-foundation` (เรียงจากเก่าไปใหม่)

ไฟล์ในตารางยืนยันจาก `git show --stat`

| # | Commit | ข้อความ | ไฟล์ที่เปลี่ยน | สาระสำคัญ |
|---|---|---|---|---|
| 4 | `7f9d777` | chore: upgrade Electron to 44.7.0 and Electron Builder to 26.17.0 | `bun.lock`, `package.json` | กลุ่ม Electron |
| 5 | `f519af6` | chore: upgrade Vite to 8.3.3 and vite-plugin-electron to 1.1.2 | `bun.lock`, `package.json`, `vite.config.mjs` | กลุ่ม Vite; ลบ vite-plugin-electron-renderer; `import.meta.dirname` |
| 6 | `146fae2` | chore: restrict Bun lifecycle scripts to Electron | `bun.lock`, `package.json` | `trustedDependencies: ["electron"]` |
| 7 | `f2aa196` | chore: upgrade Tailwind CSS to 4.3.3 and drop Sass and PostCSS | `bun.lock`, `package.json`, `postcss.config.js` (ลบ), `tailwind.config.js` (ลบ), `src/index.scss` → `src/index.css`, `src/fonts.scss` → `src/fonts.css`, `src/App.vue`, `src/components/Lists.vue`, `src/main.js`, `vite.config.mjs` | กลุ่ม Tailwind |
| 8 | `e2fa6bd` | fix: resolve bundled font files from the public directory | `src/fonts.css` (54 บรรทัดเปลี่ยน) | `../fonts/` → `/fonts/` |
| 9 | `87b491c` | chore: update Vue, YAML and JSONPath Plus to current releases | `bun.lock`, `package.json` | กลุ่ม Dependencies อื่น |
| 10 | `212016e` | chore: add TypeScript 5.9 and ESLint 10 toolchain | `bun.lock`, `package.json`, `electron/main.js` → `electron/main.ts`, `electron/preload/index.js` → `electron/preload.ts`, `electron/preload/dom.js` (ลบ), `eslint.config.mjs` (ใหม่), `index.html`, `src/App.vue`, `src/components/Lists.vue` → `MaterialList.vue`, `src/main.js` → `src/main.ts`, `src/vite-env.d.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.mjs` → `vite.config.mts` | Toolchain; แก้ Preload Path, Window Event, Security Options; `typecheck:renderer` เรียก `node` ตรง ๆ |
| 11 | `30327bb` | refactor: remove unused config module, template asset and favicon reference | `electron/config.js` (ลบ), `eslint.config.mjs`, `index.html`, `src/assets/vue.svg` (ลบ) | ลบของที่ไม่มีใคร import; favicon → `/looter.ico` |
| 12 | `b80ad55` | build: target Windows x64 only | `electron-builder.json5` (ลบ 12 บรรทัด) | ตัด `mac` และ `linux` |
| 13 | `6c25dec` | chore: refresh transitive dependencies flagged by bun audit | `bun.lock` | `bun audit fix` ยก xmldom, brace-expansion, minimatch, cross-spawn, undici, fast-uri, http-cache-semantics, js-yaml, lodash และ tmp (0.2.3 → 0.2.6) ภายใน Range เดิมโดยไม่แตะ `package.json`; ข้อความ Commit ระบุว่าแก้ได้ 66 จาก 68 Advisories แต่ `bun audit` ปัจจุบันเหลือ 3 รายการ (เท่ากับหายไป 65 รายการ) ส่วนต่าง 1 รายการน่าจะเป็น Advisory ของ `tmp@0.2.6` (GHSA-7c78-jf6q-g5cm ครอบคลุม `>=0.2.6 <0.2.7` ซึ่งเป็นรุ่นที่ `bun audit fix` เพิ่งยกไป) ที่ถูกประกาศหลัง Commit — ต้องตรวจสอบ |
| 14 | `237b7c2` | chore: declare Bun 1.4.2 and the Node.js floor in package.json | `package.json` | `packageManager: bun@1.4.2`, `engines.bun`, `engines.node` (Commit นี้ตรวจพบจาก `git log` เมื่อ 2026-10-08 เป็นการแยกส่วน `package.json` ออกมาจากงานเอกสารที่ค้างอยู่) |

หมายเหตุ: ทุก Commit ใช้ Author `Kananek Thongkam <info.dvgamer@gmail.com>` วันที่ 2026-10-08 และข้อความเป็นภาษาอังกฤษโดยไม่มี Attribution Footer ตามกติกาของ Repository

### 4.3 งานที่ยังไม่ได้ Commit ขณะเขียนเอกสารนี้

| ไฟล์ | สถานะ | เนื้อหา |
|---|---|---|
| `CLAUDE.md` | Modified | ปรับ Working conventions เป็น Bun 1.4.2 / TypeScript 5.x / Tailwind 4 / Windows x64, เพิ่ม `bun run lint` และ `bun run typecheck` ใน Validation, เพิ่ม Technical-debt log วันที่ 2026-10-08 และ Known build notes (Icon 128×128, ไม่มี Code Signing, Clipboard API ของ Electron 44, ไม่มี CSP) |
| `README.md` | Modified | Requirements เป็น Windows 10/11 x64, Bun 1.4.2, Node.js 24 LTS เฉพาะ typecheck; โครงสร้างโปรเจกต์ชี้ไฟล์ `.ts`; เพิ่ม `docs/` |
| `docs/README.md` | Untracked | ดัชนีเอกสารแผนงาน |
| `docs/01..08-*.md` | Untracked | เอกสารแผนงานชุดนี้ (รวมไฟล์นี้) |

งานชุดนี้ควร Commit เป็น `docs:` หนึ่ง Commit หลังเอกสารทั้ง 8 ไฟล์เสร็จ (หัวข้อ 8 ข้อ 1)

### 4.4 สรุปขนาดของการเปลี่ยนแปลง

- `git diff --stat 0ec4852..HEAD`: 28 ไฟล์, +1,554 / −4,083 บรรทัด (ส่วนใหญ่คือ `pnpm-lock.yaml` ที่ลบและ `bun.lock` ที่เพิ่ม)
- `git diff --stat 7bab884..HEAD` (เฉพาะงานบน Branch): 24 ไฟล์, +653 / −771 บรรทัด
- ไฟล์ที่หายไปจาก `0ec4852`: `pnpm-lock.yaml`, `postcss.config.js`, `tailwind.config.js`, `electron/config.js`, `electron/preload/dom.js`, `electron/preload/index.js`, `electron/main.js`, `src/assets/vue.svg`, `src/components/Lists.vue`, `src/index.scss`, `src/fonts.scss`, `src/main.js`, `vite.config.mjs`
- ไฟล์ใหม่: `bun.lock`, `CLAUDE.md`, `eslint.config.mjs`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.mts`, `electron/main.ts`, `electron/preload.ts`, `src/main.ts`, `src/index.css`, `src/fonts.css`, `src/components/MaterialList.vue`

### 4.5 สถานะของ `origin/main` (ตรวจพบเพิ่มเติมเมื่อ 2026-10-08)

- `origin/main` ชี้ที่ `6590336 chore: update runtimes and dependencies` (ลงวันที่ 2026-08-19) ซึ่งต่อจาก `0ec4852` และ **ไม่อยู่ใน** `main` ของเครื่องนี้หรือใน `feat/phase1-foundation`; Merge-base ระหว่าง `origin/main` กับ Branch คือ `0ec4852` (`git rev-list --count feat/phase1-foundation..origin/main` = 1, ทิศกลับกัน = 14)
- Commit `6590336` เปลี่ยน 5 ไฟล์: เพิ่ม `bun.lock`, แก้ `package.json` (Electron `^43.4.0`, Vite `^8.2.1`, @vitejs/plugin-vue `^6.0.8`, vite-plugin-electron `^1.1.1`, vite-plugin-electron-renderer `^1.0.0`, Vue `^3.5.41`, Tailwind CSS `^4.3.3` ผ่าน `@tailwindcss/postcss` โดยยังคง PostCSS/Autoprefixer/Sass ไว้, electron-builder `^26.15.3` โดยไม่มี `electron-builder-squirrel-windows`, Script `dev`/`build`/`preview` เรียกผ่าน `bun x --bun`, `engines.bun: ">=1.3.14"`, `packageManager: bun@1.3.14`), ลบ `pnpm-lock.yaml`, แก้ `postcss.config.js` (2 บรรทัด) และ `src/index.scss` (5 บรรทัด); ไม่มี TypeScript, ESLint, `trustedDependencies` หรือการตัด Target macOS/Linux
- ผลกระทบ: `main` ในเครื่อง (3 Commit หลัง `0ec4852`) กับ `origin/main` (1 Commit หลัง `0ec4852`) แยกทางกัน เมื่อเปิด PR ของ `feat/phase1-foundation` ไปยัง `main` บน Remote ต้อง Rebase หรือ Merge กับ `6590336` ก่อน และคาดว่าจะมี Conflict ที่ `bun.lock`, `package.json` และ Conflict แบบ Modify/Delete ที่ `postcss.config.js` กับ `src/index.scss` (Branch ลบสองไฟล์นี้ไปแล้วใน `f2aa196`) ส่วน `pnpm-lock.yaml` ถูกลบทั้งสองฝั่ง; แนวทางของสองฝั่งต่างกันในสาระ (Branch ใช้ `@tailwindcss/vite` โดยไม่มี PostCSS/Sass และไม่มี vite-plugin-electron-renderer ตาม Security Baseline ส่วน `6590336` ใช้ `@tailwindcss/postcss` และยังคง vite-plugin-electron-renderer) การแก้ Conflict ต้องยึดแนวทางของ Branch
- ที่มาของ `6590336` (Push จากเครื่องอื่น หรือเป็นงานชุดเดียวกับงานค้าง 2026-08-02 ที่ถูก Commit คนละแบบ) และวิธีจัดการ ต้องตรวจสอบกับเจ้าของโปรเจกต์ก่อน Commit งาน Phase 1 เพิ่ม; ทางเลือกอยู่ในหัวข้อ 7.12 และลำดับงานในหัวข้อ 8 ข้อ 2

---

## 5. ผลการตรวจสอบ

### 5.1 ตารางการตรวจสอบ (รันเมื่อ 2026-10-08)

| การตรวจสอบ | ผล (รอบตรวจสอบหลัง `6c25dec`) | ตรวจซ้ำหลัง `237b7c2` ขณะเขียนและตรวจทานเอกสารนี้ |
|---|---|---|
| `bun install --frozen-lockfile` จาก `node_modules` ที่ลบแล้ว | ผ่าน (หลังเพิ่ม `trustedDependencies: ["electron"]`; ก่อนหน้านั้น Default Trusted List ของ Bun รัน Install Script ของ `electron-winstaller` ซึ่งต้องการ `node` และล้มเหลว) | ไม่ได้รันซ้ำ |
| `bun run lint` (`eslint .`) | ผ่าน 0 ปัญหา | ผ่าน (Exit 0) |
| `bun run typecheck` | `typecheck:renderer` ผ่านเมื่อมี Node.js 24.21.0 บน PATH (ทดสอบด้วย Portable Node ในโฟลเดอร์ Scratch) และล้มเหลวชัดเจน ("command not found: node") เมื่อไม่มี; `typecheck:main` ผ่านใต้ Bun | ยืนยันว่าเครื่องไม่มี Node.js (`node: command not found`); ไม่ได้รันซ้ำ |
| `bun x vite build` | ผ่าน; `dist/` (CSS 22.96 kB, JS 61.7 kB), `dist-electron/main.js` 142.9 kB, `dist-electron/preload.js` 0.32 kB; ไม่มี Warning | ผ่าน ไม่มี Warning (รันซ้ำ 2 รอบ ระหว่างเขียนและระหว่างตรวจทานเอกสาร): JS 63.18 kB, `main.js` 142.92 kB, `preload.js` 0.32 kB คงที่ ส่วน CSS เปลี่ยนจาก 22.32 kB เป็น 27.06 kB ระหว่างสองรอบ สาเหตุยืนยันแล้ว: Automatic Source Detection ของ Tailwind 4 สแกนไฟล์ `docs/*.md` (ไม่ถูก gitignore) ด้วย ทำให้ Utility ที่ถูกเอ่ยถึงในเอกสารแต่ไม่มีใน `src/` (เช่น `sr-only`, `tabular-nums`, `gap-6`, `p-4`, `text-base`, `transition`, `collapse`) ถูก Generate ลง CSS; ตรวจโดยเทียบ Class ใน `dist/assets/index-*.css` กับ `src/` + `index.html` พบ Class ราว 20 รายการที่มีเฉพาะใน `docs/` ขนาด CSS จึงโตตามปริมาณเอกสาร ทางแก้อยู่ในหัวข้อ 7.11 |
| `bun run build` (vite build + electron-builder) | ผ่าน; `release/1.0.0/GameLooter-Windows-1.0.0-Setup.exe` (~123 MB NSIS x64), `latest.yml` และ `.blockmap` ถูกสร้าง; electron-builder ตรวจพบ Bun และไล่ `node_modules` แบบ Manual; แจ้ง "default Electron icon is used" เพราะ `public/looter.ico` ใหญ่สุด 128×128 (ต้องการ ≥256×256); แจ้ง "no code signing certificate configured" | ยืนยันไฟล์ใน `release/1.0.0/`: Setup.exe 123,053,069 bytes, `.blockmap`, `latest.yml`, `builder-debug.yml`, `win-unpacked/` 385 MB; ไม่ได้ Build ซ้ำ |
| Runtime Smoke (`bun x electron . --enable-logging`, 12–20 วินาที) | Main Process เริ่มได้, สร้าง Window, Renderer ได้รับ `main-process-message` ผ่าน Sandboxed Preload; Warning เดียวคือ "Insecure Content-Security-Policy" ของ Electron (ยังไม่มี CSP) | ไม่ได้รันซ้ำ; `bun x electron --version` = v44.7.0, `--abi` = 149 |
| `bun run dev` | Vite 8 Dev Server + Electron เริ่มได้, HMR Build ของ Main/Preload ทำงาน | ไม่ได้รันซ้ำ |
| `bun audit` | 68 Advisories (50 high) → 3 หลัง `bun audit fix` (แก้ Lockfile เท่านั้น): `braces@3.0.3` ผ่าน @vue/eslint-config-typescript > fast-glob (high, Build-time), `sprintf-js@1.1.3` ผ่าน @electron/get > global-agent (moderate, Build-time), `tmp@0.2.6` ผ่าน electron-builder > @malept/flatpak-bundler (high, Build-time, เส้นทาง Linux เท่านั้น); ไม่มีตัวใดถูกแพ็กไปกับแอป | ยืนยัน 3 รายการเดิม (2 high, 1 moderate) จากการรัน `bun audit` ซ้ำขณะตรวจทานเอกสาร; เส้นทางเพิ่มเติมที่รายงานคือ `sprintf-js` เข้าถึงได้ผ่าน `electron > @electron/get > global-agent > roarr` ด้วย (ใช้เฉพาะตอนดาวน์โหลด Binary ของ Electron ไม่ถูกแพ็กไปกับแอปเช่นกัน) |
| `git diff --check` | สะอาด | สะอาด (มี Warning "LF will be replaced by CRLF" ของ `CLAUDE.md`/`README.md` ใน Working Copy ซึ่งเป็นเรื่อง autocrlf ไม่ใช่ Whitespace Error) |
| ขนาด Icon | `public/looter.ico` = 128×128 | ยืนยันด้วยการอ่าน Header ของ ICO: 5 Entry ขนาด 128, 64, 48, 32, 16 px; PNG 128/64/48 px |

### 5.2 ผล Spike better-sqlite3 (โปรเจกต์ Scratch, Electron 44.7.0 + electron-builder 26.17.0 + Bun)

- `better-sqlite3@13.0.3` (2026-08-05) เป็น N-API (`node-addon-api ^8`), ไม่มี Install Script และแพ็ก Prebuilt Binary มาใน npm Package: `prebuilds/win32-x64.node`, `win32-arm64`, `darwin-*`, `linux-*` (ขนาด Unpacked ~27 MB) GitHub Release Assets ของ 13.x ว่างเปล่า ส่วนสาย 12.x ใช้ prebuild-install ดาวน์โหลดตาม ABI (12.12.0 มี Electron ABI ถึง 148 = Electron 43 ไม่มี 149 = Electron 44)
- Dev Run ใต้ Electron 44: โหลดได้โดยไม่ต้อง Rebuild; `process.versions.napi = 10`; SQLite 3.53.4; `PRAGMA journal_mode = WAL` ทำงาน; `PRAGMA foreign_keys = ON` บังคับจริง (`FOREIGN KEY constraint failed` เมื่อ Insert แถวกำพร้า); `db.transaction()` ทำงาน; `ON DELETE CASCADE` ประกาศได้
- Packaging: ค่าเริ่มต้น `npmRebuild: true` ทำให้ electron-builder เรียก @electron/rebuild → node-gyp → ล้มเหลว "Could not find any Python installation to use" (เครื่องไม่มี Python และ VS Build Tools; ยืนยันซ้ำว่า `python` ไม่มีใน PATH) เมื่อตั้ง `"npmRebuild": false` Build ผ่าน electron-builder แตกโมดูลออกไปที่ `resources/app.asar.unpacked/node_modules/better-sqlite3/` โดยอัตโนมัติ (รวม Prebuild ทุก Platform, `deps/` และ `src/`) และ exe ที่แพ็กแล้วเปิด DB และรันการตรวจสอบชุดเดียวกันได้ การลดขนาดในภายหลัง: ตัด Prebuild ที่ไม่ใช่ win32-x64 และ `deps/src` ด้วย `files` Glob ของ electron-builder
- Production Bundle ของ vite-plugin-electron จะ Externalize เฉพาะแพ็กเกจใน `dependencies` ดังนั้น better-sqlite3 ต้องอยู่ใน `dependencies` ไม่ใช่ `devDependencies`; มี `@types/better-sqlite3@9.6.0`; Default Trusted List ของ Bun มี better-sqlite3 อยู่แล้ว แต่ v13 ไม่มี Script จึงไม่ต้องแก้ `trustedDependencies`
- ทางเลือกสำรอง: `node:sqlite` ที่ฝังใน Node 24 ของ Electron 44 จะตัดปัญหา Native Module ทั้งหมด แต่ API ยังเป็น Experimental และยังไม่ได้ทดสอบใน Electron; การตัดสินใจคือ better-sqlite3 (Owner Decision 7)

### 5.3 ข้อเท็จจริงของ Electron 44 ที่กระทบการออกแบบ (จาก Breaking-changes Doc อย่างเป็นทางการ)

สรุปสั้นเพื่อให้ผู้อ่านรายงานนี้เห็นผลกระทบ รายละเอียดการออกแบบอยู่ใน [Architecture Proposal](02-architecture-proposal.md):

- Electron 42+: แพ็กเกจ `electron` ไม่ดาวน์โหลด Binary ใน `postinstall`; ดึงเมื่อรัน CLI ครั้งแรก
- Electron 44: โมดูล `clipboard` อยู่ใน Main Process เท่านั้นและเป็น W3C Clipboard API: `clipboard.read()` → `Promise<ClipboardItem[]>` (แต่ละรายการมี `types` และ `getType(mime)` → `Blob`), `clipboard.write([new ClipboardItem({ 'image/png': blob })])`, `readText()/writeText()` คืน Promise; `readImage/writeImage/readBuffer/availableFormats` ถูกลบ
- Electron 44: Sandboxed Preload `require` ได้เฉพาะ `electron` (ไม่มี `Buffer`, `events`, `url` Shim) → Preload ต้องเป็น Bridge บาง ๆ
- Electron 44: Permission Request ของ Screen Capture รายงานเป็น `display-capture` ใน `session.setPermissionRequestHandler`
- Electron 44 ตัด Windows ia32 (x64 เท่านั้น ตรงกับเป้าหมาย)
- API ที่ยังใช้ได้ตามเดิมสำหรับ Overlay/Capture: `BrowserWindow` Option `transparent`, `frame: false`, `alwaysOnTop` + `setAlwaysOnTop(true, 'screen-saver')`, `skipTaskbar`, `setIgnoreMouseEvents(ignore, { forward: true })`, `setOpacity()`, `globalShortcut.register()` (คืน `false` เมื่อ Accelerator ถูกใช้แล้ว), `desktopCapturer.getSources({ types: ['screen'], thumbnailSize })`, `screen.getAllDisplays()/getDisplayNearestPoint()/getCursorScreenPoint()` พร้อม `scaleFactor`, `nativeImage.crop()/resize()/toPNG()`, `dialog.showOpenDialog`, `app.getPath('userData')`

---

## 6. โค้ดที่นำกลับมาใช้ได้ และโค้ดที่ล้าสมัย / ถูกลบ / ต้องแทนที่

### 6.1 โค้ดและทรัพยากรที่นำกลับมาใช้ได้

| รายการ | ตำแหน่ง | นำไปใช้อย่างไร |
|---|---|---|
| Scaffold ของ Main Process | `electron/main.ts` | เก็บโครง `app.whenReady` → `createWindow`, การสลับระหว่าง `VITE_DEV_SERVER_URL` กับ `loadFile(path.join(DIST, 'index.html'))`, การคำนวณ `DIST`/`VITE_PUBLIC`, `autoHideMenuBar`, `openDevTools()` เฉพาะ Dev, Handler `window-all-closed`/`activate` และ `webPreferences` ที่เปิด Security Baseline แล้ว; ตัดการเรียก `createTable`/`Relink`/`JSONPath` และการ Push `main-process-message` ออกเมื่อ SQLite Layer เข้ามา |
| Config ของ electron-builder | `electron-builder.json5` | ใช้ต่อทั้งหมด: `appId: com.dvgamerr.app.looter`, `productName: GameLooter`, `asar: true`, `directories.output: release/${version}`, `files: ["dist", "dist-electron"]`, `win.target nsis x64`, `artifactName: ${productName}-Windows-${version}-Setup.${ext}`, `nsis` (`oneClick: false`, `perMachine: false`, `allowToChangeInstallationDirectory: true`, `deleteAppDataOnUninstall: false`); เพิ่มภายหลัง: `npmRebuild: false`, `files` Glob สำหรับตัด Prebuild ของ better-sqlite3, `win.icon` เมื่อมี Icon ≥256×256 |
| สไตล์ Title Bar แบบ `titleBarOverlay` | `electron/main.ts`, `src/App.vue`, `src/index.css` | `titleBarStyle: 'hidden'` + `titleBarOverlay: { color: '#1f2937', symbolColor: '#0f766e' }`, `.drag-region { -webkit-app-region: drag; user-select: none }` และ `button, a { -webkit-app-region: no-drag }` ใช้เป็น Shell ของ Main Window ได้ทันที (Overlay และ Capture Window เป็น Frameless จึงไม่ใช้ส่วนนี้); ต้องกำหนด `--system-titleBar-height` ให้ตรงกับความสูง Title Bar (`h-10` = 40px ใน `App.vue`) |
| Fonts | `src/fonts.css`, `public/fonts/` | 54 `@font-face` ของ Mulish (400/700), Open Sans (400/500/700), Poppins (400/700), Roboto (400/700) พร้อม `unicode-range` และ `font-display: swap`; Path `/fonts/*.woff2` ทำงานใต้ `file://` แล้ว; ยังไม่มี `font-family` ใดถูกใช้ในโปรเจกต์ (ดูหัวข้อ 7.7 เรื่องการเลือกใช้/ตัดทิ้ง) |
| Icons | `public/looter.ico`, `public/looter-48/64/128.png` | ใช้เป็น Favicon (`index.html`) และ `BrowserWindow.icon` ได้; สำหรับ `win.icon` ของ electron-builder ต้องมีไฟล์ ≥256×256 (หัวข้อ 7.2) |
| Schema อ้างอิงเดิม | `docs/sqlite.dbml` | แนวคิด Game → `game_profile`, Item(Own) → `item` + `inventory.owned`, ItemCraft(CraftId, ItemId, Qty) → `recipe` + `recipe_ingredient`, Recipe(ItemId, Qty, Done) → `tracking_target` (kind `recipe`, `target_qty`); คอลัมน์ `Image blob` ถูกแทนด้วย `image_path`/`thumbnail_path` ตาม Owner Decision 7; เอกสาร Data Model จะเขียนไฟล์นี้ใหม่ |
| ตัวอย่างข้อมูล Seed | `data/Game.csv`, `data/Item.csv`, `data/ItemCraft.csv` (gitignored) | ตัวอย่าง Game Profile "V-Rising" กับ Item 7 รายการ (Dawnthorn Chestguard, Pristine Leather, Mutant, Pristine Hide, Silk, Cloth, Silkworm) และความสัมพันธ์ Craft 4 แถว (Dawnthorn Chestguard ← Pristine Leather ×12 + Mutant ×12; Pristine Leather ← Mutant ×15 + Pristine Hide ×15) ซึ่งเป็น Nested Recipe 2 ชั้น เหมาะใช้เป็น Fixture ทดสอบ Aggregation ด้วยมือและเป็นแบบของ Seed/Import ในอนาคต; ความถูกต้องของตัวเลขเทียบกับเกมจริงต้องตรวจสอบ |
| Tailwind Classes | `src/components/MaterialList.vue`, `src/App.vue` | รูปแบบ Input (`appearance-none border-none bg-transparent ... focus:outline-hidden`), ปุ่ม Accent Teal (`border-teal-500 bg-teal-500 hover:bg-teal-700`), รายการ (`divide-y divide-gray-200`, `flex items-center py-4`), Title Bar (`h-10 max-w-(--breakpoint-xl)`, `dark:bg-gray-800`) ใช้เป็นจุดตั้งต้นของ Visual System ในเอกสาร UI/UX; ตัว Component เองเป็น Placeholder ที่จะถูกแทนด้วยหน้าจอจริง |
| แนวคิดการจำตำแหน่ง Window | `electron/settings/index.js` (`eventSetPosition`) | Logic การ Clamp ตำแหน่ง Window ให้อยู่ใน `workAreaSize`, การแยกกรณี `isMaximized()` และ Debounce 200 ms ก่อนบันทึก นำไปเขียนใหม่เป็น TypeScript ใน Settings Store (`app_setting` key `window`) ของ Phase 1 โดยเปลี่ยนจาก `screen.getPrimaryDisplay()` เป็น Display ที่ใกล้ Window จริง (`screen.getDisplayNearestPoint()`) เพื่อรองรับ Multi-monitor |
| แนวคิด `debounce()` | `electron/helper.js` | นำแนวคิดไปใช้กับการ Push `gathering:changed` แบบ Debounce 16 ms (ตาม Aggregation Algorithm ใน [Data Model](04-data-model.md)) โดยเขียนใหม่เป็น TypeScript ในโมดูลใหม่ ไม่ต่อยอดไฟล์ JavaScript เดิม |
| Config ของ Toolchain | `vite.config.mts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.mjs`, `index.html`, `src/vite-env.d.ts`, `.vscode/extensions.json`, `.github/dependabot.yml` | ใช้ต่อทั้งหมด; `vite.config.mts` ต้องเพิ่ม Entry `overlay.html` และ `capture.html` ใน Phase 3/4; `eslint.config.mjs` ต้องถอด Ignore ของ `electron/database/**`, `electron/settings/**`, `electron/helper.js` เมื่อไฟล์เหล่านั้นถูกลบ |

### 6.2 โค้ดที่ล้าสมัยและถูกลบไปแล้วระหว่างเตรียม Repository

| รายการ | Commit | เหตุผล |
|---|---|---|
| `pnpm-lock.yaml` | `c4ca8ba` | ย้ายไป Bun (`bun.lock`) |
| `vue-tsc` ใน Script `build` | `c4ca8ba` | เรียกเครื่องมือที่ไม่ได้ติดตั้งและไม่มี tsconfig; ภายหลังเพิ่มกลับเป็น Script `typecheck` แยกใน `212016e` |
| `vite-plugin-electron-renderer` และ Option `renderer: {}` | `f519af6` | Polyfill Node ใน Renderer ขัดกับ Security Baseline |
| `tailwind.config.js`, `postcss.config.js`, `sass`, `postcss`, `autoprefixer`, `src/index.scss`, `src/fonts.scss` | `f2aa196` | Tailwind 4 ตั้งค่าใน CSS; Sass ไม่รองรับ |
| `electron/preload/index.js` (Output `dist-electron/index.js`) | `212016e` | ชื่อ Output ไม่ตรงกับที่ Main โหลด (`preload.js`); แทนด้วย `electron/preload.ts` |
| `electron/preload/dom.js` | `212016e` | Loading Animation จาก Template ที่ไม่มีใคร import |
| `electron/config.js` | `30327bb` | import `electron-settings` ซึ่งไม่ใช่ Dependency และไม่มีใคร import ไฟล์นี้ (ตรวจแล้วตาม Owner Decision ข้อเพิ่มเติม) |
| `src/assets/vue.svg`, การอ้าง `/vite.svg` ใน `index.html` | `30327bb` | ของเหลือจาก Vite Template; `/vite.svg` ไม่มีอยู่จริง → เปลี่ยนเป็น `/looter.ico` |
| Block `mac` และ `linux` ใน `electron-builder.json5` | `b80ad55` | นอกขอบเขต Phase แรก (Owner Decision 5) |

### 6.3 บั๊กในโค้ดเดิมที่แก้ไขแล้วระหว่างเตรียม Repository

| บั๊ก | อาการ | การแก้ | Commit |
|---|---|---|---|
| Preload Entry `electron/preload/index.js` Build เป็น `dist-electron/index.js` แต่ Main โหลด `preload.js` | ทำงานได้เฉพาะเครื่องที่มี `dist-electron/preload.js` ค้างจากปี 2024; เครื่องใหม่ Preload หาย Renderer ไม่มี `window.ipcRenderer` | `electron/preload.ts` → `dist-electron/preload.js` ผ่าน `preload.input` ของ vite-plugin-electron | `212016e` |
| `app.on('moved' \| 'maximize' \| 'unmaximize', onWindowPositionEvent(win))` ถูกลงทะเบียนบน `app` ขณะ `win === null` | Event เหล่านี้เป็นของ `BrowserWindow` ไม่ใช่ `app` จึงไม่เคยถูกเรียก และ Closure จับ `win` ที่เป็น `null` | ย้ายไป `win.on(...)` หลังสร้าง Window และสร้าง Handler จาก Window จริง | `212016e` |
| `webPreferences` ระบุแค่ `preload` | พึ่งค่าเริ่มต้นของ Electron โดยไม่ประกาศชัด | เพิ่ม `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` | `212016e` |
| Font URL `../fonts/*.woff2` (Relative จาก `src/`) ไม่มีอยู่จริง | Vite แจ้ง "unresolved URL" 54 รายการทุก Build; ใน Build จริง Font อาจโหลดไม่ได้ | เปลี่ยนเป็น `/fonts/*.woff2` (Public Path) ซึ่ง Vite เขียนใหม่ให้เข้ากับ Base `./` | `e2fa6bd` |
| `Lists.vue` ชื่อคำเดียว | ผิดกฎ `vue/multi-word-component-names` | เปลี่ยนชื่อเป็น `MaterialList.vue` | `212016e` |
| Utility ของ Tailwind 3 ที่เปลี่ยนชื่อใน 4 | Class ไม่ถูก Generate | `max-w-screen-xl` → `max-w-(--breakpoint-xl)`, `flex-shrink-0` → `shrink-0`, `focus:outline-none` → `focus:outline-hidden` | `f2aa196` |
| `console.log(...message)` ใน `src/main.js` | Spread สมมติว่าข้อความจาก Main Process เป็น Iterable เสมอ; หาก Main ส่ง Object ธรรมดาจะเกิด `TypeError` | เปลี่ยนเป็น `console.log(message)` ใน `src/main.ts` | `212016e` |

### 6.4 โค้ดที่ยังอยู่และต้องแทนที่ (ไม่แก้ทีละจุด) พร้อมรายการบั๊กที่พบ

**`electron/database/index.js`** (Legacy JSON Layer; ESLint-ignored, `checkJs: false`): แทนที่ทั้งโมดูลด้วย SQLite Layer ใน Phase 1:

1. `jsonWriteFile(tableName, content)` อ้าง `fileName` ที่ไม่ได้ประกาศ → `ReferenceError` ทุกครั้งที่เขียนไฟล์
2. `JSONUpsert` กรณีมี `jsonInMemory`: วนลูป `jsonInMemory[tableName]` (แถวเดิม) แทน `tableRow` (แถวใหม่), กำหนด `_id` ใหม่ทับแถวเดิมทุกแถว และเรียก `jsonInMemory.push(row)` บน Object ที่ไม่ใช่ Array → `TypeError`; กรณีไม่มี In-memory แถวที่มี `_id` อยู่แล้วตกเข้า `else {}` ว่าง (ไม่มี Update จริง)
3. `JSONPath(path)` เมื่อ `jsonInMemory` เป็น `null` อ้าง `tableName` ที่ไม่ได้ประกาศ → `ReferenceError`
4. `createTable(...)` ต่อท้ายชื่อตาราง `'publuc'` (สะกดผิด) จึงสร้าง `publuc.json` ขณะที่ `DEFAULT_TABLE = 'public'` ทำให้ `valid()` ค่าเริ่มต้นไม่เคยเจอไฟล์; `exists.isFile` เป็นการอ้าง Method โดยไม่เรียก (เป็น Truthy เสมอ)
5. `valid()` เป็น `async` แต่ถูกใช้ใน `if (!valid(tableName))` โดยไม่มี `await` → Promise เป็น Truthy เสมอ การตรวจสอบไม่เคยล้มเหลว
6. `Relink()` รวมทุกไฟล์ใน `Database/` ด้วย `Object.assign` โดยไม่ตรวจชื่อตาราง และคืน `false` เงียบ ๆ เมื่อ Parse ไม่ผ่าน
7. คำนวณ `userData` เองจาก `process.env.APPDATA`/`HOME` แทน `app.getPath('userData')` และ Path ของ Linux เป็น `var/local/...` แบบ Relative; import `package.json` ทั้งไฟล์เข้า Bundle ของ Main เพื่อเอา `name`
8. Startup ใน `electron/main.ts` ยังเรียก `createTable('Game','Item','ItemCraft','Recipe')` + `Relink()` ก่อนสร้าง Window และ Push ผล `JSONPath('$')` ทั้งก้อนไปยัง Renderer ผ่าน `main-process-message` ใน `did-finish-load`
9. ประมาณ 430 จาก 665 บรรทัดของไฟล์เป็น API แบบ Callback ที่ Comment ทิ้งไว้ (`getField`, `clearTable`, `count`, `getRows`, `updateRow`, `search`, `deleteRow`, `tableExists`)

**`electron/settings/index.js`** (Legacy; ESLint-ignored): แทนที่ด้วย Settings Store (`app_setting`) ใน Phase 1:

1. `initilizeApp` (สะกดผิด) อ้าง `config` ที่ถูก Comment ทิ้ง → `ReferenceError` หากถูกเรียก (ปัจจุบันไม่มีใครเรียก)
2. บรรทัดบันทึกค่า (`settings.set(...)`) ถูก Comment ทั้งหมด `eventSetPosition` จึงทำได้แค่ `console.log`
3. `themeExternal` ทำแค่ `console.log`; Object `user` (สี Theme) ไม่ถูกใช้
4. ฟังก์ชันเดียวที่ถูกใช้คือ `onWindowPositionEvent` (Debounce 200 ms ครอบ `eventSetPosition`)
5. import `yaml` ทำให้ `yaml` ยังต้องเป็น Dependency

**`electron/helper.js`**: `debounce()` ตัวเดียว เป็น JavaScript ที่ ESLint ข้าม; เขียนใหม่เป็น TypeScript เมื่อย้าย Settings Store แล้วลบไฟล์นี้

**`electron/preload.ts`**: Bridge แบบ Generic เปิด `window.ipcRenderer.{on, off, send, invoke}` ให้ Renderer ส่งได้ทุก Channel ต้องแทนที่ด้วย Typed API `window.api.*` ที่สร้างจาก `electron/ipc/contracts.ts` และไม่เปิด `ipcRenderer` ดิบ (รูปแบบ API อยู่ใน [Architecture Proposal](02-architecture-proposal.md)); Type `Window.ipcRenderer` ใน `src/vite-env.d.ts` ต้องเปลี่ยนตาม

**`src/index.css`**: `grid-template-rows: [row1-start] var(--system-titleBar-height)` อ้างตัวแปรที่ไม่เคยถูกประกาศ แถว Title จึงยุบเป็น `auto`; มี `@import './fonts.css'` แต่ไม่มี `font-family` ใดถูกตั้งค่า (ตรวจด้วย `grep` ใน `src/` ไม่พบการใช้)

**`src/App.vue`, `src/components/MaterialList.vue`, `src/main.ts`**: `MaterialList.vue` เป็น Checklist ตัวอย่างที่ Form ไม่ทำงาน; `App.vue` มี `outline: 1px solid #ffffff55` สำหรับดูขอบเขต Layout ระหว่างพัฒนา; `src/main.ts` Subscribe `main-process-message` แล้ว `console.log` ทั้งหมดนี้จะถูกแทนที่ด้วย App Shell + Router ใน Phase 1 และหน้าจอจริงใน Phase 2

**`jsonpath-plus`, `yaml`**: ใช้เฉพาะใน Legacy Layer ลบออกจาก `package.json` พร้อมโมดูลเหล่านั้น

**`electron-builder-squirrel-windows`**: ไม่ได้ใช้ Target Squirrel แต่ลบไม่ได้ (Hard Peer ของ `app-builder-lib`) คงไว้และบันทึกเหตุผลใน CLAUDE.md แล้ว

**`.github/dependabot.yml`**: ครอบคลุมเฉพาะ `github-actions` แต่ Repository ยังไม่มี `.github/workflows/` จึงไม่มีผลอะไรในปัจจุบัน

---

## 7. ปัญหาที่ยังเหลือและทางเลือก

### 7.1 เครื่องพัฒนาไม่มี Node.js

- ผลกระทบ: `bun run typecheck` ล้มเหลวที่ `typecheck:renderer`; ไฟล์ `.vue` ไม่ถูก Type Check ในเครื่อง
- ทางเลือก:
  1. ติดตั้ง Node.js 24 LTS ในเครื่อง (ผ่าน Installer ทางการ, `winget`, หรือ nvm-windows) ใช้เฉพาะ vue-tsc; Bun ยังเป็น Package Manager และ Script Runner ตามเดิม (แนะนำ)
  2. ใช้ Portable Node ในโฟลเดอร์นอก Repository แล้วเพิ่มเข้า PATH เฉพาะตอนรัน Type Check (วิธีที่ใช้ยืนยันผลในหัวข้อ 5.1)
  3. ยอมรับว่า Type Check ของ `.vue` รันเฉพาะที่ที่มี Node.js (เช่น CI ในอนาคต) และพึ่ง `vue-tsc` ผ่าน Volar ใน Editor ระหว่างพัฒนา; เสี่ยงต่อการ Merge โค้ดที่ Type ผิด

### 7.2 Icon ใหญ่สุด 128×128

- ผลกระทบ: electron-builder ใช้ Icon เริ่มต้นของ Electron สำหรับ exe/Installer (ต้องการ ≥256×256 สำหรับ `win.icon`); Favicon และ `BrowserWindow.icon` ยังใช้ `looter.ico` ได้
- ทางเลือก:
  1. สร้าง `looter.ico` ใหม่ที่มีขนาด 256×256 (และ 128/64/48/32/16 ในไฟล์เดียว) จาก Artwork ต้นฉบับ; ต้องตรวจสอบว่ามีไฟล์ต้นฉบับความละเอียดสูง (SVG/PNG ≥512) อยู่หรือไม่
  2. ให้ electron-builder สร้าง ICO จาก PNG ขนาด ≥256×256 โดยตั้ง `win.icon` ชี้ไฟล์ PNG; พฤติกรรมการแปลงอัตโนมัติต้องตรวจสอบกับเวอร์ชัน 26.17.0
  3. ปล่อยไว้ถึง Phase 5 — Optimization & Distribution แต่ต้องปิดก่อน Release แรก (Owner Decision 10)

### 7.3 ไม่มี Code Signing Certificate

- ผลกระทบ: Windows SmartScreen เตือน "Unknown publisher" บน Installer ที่ไม่ได้ Sign; electron-updater ในอนาคตยังทำงานได้กับไฟล์ที่ไม่ได้ Sign แต่ผู้ใช้จะเจอคำเตือนทุกครั้งที่ติดตั้ง
- ทางเลือก:
  1. Release แรกแบบไม่ Sign และบันทึกคำเตือน SmartScreen ไว้ใน README/Release Notes พร้อมวิธีกด "More info → Run anyway" (ต้นทุนศูนย์ ตรงกับ Owner Decision 14 ที่ไม่สมมติว่ามี Certificate)
  2. จัดหา OV หรือ EV Code Signing Certificate แล้วตั้ง `win.certificateFile`/`signtoolOptions` หรือ Azure Trusted Signing; ต้นทุนและขั้นตอนต้องตรวจสอบ
  3. Sign ภายหลังเมื่อมี Release Workflow บน GitHub Actions (Secret ของ Certificate อยู่ใน CI)

### 7.4 Advisories ที่เหลือ 3 รายการจาก `bun audit`

- `braces@3.0.3` (high) ผ่าน `@vue/eslint-config-typescript > fast-glob > micromatch`; `sprintf-js@1.1.3` (moderate) ผ่าน `@electron/get > global-agent > roarr`; `tmp@0.2.6` (high) ผ่าน `app-builder-lib > @malept/flatpak-bundler > tmp-promise` (เส้นทาง Linux/Flatpak เท่านั้น) ทั้งหมดเป็นเครื่องมือ Build-time ไม่ถูกแพ็กไปกับแอป
- ทางเลือก:
  1. รอ Upstream ออก Patch แล้วรัน `bun audit fix` ซ้ำก่อนทุก Release (แนะนำ; ต้นทุนต่ำ)
  2. ใช้ `bun audit fix --latest` ซึ่งข้าม Major Version ของ Transitive Dependency; เสี่ยงต่อความเข้ากันได้ของ ESLint/electron-builder ต้องตรวจสอบก่อน
  3. ใช้ Field `overrides` ใน `package.json` บังคับเวอร์ชันของ `braces`/`sprintf-js`/`tmp`; ต้องตรวจสอบว่ามีเวอร์ชันที่แก้แล้วและเข้ากับ Range ของผู้ใช้งานแต่ละตัว

### 7.5 ยังไม่มี Content-Security-Policy

- ผลกระทบ: Electron แจ้ง "Insecure Content-Security-Policy" ตอนเริ่ม; Renderer โหลดสคริปต์/สไตล์จากที่ใดก็ได้ในทางทฤษฎี
- ทางเลือก:
  1. เพิ่ม `<meta http-equiv="Content-Security-Policy">` ใน `index.html` (และ `overlay.html`, `capture.html` เมื่อมี) เช่น `default-src 'self'; img-src 'self' data: file:; style-src 'self' 'unsafe-inline'` โดย `style-src 'unsafe-inline'` จำเป็นระหว่าง Dev เพราะ Vite/HMR Inject สไตล์เป็น `<style>` ใน DOM ส่วน Production สไตล์ทั้งหมดอยู่ในไฟล์ CSS จึงใช้ `'self'` ได้; ค่าที่เหมาะสมของแต่ละโหมดต้องตรวจสอบกับผลลัพธ์ Build จริง
  2. ตั้ง Header ผ่าน `session.defaultSession.webRequest.onHeadersReceived` ใน Main Process ซึ่งแยกค่า Dev/Prod ได้ด้วยโค้ด
  3. ทำทั้งสองอย่าง: Meta เป็นค่าเริ่มต้น และ Header สำหรับ Custom Protocol ที่ใช้เสิร์ฟรูป Item จาก `<userData>\data\images` (การออกแบบ Protocol อยู่ใน Architecture Proposal)
- ควรทำพร้อม Typed IPC ใน Phase 1 เพราะ Policy ต้องรู้ว่า Renderer โหลดรูปจาก Scheme ใด

### 7.6 Legacy JSON Layer ยังถูกเรียกตอน Startup

- ผลกระทบ: ทุกครั้งที่เปิดแอป `createTable` + `Relink` สร้าง/อ่าน `%APPDATA%\looter-app\Database\*.json` และ Push ข้อมูลทั้งก้อนไป Renderer; โค้ดมีบั๊กตามหัวข้อ 6.4 และ `jsonpath-plus`/`yaml` ยังต้องติดตั้ง
- ทางเลือก:
  1. ลบ `electron/database/index.js`, `electron/settings/index.js`, `electron/helper.js` ทั้งชุดเป็นงานแรกของ Phase 1 พร้อมถอด Ignore ใน `eslint.config.mjs`, ถอด `allowJs` ใน `tsconfig.node.json` และลบ `jsonpath-plus`/`yaml` (แนะนำ; Owner Decision 8 อนุญาตให้ Rewrite และไม่ต้องรักษา API ที่ผิด)
  2. คงไฟล์ไว้จนกว่า SQLite Layer เสร็จแล้วค่อยลบใน Commit เดียวกัน; ข้อเสียคือ Main Process ยังเขียนไฟล์ JSON ที่ไม่มีประโยชน์ระหว่างพัฒนา
- ไฟล์ JSON เดิมใน `%APPDATA%\looter-app\Database\` ไม่ต้อง Migrate (ไม่เคยมีข้อมูลผู้ใช้จริง) แต่ Settings Store ใหม่ควรไม่ใช้โฟลเดอร์ชื่อเดียวกันเพื่อไม่ให้สับสน ([Data Model](04-data-model.md) กำหนดให้ใช้ `<userData>\data\`)

### 7.7 Fonts ถูกประกาศแต่ไม่ถูกใช้ และมีไฟล์เกิน

- ข้อเท็จจริง: `src/fonts.css` มี 54 `@font-face` (4 Family) แต่ไม่มี `font-family` ถูกใช้ที่ใด; `public/fonts/` มี 78 ไฟล์ (1,675,428 bytes) โดย 24 ไฟล์ของ Open Sans (622,008 bytes) ไม่ถูกอ้างอิงจาก Rule ใดเลย; ทั้งหมดถูกคัดลอกเข้า `dist/` และ Installer
- ทางเลือก:
  1. เลือก 1 Family (เช่น Mulish หรือ Open Sans) ตั้งเป็น `--font-sans` ใน `@theme` ของ Tailwind 4 แล้วลบ Family อื่นและไฟล์ที่ไม่ถูกอ้างอิง (ลดขนาด Build และจำนวน Request ตอนเปิดหน้า)
  2. ตัดเฉพาะ 24 ไฟล์ที่ไม่ถูกอ้างอิงออกก่อน และเลื่อนการเลือก Font ไปที่เอกสาร UI/UX
  3. ไม่ใช้ Web Font เลย ใช้ System Font Stack (Segoe UI บน Windows) ซึ่งเร็วที่สุดและเหมาะกับ Overlay ที่ต้องเบา; ลบ `fonts.css` และ `public/fonts/` ทั้งหมด
- การตัดสินใจอยู่ใน [UI/UX Design Plan](05-ui-ux-design-plan.md)

### 7.8 ตัวแปร CSS `--system-titleBar-height` ไม่ถูกประกาศ

- ผลกระทบ: `grid-template-rows` ของ `#app` ไม่ได้ผลตามที่ตั้งใจ (แถว Title สูงเท่าเนื้อหา)
- ทางเลือก:
  1. ประกาศ `--system-titleBar-height: 40px` ใน `:root` ให้ตรงกับ `h-10` ของ `App.vue` (แก้เล็กที่สุด)
  2. ออกแบบ App Shell ใหม่ใน Phase 1 (Title Bar + Sidebar/Nav + `<router-view>`) แล้วกำหนด Layout ด้วย Tailwind Utilities ไม่ต้องใช้ตัวแปรนี้ (แนะนำ เพราะ Shell ต้องเขียนใหม่อยู่แล้ว)

### 7.9 Preload Bridge แบบ Generic

- ผลกระทบ: Renderer ส่ง IPC ได้ทุก Channel โดยไม่มี Type และไม่มี Allow-list; ขัดกับหลัก "Renderer ติดต่อผ่าน Typed IPC เท่านั้น"
- ทางเลือก:
  1. สร้าง `electron/ipc/contracts.ts` (Type ร่วม), `electron/preload.ts` ใหม่ที่ Expose `window.api` ตาม Contract (`profiles`, `items`, `inventory`, `tracking`, `gathering`, `overlay`, `capture`, `backup`, `on('<domain>:changed')`) และ `ipcMain.handle` ที่ Validate Input ทุกตัว; ลบ `window.ipcRenderer` (แนะนำ; เป็นงาน Phase 1 โดยตรง)
  2. คง Bridge เดิมไว้ชั่วคราวและเพิ่ม Allow-list ของ Channel; ไม่แนะนำเพราะต้องทำซ้ำเมื่อ Contract มา

### 7.10 vue-tsc ภายใต้ Bun

- ข้อเท็จจริง: vue-tsc ใต้ Bun เงียบและข้าม `.vue` (หัวข้อ 3.4); Script ปัจจุบันบังคับใช้ `node` จึงล้มเหลวชัดเจนแทนที่จะผ่านแบบหลอก
- ทางเลือก:
  1. คง Script แบบบังคับ `node` และแก้ที่สภาพแวดล้อม (ติดตั้ง Node.js ตาม 7.1) (แนะนำ)
  2. ติดตาม vue-tsc/Volar รุ่นใหม่ที่อาจไม่พึ่งการดัก CommonJS Loader แล้วค่อยเปลี่ยนกลับมาใช้ `bun x vue-tsc`; ต้องตรวจสอบเป็นรายรุ่น
  3. เขียน Script ตรวจ `.vue` ด้วย `@vue/language-core` เอง; ซับซ้อนเกินความจำเป็น ไม่แนะนำ

### 7.11 ประเด็นเพิ่มเติมที่พบระหว่าง Audit

| ประเด็น | ทางเลือก |
|---|---|
| `data/*.csv` (ตัวอย่าง Seed) ไม่อยู่ใน Version Control | ย้ายสำเนาที่ตรวจแล้วไปไว้เป็น Fixture ใต้ `electron/database/seed/` หรือ `docs/` เมื่อ Data Model นิ่ง; หรือคงเป็นข้อมูลเฉพาะเครื่องตามเดิม |
| Dependabot ครอบคลุมเฉพาะ `github-actions` และยังไม่มี Workflow | เพิ่ม Ecosystem สำหรับ `package.json` เมื่อมี CI; การรองรับ `bun.lock` ของ Dependabot ต้องตรวจสอบ หรือใช้ `bun outdated` + `bun audit` ด้วยมือก่อนทุก Release |
| ขนาด Installer ~123 MB และ `win-unpacked` 385 MB | ปกติสำหรับ Electron; ลดได้บางส่วนด้วยการตัด Font ที่ไม่ใช้ (7.7) และ `files` Glob ของ better-sqlite3 (5.2); การตัด Locale ของ Chromium ต้องตรวจสอบผลกระทบก่อน |
| Tailwind 4 สแกน `docs/*.md` เป็น Source (หัวข้อ 5.1): ขนาด CSS ของ Renderer ขึ้นกับเนื้อหาเอกสาร และ Utility ที่ไม่ได้ใช้ใน `src/` หลุดเข้า Bundle | เพิ่ม `@source not "../docs";` ใน `src/index.css` เพื่อตัดโฟลเดอร์เอกสารออกจากการสแกน (Directive `@source not` มีตั้งแต่ Tailwind 4.1 — Syntax ที่แน่นอนสำหรับ 4.3.3 ต้องตรวจสอบกับเอกสารทางการก่อนใช้) หรือกำหนด Source แบบ Explicit เฉพาะ `index.html` และ `src/**`; ควรทำใน Phase 1 เพื่อให้ตัวเลขขนาด Build ใช้อ้างอิงได้ |
| `.DS_Store` บนดิสก์ | ถูก ignore แล้ว ไม่ต้องทำอะไร |

### 7.12 `main` ในเครื่องกับ `origin/main` แยกทางกัน

- ข้อเท็จจริง: หัวข้อ 4.5 (`origin/main` = `6590336`, Merge-base กับ Branch = `0ec4852`)
- ทางเลือก:
  1. Rebase `feat/phase1-foundation` ทับ `origin/main` แล้วแก้ Conflict โดยยึดเวอร์ชันบน Branch (Electron 44.7.0, Vite 8.3.3, Bun 1.4.2, ไม่มี PostCSS/Sass); ประวัติยังเป็นลำดับเดิม 14 Commit แต่ Hash ทั้งหมดจะเปลี่ยน ต้องอัปเดตหัวข้อ 4.2 ของเอกสารนี้
  2. Merge `origin/main` เข้า Branch เป็น Merge Commit เดียวแล้วแก้ Conflict แบบเดียวกัน; Hash เดิมคงอยู่ เอกสารไม่ต้องแก้ แต่ประวัติมี Merge Commit
  3. หาก `6590336` เป็นงานทดลองที่ไม่ต้องการ การเขียนทับ `main` บน Remote เป็นการตัดสินใจของเจ้าของโปรเจกต์เท่านั้น ต้องตรวจสอบก่อน ไม่ทำโดยพลการ
- ไม่ว่าเลือกทางใด ต้องรันชุดตรวจสอบเต็ม (หัวข้อ 5.1) ซ้ำหลังแก้ Conflict เพราะ `bun.lock` และ `package.json` เป็นไฟล์ที่ชนกันโดยตรง

---

## 8. ข้อเสนอแนะก่อนเริ่ม Phase 1 implementation (เรียงตามลำดับที่ควรทำ)

1. **Commit งานเอกสารที่ค้าง**: `CLAUDE.md`, `README.md`, `docs/README.md` และ `docs/01..08-*.md` เป็น Commit `docs:` เดียว เพื่อให้ Branch มีจุดอ้างอิงแผนงานก่อนเขียนโค้ด (ยังไม่เปิด PR จนกว่า Phase 1 จะเสร็จตาม Owner Decision 2)
2. **จัดการความต่างกับ `origin/main`** (7.12) ก่อนที่โค้ด Phase 1 จะทับซ้อน `package.json`/`bun.lock` เพิ่ม: ตกลงกับเจ้าของโปรเจกต์ว่าจะ Rebase หรือ Merge แล้วรันชุดตรวจสอบเต็มซ้ำ; ถ้า Rebase ให้อัปเดต Hash ในหัวข้อ 4.2
3. **ติดตั้ง Node.js 24 LTS** (หรือกำหนดวิธีตาม 7.1) แล้วรัน `bun run typecheck` ให้ผ่านครบทั้ง Renderer และ Main ก่อนแตะโค้ด เพื่อให้ทุก Commit ของ Phase 1 ผ่านชุดตรวจสอบเต็ม (`bun run lint`, `bun run typecheck`, `bun x vite build`, `bun run build`, `bun audit`, `git diff --check`)
4. **เพิ่ม better-sqlite3**: `better-sqlite3@13.0.3` ใน `dependencies` และ `@types/better-sqlite3@9.6.0` ใน `devDependencies`; ตั้ง `"npmRebuild": false` ใน `electron-builder.json5`; ยืนยันด้วย `bun run build` ว่าโมดูลถูก Unpack ไปที่ `app.asar.unpacked` และ exe เปิด DB ได้ (ทำซ้ำผล Spike ในโปรเจกต์จริง); การตัด Prebuild ที่ไม่ใช่ win32-x64 เลื่อนไป Phase 5
5. **ลบ Legacy Layer ทั้งชุด**: `electron/database/index.js`, `electron/settings/index.js`, `electron/helper.js`, การเรียก `createTable`/`Relink`/`JSONPath` และ `main-process-message` ใน `electron/main.ts`/`src/main.ts`; ลบ `jsonpath-plus` และ `yaml`; ถอด Ignore ใน `eslint.config.mjs` และ `allowJs`/`checkJs` ใน `tsconfig.node.json` เพื่อให้ `electron/` เป็น TypeScript ล้วน
6. **สร้าง SQLite Data Layer + Migrations** ตาม [Data Model](04-data-model.md): `electron/database/` ใหม่ (เปิด DB ที่ `<userData>\data\gamelooter.sqlite`, WAL, `foreign_keys = ON`, `PRAGMA user_version`, Migration `electron/database/migrations/NNN-name.ts` ในธุรกรรม) และ Domain Logic ใน `electron/domain/*.ts` ที่ไม่ import Electron
7. **สร้าง Typed IPC**: `electron/ipc/contracts.ts`, `electron/preload.ts` ใหม่ที่ Expose `window.api` เท่านั้น, `ipcMain.handle` พร้อม Validation และ Push Event `<domain>:changed`; อัปเดต `src/vite-env.d.ts`
8. **เพิ่ม Security Baseline ส่วนที่เหลือ**: CSP (7.5), `session.setPermissionRequestHandler` (อนุญาตเฉพาะ `display-capture` เมื่อถึง Phase 4), ปิด `openDevTools()` ใน Production (มีอยู่แล้วเฉพาะ Dev)
9. **App Shell และ Settings Store**: `vue-router` 4 แบบ Hash History กับ Route `#/`, `#/items`, `#/recipes`, `#/quests`, `#/gathering`, `#/settings`; Store ใน `src/stores/*.ts`; Settings Store บน `app_setting` (Key `active_profile_id`, `hotkeys`, `overlay`, `window`, `preferences`) โดยนำ Logic จำตำแหน่ง Window จาก 6.1 มาเขียนใหม่; แก้ Layout Title Bar ตาม 7.8 และตัด `docs/` ออกจาก Source ของ Tailwind ตาม 7.11
10. **Game Profile Management** (Create/Rename/Delete/Switch/Active Profile, แยกข้อมูลต่อ Profile ด้วย `profile_id` + `ON DELETE CASCADE`) เป็น Feature แรกที่ปิด Phase 1 ตาม [Acceptance Criteria](08-acceptance-criteria.md)
11. **ตัดสินใจเรื่อง Font และ Icon ให้เสร็จก่อน Phase 2** (7.7, 7.2) เพื่อไม่ให้หน้าจอที่สร้างใน Phase 2 ต้องปรับ Visual System ซ้ำ; Code Signing (7.3) และการลดขนาด Installer เลื่อนไป Phase 5 — Optimization & Distribution
12. **บันทึกผลทุกการเปลี่ยนแปลงใน Technical-debt log ของ `CLAUDE.md`** และรัน `bun audit` ซ้ำก่อนทุก Release ตาม 7.4
