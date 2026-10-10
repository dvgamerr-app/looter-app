# เอกสารแผนงาน GameLooter

เอกสารชุดนี้เป็นผลจากการตรวจสอบ Repository และการวางแผนก่อนเริ่มพัฒนา Universal RPG Item & Quest Tracker พร้อม Windows Overlay อัปเดตล่าสุด 2026-10-10 Phase 1 (Foundation) เขียนครบแล้วใน branch `feat/phase1-foundation` เหลือการตรวจด้วยมือบนหน้าต่างจริง (ดูหัวข้อด้านล่าง) Phase 2 ถึง 5 เขียนครบแล้วบน branch เดียวกัน (2026-10-10) เหลือการตรวจด้วยมือบนหน้าต่างจริง, ผลทดสอบ Windows 10/11 + DPI, การวัด performance และ release แรก ซึ่งต้องให้เจ้าของโปรเจกต์ทำ

| ลำดับ | เอกสาร | เนื้อหา |
|---|---|---|
| 1 | [Repository Audit Report](01-repository-audit.md) | โครงสร้างปัจจุบัน, Dependencies ที่อัปเดตแล้ว, ผลการตรวจสอบ, โค้ดที่นำกลับมาใช้และปัญหาที่เหลือ |
| 2 | [Architecture Proposal](02-architecture-proposal.md) | การเปรียบเทียบ Technology Stack, Process Model, Typed IPC, Storage, Overlay, Capture, Packaging และ Update |
| 3 | [Feature Specification](03-feature-specification.md) | กฎการทำงานของทุก Feature ตั้งแต่ Game Profile จนถึง Backup/Restore |
| 4 | [Data Model](04-data-model.md) | SQLite Schema, Migrations, File Storage และ Algorithm การคำนวณ Materials พร้อมตัวอย่าง |
| 5 | [UI/UX Design Plan](05-ui-ux-design-plan.md) | หน้าจอหลัก, Overlay, Capture Flow, User Flows และ Visual System |
| 6 | [Development Roadmap](06-development-roadmap.md) | Phases, Tasks, Dependencies, ลำดับการทำงานและ Definition of Done |
| 7 | [Risks & Limitations](07-risks-and-limitations.md) | Risk Register ด้าน Game Compatibility, Capture, Overlay, Performance และ Tooling |
| 8 | [Acceptance Criteria](08-acceptance-criteria.md) | เงื่อนไขตรวจรับรายฟีเจอร์และเกณฑ์ปิดแต่ละ Phase |

ไฟล์ประกอบ: [sqlite.dbml](sqlite.dbml) คือ Schema ในรูปแบบ DBML ที่ตรงกับเอกสาร Data Model

## การตัดสินใจหลัก

- ใช้ Electron 44 + Vue 3 + Vite 8 + TypeScript 5.x ต่อจาก Repository เดิม ไม่ Rewrite เป็น Tauri
- ใช้ SQLite ผ่าน better-sqlite3 เป็น Primary Storage ภาพ Item เก็บเป็นไฟล์และอ้างอิง Path ใน Database
- Renderer ติดต่อ Main Process ผ่าน Preload และ Typed IPC เท่านั้น โดยเปิด `contextIsolation` และ `sandbox` ปิด `nodeIntegration`
- Overlay เป็น Window แยกแบบ Transparent และ Always-on-top รองรับ Borderless Windowed เป็นหลัก ไม่ใช้ Injection
- Manual Inventory Tracking เป็นรูปแบบหลัก ไม่อ่าน Memory หรือ Process ของเกม
- Packaging เป้าหมาย Windows 10/11 x64 เท่านั้นใน Phase แรก

## แผนทั้งหมดโดยสรุป

รายละเอียด Task รายตัว (รหัส, ไฟล์เป้าหมาย, Dependencies, ขนาด, วิธีตรวจสอบ) อยู่ใน [Development Roadmap](06-development-roadmap.md) ตารางนี้เป็นภาพรวมเท่านั้น

