# Development Roadmap

แผนพัฒนา GameLooter แบ่งเป็น 5 Phases พร้อม Tasks, Dependencies, ลำดับการทำงาน, Definition of Done, แผน PR และ Checklist การตรวจสอบของแต่ละ Phase

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง:

- [Repository Audit Report](01-repository-audit.md)
- [Architecture Proposal](02-architecture-proposal.md)
- [Feature Specification](03-feature-specification.md)
- [Data Model](04-data-model.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Risks & Limitations](07-risks-and-limitations.md)
- [Acceptance Criteria](08-acceptance-criteria.md)

## 1. ภาพรวม Phases

ลำดับ Phases ยึดตาม Requirement 7 โดยปรับตามผลการตรวจสอบ Repository (Repository Audit Report) และ Technical Dependencies ที่พบ ได้แก่ การแทนที่ JSON Data Layer ด้วย SQLite ต้องเสร็จก่อน Feature ทุกตัว, Overlay ต้องมี Gathering Result จาก Aggregation Engine ก่อนจึงมีข้อมูลแสดง และ Capture ต้องมี Image Store กับ Hotkeys Module ก่อน

### 1.1 ตาราง Phases

| Phase | เป้าหมาย | ผลลัพธ์ที่ส่งมอบ | สถานะ (2026-10-08) |
|---|---|---|---|
| Phase 1 — Foundation | Repository พร้อมพัฒนา Feature ด้วย Stack ที่อัปเดตแล้ว, Data Layer เป็น SQLite, Renderer ติดต่อ Main Process ผ่าน Typed IPC เท่านั้น, มี App Shell และ Game Profile | Part A: Dependency Updates, Toolchain (TypeScript 5.9, ESLint 10), Security Baseline, แก้บั๊กเดิม. Part B: better-sqlite3 + Migrations, Repositories, Domain Skeleton, Typed IPC + Preload API + CSP, Settings Store (`app_setting`), App Shell (vue-router, Layout, Title Bar, Profile Switcher), Game Profile Management, ลบ Legacy Code, PR | Part A และ Part B เขียนเสร็จใน branch `feat/phase1-foundation` (2026-10-10); เหลือตรวจด้วยมือ (P1-15) และเปิด PR (P1-16) |
| Phase 2 — Core Tracking | ติดตาม Items, Recipes, Quests, Inventory และคำนวณ Gathering List ได้ถูกต้องตาม Requirement 3.1 ถึง 3.6 | Item Library (+ Import ไฟล์/Clipboard), Recipes (Nested, Cycle Check), Quest Tracker, Manual Inventory, Tracking Targets + Aggregation Engine + Gathering List, Consume/Craft Actions | ยังไม่เริ่ม |
| Phase 3 — Windows Overlay | แสดงข้อมูลทับเกม Borderless Windowed ตาม Requirement 3.7 | Overlay Window, View/Interactive, Click-through, Opacity/Compact/Bounds Persistence, Pinning, Global Hotkeys, Low-resource Behaviour | ยังไม่เริ่ม |
| Phase 4 — Capture & Productivity | เก็บภาพ Item จากเกมได้ในขั้นตอนน้อยที่สุดตาม Requirement 3.8 และปรับ Gathering List ให้ใช้งานเร็วขึ้นตาม Requirement 4 | Capture window, Region Selection, Cropping, Capture→Item Dialog, Clipboard Fallback Flow, Quick Item Creation, Gathering List Filters/Sorting/Hide-complete | ยังไม่เริ่ม |
| Phase 5 — Optimization & Distribution | แอปพร้อมแจกจ่ายบน Windows 10/11 x64 | Performance Pass, Backup/Restore/Export/Import, Packaging Polish (Icon, asar Trimming, Signing Decision), Update Mechanism Design, Windows 10/11 + High-DPI + Multi-monitor Verification, Release Checklist | ยังไม่เริ่ม |

### 1.2 Dependency Chain ระหว่าง Phases

```
Phase 1 — Foundation
  Part A (done): audit, dependency updates, toolchain, security baseline
  Part B (next): SQLite + migrations, repositories, typed IPC + preload API + CSP,
                 settings store, app shell, Game Profile management
        |
        v
Phase 2 — Core Tracking
  Item Library (+ image store, file/clipboard import), Recipes (+ cycle check),
  Quest Tracker, Manual Inventory, Tracking targets, Aggregation engine,
  Gathering List, Consume/Craft
        |
        v
Phase 3 — Windows Overlay
  overlay.html + overlay window, View/Interactive, click-through,
  opacity/compact/bounds persistence, pinning, hotkeys module (P3-07)
        |
        v
Phase 4 — Capture & Productivity
  capture.html + capture window, desktopCapturer + crop, capture->item dialog,
  clipboard fallback flow, quick item creation, gathering list filters/sorting/hide-complete
        |
        v
Phase 5 — Optimization & Distribution
  performance pass, backup/restore/export/import, packaging polish,
  update mechanism design, Win10/11 + High-DPI + multi-monitor verification, release
```

| Phase | ต้องการจาก Phase ก่อนหน้า | เหตุผล |
|---|---|---|
| Phase 2 | Phase 1 ทั้งหมด | Repositories, Typed IPC, Settings Store และ Active Profile เป็นฐานของทุก Feature; ข้อมูลทุกตารางผูกกับ `game_profile` |
| Phase 3 | Phase 2 (P2-14 Gathering Service, P2-15 Gathering List, P2-11 Inventory IPC) | Overlay แสดง Gathering Result และใช้ `inventory:adjust` ใน Interactive Mode |
| Phase 4 | Phase 2 (P2-02 Image Store, P2-04 Clipboard Import, P2-05 Item Library) และ Phase 3 (P3-07 Hotkeys Module) | Capture→Item Dialog บันทึกภาพผ่าน Image Store; Hotkey เริ่ม Capture และ Import จาก Clipboard ใช้ Hotkeys Module |
| Phase 5 | Phase 1 ถึง 4 | Performance Pass และ Compatibility Verification ต้องวัดจากแอปที่มี Overlay และ Capture ครบแล้ว; Backup ต้องครอบคลุม Images |

Phase 4 ขึ้นกับ Phase 3 เฉพาะ P3-07 (Hotkeys Module) หากต้องการทำคู่ขนาน ให้ merge P3-07 ก่อนแล้วเริ่ม P4-01 ถึง P4-04 ได้ แต่ลำดับที่แนะนำคือทำทีละ Phase ตามลำดับ เพราะงานทั้งหมดอยู่ในโค้ดชุดเดียวกันและ PR ของแต่ละ Phase ต้องผ่านการตรวจสอบเต็มรูปแบบก่อน merge

## 2. สถานะปัจจุบัน

### 2.1 สิ่งที่ Phase 1 Part A ส่งมอบแล้วใน branch `feat/phase1-foundation`

Branch แตกจาก `main` ที่ commit `7bab884` (docs: rewrite README and add repository guide) และมี 11 commits นำหน้า `main` ดังนี้ (เก่าสุดก่อน)

| Commit | เนื้อหา |
|---|---|
| `7f9d777` | chore: upgrade Electron to 44.7.0 and Electron Builder to 26.17.0 |
| `f519af6` | chore: upgrade Vite to 8.3.3 and vite-plugin-electron to 1.1.2 |
| `146fae2` | chore: restrict Bun lifecycle scripts to Electron |
| `f2aa196` | chore: upgrade Tailwind CSS to 4.3.3 and drop Sass and PostCSS |
| `e2fa6bd` | fix: resolve bundled font files from the public directory |
| `87b491c` | chore: update Vue, YAML and JSONPath Plus to current releases |
| `212016e` | chore: add TypeScript 5.9 and ESLint 10 toolchain |
| `30327bb` | refactor: remove unused config module, template asset and favicon reference |
| `b80ad55` | build: target Windows x64 only |
| `6c25dec` | chore: refresh transitive dependencies flagged by bun audit |
| `237b7c2` | chore: declare Bun 1.4.2 and the Node.js floor in package.json |

Commits `c4ca8ba`, `ec244e1`, `7bab884` (migrate to Bun, simplify renderer templates, rewrite README) อยู่บน `main` ก่อนแตก branch

สิ่งที่ส่งมอบแล้ว (รายละเอียดและผลตรวจสอบเต็มอยู่ใน Repository Audit Report)

1. Dependency Updates แยกทีละกลุ่มพร้อม Build หลังแต่ละกลุ่มตาม Requirement 10 ข้อ 3: Electron 44.7.0 (Chromium 152, Node 24.21.0, N-API 10), electron-builder 26.17.0, Vite 8.3.3 + vite-plugin-electron 1.1.2, Tailwind CSS 4.3.3 ผ่าน `@tailwindcss/vite` (ลบ Sass, PostCSS, Autoprefixer, `tailwind.config.js`, `postcss.config.js`), Vue 3.5.43, yaml 2.9.1, jsonpath-plus 11.2.0
2. Toolchain: TypeScript 5.9.3, vue-tsc 3.3.12, ESLint 10.12.0 (flat config), eslint-plugin-vue, @vue/eslint-config-typescript; Entry points เป็น `electron/main.ts`, `electron/preload.ts`, `src/main.ts`, `vite.config.mts`; `tsconfig.app.json` (Renderer) และ `tsconfig.node.json` (Electron); scripts `lint`, `typecheck`, `typecheck:renderer`, `typecheck:main`
3. Security Baseline ใน `electron/main.ts`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, ลบ `vite-plugin-electron-renderer` ที่ polyfill Node ใน Renderer, แก้ path ของ Preload เป็น `dist-electron/preload.js`
4. แก้บั๊กเดิม: ย้าย `moved`/`maximize`/`unmaximize` listeners จาก `app` ไปที่ `BrowserWindow`, แก้ font URLs 54 รายการเป็น `/fonts/`, ลบ `electron/config.js`, `electron/preload/dom.js`, `src/assets/vue.svg`, แก้ favicon เป็น `/looter.ico`, เปลี่ยนชื่อ `Lists.vue` เป็น `MaterialList.vue`, ปรับ Tailwind 4 class renames
5. Packaging: `electron-builder.json5` เหลือ win nsis x64 เท่านั้น; `trustedDependencies: ["electron"]`; `packageManager: bun@1.4.2` และ `engines` (`bun >=1.4.2`, `node >=20.19.0`)
6. `bun audit`: จาก 68 advisories เหลือ 3 (build-time เท่านั้น: braces, sprintf-js, tmp)
7. Spike better-sqlite3 13.0.3 ใน scratch project: โหลดใน Electron 44 ได้โดยไม่ rebuild, WAL + `foreign_keys = ON` + `db.transaction()` ทำงาน, Package ได้เมื่อ `npmRebuild: false` และ electron-builder unpack module ไปที่ `resources/app.asar.unpacked/node_modules/better-sqlite3/`
8. ผลตรวจสอบ ณ 2026-10-08: `bun install --frozen-lockfile`, `bun run lint`, `bun run typecheck:main`, `bun x vite build`, `bun run build` (`release/1.0.0/GameLooter-Windows-1.0.0-Setup.exe` ประมาณ 123 MB), runtime smoke และ `git diff --check` ผ่านทั้งหมด; `bun run typecheck:renderer` ผ่านเฉพาะเมื่อมี Node.js 24 บน PATH (เครื่องพัฒนาปัจจุบันไม่มี Node.js)

งานที่อยู่ใน Working Tree แต่ยังไม่ commit: `README.md` และ `CLAUDE.md` (แก้ไข) และโฟลเดอร์ `docs/` (`docs/README.md` กับเอกสารแผนงานชุดนี้) ต้อง commit เป็น `docs:` ก่อนเริ่ม Part B (Task P1-00)

### 2.2 สิ่งที่ยังไม่เริ่ม

ตาม Requirement 1 ข้อ 3 และ Requirement 10 ยังไม่มีการเริ่ม Implementation ของ Feature ใหม่ Phase 1 Part B จะเริ่มเมื่อได้รับคำสั่งจากเจ้าของโปรเจกต์ โค้ดเดิมที่ยังอยู่และจะถูกแทนที่ใน Part B (ไม่แก้บั๊กในที่เดิม) ได้แก่

- `electron/database/index.js` (JSON tables ใน `%APPDATA%\looter-app\Database\*.json`; มีบั๊กหลายจุด เช่น `fileName` และ `tableName` ไม่ได้ประกาศ, `JSONUpsert` push ลง object) และการเรียก `createTable('Game','Item','ItemCraft','Recipe')` + `Relink()` + `JSONPath('$')` ใน `electron/main.ts`
- `electron/settings/index.js` (persistence ถูก comment ออก, `initilizeApp` อ้าง `config` ที่ไม่มี) และ `electron/helper.js` (`debounce`)
- `electron/preload.ts` ที่ expose `window.ipcRenderer` แบบ generic (ส่งได้ทุก channel)
- `src/components/MaterialList.vue` (checklist placeholder), `src/index.css` ที่อ้าง `--system-titleBar-height` ซึ่งไม่ได้ประกาศ, `src/fonts.css` ที่ประกาศ 54 `@font-face` แต่ไม่มี `font-family` ถูกใช้
- `jsonpath-plus` และ `yaml` (ใช้เฉพาะ Legacy Layer)
- ยังไม่มี Content-Security-Policy (Electron แจ้ง "Insecure Content-Security-Policy" ตอน start)

## 3. รูปแบบ Task และกติการ่วม

### 3.1 รูปแบบ Task

