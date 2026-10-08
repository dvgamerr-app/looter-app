# เอกสารแผนงาน GameLooter

เอกสารชุดนี้เป็นผลจากการตรวจสอบ Repository และการวางแผนก่อนเริ่มพัฒนา Universal RPG Item & Quest Tracker พร้อม Windows Overlay อัปเดตล่าสุด 2026-10-08 ยังไม่มีการเริ่ม Implementation ของ Features ใหม่ จนกว่าจะได้รับคำสั่ง

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