| Phase | เป้าหมาย | Task | PR | สถานะ |
|---|---|---|---|---|
| 1 Foundation | Audit, Dependencies, Toolchain, Security baseline, SQLite, Typed IPC, App shell, Game Profile | Part A เสร็จ; Part B = P1-00 ถึง P1-16 | `feat/phase1-foundation` | Part A และ Part B เขียนเสร็จ (P1-00 ถึง P1-14); รอตรวจด้วยมือบนหน้าต่างจริง (P1-15) และเปิด PR (P1-16) |
| 2 Core Tracking | Item Library, ภาพจากไฟล์/Clipboard, Recipes (Nested, Cycle check), Quests, Inventory, Aggregation, Gathering List, Consume/Craft | P2-01 ถึง P2-18 | `feat/phase1-foundation` (ทำซ้อนบน branch เดียวกัน) | เขียนเสร็จ (P2-01 ถึง P2-17) รอตรวจด้วยมือบนหน้าต่างจริง (P2-18) |
| 3 Windows Overlay | Overlay window, View/Interactive, Click-through, Opacity/Compact, Pin, Global Hotkeys | P3-01 ถึง P3-10 | `feat/phase1-foundation` (ซ้อน) | เขียนเสร็จ (P3-01 ถึง P3-09) รอตรวจกับเกมจริง (P3-10) |
| 4 Capture & Productivity | Region capture, Crop, Clipboard fallback (Win+Shift+S), Quick item creation, Gathering List filters | P4-01 ถึง P4-08 | `feat/phase1-foundation` (ซ้อน) | เขียนเสร็จ (P4-01 ถึง P4-07) รอตรวจ DPI/สองจอ (P4-08) |
| 5 Optimization & Distribution | Performance, Backup/Restore/Export/Import, ไอคอน >=256px, Signing, Update mechanism, Windows 10/11 matrix, Release | P5-01 ถึง P5-10 | `feat/phase1-foundation` (ซ้อน) | Backup/Restore, Settings, Packaging trim เสร็จ (P5-02 ถึง P5-04, ส่วนของ P5-05); ค้าง: ไอคอน, Signing, Updater, Matrix, Release (ต้องตัดสินใจโดยเจ้าของโปรเจกต์) |

### Phase 1 Part B (สถานะ 2026-10-10)

1. [เสร็จ] P1-01 ถึง P1-05: better-sqlite3 (`npmRebuild: false`), Connection, Migrations + `001-initial`, Repositories, Domain skeleton
2. [เสร็จ] P1-06 ถึง P1-09: Typed IPC, Preload API แทน Generic bridge, CSP, Settings Store
3. [เสร็จ] P1-10 ถึง P1-12: App shell (vue-router), Game Profile Management, Bootstrap Main Process ใหม่
4. [เสร็จ P1-13 และ P1-14] ลบ Legacy, อัปเดต README/CLAUDE.md; [ค้าง] P1-15 Verification Pass บนหน้าต่างจริง (CSP, Title Bar, Dialog, Game Profile, ติดตั้ง Setup.exe) และ P1-16 เตรียม PR

### สิ่งที่ต้องตัดสินใจหรือเตรียมก่อนถึง Phase ที่เกี่ยวข้อง

- ติดตั้ง Node.js 24 LTS เพื่อรัน `bun run typecheck` (ก่อนปิด Phase 1)
- ไอคอน Windows ขนาดอย่างน้อย 256×256 และการตัดสินใจเรื่อง Code Signing (Phase 5)
- ตรวจสิทธิ์ GitHub Releases และ Release workflow ก่อนทำ Auto-update (Phase 5)
- อนุมัติ Hotkey ค่าเริ่มต้นและเลือก Font (Phase 3 และ UI)

รายการตัดสินใจทั้งหมดอยู่ในหัวข้อ 11 ของ Roadmap และความเสี่ยงอยู่ใน [Risks & Limitations](07-risks-and-limitations.md)