- รหัส Task เป็น `P<phase>-<nn>` เช่น `P1-03`
- แต่ละ Task ระบุ: งานและรายละเอียด, ไฟล์/Module เป้าหมายตาม Architecture Proposal, Task ที่ต้องเสร็จก่อน, ขนาดสัมพัทธ์ และวิธีตรวจสอบ
- ขนาดสัมพัทธ์: S = แก้ไขไฟล์เดียวหรือ Module เดียวแบบจำกัดขอบเขต, M = หลายไฟล์ในพื้นที่ Feature เดียว, L = งานข้าม Layer (Main + IPC + Renderer) หรือ Algorithm ที่ต้องตรวจความถูกต้องละเอียด ไม่ระบุเป็นชั่วโมงเพราะยังไม่มีข้อมูลความเร็วการพัฒนาจริง
- วิธีตรวจสอบ: `lint` = `bun run lint`, `typecheck` = `bun run typecheck` (ต้องมี Node.js 24 LTS สำหรับส่วน Renderer; ส่วน `typecheck:main` รันใต้ Bun ได้), `build` = `bun x vite build`, `package` = `bun run build`, `audit` = `bun audit`, `manual` = ตรวจด้วยมือตามขั้นตอนใน Acceptance Criteria ของ Feature นั้น
- ชื่อไฟล์ที่ Architecture Proposal และ Data Model กำหนดไว้แล้ว (`electron/domain/*.ts`, `electron/ipc/contracts.ts`, `electron/database/index.ts`, `electron/database/migrate.ts`, `electron/database/migrations/index.ts`, `electron/database/migrations/NNN-name.ts`, `electron/database/repositories/`, `src/stores/*.ts`, `overlay.html`, `capture.html`; ดู Data Model §4.2) ใช้ตามนั้น ชื่อไฟล์ย่อยอื่นในเอกสารนี้เป็นข้อเสนอ ปรับได้ตอน implement ตราบที่ยังอยู่ใน Module เดียวกัน
- ชื่อ Vue Component ใช้ตาม Component Inventory ใน UI/UX Design Plan §7 (เช่น `AppShell`, `AppTitleBar`, `AppSidebar`, `ProfileSwitcher`, `ItemThumbnail`, `QuantityStepper`, `MaterialRow`, `GatheringTable`, `OverlayPanel`, `CaptureSelection`, `CaptureItemDialog`) โดยวางไฟล์ `.vue` ใน `src/components/` (ใช้ร่วม), `src/views/` (หน้าจอตาม Route), `src/overlay/` และ `src/capture/` (Entry แยก)
- ชื่อ IPC channel ยึดรูปแบบ `<domain>:<action>` สำหรับ invoke และ `<domain>:changed` สำหรับ push event ตาม Architecture Proposal; รายการ channel ทั้งหมดและ Payload ยึดตาม Feature Specification §14.1 (เช่น `profiles:switch`, `settings:update`, `capture:fromClipboard`, `backup:restore`, `app:getInfo`); ผลลัพธ์ของทุก invoke อยู่ในรูป `{ ok: true, data }` หรือ `{ ok: false, error: { code, message, details? } }` ด้วยรหัส Error ตาม Feature Specification §14.2 (`VALIDATION`, `DUPLICATE_NAME`, `NOT_FOUND`, `ITEM_IN_USE`, `CYCLE`, `HOTKEY_CONFLICT`, `HOTKEY_REGISTER_FAILED` เป็นต้น)

### 3.2 กติการ่วมของทุก Task

- เขียนด้วย TypeScript 5.x เท่านั้น (ห้าม TypeScript 6 และ 7) ตาม Requirement 10 ข้อ 4
- Renderer ห้าม import Node.js หรือ Electron API; ติดต่อ Main Process ผ่าน `window.api` เท่านั้น; คง `contextIsolation`, `sandbox` เปิด และ `nodeIntegration` ปิด
- Main Process เป็นเจ้าของ Database, File System, Hotkeys, Capture, Clipboard และ Overlay Window; ทุก Handler ตรวจสอบ input ก่อนทำงาน
- การเขียนหลายแถวใน SQLite ต้องอยู่ใน `db.transaction()` เดียว; `profile_id` ของทุกคำสั่งมาจาก `active_profile_id` ใน Main Process ไม่รับจาก Renderer เพื่อรักษา Per-profile Data Isolation
- Domain Logic ใน `electron/domain/*.ts` ห้าม import `electron`
- ไม่เขียน Test Scripts เว้นแต่ได้รับคำสั่ง แต่ต้องรัน Checklist ในหัวข้อ 10 ก่อน commit ทุกครั้งที่ปิด Task
- Commit message ภาษาอังกฤษตามรูปแบบที่ใช้อยู่ใน branch (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `build:`); PR description ภาษาไทย; ไม่ใส่ attribution footer

## 4. Phase 1 — Foundation

### 4.1 วัตถุประสงค์

- Part A (เสร็จแล้ว): Repository ใช้ Stack ปัจจุบัน, Toolchain ตรวจ lint/type ได้, Security Baseline ครบ, Build และ Package ผ่าน
- Part B (ถัดไป): แทนที่ JSON Data Layer ด้วย SQLite (better-sqlite3 13) พร้อม Migrations; Renderer ติดต่อผ่าน Typed IPC และ Preload API แบบ allow-list; Settings เก็บใน `app_setting`; App Shell มี Navigation ครบ 6 หน้าจอ (หน้าจอที่ยังไม่มี Feature เป็น placeholder); Game Profile สร้าง/เปลี่ยนชื่อ/ลบ/สลับ/ตั้ง Active ได้และข้อมูลแยกต่อ Profile; ลบ Legacy Code และ Dependencies ที่ไม่ใช้; อัปเดต README/CLAUDE.md; เปิด PR

### 4.2 Part A (เสร็จแล้ว)

รายการงานและผลตรวจสอบอยู่ในหัวข้อ 2.1 ไม่มี Task ค้างยกเว้น P1-00 (commit เอกสาร)

### 4.3 Task List ของ Part B

| ID | งาน | ไฟล์ / Module | ขึ้นกับ | ขนาด | ตรวจสอบ |
|---|---|---|---|---|---|
| P1-00 | Commit งานเอกสารที่ค้างอยู่ (`README.md`, `CLAUDE.md`, `docs/README.md`, `docs/01` ถึง `docs/08`, `docs/sqlite.dbml` ฉบับที่ตรงกับ Data Model — ต้องตรวจสอบว่าถูกเขียนใหม่แล้วก่อน commit) เป็น commit `docs:` แยกจากโค้ด เพื่อให้ Part B เริ่มจาก Working Tree สะอาด | `README.md`, `CLAUDE.md`, `docs/` | ไม่มี | S | `git diff --check`, อ่านทวน |
| P1-01 | (R-13) เพิ่ม `better-sqlite3@13.0.3` ใน `dependencies` (ต้องเป็น `dependencies` เพราะ vite-plugin-electron externalize เฉพาะกลุ่มนี้) และ `@types/better-sqlite3@9.6.0` ใน `devDependencies`; ตั้ง `"npmRebuild": false` ใน `electron-builder.json5`; ไม่ต้องแก้ `trustedDependencies` (v13 ไม่มี install script); ให้ `bun.lock` ตรงกับ `package.json` | `package.json`, `bun.lock`, `electron-builder.json5` | P1-00 | S | `bun install --frozen-lockfile`, `build`, `package` (ต้องเห็น `app.asar.unpacked/node_modules/better-sqlite3/`) |
| P1-02 | (R-14) Connection Module: `openDatabase()` สร้างโฟลเดอร์ `<userData>\data\` และ `<userData>\data\images\` (`mkdirSync` recursive), เปิด `<userData>\data\gamelooter.sqlite`, ตั้ง `PRAGMA journal_mode = WAL` และ `PRAGMA foreign_keys = ON` (คง `synchronous = FULL` ค่าเริ่มต้นตาม Data Model §1), รัน `PRAGMA quick_check` ต้องได้ `ok` ไม่เช่นนั้นแสดง Dialog ตาม Feature Specification F12-R9 (Phase 1 มีเฉพาะทางเลือก "เริ่มใหม่" = เปลี่ยนชื่อไฟล์เสียเป็น `.corrupt-<timestamp>` แล้วสร้างใหม่; ทางเลือก "กู้คืนจาก Backup" ต่อสายใน P5-03), คืน instance เดียว (`getDb()`), `closeDatabase()` บน `before-quit` (F12-R12); ถ้าเปิดไม่ได้ให้ `dialog.showErrorBox` แล้ว quit | `electron/database/index.ts` | P1-01 | S | `typecheck`, `build`, `manual` (เห็นไฟล์ `.sqlite`, `-wal`, `-shm` ขณะเปิด; AC-F12-06) |
| P1-03 | (R-15) Migrations Runner + `001-initial`: `migrate.ts` อ่าน `current = PRAGMA user_version` และ `latest` จาก `migrations/index.ts` (array ของ `Migration { version, name, rebuildsTables?, up(db) }` ตาม Data Model §4.2); ถ้า `current > latest` ปฏิเสธการเปิดพร้อมข้อความ "ต้องอัปเดตแอป"; ตรวจว่าหมายเลข Migration ต่อเนื่อง 1..latest; ก่อน apply เมื่อ `current > 0` สำรอง DB ด้วย `db.backup()` ไปที่ `<userData>\backups\gamelooter-v<current>-<timestamp>.sqlite` เก็บ 5 ไฟล์ล่าสุด (Data Model §4.3, §5.1); apply ทีละตัวใน `db.transaction()` แล้วตั้ง `user_version` ใน Transaction เดียวกัน (`rebuildsTables` ปิด `foreign_keys` นอก Transaction และตรวจ `PRAGMA foreign_key_check` ว่าง); ล้มเหลว → `dialog.showErrorBox` ระบุหมายเลข Migration, Error และ Path ของ Backup แล้ว `app.quit()` (F12-R7); `001-initial.ts` สร้างตาราง `game_profile`, `item`, `inventory`, `recipe`, `recipe_ingredient`, `quest`, `quest_requirement`, `tracking_target`, `app_setting` พร้อม Constraints และ Indexes ตรงตาม Data Model §3 ไม่มี Seed | `electron/database/migrate.ts`, `electron/database/migrations/index.ts`, `electron/database/migrations/001-initial.ts` | P1-02 | M | `typecheck`, `build`, `manual` (userData ว่าง → `user_version = 1` และมีครบ 9 ตาราง; รันซ้ำไม่เปลี่ยนอะไร; `PRAGMA foreign_key_check` ว่าง; AC-F12-01, AC-F12-02) |
| P1-04 | Repositories: `profile.ts` (list พร้อมจำนวน Items/Recipes/Quests ต่อ Profile, get, create, rename, delete แบบ Cascade ใน Transaction เดียวแล้วลบโฟลเดอร์ `<userData>\data\images\<profile_id>\` หลัง Commit ตาม F1-R9, getDeleteSummary ตาม F1-R8, touchLastOpened) และ `setting.ts` (get/set ค่า JSON ตาม key) ทำครบใน Phase นี้; สร้างไฟล์ `item.ts`, `inventory.ts`, `recipe.ts`, `quest.ts`, `tracking.ts` พร้อม Row Types และ Prepared Statements สำหรับอ่านตาม Query Patterns ใน Data Model §11 ส่วน Mutations ทำใน Phase 2; กติกา: `db.prepare()` ครั้งเดียวตอนสร้าง Repository และผูกค่าด้วย Named Parameters, คืน plain objects, map error `UNIQUE … COLLATE NOCASE` เป็น `DUPLICATE_NAME` และแถวไม่พบเป็น `NOT_FOUND` (Feature Specification §14.2) | `electron/database/repositories/*.ts` | P1-03 | M | `typecheck`, `lint`, `manual` ผ่าน IPC ใน P1-11 |
| P1-05 | Domain Module Skeleton: `types.ts` (ItemCategory, `Mode` = `craft`/`gather`, TrackingKind และรูปร่าง `AggregationTarget`, `AggregationRecipe`, `AggregationRequirement`, `AggregationResult` ตาม Data Model §7.5), `aggregation.ts` (signature `aggregate(input: AggregationInput): AggregationResult` ตาม Data Model §7.5 คืนผลว่าง; DTO ที่ส่งผ่าน IPC ชื่อ `GatheringResult`), `cycle.ts` (signature `findCycle(outputItemId, ingredients, recipesByOutputItem)` ตาม Data Model §8.1 คืน `null`); ห้าม import `electron` และ `better-sqlite3` บังคับด้วย ESLint `no-restricted-imports` สำหรับ `electron/domain/**` | `electron/domain/types.ts`, `electron/domain/aggregation.ts`, `electron/domain/cycle.ts`, `eslint.config.mjs` | ไม่มี (ทำคู่ขนานได้) | S | `lint`, `typecheck` |
| P1-06 | Typed IPC Contracts + Handler Registration: `contracts.ts` กำหนด type map ของ invoke channels และ push events ทั้งหมดตาม Feature Specification §14.1 (ประกาศ type ครบทุก domain ตั้งแต่ Phase นี้เพื่อให้ `window.api` มี namespace ครบ ส่วน handler ของ domain อื่น implement ใน Phase ของมัน) พร้อม Result envelope `{ ok: true, data }` / `{ ok: false, error: { code, message, details? } }` และรหัส Error ตาม §14.2; `register.ts` มี wrapper `handle(channel, fn)` ที่ validate input (trim ชื่อ, ความยาว, ชนิด) และ normalize error ก่อน `ipcMain.handle`; Phase 1 implement `profiles:list`, `profiles:create`, `profiles:rename`, `profiles:delete`, `profiles:getDeleteSummary`, `profiles:switch`, `profiles:getActive`, `settings:get`, `settings:update`, `app:getInfo`, `app:openDataFolder` และ push `profile:changed`, `settings:changed` (`gathering:changed` ประกาศ type ไว้ก่อน) | `electron/ipc/contracts.ts`, `electron/ipc/register.ts`, `electron/ipc/handlers/profiles.ts`, `electron/ipc/handlers/settings.ts`, `electron/ipc/handlers/app.ts` | P1-04 | M | `typecheck`, `lint`, `manual` |
| P1-07 | Preload API แทน Generic Bridge: `contextBridge.exposeInMainWorld('api', …)` สร้างจาก `contracts.ts` ให้ได้ `window.api.profiles.list()`, `window.api.settings.get()`, `window.api.on(event, cb)` (คืนฟังก์ชัน unsubscribe) เฉพาะ channel ใน allow-list; ไม่ expose `ipcRenderer` ดิบ; Preload ยังคง thin เพราะ sandboxed preload `require` ได้เฉพาะ `electron`; แก้ `src/vite-env.d.ts` ให้ `Window.api` อ้าง type จาก `contracts.ts` (type-only import; ต้องให้ `tsconfig.app.json` มองเห็นไฟล์นั้นหรือย้าย shared types ไปที่ที่ทั้งสอง tsconfig include ได้); ลบ `window.ipcRenderer` และ `main-process-message` | `electron/preload.ts`, `src/vite-env.d.ts` | P1-06 | M | `typecheck` (ทั้ง renderer และ main), `build`, `manual` (`window.ipcRenderer` เป็น `undefined`, `window.api` มีเฉพาะ namespace ตาม `contracts.ts`, `window.api.profiles.list()` คืน array; AC-PKG-12) |
| P1-08 | Content-Security-Policy: ใส่ `<meta http-equiv="Content-Security-Policy">` ใน `index.html` (และ `overlay.html`/`capture.html` เมื่อมีใน Phase 3/4) ด้วย directives ตาม Architecture Proposal (อย่างน้อย `default-src 'self'` และ `img-src` ที่ครอบคลุม scheme ของ Item Images; ไม่มี `unsafe-eval`); Dev mode ที่ Vite HMR ต้องการ `ws:` และ inline style ให้แยกค่าระหว่าง dev กับ production (ผ่าน `transformIndexHtml` หรือ `session.defaultSession.webRequest.onHeadersReceived` ใน production) | `index.html`, `vite.config.mts` หรือ `electron/main.ts` | P1-07 | S | `build`, `manual` (ไม่มี warning "Insecure Content-Security-Policy" ตอน `bun x electron .`; `bun run dev` ยัง HMR ได้) |
| P1-09 | Settings Store แทน `electron/settings/index.js`: keys `active_profile_id`, `hotkeys`, `overlay`, `window`, `preferences` เก็บเป็น JSON ใน `app_setting` รูปร่างตาม Data Model §3.12; `defaults.ts` กำหนดค่าเริ่มต้น (Hotkeys ตามหัวข้อ 11 ข้อ 5, Overlay bounds/opacity/mode/compact/visible, Preferences theme/sort/hideComplete/step/sidebarCollapsed); อ่านค่าผ่าน Type Guard ที่เขียนเอง ค่าที่ขาดหรือผิดชนิดใช้ค่าเริ่มต้นเฉพาะ Field นั้นแล้วเขียนกลับ (F12-R10); `settings:update` merge บางส่วนแล้ว push `settings:changed`; Main Window Bounds: บันทึก key `window` (bounds + `maximized` แยก) เมื่อ `moved`/`resized`/`maximize`/`unmaximize` แบบ debounce (เขียน `debounce` ใหม่เป็น TypeScript แทน `electron/helper.js`) ล้าง debounce ที่ค้างบน `before-quit` (F12-R12) และตอน restore ตรวจว่า bounds อยู่บน display ที่มีอยู่ (`screen.getAllDisplays()`) ไม่เช่นนั้นใช้ค่าเริ่มต้น (F12-R11) | `electron/settings/settings-service.ts`, `electron/settings/defaults.ts`, `electron/ipc/broadcast.ts` | P1-04 | M | `typecheck`, `manual` (ย้าย/ย่อขยายหน้าต่าง → ปิด → เปิดใหม่ได้ bounds เดิม; bounds นอกจอถูกแก้; AC-F10-05) |
| P1-10 | App Shell: ติดตั้ง `vue-router` 4 (เวอร์ชันแน่นอนต้องตรวจสอบตอนติดตั้ง); `src/router.ts` ใช้ `createWebHashHistory` กับ routes `#/` Game Dashboard, `#/items` Item Library, `#/recipes` Recipes, `#/quests` Quest Tracker, `#/gathering` Gathering List, `#/settings` Settings (หน้าจอของ Phase 2 เป็น placeholder view) พร้อม Route Guard: ไม่มี Active Profile → redirect ไป `#/` และ Sidebar แสดงรายการ 2–5 เป็น Disabled (UI/UX Design Plan §2.2), Query `?id=`/`?section=` สำหรับ Deep Link, Shortcut `Ctrl+1` ถึง `Ctrl+6`; `src/App.vue` ใช้ `AppShell` = Grid `'title title' / 'sidebar desktop'` + `AppTitleBar` (drag region, ชื่อแอป, `ProfileSwitcher`, ปุ่ม Capture/Overlay เป็น Disabled จนถึง Phase 3/4) + `AppSidebar` (ยุบได้ เก็บใน `preferences.sidebarCollapsed`) + `<router-view>` + `ToastStack` และ Live Region; Component ใช้ร่วม `EmptyState`, `BaseDialog`, `ConfirmDialog`, `AppIcon`; แก้ `src/index.css` ให้ใช้ `env(titlebar-area-height, 40px)` แทน `--system-titleBar-height` และเพิ่ม `@source not "../docs";` กัน Tailwind 4 สแกน `docs/*.md` (Repository Audit Report 7.11) และตั้ง `titleBarOverlay.height: 40` กับสี `titleBarOverlay` ให้ตรง `--color-surface-1` ใน `electron/windows/main-window.ts` (UI/UX Design Plan §2.1, §8.1); ประกาศ Tokens ใน `@theme` ตาม UI/UX Design Plan §8.1 (แทน `font-size: 0.85rem` ด้วย `14px`, Dark Mode เป็นค่าเริ่มต้น, `--font-sans`/`--font-numeric` ตามการตัดสินใจข้อ 6 ในหัวข้อ 11; การลบ `@font-face` และไฟล์ฟอนต์ที่ไม่ใช้ทำใน P5-05); ลบ `src/components/MaterialList.vue`; Stores `src/stores/profiles.ts`, `src/stores/settings.ts` เป็น composables ที่เรียก `window.api` และ subscribe `profile:changed`/`settings:changed` | `src/router.ts`, `src/App.vue`, `src/components/AppShell.vue`, `src/components/AppTitleBar.vue`, `src/components/AppSidebar.vue`, `src/components/ProfileSwitcher.vue`, `src/components/EmptyState.vue`, `src/components/BaseDialog.vue`, `src/components/ConfirmDialog.vue`, `src/components/ToastStack.vue`, `src/components/AppIcon.vue`, `src/views/*.vue`, `src/stores/profiles.ts`, `src/stores/settings.ts`, `src/index.css`, `electron/windows/main-window.ts`, `package.json` | P1-07, P1-09, P1-12 | L | `lint`, `typecheck`, `build`, `manual` (เปิดครบ 6 routes, ลาก Title Bar ได้, Dark Mode เป็นค่าเริ่มต้น; AC-UX-01, AC-UX-02) |
| P1-11 | Game Profile Management ตาม Feature Specification F1: Game Dashboard แสดง `ProfileCard` (ชื่อ, อักษรตัวแรกแทนไอคอนเพราะ `icon_path` เป็น NULL ใน Phase 1 ตาม F1-R12, `last_opened_at`, badge Active; จำนวน Items/Targets และ Progress เป็น 0 จนถึง Phase 2) เรียงตาม `last_opened_at` พร้อม Create/Rename/Delete/Switch และ Shortcut `Ctrl+N`, `F2`, `Delete`; First Run ไม่มี Profile → `EmptyState` เต็มหน้าบังคับสร้างก่อนใช้งาน และ Profile แรกเป็น Active ทันที (F1-R3); Create/Rename บังคับชื่อ (trim, ไม่ว่าง) และแสดง `DUPLICATE_NAME` เมื่อชื่อซ้ำแบบ case-insensitive; Delete ใช้ `ConfirmDialog` ที่แสดงผล `profiles:getDeleteSummary` (จำนวน Items/Recipes/Quests/Targets/ไฟล์ภาพ) ตาม F1-R8 และหลังลบ Profile ที่ Active ให้สลับไป `last_opened_at` ล่าสุดหรือกลับสู่ Onboarding (F1-R10); Switch (`profiles:switch`) เขียน `active_profile_id` + `last_opened_at` แล้ว push `profile:changed` ในคำสั่งเดียว (F1-R4); ตอนเริ่มแอป fallback ตาม F1-R5; `ProfileSwitcher` ใน Title Bar (`Ctrl+P`); Settings มี Section Profiles ใช้ `ProfileTable` (ปุ่มเลือกไอคอนเลื่อนไป Phase 2 เพราะต้องใช้ Image Store) | `src/views/GameDashboard.vue`, `src/views/Settings.vue`, `src/components/ProfileCard.vue`, `src/components/ProfileTable.vue`, `src/components/ProfileSwitcher.vue`, `electron/ipc/handlers/profiles.ts` | P1-10 | L | `lint`, `typecheck`, `build`, `manual` ตาม AC-F1-01 ถึง AC-F1-04 (รวมการตรวจว่า Handler ทุกตัวอ่าน `profile_id` จาก `active_profile_id` ใน Main Process ไม่รับจาก Renderer ตาม F1-R11); AC-F1-05 ถึง AC-F1-07 ตรวจเต็มรูปแบบใน Phase 2 เมื่อมี Items |
| P1-12 | Bootstrap Main Process ใหม่: ลบการเรียก `createTable`, `Relink`, `JSONPath`, `main-process-message` และ `onWindowPositionEvent`; ลำดับใน `app.whenReady()` ตาม F12-R6 = `requestSingleInstanceLock()` (ป้องกันสองโปรเซสเปิด DB เดียวกัน; ข้อเสนอ) → `openDatabase()` (สร้างโฟลเดอร์, PRAGMA, `quick_check`) → `runMigrations()` → โหลด Settings และเลือก Active Profile ตาม F1-R5 → `registerIpcHandlers()` → `createMainWindow()`; บน `before-quit` ล้าง debounce ที่ค้างแล้ว `closeDatabase()` (F12-R12; การยกเลิก Hotkeys และทำลาย Overlay/Capture windows เพิ่มใน Phase 3/4); ย้ายการสร้าง BrowserWindow ไป `electron/windows/main-window.ts` (คง `titleBarStyle: 'hidden'`, `titleBarOverlay`, `autoHideMenuBar`, `icon`, webPreferences เดิม) และใช้ bounds/`maximized` จาก P1-09 | `electron/main.ts`, `electron/windows/main-window.ts` | P1-03, P1-06, P1-09 | M | `build`, `manual` (`bun x electron .` จาก userData ว่างสร้าง `data\gamelooter.sqlite`; เปิดแอปซ้ำจะโฟกัสหน้าต่างเดิม; AC-F12-05, AC-F12-08) |
| P1-13 | ลบ Legacy: `electron/database/index.js`, `electron/settings/index.js`, `electron/helper.js`; `bun remove jsonpath-plus yaml`; ลบรายการ ignore ของสามไฟล์นั้นใน `eslint.config.mjs`; ตั้ง `allowJs: false` และลบ `checkJs` ใน `tsconfig.node.json` (ไม่เหลือ JavaScript ใน `electron/`); ลบ `dist-electron/` เก่าก่อน build ใหม่ | `electron/database/index.js`, `electron/settings/index.js`, `electron/helper.js`, `package.json`, `bun.lock`, `eslint.config.mjs`, `tsconfig.node.json` | P1-12 | S | `bun install --frozen-lockfile`, `lint`, `typecheck`, `build`, `audit` |
| P1-14 | อัปเดต `README.md` และ `CLAUDE.md`: โครงสร้างโปรเจกต์ใหม่ (`electron/database`, `electron/domain`, `electron/ipc`, `electron/settings`, `electron/windows`, `src/router.ts`, `src/views`, `src/stores`), ตำแหน่ง Database และวิธีเพิ่ม Migration `NNN-name.ts`, กฎ `window.api` เท่านั้น, ลบข้อความเกี่ยวกับ Legacy Modules และ ESLint ignores, เพิ่มรายการใน "Optimization and technical-debt log" สำหรับ Part B | `README.md`, `CLAUDE.md` | P1-13 | S | `git diff --check`, อ่านทวน |
| P1-15 | (R-20) Verification Pass เต็มรูปแบบตามหัวข้อ 10.1 รวม `bun run typecheck` บนเครื่องที่มี Node.js 24 (ถ้าเครื่องพัฒนายังไม่มี ให้ระบุใน PR ว่า `typecheck:renderer` รันที่ไหน); ติดตั้ง Setup.exe แล้วตรวจว่า `%APPDATA%\looter-app\data\gamelooter.sqlite` ถูกสร้างและ Game Profile ทำงานในแอปที่ package แล้ว (AC-PKG-01, AC-PKG-09); วัดเวลาเปิดหน้าต่างหลักครั้งแรกและบันทึกค่า (AC-PERF-03 เป้าหมายน้อยกว่า 3 วินาที); บันทึกผลลง PR | ทั้งโปรเจกต์ | P1-14 | S | ทุกรายการในหัวข้อ 10.1 |
| P1-16 | เตรียม PR `feat/phase1-foundation` → `main`: จัด commits เป็นกลุ่มตาม Task (ภาษาอังกฤษ), rebase บน `main` ล่าสุด, PR description ภาษาไทยตามหัวข้อ 9.2, แนบผลตรวจสอบและรายการที่ยังไม่ทำ (เช่น `icon_path`), ไม่มี attribution footer | PR | P1-15 | S | Checklist ในหัวข้อ 9.2 |

### 4.4 ลำดับที่แนะนำและการจัด Commit

ลำดับ: P1-00 → P1-01 → P1-02 → P1-03 → P1-04 (P1-05 ทำคู่ขนานได้) → P1-06 → P1-07 → P1-08 → P1-09 → P1-12 → P1-10 → P1-11 → P1-13 → P1-14 → P1-15 → P1-16

กลุ่ม commit ที่แนะนำ (หนึ่ง commit ต่อกลุ่ม, build/lint ผ่านทุก commit)

1. `docs: add planning documents and repository guide updates` (P1-00)
2. `feat: add better-sqlite3 connection and initial migration` (P1-01, P1-02, P1-03)
3. `feat: add repositories and domain module skeleton` (P1-04, P1-05)
4. `feat: add typed IPC contracts, preload API and CSP` (P1-06, P1-07, P1-08)
5. `feat: add settings store with window state persistence` (P1-09)
6. `refactor: bootstrap the main process on the SQLite layer` (P1-12)
7. `feat: add app shell with router, layout and title bar` (P1-10)
8. `feat: add game profile management` (P1-11)
9. `chore: remove the legacy JSON data layer and unused dependencies` (P1-13)
10. `docs: update README and repository guide for the SQLite layer` (P1-14)

### 4.5 Definition of Done ของ Phase 1

- Task P1-00 ถึง P1-16 เสร็จและอยู่ใน branch `feat/phase1-foundation`
- Checklist หัวข้อ 10.1 ผ่านทั้งหมด (`typecheck:renderer` ผ่านบนเครื่องที่มี Node.js 24)
- แอปที่ package แล้วสร้าง `gamelooter.sqlite` ที่ `user_version = 1` และ Game Profile สร้าง/เปลี่ยนชื่อ/ลบ/สลับ/ตั้ง Active ได้ ข้อมูลแยกต่อ Profile
- ไม่มี `window.ipcRenderer`, ไม่มี Legacy Modules, ไม่มี `jsonpath-plus`/`yaml`, ไม่มี Electron CSP warning
- `README.md` และ `CLAUDE.md` ตรงกับโค้ด
- PR เปิดแล้วพร้อม description ภาษาไทย
- ผ่านเกณฑ์ใน [Acceptance Criteria](08-acceptance-criteria.md) หัวข้อ 19 แถว Phase 1 — Foundation: AC-F1-01 ถึง AC-F1-04, AC-F10-05, AC-F12-01, AC-F12-02, AC-F12-05, AC-F12-06, AC-F12-08, AC-UX-01, AC-UX-02, AC-PKG-01, AC-PKG-09, AC-PKG-12, AC-TOOL-01 ถึง AC-TOOL-10 และบันทึกค่า AC-PERF-03

### 4.6 ความเสี่ยงที่ต้องเฝ้าระวัง

อ้างอิง [Risks & Limitations](07-risks-and-limitations.md): Native Module (R-13: better-sqlite3 ต้องใช้ `npmRebuild: false`; Module อื่นที่ต้อง rebuild จะต้องมี Python และ VS Build Tools), Tooling (R-20: vue-tsc ต้องใช้ Node.js; เครื่องพัฒนาไม่มี Node.js; R-21: Vite 8/Tailwind 4 ยังใหม่), Data Safety (R-14, R-15: Migration ต้องสำรองก่อน; WAL + Transactions), Scope Control (R-27: ไม่เริ่ม Part B จนกว่าจะได้รับคำสั่ง; R-28: ไม่เขียน Tests), Audit (R-22: 3 advisories build-time ต้องตรวจซ้ำก่อน release)

## 5. Phase 2 — Core Tracking

### 5.1 วัตถุประสงค์

ทำให้ Requirement 3.1 ถึง 3.6 ใช้งานได้ครบในหน้าต่างหลัก: Item Library พร้อมรูปภาพจากไฟล์และ Clipboard, Recipes แบบ Nested ที่ป้องกัน Circular Dependencies, Quest Tracker, Manual Inventory, Tracking Targets และ Aggregation Engine ที่คำนวณ Required/Owned/Missing จาก Shared Inventory โดยไม่นับซ้ำ, Gathering List, Consume/Craft Actions และ Per-target Allocated Progress

### 5.2 Task List

| ID | งาน | ไฟล์ / Module | ขึ้นกับ | ขนาด | ตรวจสอบ |
|---|---|---|---|---|---|
| P2-01 | Item Repository + IPC `items:list` (ตาม Active Profile พร้อม `owned`, `has_recipe`, search/category/pinnedOnly ตาม Data Model §11.1), `items:get`, `items:create` (สร้างแถว `inventory` owned 0 ใน Transaction เดียว ตาม F2-R3; ผูก `pendingImageId` ถ้ามีผ่าน P2-02), `items:update`, `items:setPinned`, `items:getUsage` (Recipes ที่ใช้เป็น Ingredient, Quests ที่ใช้เป็น Requirement, Recipe ที่ Item เป็น Output), `items:delete` ตาม F2-R12 ถึง F2-R15 (`ITEM_IN_USE` เมื่อติด `ON DELETE RESTRICT`; Cascade Recipe ที่ Item เป็น Output พร้อมแจ้งชื่อ) และ push `items:changed`; map ชื่อซ้ำใน Profile เป็น `DUPLICATE_NAME` | `electron/database/repositories/item.ts`, `electron/ipc/handlers/items.ts`, `electron/ipc/contracts.ts` | P1-04, P1-06 | M | `typecheck`, `lint`, `manual` (AC-F2-01 ถึง AC-F2-03, AC-F2-08, AC-F2-09) |
| P2-02 | Image Store + Pending image: Pending image เก็บในหน่วยความจำของ Main Process (`pendingImageId`, PNG buffer, กว้าง × สูง, `source` = `file`/`clipboard`/`capture`, ผูกกับ Active Profile ตอนสร้างและยกเลิกเมื่อสลับ Profile ตาม F1-R13, อายุตามค่าเสนอใน Feature Specification F10-R8) ทุกแหล่งภาพสร้าง Pending image ก่อนแล้วผูกผ่าน `items:create({ pendingImageId })` หรือ `items:attachImage({ id, pendingImageId, replace? })` (F2-R7); `saveItemImage(profileId, itemId, png)` เขียน `<userData>\data\images\<profile_id>\<item_id>.png` และ `thumbs\<item_id>.png` (ด้านยาวสุด 64 px ด้วย `nativeImage.resize`; วิธี Pad เป็น 64×64 ตาม Data Model §5.3) ก่อน Commit แถว DB (F12-R13), อัปเดต `item.image_path`/`thumbnail_path` เป็น path relative กับ `<userData>\data` ใช้ `/` คั่น (Data Model §5.2), `items:removeImage` ลบไฟล์ทั้งสองและตั้ง NULL, ลบไฟล์หลัง Commit เมื่อลบ Item หรือแทนที่ภาพ (F2-R9, F2-R10); Item DTO มี `imageUrl`/`thumbnailUrl` พร้อม `?v=<updated_at>` ตามกลไกโหลดภาพใน Architecture Proposal และต้องสอดคล้องกับ CSP ใน P1-08; `capture:discard`, `capture:listPending` สำหรับจัดการ Pending image | `electron/images/image-store.ts`, `electron/images/pending-store.ts`, `electron/ipc/handlers/capture.ts`, `electron/images/image-protocol.ts` (Scheme `looter-img` ตาม Architecture Proposal §7.2), `electron/main.ts` (ลงทะเบียน Scheme ก่อน `ready`) | P2-01 | M | `typecheck`, `manual` (ไฟล์อยู่ตาม path, DB เก็บ relative path, Thumbnail แสดงใน Renderer; AC-F2-05, AC-F2-10) |
| P2-03 | Import ภาพจากไฟล์ (`capture:importFile`): `dialog.showOpenDialog` (png/jpg/jpeg/webp/bmp; รูปแบบที่ `nativeImage` ของ Electron 44 อ่านได้นอกจาก PNG/JPEG ต้องตรวจสอบตอน implement) → `nativeImage.createFromPath` → `toPNG()` → Pending image (`source: 'file'`) → push `capture:changed` (`phase: 'captured'`) → ผูกกับ Item ผ่าน P2-02; ปุ่ม "Import image file" ใน `ItemEditDialog`; Drag-and-drop ไฟล์ใช้ `capture:importPath({ path })` (Preload ใช้ `webUtils.getPathForFile`; ถ้าใช้ใน Sandbox ไม่ได้ให้ตัด Drag-and-drop เหลือ `importFile`; ตาม Architecture Proposal 5.2) | `electron/ipc/handlers/capture.ts`, `electron/images/pending-store.ts` | P2-02 | S | `manual` (AC-F2-05) |
| P2-04 | (R-12) Paste ภาพจาก Clipboard (`capture:fromClipboard`) ด้วย API ใหม่ของ Electron 44: `clipboard.read()` → เลือก `ClipboardItem` ที่ `types` มี `image/png` (หรือ `image/*`) → `getType()` → `Buffer.from(await blob.arrayBuffer())` → แปลงเป็น PNG ผ่าน `nativeImage` ถ้าไม่ใช่ PNG → Pending image (`source: 'clipboard'`) → push `capture:changed`; error ชัดเจนเมื่อ Clipboard ไม่มีภาพ (AC-F8-09); ปุ่ม "Paste from clipboard" ใน `ItemEditDialog` (Hotkey `CommandOrControl+Shift+V` ผูกใน P4-05) | `electron/capture/clipboard-image.ts`, `electron/ipc/handlers/capture.ts` | P2-02 | S | `manual` (Win+Shift+S แล้วกดปุ่ม; AC-F2-06) |
| P2-05 | Item Library (`#/items`): กริด `ItemCard` พร้อม `ItemThumbnail`, `SearchField` (debounce, `/` โฟกัส), `CategoryFilter` 5 ค่า (`material`, `equipment`, `consumable`, `quest`, `other`) + ตัวกรอง Pinned เท่านั้น (F2-R4), `ItemEditDialog` (ชื่อ, category, notes, ปุ่มรูป 3 ทาง: Import file / Paste clipboard / Capture ซึ่ง Capture เป็น Disabled จนถึง Phase 4, ส่วน "ใช้ใน" จาก `items:getUsage`, ลบรูป), toggle pinned, ลบพร้อม `ConfirmDialog` ที่อธิบาย "ใช้อยู่ใน …" และ Recipe ที่จะถูกลบตาม (F2-R12, F2-R13, F2-R15), `QuantityStepper` ปรับ `owned` ในการ์ด (ต่อสายเมื่อ P2-11 เสร็จ); `ItemThumbnail` และ `ItemPicker` ใช้ร่วมทุกหน้าจอและ Overlay; store `items.ts` subscribe `items:changed` | `src/views/ItemLibrary.vue`, `src/components/ItemCard.vue`, `src/components/ItemEditDialog.vue`, `src/components/ItemThumbnail.vue`, `src/components/ItemPicker.vue`, `src/components/SearchField.vue`, `src/components/CategoryFilter.vue`, `src/components/QuantityStepper.vue`, `src/stores/items.ts` | P2-01, P2-02, P2-03, P2-04 | L | `lint`, `typecheck`, `build`, `manual` (AC-F2-01 ถึง AC-F2-11 ยกเว้นส่วน Overlay) |
| P2-06 | Recipe Graph Domain: `cycle.ts` `findCycle(outputItemId, ingredients, recipesByOutputItem)` ทำ DFS บนกราฟ "Item → Items ที่ Recipe ของมันใช้" โดยไม่สน `mode` และคืน path ของวงจรหรือ `null` (Data Model §8.1); `expandRecipeTree` สำหรับ Nested Preview และวัตถุดิบรวม Gross ที่ `recipes:expand` ใช้ (pure function, ไม่ import `electron`; ชื่อไฟล์เสนอ `expand.ts`) | `electron/domain/cycle.ts`, `electron/domain/expand.ts` | P1-05 | M | `typecheck`, `lint`, `manual` ผ่าน UI ใน P2-08 |
| P2-07 | Recipe Repository + IPC `recipes:list`, `recipes:get`, `recipes:create`/`recipes:update` (output item, `output_qty`, `station`, `notes`, ingredients ที่มี `qty`, `mode`, `sort_order`) ใน transaction เดียว, `recipes:delete`, `recipes:validate` (ตรวจ Cycle ของร่าง คืน `{ ok }` หรือ `CYCLE` พร้อม `path`), `recipes:expand` (ต้นไม้ Nested Preview); บังคับ `UNIQUE (output_item_id)` (หนึ่ง recipe ต่อ output item); เรียก P2-06 ก่อนเขียนและปฏิเสธด้วย `CYCLE`; push `recipes:changed` | `electron/database/repositories/recipe.ts`, `electron/ipc/handlers/recipes.ts` | P2-01, P2-06 | M | `typecheck`, `manual` (สร้าง A→B→A ต้องถูกปฏิเสธพร้อม path; AC-F3-02, AC-F3-05) |
| P2-08 | Recipes (`#/recipes`): `RecipeListPane` ซ้าย + `RecipeEditor` ขวา (เลือก output item จาก `ItemPicker`, `output_qty`, station), `IngredientList` ที่ใช้ `MaterialRow` แบบ `ingredient` + `ModeToggle` (`craft`/`gather`; บังคับ `gather` เมื่อ Item ไม่มี Recipe) + ลากจัดลำดับ, เรียก `recipes:validate` ทันทีที่เพิ่ม Ingredient และแสดง `CycleErrorBanner`, `RecipePreviewTree` แสดงต้นไม้ถึง Raw Materials จาก `recipes:expand`; store `recipes.ts` | `src/views/Recipes.vue`, `src/components/RecipeListPane.vue`, `src/components/RecipeEditor.vue`, `src/components/IngredientList.vue`, `src/components/MaterialRow.vue`, `src/components/ModeToggle.vue`, `src/components/RecipePreviewTree.vue`, `src/components/CycleErrorBanner.vue`, `src/stores/recipes.ts` | P2-05, P2-07 | L | `lint`, `typecheck`, `build`, `manual` (AC-F3-01 ถึง AC-F3-08) |
| P2-09 | Quest Repository + IPC `quests:list`, `quests:get`, `quests:create`/`quests:update` (requirements ที่มี `qty`, `mode`, `sort_order` ใน transaction), `quests:setStatus` (`active`/`paused`/`completed` ตั้ง `completed_at`; ไม่แตะ `inventory`), `quests:delete`; push `quests:changed` | `electron/database/repositories/quest.ts`, `electron/ipc/handlers/quests.ts` | P2-01 | M | `typecheck`, `manual` (AC-F4-03) |
| P2-10 | Quest Tracker (`#/quests`): รายการ `QuestCard` แยกตาม status (ขยายได้), `QuestEditDialog` (ชื่อ, notes, requirements ใช้ `IngredientList` ร่วม, ตัวเลือก "ติดตามทันที"), ปุ่มเปลี่ยน status; store `quests.ts` | `src/views/QuestTracker.vue`, `src/components/QuestCard.vue`, `src/components/QuestEditDialog.vue`, `src/stores/quests.ts` | P2-05, P2-09 | M | `lint`, `typecheck`, `build`, `manual` (AC-F4-01, AC-F4-02, AC-F4-06) |
| P2-11 | (R-18) Inventory Repository + IPC `inventory:adjust({ itemId, delta })` และ `inventory:set({ itemId, owned })`: `adjust` ปัดผลลัพธ์เป็น 0 และเป็นค่าสูงสุด 999,999 แทนการปฏิเสธ (F7-R2, Data Model §9.3); `set` ตรวจจำนวนเต็มในช่วง 0 ถึงค่าสูงสุดมิฉะนั้น `VALIDATION` (F7-R3; `CHECK (owned >= 0)` เป็นด่านสุดท้าย); อัปเดต `updated_at`; push `inventory:changed` (`{ profileId, changes: [{ itemId, owned }] }`) ทันทีตาม F7-R7 | `electron/database/repositories/inventory.ts`, `electron/ipc/handlers/inventory.ts` | P2-01 | S | `typecheck`, `manual` (AC-F6-04) |
| P2-12 | Tracking Targets Repository + IPC `tracking:list`, `tracking:add` (quest/recipe พร้อม `target_qty`), `tracking:remove`, `tracking:update` (แก้ `target_qty`), `tracking:reorder(ids)` เขียน `priority` ใหม่ใน transaction, `tracking:setPinned`; บังคับหนึ่ง target ต่อ quest/recipe ตาม `UNIQUE (quest_id)`/`UNIQUE (recipe_id)`; push `tracking:changed` | `electron/database/repositories/tracking.ts`, `electron/ipc/handlers/tracking.ts` | P2-07, P2-09 | M | `typecheck`, `manual` |
| P2-13 | (R-19) Aggregation Engine ตาม Algorithm ใน Data Model: input = targets เรียง `priority`, `inventory.owned`, recipes + ingredients; output = Gather Items (Required/Owned/Missing), Craft Plan (`runs × recipe` พร้อม Required/Owned), `allocation[target]`, Overall Progress = Σ min(Owned, Required) / Σ Required; หัก Owned Intermediate ก่อน, `mode` `craft`/`gather`, surplus จาก `output_qty` ใช้กับ target ถัดไป, visited-set กัน cycle; pure function รับ/คืนค่าตามรูปร่างใน Data Model §7.5 | `electron/domain/aggregation.ts`, `electron/domain/types.ts` | P1-05, P2-06 | L | `typecheck`, `lint`, `manual` ด้วยตัวอย่าง Requirement 3.5 (Iron Ore 45/20/25, Wood 15/5/10, Leather 8/3/5, Overall 28/68) และกรณี Nested/Priority/Gather ใน Data Model §7.4 (Fixture A ถึง D ใน Acceptance Criteria §2; AC-F5-01 ถึง AC-F5-12) |
| P2-14 | Gathering Service: โหลด input จาก Repositories (4 Statements ตาม Data Model §11.2), เรียก P2-13, cache ผล, recompute หลังทุก mutation (items, recipes, quests, inventory, tracking, สลับ Profile) แบบ debounce 16 ms แล้ว push `gathering:changed` ไปทุกหน้าต่าง; IPC `gathering:get` | `electron/gathering/service.ts`, `electron/ipc/handlers/gathering.ts` | P2-11, P2-12, P2-13 | M | `typecheck`, `manual` (ปรับ owned แล้ว Gathering List อัปเดตทันที) |
| P2-15 | Gathering List (`#/gathering`): `GatheringTable` ใช้ `MaterialRow` แบบ `gathering` (Thumbnail / Required / Owned / Missing / `ProgressBar`, `QuantityStepper` + ช่องพิมพ์ตัวเลข), `StepSelector` ตัวเลือกจาก `preferences.stepSizes` ค่าเริ่มต้น 1/5/10 (Requirement 3.6; F7-R4; ขั้นที่เลือกเป็นสถานะของหน้าจอ ไม่บันทึก; AC-F6-03), `TargetPicker` (เลือก quests/recipes ที่ติดตาม, จัดลำดับ priority, `target_qty` สำหรับ recipe) และ `TargetChip` บน Toolbar, `CraftPlanSection` ยุบได้, `OverallProgress` ใน Footer, ลำดับเริ่มต้น Items ที่ยังขาดก่อน (ตัวเลือก search/filter/sort/hide-complete อยู่ใน P4-07), สีสถานะ `StatusBadge` ตาม UI/UX Design Plan §8.2; store `gathering.ts` subscribe `gathering:changed` และ `inventory:changed` | `src/views/GatheringList.vue`, `src/components/GatheringTable.vue`, `src/components/TargetPicker.vue`, `src/components/TargetChip.vue`, `src/components/CraftPlanSection.vue`, `src/components/OverallProgress.vue`, `src/components/StepSelector.vue`, `src/components/ProgressBar.vue`, `src/components/StatusBadge.vue`, `src/stores/gathering.ts` | P2-14 | L | `lint`, `typecheck`, `build`, `manual` (AC-F5-01 ถึง AC-F5-12, AC-F6-01 ถึง AC-F6-09, AC-UX-04, AC-UX-05) |
| P2-16 | Consume Materials / Craft: IPC `inventory:consume({ questId, dryRun?, completeQuest? })` หัก `quest_requirement` ของ Quest (ไม่ขยาย Nested; Recipe ไม่มี Consume ตาม F8-R1) และ `inventory:craft({ recipeId, runs, dryRun?, reduceTarget? })` หัก ingredients × runs และบวก `output_qty × runs` ใน `db.transaction()` เดียว (Data Model §9; ตัวเลือก `completeQuest`/`reduceTarget` ตาม F8-R7, F8-R11); ปฏิเสธทั้งคำสั่งด้วย `INSUFFICIENT_MATERIALS` ถ้ามี owned ติดลบและคืนรายการที่ขาดใน `details.items`; `ConsumeMaterialsDialog` แสดงตาราง before → after (และ output ที่จะได้ในโหมด Craft) ใน Quest Tracker, Recipes และ Gathering List และอัปเดตตัวเลขจาก `inventory:changed` ขณะเปิด (F8-R4, F8-R5) | `electron/ipc/handlers/inventory.ts`, `electron/database/repositories/inventory.ts`, `src/components/ConsumeMaterialsDialog.vue` | P2-11, P2-14 | M | `typecheck`, `manual` (กรณีขาดต้องไม่มีการเขียนบางส่วน; AC-F9-01 ถึง AC-F9-06) |
| P2-17 | Per-target Allocated Progress และ Dashboard: `QuestCard` และ `TargetPicker` แสดง `allocation[target]` เทียบ requirements ด้วย `MaterialRow` แบบ `allocated` พร้อมป้าย "จัดสรร (allocated)" และคำอธิบายว่าไม่ใช่ Inventory ของ target; Game Dashboard แสดง `OverallProgress`, รายการ "ยังขาดมากที่สุด" 5 แถวแรก, `TargetSummaryList`, สถิติบน `ProfileCard` (Items/Targets/Progress จาก `profiles:list`) และ Quick Links ไปทุกหน้าจอ ตาม UI/UX Design Plan §3.1 | `src/views/QuestTracker.vue`, `src/components/TargetPicker.vue`, `src/views/GameDashboard.vue`, `src/components/TargetSummaryList.vue`, `electron/ipc/handlers/profiles.ts` | P2-14, P2-15 | M | `lint`, `typecheck`, `manual` (AC-F1-07, AC-F4-04, AC-F5-05) |
| P2-18 | Verification Pass + PR `feat/phase2-core-tracking` → `main`: Checklist หัวข้อ 10.1 และ 10.2 (Phase 2), บันทึกผลตัวอย่าง Requirement 3.5 และกรณี Nested ลง PR | ทั้งโปรเจกต์ | P2-17 | S | ทุกรายการ |

### 5.3 ลำดับที่แนะนำ

P2-01 → P2-02 → P2-03 และ P2-04 → P2-05 → P2-06 → P2-07 → P2-08 → P2-09 → P2-10 → P2-11 → P2-12 → P2-13 → P2-14 → P2-15 → P2-16 → P2-17 → P2-18

หาก Phase นี้ใหญ่เกินกว่าจะ review ใน PR เดียว ให้แยกเป็น PR 2a (P2-01 ถึง P2-10: Items, Recipes, Quests) และ PR 2b (P2-11 ถึง P2-18: Inventory, Aggregation, Gathering List, Consume/Craft) โดย PR 2a ต้อง merge ก่อน

### 5.4 Definition of Done ของ Phase 2

- Task P2-01 ถึง P2-18 เสร็จ; Checklist หัวข้อ 10 ผ่าน
- ตัวอย่าง Requirement 3.5 ให้ผล Iron Ore 45/20/25, Wood 15/5/10, Leather 8/3/5 และ Overall Progress 28/68; กรณี Nested Recipe ที่มี Owned Intermediate ให้ผลตรงกับตัวอย่างใน Data Model โดยไม่นับซ้ำ
- การสร้าง Recipe ที่เป็นวงจรถูกปฏิเสธพร้อม path; การลบ Item ที่ถูกใช้ถูกปฏิเสธพร้อมคำอธิบาย
- Consume/Craft ไม่เขียนบางส่วนเมื่อขาด Materials; การตั้ง Quest เป็น `completed` ไม่เปลี่ยน Inventory
- ทุกหน้าจอ `#/items`, `#/recipes`, `#/quests`, `#/gathering` และ `#/` ใช้งานได้จริง (ไม่มี placeholder)
- ผ่านเกณฑ์ใน [Acceptance Criteria](08-acceptance-criteria.md) หัวข้อ 19 แถว Phase 2 — Core Tracking: AC-F1-05 ถึง AC-F1-07, AC-F2-01 ถึง AC-F2-11 (ยกเว้นส่วน Overlay), AC-F3-01 ถึง AC-F3-08, AC-F4-01 ถึง AC-F4-07, AC-F5-01 ถึง AC-F5-12, AC-F6-01 ถึง AC-F6-09, AC-F9-01 ถึง AC-F9-06, AC-F10-06 ส่วนขนาดก้าว (ส่วนซ่อนรายการที่ครบแล้วตรวจใน Phase 4 ตาม P4-07), AC-F12-07, AC-UX-03 ถึง AC-UX-05, AC-TOOL-01 ถึง AC-TOOL-10 และบันทึกค่า AC-PERF-02 (หน้าต่างหลัก), AC-PERF-05

### 5.5 ความเสี่ยงที่ต้องเฝ้าระวัง

อ้างอิง [Risks & Limitations](07-risks-and-limitations.md): ความถูกต้องของ Aggregation (R-19: Double Counting, ลำดับ priority, surplus จาก `output_qty`), Clipboard API ของ Electron 44 (R-12: ต้องเขียนกับ API ใหม่เท่านั้น), Data Safety (R-14: ไฟล์ภาพกับแถว DB ต้องไม่หลุดจากกัน), Inventory Drift (R-18), Performance (R-06: recompute ทั้งชุดทุก mutation; ข้อมูลระดับหลายร้อยแถวยังรับได้ ต้องวัดใน Phase 5), ไม่มี Test อัตโนมัติ (R-28)

## 6. Phase 3 — Windows Overlay

### 6.1 วัตถุประสงค์

ทำ Requirement 3.7 ด้วย `BrowserWindow` แยก (transparent, frameless, always-on-top, skip taskbar) ที่โหลด `overlay.html`, มี View Mode (click-through) และ Interactive Mode, ปรับ Opacity/Compact/ตำแหน่ง/ขนาดได้และจำค่าไว้, Pin Items/Targets, Global Hotkeys และกินทรัพยากรต่ำ เป้าหมายคือเกม Borderless Windowed; Fullscreen Exclusive เป็นข้อจำกัดที่ต้องแจ้งผู้ใช้พร้อมวิธีแก้ (สลับเกมเป็น Borderless Windowed) ไม่ใช้ Injection

### 6.2 Task List

| ID | งาน | ไฟล์ / Module | ขึ้นกับ | ขนาด | ตรวจสอบ |
|---|---|---|---|---|---|
| P3-01 | Overlay Vite Entry: `overlay.html` ที่ root, `src/overlay/main.ts`, `src/overlay/OverlayPanel.vue` (Root); เพิ่ม input ที่สองใน `vite.config.mts` (`build.rolldownOptions.input` ของ Vite 8; ชื่อ option ต้องตรวจสอบกับเอกสาร Vite 8 ตอน implement); Dev URL = `${VITE_DEV_SERVER_URL}overlay.html`; ใช้ `src/index.css` และ `ItemThumbnail.vue` ร่วม; ใส่ CSP เหมือน P1-08 | `overlay.html`, `src/overlay/*`, `vite.config.mts` | P1-10 | S | `build` (มี `dist/overlay.html`), `manual` |
| P3-02 | Overlay Window Module: สร้างแบบ lazy เมื่อแสดงครั้งแรก; options `transparent: true`, `frame: false`, `alwaysOnTop: true`, `skipTaskbar: true`, `resizable: true`, `hasShadow: false`, webPreferences เดียวกับ Main Window; เรียก `setAlwaysOnTop(true, 'screen-saver')`; restore bounds จาก key `overlay`; toggle = hide/show (ไม่ destroy) | `electron/windows/overlay-window.ts` | P3-01, P1-09 | M | `typecheck`, `manual` (หน้าต่างโปร่ง ไม่มีขอบ ไม่ขึ้น Taskbar อยู่บนสุด) |
| P3-03 | (R-04) Overlay IPC และโหมด: `overlay:show`, `overlay:hide`, `overlay:toggle`, `overlay:setMode('view'/'interactive')`, `overlay:setOpacity`, `overlay:setCompact`, `overlay:resetLayout`, `overlay:getState`, `overlay:cycleScope({ direction })`, `overlay:focusMainWindow`, `overlay:setBounds({ x, y, width, height })` (Main บีบไม่ต่ำกว่า 220×160 และให้อยู่ในจอที่มีอยู่จริง), push `overlay:changed` (สถานะเดียวกับ `overlay:getState`); View = `setIgnoreMouseEvents(true, { forward: true })` และไม่รับโฟกัส; Interactive = `setIgnoreMouseEvents(false)`; Overlay แสดง badge โหมดปัจจุบัน; ปุ่ม Overlay ใน `AppTitleBar` เปิดใช้งาน; ซ่อน Overlay เมื่อไม่มี Active Profile (F1-R10) | `electron/ipc/handlers/overlay.ts`, `electron/windows/overlay-window.ts`, `electron/ipc/contracts.ts` | P3-02 | M | `typecheck`, `manual` (View คลิกทะลุไปเกม; Interactive กดปุ่มได้; AC-F7-02, AC-F7-03) |
| P3-04 | Overlay Persistence: บันทึก bounds (`moved`/`resized` debounce), opacity, mode, compact, visible ใน key `overlay`; ตอน restore ตรวจกับ `screen.getAllDisplays()` (จอถูกถอด) ไม่เช่นนั้นใช้ค่าเริ่มต้น | `electron/windows/overlay-window.ts`, `electron/settings/settings-service.ts` | P3-03 | S | `manual` (ปิดเปิดแอปแล้ว Overlay กลับที่เดิม) |
| P3-05 | Overlay UI: `OverlayPanel` (Root) + `OverlayHeader` ("MATERIAL TRACKER", `‹ ›` วน Scope, badge โหมด, drag region ใน Interactive Mode) + `OverlayRow` (Thumbnail, ชื่อ, `owned / required`, `Missing n`, ปุ่ม `-`/`+` ใช้ได้เฉพาะ Interactive) + `OverlayResizeGrip` (เรียก `overlay:setBounds`); Scope = ทั้งหมดหรือ Pinned Target ที่เลือก (สลับด้วย hotkey next/previous และ `overlay:cycleScope`), Pinned Items ขึ้นก่อน, บรรทัด Overall Progress, แบบ Full/Compact ตาม UI/UX Design Plan §4.2–4.3, ไม่มี animation/transition/timer ต่อเนื่อง (F9-R11), subscribe เฉพาะ `gathering:changed`, `inventory:changed` และ `overlay:changed`, เรียก `window.api.inventory.adjust` | `src/overlay/OverlayPanel.vue`, `src/overlay/components/OverlayHeader.vue`, `src/overlay/components/OverlayRow.vue`, `src/overlay/components/OverlayResizeGrip.vue` | P3-03, P2-15 | L | `lint`, `typecheck`, `build`, `manual` (AC-F7-07 ถึง AC-F7-10) |
| P3-06 | Pinning ใน Main Window: toggle pin ใน Item Library, Gathering List, Quest Tracker, Recipes (ใช้ `items:setPinned`, `tracking:setPinned`); Overlay แสดง Pinned Items ก่อน; พฤติกรรมเมื่อไม่มีอะไร pin ตาม Feature Specification | `src/views/*.vue`, `src/components/GatheringTable.vue`, `src/components/MaterialRow.vue` | P2-15, P3-05 | S | `manual` (AC-F2-11 ส่วน Overlay, AC-F7-08) |
| P3-07 | (R-05) Hotkeys Module: อ่าน key `hotkeys` (ค่าเริ่มต้น: Toggle overlay `CommandOrControl+Shift+O`, Toggle mode `CommandOrControl+Shift+M`, Start capture `CommandOrControl+Shift+X`, Import from clipboard `CommandOrControl+Shift+V`, Next/Previous pinned target `CommandOrControl+Shift+]` / `CommandOrControl+Shift+[`); `globalShortcut.register` ทีละ action และเก็บสถานะรายการที่คืน `false`; IPC อยู่ในกลุ่ม `settings` ตาม Feature Specification §12.7: `settings:get` คืนสถานะลงทะเบียนของแต่ละ Hotkey, `settings:setHotkey({ action, accelerator })` (unregister แล้ว register ใหม่; คืน `HOTKEY_CONFLICT` เมื่อซ้ำภายในแอป หรือ `HOTKEY_REGISTER_FAILED`), `settings:resetHotkeys({ action? })`, `settings:retryHotkeys()`; push `settings:changed`; `globalShortcut.unregisterAll()` บน `before-quit`; action ของ capture/clipboard ลงทะเบียนแต่ผูก handler ใน Phase 4 | `electron/hotkeys/hotkey-manager.ts`, `electron/ipc/handlers/settings.ts`, `electron/settings/defaults.ts` | P1-09, P3-03 | M | `typecheck`, `manual` (กด hotkey ขณะเกมโฟกัส; ตั้ง accelerator ที่ชนกับโปรแกรมอื่นแล้วเห็นสถานะล้มเหลว; AC-F10-01 ถึง AC-F10-04) |
| P3-08 | Settings (`#/settings`) โครง `SettingsNav`/`SettingsSection` (`?section=`) ส่วน Hotkeys (`HotkeyRecorder` ต่อ action, สถานะลงทะเบียนล้มเหลวพร้อมปุ่มตั้งใหม่, คืนค่าเริ่มต้น) และ Overlay (`OpacitySlider`, Compact toggle, โหมดเริ่มต้นเมื่อแสดง, แสดง Overlay เมื่อเปิดแอป, Reset layout ผ่าน `overlay:resetLayout`) ตาม UI/UX Design Plan §3.6 | `src/views/Settings.vue`, `src/components/SettingsNav.vue`, `src/components/SettingsSection.vue`, `src/components/HotkeyRecorder.vue`, `src/components/OpacitySlider.vue` | P3-04, P3-07 | M | `lint`, `typecheck`, `manual` (AC-F10-02, AC-F10-07) |
| P3-09 | (R-03, R-06, R-07) Topmost Resilience และ Low-resource: เรียก `setAlwaysOnTop(true, 'screen-saver')` ซ้ำตามช่วงเวลา (ค่าตาม Architecture Proposal) ขณะ Overlay แสดงอยู่และเมื่อ Main Window `blur`; หยุด interval เมื่อซ่อน; throttle push `gathering:changed` ไป Overlay; คง `backgroundThrottling` ค่าเริ่มต้น | `electron/windows/overlay-window.ts`, `electron/gathering/service.ts` | P3-02 | S | `manual` (เกมดึง topmost แล้ว Overlay กลับมาบนสุด) |
| P3-10 | Verification Pass + PR `feat/phase3-overlay` → `main`: ทดสอบกับเกม Borderless Windowed (Overlay เห็น, View คลิกทะลุ, Interactive กด `+`/`-` ได้, hotkeys ทำงาน), Fullscreen Exclusive (บันทึกเป็นข้อจำกัด), วัด RAM ของ Main + Overlay ด้วย Task Manager และบันทึกลง PR | ทั้งโปรเจกต์ | P3-09 | S | ทุกรายการ |

### 6.3 ลำดับที่แนะนำ

P3-01 → P3-02 → P3-03 → P3-04 → P3-07 → P3-05 → P3-06 → P3-08 → P3-09 → P3-10 (P3-07 ถูกยกขึ้นมาก่อน P3-05 เพื่อให้ Overlay UI ทดสอบด้วย hotkey ได้ และเพื่อปลดล็อก Phase 4)

### 6.4 Definition of Done ของ Phase 3

- Task P3-01 ถึง P3-10 เสร็จ; Checklist หัวข้อ 10 ผ่าน
- Overlay แสดงทับเกม Borderless Windowed; View Mode คลิกทะลุ; Interactive Mode ปรับ Owned ได้และตัวเลขใน Main Window เปลี่ยนตาม
- Opacity, Compact, ตำแหน่ง/ขนาด, โหมด และสถานะแสดง/ซ่อนถูกจำข้ามการเปิดแอป
- Hotkeys ทั้ง 6 action ลงทะเบียนและเปลี่ยนใน Settings ได้; กรณีชนกันแสดงใน Settings
- ผ่านเกณฑ์ใน [Acceptance Criteria](08-acceptance-criteria.md) หัวข้อ 19 แถว Phase 3 — Windows Overlay: AC-F2-07 และ AC-F2-11 (ส่วน Overlay), AC-F7-01 ถึง AC-F7-13, AC-F10-01 ถึง AC-F10-04, AC-F10-07, AC-TOOL-01 ถึง AC-TOOL-10 และบันทึกค่า AC-PERF-01, AC-PERF-02 (รวม Overlay), AC-PERF-04

### 6.5 ความเสี่ยงที่ต้องเฝ้าระวัง

อ้างอิง [Risks & Limitations](07-risks-and-limitations.md): Overlay vs Games (R-01: Fullscreen Exclusive, R-02: Anti-cheat/Anti-overlay, R-03: เกมดึง topmost คืน, R-04: Overlay แย่ง Focus/Input), Electron Memory/CPU/GPU (R-06, R-07: สอง Renderer และหน้าต่าง transparent; ต้อง lazy-create และไม่มี animation), Hotkeys (R-05: ชนกับ key binding ของเกมหรือโปรแกรมอื่น), Multi-monitor (R-11: Bounds ของ Overlay)

## 7. Phase 4 — Capture & Productivity

### 7.1 วัตถุประสงค์

ทำ Requirement 3.8: hotkey → screenshot ของ display ใต้ cursor ด้วย `desktopCapturer` → Capture window แบบ frameless fullscreen แสดง screenshot → ลากเลือกบริเวณ → `nativeImage.crop` → บันทึก PNG + Thumbnail → dialog ตั้งชื่อ Item หรือผูกกับ Item เดิม; Fallback เมื่อ frame ดำหรือถูกปฏิเสธ = Win+Shift+S แล้ว Import จาก Clipboard; Quick Item Creation; และปรับ Gathering List ตาม Requirement 4 (filter, sort, hide complete, step sizes)

### 7.2 Task List

| ID | งาน | ไฟล์ / Module | ขึ้นกับ | ขนาด | ตรวจสอบ |
|---|---|---|---|---|---|
| P4-01 | Capture Vite Entry: `capture.html`, `src/capture/main.ts`, `src/capture/CaptureSelection.vue` (Root: ภาพพื้นหลัง, Crosshair, กรอบเลือก, Handle, Readout ขนาด, Hint, Esc ยกเลิก, Enter หรือปล่อยเมาส์ยืนยัน ตาม UI/UX Design Plan §5.1); เพิ่ม input ใน `vite.config.mts`; CSP | `capture.html`, `src/capture/*`, `vite.config.mts` | P1-10, P3-01 | S | `build` (มี `dist/capture.html`) |
| P4-02 | (R-08, R-09, R-10, R-11) Capture Service: หา display ใต้ cursor (`screen.getCursorScreenPoint()` → `screen.getDisplayNearestPoint()`), `desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: bounds.width × scaleFactor, height: bounds.height × scaleFactor } })`, เลือก source ที่ `display_id` ตรงกับ display, คืน `NativeImage`; ตรวจ frame ดำ (sample pixel) เพื่อเข้าสู่ fallback; `session.setPermissionRequestHandler` อนุญาต `display-capture` เฉพาะหน้าต่างของแอป | `electron/capture/screen-capture.ts`, `electron/main.ts` | P3-07, P2-02 | M | `typecheck`, `manual` (จอ 125%/150% ภาพไม่เบลอ; สองจอได้จอที่ถูกต้อง) |
| P4-03 | Capture window: frameless fullscreen บน bounds ของ display นั้น (`alwaysOnTop`, `skipTaskbar`), โหลด `capture.html`, ส่ง screenshot ให้ Renderer ของ Capture window นั้นเท่านั้นผ่าน Event `capture:frame` (`{ frameUrl, displayBounds, imageWidth, imageHeight }` ไม่ Broadcast; ตาม Architecture Proposal 5.3), destroy หลังใช้; Phase นี้รองรับเฉพาะ display ใต้ cursor | `electron/windows/capture-window.ts`, `electron/ipc/handlers/capture.ts` | P4-01, P4-02 | M | `typecheck`, `manual` |
| P4-04 | Region → Crop → Dialog: Capture window ส่ง `capture:commitSelection({ rect })` หน่วย CSS pixel (ขนาดต่ำสุดตามค่าเสนอ F10-R4) → Main คูณ `scaleFactor` → `nativeImage.crop()` → `toPNG()` → Pending image (`source: 'capture'`) → push `capture:changed` (`phase: 'captured'` พร้อม Preview) → นำ Main Window ขึ้นและเปิด `CaptureItemDialog` (Preview, ช่องชื่อ Autocomplete ค้นหา Item เดิม, category เมื่อสร้างใหม่, `save` / `save-and-continue` / `cancel`): สร้าง Item ใหม่ผ่าน `items:create({ pendingImageId })` หรือผูกกับ Item เดิมผ่าน `items:attachImage` → `items:changed`; IPC `capture:start`, `capture:cancel`, `capture:listPending` (เมื่อ Main Window เพิ่งโหลด) | `electron/ipc/handlers/capture.ts`, `electron/capture/screen-capture.ts`, `src/components/CaptureItemDialog.vue` | P4-03, P2-05 | M | `manual` (ภาพแสดงใน Recipes, Quests, Overlay ทันที; AC-F8-02, AC-F8-03, AC-F8-04, AC-F8-10) |
| P4-05 | (R-08, R-12) Clipboard Fallback Flow: hotkey `CommandOrControl+Shift+V` → `capture:fromClipboard` (P2-04) → `CaptureItemDialog` เดียวกับ P4-04 (`source: 'clipboard'`); เมื่อ capture ได้ frame ดำ (เกณฑ์ตรวจภาพดำต้องตรวจสอบกับภาพจริงจากเกมตาม Feature Specification F10-R10) หรือถูกปฏิเสธ push `capture:changed` (`phase: 'failed'`) และแสดงข้อความแนะนำให้กด Win+Shift+S แล้วใช้ hotkey หรือปุ่ม "Paste from clipboard" (ข้อความตาม UI/UX Design Plan §5.4); "Import image file" มีให้เสมอ; ปุ่ม Capture ใน `AppTitleBar` และ `ItemEditDialog` เปิดใช้งาน | `electron/hotkeys/hotkey-manager.ts`, `electron/capture/screen-capture.ts`, `src/components/CaptureItemDialog.vue` | P4-04, P2-04 | S | `manual` (Snipping Tool → hotkey → Item มีภาพ; AC-F8-07, AC-F8-08, AC-F8-09) |
| P4-06 | Quick Item Creation: `ItemPicker` เปิด `allowCreate` ใน Recipes/Quests (สร้าง Item ใหม่จากช่องค้นหาเดียวกันโดยไม่ออกจากฟอร์ม ชื่อ + category ค่าเริ่มต้น `material`, Owned 0), ปุ่ม "เพิ่ม Item เร็ว" ใน Gathering List (AC-F8-11; การมีปุ่มนี้บน Overlay ต้องตรวจสอบกับ UI/UX Design Plan) และ `save-and-continue` ใน `CaptureItemDialog` เพื่อ capture ต่อเนื่อง | `src/components/ItemPicker.vue`, `src/views/GatheringList.vue`, `src/components/CaptureItemDialog.vue` | P4-04, P2-05 | S | `manual` (AC-F8-11) |
| P4-07 | Gathering List Improvements: `SearchField` และ `CategoryFilter` ใน Gathering List, ตัวเลือก sort (ขาดก่อนเป็นค่าเริ่มต้น, ชื่อ, หมวดหมู่ ตาม `preferences.sort` ใน Data Model §3.12; ตัวเลือก Required ต้องตรวจสอบก่อนเพิ่มตาม F6-R10), toggle "ซ่อน Items ที่ครบแล้ว" พร้อมแถวสรุป "ครบแล้ว N", ใช้ keyboard ได้ (ลูกศร, `+`/`-` ตาม UI/UX Design Plan §9.2); ค่าที่จำไว้เก็บใน key `preferences` (`sort`, `hideComplete`); Step sizes 1/5/10 ทำแล้วใน P2-15 | `src/views/GatheringList.vue`, `src/components/GatheringTable.vue`, `src/stores/gathering.ts`, `electron/settings/defaults.ts` | P2-15, P1-09 | M | `lint`, `typecheck`, `manual` (AC-F5-13, AC-F5-14, AC-F10-06 ส่วนการจัดเรียง) |
| P4-08 | Verification Pass + PR `feat/phase4-capture` → `main`: ทดสอบบน DPI 100/125/150 และสองจอ, capture จากเกม Borderless, Fullscreen Exclusive ได้ frame ดำแล้วเข้า fallback, import จาก Snipping Tool | ทั้งโปรเจกต์ | P4-07 | S | ทุกรายการ |

### 7.3 ลำดับที่แนะนำ

P4-01 → P4-02 → P4-03 → P4-04 → P4-05 → P4-06 → P4-07 → P4-08

### 7.4 Definition of Done ของ Phase 4

- Task P4-01 ถึง P4-08 เสร็จ; Checklist หัวข้อ 10 ผ่าน
- Workflow 7 ขั้นตอนใน Requirement 3.8 ทำได้จริงจากเกม Borderless Windowed; ภาพที่ crop บน High-DPI ตรงกับบริเวณที่เลือก
- เมื่อ capture ล้มเหลว ผู้ใช้ได้รับคำแนะนำและใช้ Clipboard หรือไฟล์แทนได้
- Gathering List มี search/filter/sort/hide-complete และจำค่าไว้
- ผ่านเกณฑ์ใน [Acceptance Criteria](08-acceptance-criteria.md) หัวข้อ 19 แถว Phase 4 — Capture & Productivity: AC-F5-13, AC-F5-14, AC-F8-01 ถึง AC-F8-11, AC-F10-06 ส่วนการจัดเรียง (ส่วนธีมขึ้นกับการตัดสินใจเรื่อง Light Theme ซึ่ง UI/UX Design Plan §8.1 วางไว้หลัง Phase 5 — ต้องตรวจสอบ), AC-TOOL-01 ถึง AC-TOOL-10 และบันทึกค่า AC-PERF-06

### 7.5 ความเสี่ยงที่ต้องเฝ้าระวัง

อ้างอิง [Risks & Limitations](07-risks-and-limitations.md): Capture (R-08: frame ดำสำหรับ Protected Content/Fullscreen Exclusive, R-09: Permission `display-capture`, R-10: `thumbnailSize` ต้องคูณ `scaleFactor`, R-11: Multi-monitor), Clipboard API ของ Electron 44 (R-12), Electron Memory (R-06: Capture window ต้อง destroy หลังใช้)

## 8. Phase 5 — Optimization & Distribution

### 8.1 วัตถุประสงค์

ทำให้แอปพร้อมแจกจ่าย: วัดและลดการใช้ทรัพยากร, Backup/Restore/Export/Import ที่มี `schemaVersion`, Packaging ที่มี Icon ถูกต้องและ asar เล็กลง, ตัดสินใจเรื่อง Code Signing, ออกแบบ Update Mechanism บน GitHub Releases (ไม่บังคับเปิดใช้ Auto-update), ตรวจความเข้ากันได้บน Windows 10/11 + High-DPI + Multi-monitor และ Release Checklist

### 8.2 Task List

| ID | งาน | ไฟล์ / Module | ขึ้นกับ | ขนาด | ตรวจสอบ |
|---|---|---|---|---|---|
| P5-01 | (R-06, R-07) Performance Pass: วัด RAM/CPU ตอน idle และขณะปรับ Inventory ของ Main + Overlay (Task Manager และ `process.getProcessMemoryInfo()`), เวลา start; ตรวจ query ของ Gathering Service ด้วย `EXPLAIN QUERY PLAN` ว่าใช้ Indexes; ยืนยัน lazy-create ของ Overlay/Capture windows, throttle push, ไม่มี animation ใน Overlay; บันทึกตัวเลขใน Risks & Limitations | `electron/**`, `src/**`, `docs/07-risks-and-limitations.md` | Phase 1 ถึง 4 | M | `manual` (ตัวเลขก่อน/หลัง), `build` |
| P5-02 | (R-16, R-17) Backup/Export: เพิ่ม `fflate` (เวอร์ชันต้องตรวจสอบตอนติดตั้ง) ใน `dependencies`; `backup:pickPath({ mode })` เปิด `dialog.showSaveDialog`/`showOpenDialog`; `backup:export(path)` = `wal_checkpoint(PASSIVE)` → `db.backup()` ไปโฟลเดอร์ชั่วคราว → ZIP ของ `data\` (SQLite สำเนา + `images\`; ไม่รวม `-wal`/`-shm`) + `manifest.json` (`format`, `appVersion`, `schemaVersion` = `user_version`, `exportedAt`) ตาม Data Model §6.1–6.2 ชื่อไฟล์เริ่มต้นตามค่าเสนอ F11-R10 | `electron/backup/backup-service.ts`, `electron/ipc/handlers/backup.ts`, `package.json` | P1-03, P2-02 | M | `typecheck`, `manual` (เปิด ZIP แล้วมี manifest และไฟล์ครบ; AC-F11-01) |
| P5-03 | (R-16) Import/Restore: `backup:inspect(path)` อ่าน `manifest.json` และสรุปเนื้อหาโดยไม่เขียน; `backup:restore(path)` = ตรวจ `format` และ `schemaVersion` ไม่สูงกว่าปัจจุบัน → แตกไฟล์ไป `<userData>\restore-tmp-<timestamp>\` → เปิด DB ใน temp ด้วย Connection แยก: `PRAGMA integrity_check`, `user_version` ตรง manifest, `foreign_key_check` ว่าง, รัน migrations ถึง `latest` → ปิด DB ปัจจุบัน → ย้าย `data\` เดิมไป `<userData>\backups\pre-restore-<timestamp>\` (เก็บ 1 ชุดล่าสุด) แล้วย้าย temp เข้าที่ → Relaunch แอป (Data Model §5.1, §6.3–6.4); ต่อทางเลือก "กู้คืนจาก Backup" ของ Dialog ไฟล์เสียหายใน P1-02; รัน Orphan Cleanup กับชุดที่แตกออกมาก่อนสลับ (Data Model §5.4, F11-R14) | `electron/backup/backup-service.ts`, `electron/ipc/handlers/backup.ts`, `electron/database/index.ts` | P5-02 | L | `typecheck`, `manual` (Export จากเครื่อง A → Import เครื่อง B ได้ข้อมูลและภาพครบ; manifest ผิดถูกปฏิเสธโดยข้อมูลเดิมไม่เสีย; AC-F11-02 ถึง AC-F11-07) |
| P5-04 | Settings Section Backup & Data (`BackupPanel`: Path `<userData>\data` + ปุ่มเปิดโฟลเดอร์ผ่าน `app:openDataFolder`, Export, Import/Restore พร้อมสรุปจาก `backup:inspect` ก่อนยืนยัน) และ About (`app:getInfo`: เวอร์ชันแอป, Electron/Chromium/Node, `schemaVersion`, ลิงก์จาก README, สถานะ update) ตาม UI/UX Design Plan §3.6 และปุ่ม "ล้างไฟล์ภาพที่ไม่ถูกใช้" (Orphan Cleanup ด้วยมือ ตาม Data Model §5.4; ตัดสินใจเพิ่มใน Phase 5 เพื่อปิดประเด็นใน Feature Specification 14.3) | `src/views/Settings.vue`, `src/components/BackupPanel.vue`, `src/components/AboutSection.vue`, `electron/ipc/handlers/app.ts` | P5-02, P5-03 | M | `lint`, `typecheck`, `manual` (AC-F10-08) |
| P5-05 | (R-13, R-23) Packaging Polish: ใส่ไอคอน `.ico` ขนาดอย่างน้อย 256×256 (หลายขนาด 16 ถึง 256) ที่เจ้าของโปรเจกต์จัดหา และตั้ง `win.icon`; ตั้ง `files` globs ให้ตัด `node_modules/better-sqlite3/deps`, `src` และ `prebuilds` ที่ไม่ใช่ `win32-x64` ออก (ตรวจว่า asar unpack ยังทำงาน); ยืนยัน `npmRebuild: false`; ลบ `@font-face` ใน `src/fonts.css` และไฟล์ใน `public/fonts/` ของตระกูลที่ไม่ใช้ตามการตัดสินใจข้อ 6 ในหัวข้อ 11 (ตามข้อเสนอ UI/UX Design Plan §8.3 คือตัด Mulish และ Poppins 16 กฎ/16 ไฟล์ และ 24 ไฟล์ Open Sans ที่ไม่ถูกอ้างอิงตาม Repository Audit Report 7.7); ทบทวน `nsis` options (คง `deleteAppDataOnUninstall: false`); บันทึกขนาด installer ก่อน/หลัง | `electron-builder.json5`, `build/icon.ico` (หรือ path ที่ตกลง), `src/fonts.css`, `public/fonts/` | P1-01 | M | `package` (ไม่มี warning "default Electron icon is used"; exe เปิด DB ได้), `manual` |
| P5-06 | (R-24) Code Signing Decision + เอกสาร SmartScreen: ทางเลือก (a) ไม่ sign และอธิบายขั้นตอน "More info → Run anyway" ใน README/Release notes, (b) OV/EV Certificate, (c) Azure Trusted Signing; ค่าใช้จ่ายและเงื่อนไขของแต่ละทางต้องตรวจสอบ; ถ้า sign ให้ตั้งค่าใน `electron-builder.json5` (ชื่อ option ของ electron-builder 26 ต้องตรวจสอบกับเอกสารทางการ) | `electron-builder.json5`, `README.md` | การตัดสินใจของเจ้าของโปรเจกต์ | S (ตัดสินใจ) / M (implement) | `package`, `manual` (ติดตั้งบนเครื่องสะอาดแล้วบันทึกพฤติกรรม SmartScreen) |
| P5-07 | (R-25, R-26) Update Mechanism: เพิ่มส่วนออกแบบใน Architecture Proposal และ implement `electron-updater` (เวอร์ชันต้องตรวจสอบ) กับ `publish: { provider: 'github', owner, repo }` (repo ตาม README คือ `dvgamerr-app/looter-app`; ต้องตรวจสอบสิทธิ์); `latest.yml` + blockmap มาจาก electron-builder อยู่แล้ว; ในแอปมีปุ่ม "Check for updates" แบบ manual เท่านั้นในรุ่นแรก; GitHub Actions `.github/workflows/release.yml` ทำงานเมื่อ tag `v*`: `bun install --frozen-lockfile` → `bun run build` → อัปโหลดไป GitHub Release (draft) ต้องมี permission `contents: write` (ต้องตรวจสอบ); พฤติกรรมของ electron-updater กับ installer ที่ไม่ได้ sign ต้องตรวจสอบก่อนเปิดใช้ | `electron/updater/index.ts`, `electron-builder.json5`, `.github/workflows/release.yml`, `src/components/AboutSection.vue` | P5-05, P5-06 | L | `package`, `manual` (workflow รันบน tag ทดสอบแล้วได้ Setup.exe, `latest.yml`, blockmap บน Release) |
| P5-08 | (R-10, R-11) Compatibility Verification Matrix: Windows 10 22H2 x64 และ Windows 11 x64 (เครื่องหรือ VM ต้องตรวจสอบความพร้อม) × DPI 100/125/150/200% × จอเดียว/สองจอที่ DPI ต่างกัน × เกม Borderless/Fullscreen Exclusive; ติดตั้ง → ใช้งาน → ถอนการติดตั้ง (ข้อมูลใน `%APPDATA%` ต้องยังอยู่) → ติดตั้งทับเวอร์ชันเก่า (ข้อมูลอยู่และ migrations รัน); ถ้ายังมี Migration เดียว ให้ทดสอบ AC-F12-03 และ AC-F12-04 ด้วย Migration ทดสอบในสาขาแยกตามที่ Acceptance Criteria ระบุ และบันทึกวิธีที่ใช้ | ตาราง matrix ใน PR และ Acceptance Criteria | P5-05 | M | `manual` (AC-PKG-02 ถึง AC-PKG-11, AC-F12-03, AC-F12-04) |
| P5-09 | Release Checklist และ Release แรก: กำหนดเลขเวอร์ชัน (ปัจจุบัน `1.0.0` ใน `package.json`; เลขที่จะใช้ต้องตัดสินใจ), `bun audit` ต้องไม่มี advisory ที่ ship ใน runtime, Release notes บน GitHub Releases (README ชี้ Changelog ไปที่นั่น) พร้อมหมายเหตุ SmartScreen, tag `v<version>`, รัน workflow, ตรวจไฟล์บน Release | `package.json`, GitHub Release | P5-07, P5-08 | S | หัวข้อ 10.3 |
| P5-10 | PR `feat/phase5-distribution` → `main` | PR | P5-09 | S | หัวข้อ 9.2 |

### 8.3 ลำดับที่แนะนำ

P5-01 → P5-02 → P5-03 → P5-04 → P5-05 → P5-06 → P5-07 → P5-08 → P5-09 → P5-10 (P5-06 เป็นการตัดสินใจที่ควรได้คำตอบตั้งแต่ต้น Phase เพราะกระทบ P5-07)

### 8.4 Definition of Done ของ Phase 5

- Task P5-01 ถึง P5-10 เสร็จ; Checklist หัวข้อ 10.1 และ 10.3 ผ่าน
- Export → Import บนเครื่องอื่นได้ข้อมูลและภาพครบ; Import ที่ manifest ไม่ถูกต้องไม่ทำให้ข้อมูลเดิมเสีย
- Installer ใช้ไอคอนของแอป ขนาดเล็กลงจากการตัด prebuilds อื่น และเปิด DB ได้บน Windows 10 และ 11
- การตัดสินใจเรื่อง Signing ถูกบันทึก และ SmartScreen มีคำอธิบายให้ผู้ใช้
- Release workflow ผลิตไฟล์ครบบน GitHub Releases; ผลตรวจ Compatibility Matrix บันทึกครบ
- ผ่านเกณฑ์ใน [Acceptance Criteria](08-acceptance-criteria.md) หัวข้อ 19 แถว Phase 5 — Optimization & Distribution: AC-F10-08, AC-F11-01 ถึง AC-F11-07, AC-F12-03, AC-F12-04, AC-PKG-02 ถึง AC-PKG-08, AC-PKG-10, AC-PKG-11, AC-TOOL-01 ถึง AC-TOOL-10 และ Regression ของเกณฑ์ทุก Phase บน Windows 10 และ Windows 11; ยืนยันค่าสุดท้ายของ AC-PERF-01 ถึง AC-PERF-06 ก่อน Release

### 8.5 ความเสี่ยงที่ต้องเฝ้าระวัง

อ้างอิง [Risks & Limitations](07-risks-and-limitations.md): Packaging/Distribution (R-23: ไอคอน, R-24: ไม่มี Certificate, ขนาด installer, R-25: สิทธิ์ repo สำหรับ workflow, R-26: Auto-update), Data Safety (R-16: Import ต้อง atomic และมี backup; R-17: ความเป็นส่วนตัวของไฟล์ Export), Audit (R-22: ตรวจซ้ำก่อน release), Electron Memory/CPU/GPU (R-06, R-07: ตัวเลขจริงหลังมีทุก Feature)

## 9. Milestones และแผน PR

### 9.1 Milestones

| Milestone | เนื้อหา | Branch → target | เงื่อนไข |
|---|---|---|---|
| M0 | Commit เอกสารแผนงานและ README/CLAUDE.md ที่ค้าง (P1-00) | อยู่ใน `feat/phase1-foundation` | ไม่มี PR แยก; เป็น commit แรกของ Part B |
| M1 | Phase 1 PR หลัง Part B เสร็จ (P1-16) | `feat/phase1-foundation` → `main` | DoD หัวข้อ 4.5 |
| M2 | Phase 2 PR (หรือ 2a + 2b) | `feat/phase2-core-tracking` → `main` | DoD หัวข้อ 5.4 |
| M3 | Phase 3 PR | `feat/phase3-overlay` → `main` | DoD หัวข้อ 6.4 |
| M4 | Phase 4 PR | `feat/phase4-capture` → `main` | DoD หัวข้อ 7.4 |
| M5 | Phase 5 PR และ Release แรกบน GitHub Releases | `feat/phase5-distribution` → `main` แล้ว tag `v<version>` | DoD หัวข้อ 8.4 และหัวข้อ 10.3 |

อย่างน้อยหนึ่ง PR ต่อ Phase; Phase 2 แยกเป็นสอง PR ได้ตามหัวข้อ 5.3; ห้ามพัฒนา Feature บน `main` โดยตรงตาม Requirement 10 ข้อ 2; ทุก branch ใหม่แตกจาก `main` หลัง PR ก่อนหน้า merge แล้ว

### 9.2 กติกาของ PR

- Commit messages ภาษาอังกฤษ รูปแบบ `<type>: <summary>` (`feat`, `fix`, `chore`, `refactor`, `docs`, `build`) และ body อธิบายเหตุผลเมื่อจำเป็น; ไม่มี attribution footer
- PR description ภาษาไทย (ศัพท์เทคนิคภาษาอังกฤษ) ประกอบด้วย: สรุป, การเปลี่ยนแปลงหลัก (อ้าง Task ID), ผลการตรวจสอบ (คำสั่งที่รันและผล รวมทั้งระบุเครื่องที่รัน `typecheck:renderer`), ผล manual check ตาม Acceptance Criteria, สิ่งที่ยังไม่ทำหรือเลื่อนไป Phase ถัดไป, ความเสี่ยงที่พบใหม่; ไม่มี attribution footer
- ก่อนเปิด PR: rebase บน `main`, ลบ `dist/`, `dist-electron/`, `release/` ที่ค้าง, Checklist หัวข้อ 10.1 ผ่านทุกข้อ, `bun.lock` ตรงกับ `package.json`
- Reviewer ตรวจอย่างน้อย: ขอบเขต Renderer/Main/Preload, Transactions ครบ, ชื่อตาราง/Channel ตรงเอกสาร, ไม่มี Test Scripts ที่ไม่ได้ขอ, เอกสารใน `docs/` อัปเดตเมื่อการตัดสินใจเปลี่ยน

## 10. Verification Checklist และ Release Prerequisites

### 10.1 คำสั่งที่ต้องรันก่อนปิดทุก Task และก่อนเปิดทุก PR

```sh
bun install --frozen-lockfile
bun run lint
bun run typecheck        # ส่วน renderer ต้องมี Node.js 24 LTS บน PATH
bun x vite build
bun run build
bun audit
git diff --check
```

Runtime smoke หลัง `bun x vite build`:

```sh
bun x electron . --enable-logging
```

ตรวจว่า Main Process start, หน้าต่างเปิด, ไม่มี Electron security warning (CSP) และไม่มี error ใน console; ถ้า entry point เปลี่ยน ให้ลบ `dist-electron/` ก่อน build เพื่อไม่ให้ไฟล์เก่าซ่อนปัญหา

### 10.2 การตรวจเพิ่มเติมรายละเอียดต่อ Phase

| Phase | การตรวจเพิ่มเติม (manual) |
|---|---|
| Phase 1 | userData ว่าง → สร้าง `data\gamelooter.sqlite` ที่ `user_version = 1`; Game Profile create/rename/delete/switch; ชื่อซ้ำถูกปฏิเสธ; bounds ของ Main Window ถูกจำ; `window.ipcRenderer` ไม่มี; Setup.exe ติดตั้งแล้วทำงานเหมือน dev |
| Phase 2 | ตัวอย่าง Requirement 3.5 (45/20/25, 15/5/10, 8/3/5, Overall 28/68); กรณี Nested ใน Data Model; วงจร Recipe ถูกปฏิเสธ; ลบ Item ที่ถูกใช้ถูกปฏิเสธพร้อมคำอธิบาย; Consume/Craft ไม่เขียนบางส่วน; Import ภาพจากไฟล์และ Clipboard; ขนาดก้าว +1/+5/+10 ใช้ได้ (ชุด `stepSizes` จำค่า); สลับ Profile แล้วข้อมูลไม่ปน |
| Phase 3 | เกม Borderless Windowed: Overlay เห็น, View คลิกทะลุ, Interactive ปรับ Owned ได้; Persistence ของ Overlay; Hotkeys 6 action; กรณี accelerator ชนกันแสดงใน Settings; RAM ของ Main + Overlay บันทึกไว้ |
| Phase 4 | Capture บน DPI 100/125/150 และสองจอ; ภาพ crop ตรงบริเวณที่เลือก; Fullscreen Exclusive → frame ดำ → fallback; Snipping Tool → hotkey → Item มีภาพ; Gathering List search/filter/sort/hide-complete จำค่า |
| Phase 5 | Export/Import ข้ามเครื่อง; manifest ผิดถูกปฏิเสธ; Installer มีไอคอน; ติดตั้งทับเวอร์ชันเก่าแล้วข้อมูลอยู่; Compatibility Matrix หัวข้อ 8.2 (P5-08); Release workflow ผลิตไฟล์ครบ |

### 10.3 Release Prerequisites ของ Phase 5

- ไอคอน `.ico` ขนาดอย่างน้อย 256×256 (หลายขนาด) อยู่ใน repo และตั้ง `win.icon` แล้ว; `bun run build` ไม่มี warning เรื่องไอคอน
- การตัดสินใจเรื่อง Code Signing ถูกบันทึก; ถ้าไม่ sign ต้องมีคำอธิบาย SmartScreen ใน README และ Release notes
- GitHub Releases workflow (`.github/workflows/release.yml`) รันสำเร็จบน tag ทดสอบ และสิทธิ์ของ repo (`contents: write`) ได้รับการยืนยัน
- ผล Windows 10/11 test matrix (x64, DPI 100/125/150/200%, จอเดียว/สองจอ, Borderless/Fullscreen Exclusive, ติดตั้ง/ถอน/ติดตั้งทับ) บันทึกครบและไม่มี blocker
- `bun audit` ไม่มี advisory ที่ ship ใน runtime (advisories build-time ที่เหลือระบุไว้ใน Release notes หรือ Risks & Limitations)
- `npmRebuild: false` คงอยู่ และ exe ที่ package เปิด DB ได้บนเครื่องสะอาด
- เอกสารใน `docs/`, `README.md`, `CLAUDE.md` ตรงกับเวอร์ชันที่จะ release; เลขเวอร์ชันใน `package.json` และ tag ตรงกัน

## 11. Prerequisites และการตัดสินใจที่ยังต้องการจากเจ้าของโปรเจกต์

| ลำดับ | เรื่อง | ต้องการ | กระทบ |
|---|---|---|---|
| 1 | คำสั่งเริ่ม Phase 1 Part B | ยืนยันให้เริ่ม implement ตามหัวข้อ 4.3 | ทุก Task ตั้งแต่ P1-01 |
| 2 | Node.js 24 LTS บนเครื่องพัฒนา (R-20) | ติดตั้ง Node.js 24 LTS เพื่อให้ `bun run typecheck` รันส่วน Renderer ได้ หรือยอมรับให้ `typecheck:renderer` รันเฉพาะบนเครื่องหรือ CI ที่มี Node.js และระบุใน PR ทุกครั้ง | P1-15 และทุก Verification Pass |
| 3 | Icon Asset (R-23) | ไฟล์ `.ico` ขนาดอย่างน้อย 256×256 (รวมขนาด 16, 32, 48, 64, 128, 256) หรือ PNG ต้นฉบับขนาดใหญ่ให้แปลง; `public/looter.ico` ปัจจุบัน 128×128 ใช้กับ `win.icon` ไม่ได้ | P5-05, Release |
| 4 | Code Signing (R-24) | เลือกทาง (a) ไม่ sign + เอกสาร SmartScreen, (b) OV/EV Certificate, (c) Azure Trusted Signing; ค่าใช้จ่ายและเงื่อนไขต้องตรวจสอบ | P5-06, P5-07 (พฤติกรรม electron-updater กับ installer ที่ไม่ได้ sign ต้องตรวจสอบ) |
| 5 | Hotkey Defaults | อนุมัติค่าเริ่มต้น: Toggle overlay `CommandOrControl+Shift+O`, Toggle mode `CommandOrControl+Shift+M`, Start capture `CommandOrControl+Shift+X`, Import from clipboard `CommandOrControl+Shift+V`, Next/Previous pinned target `CommandOrControl+Shift+]` / `CommandOrControl+Shift+[` | P1-09 (defaults), P3-07 |
| 6 | Font Choice | `src/fonts.css` ประกาศ 54 `@font-face` จาก 4 ตระกูล (Open Sans 24, Roboto 14, Mulish 10, Poppins 6) และ `public/fonts/` มี 78 ไฟล์ woff2 (24 ไฟล์ Open Sans ไม่ถูกอ้างอิง) แต่ไม่มี `font-family` ถูกใช้; ข้อเสนอใน UI/UX Design Plan §8.3 คือ Open Sans เป็น UI Font (`--font-sans`) และ Roboto สำหรับตัวเลข (`--font-numeric` กับ `tabular-nums`; ต้องตรวจสอบว่าไฟล์ Subset คง Feature `tnum`) แล้วตัด Mulish/Poppins; ทางเลือกอื่นตาม Repository Audit Report 7.7 คือ System Font Stack (Segoe UI) และลบฟอนต์ทั้งหมด; ต้องเลือกก่อน P1-10 | P1-10, P5-05 |
| 7 | GitHub Repository และสิทธิ์ (R-25) | ยืนยัน repo ที่ใช้ release (README ชี้ไป `dvgamerr-app/looter-app`; ต้องตรวจสอบ) และสิทธิ์สร้าง Release/Workflow | P5-07 |
| 8 | เครื่องทดสอบ Windows 10 | ความพร้อมของเครื่องหรือ VM Windows 10 22H2 x64 สำหรับ Compatibility Matrix (ต้องตรวจสอบ) | P5-08 |
| 9 | การแยก PR ของ Phase 2 | เลือก PR เดียวหรือแยก 2a/2b ตามหัวข้อ 5.3 | M2 |
| 10 | เลขเวอร์ชัน Release แรก | `package.json` ปัจจุบันคือ `1.0.0` ต้องตัดสินใจว่าจะใช้เลขนี้หรือเริ่มจากเลขอื่น | P5-09 |
| 11 | ภาษาของข้อความ UI | ไทย อังกฤษ หรือสองภาษา; ฟอนต์ที่ Bundle อยู่ไม่มี Subset ภาษาไทย ข้อความไทยจะตกไปที่ `Leelawadee UI` ของ Windows ตาม UI/UX Design Plan §8.3 ถ้าต้องการฟอนต์ไทยเฉพาะต้องเพิ่ม Bundle; มีผลต่อป้ายใน Component ทั้งหมดตั้งแต่ P1-10 | P1-10, P1-11 |

การเปลี่ยนแปลงแผนนี้ (เพิ่ม/ตัด Task, ย้าย Phase, เปลี่ยนการตัดสินใจ) ให้แก้ไขในเอกสารนี้พร้อมอัปเดตวันที่ และแก้เอกสารที่เกี่ยวข้อง (Feature Specification, Acceptance Criteria, Risks & Limitations) ให้สอดคล้องกันใน commit `docs:` เดียวกัน
