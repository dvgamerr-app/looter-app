# Acceptance Criteria

เงื่อนไขตรวจรับรายฟีเจอร์ (F1–F12) และเกณฑ์ข้ามฟีเจอร์ของ GameLooter พร้อมชุดข้อมูลทดสอบที่มีตัวเลขคาดหวังชัดเจน และตารางสรุปเกณฑ์ปิดแต่ละ Phase

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง

- [Repository Audit Report](01-repository-audit.md)
- [Architecture Proposal](02-architecture-proposal.md)
- [Feature Specification](03-feature-specification.md)
- [Data Model](04-data-model.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Development Roadmap](06-development-roadmap.md)
- [Risks & Limitations](07-risks-and-limitations.md)

---

## 1. วิธีใช้เอกสาร

### 1.1 ขอบเขตและรูปแบบการตรวจ

- เกณฑ์ทุกข้อในเอกสารนี้เป็น **ขั้นตอนตรวจสอบด้วยมือ (Manual Verification)** จนกว่าจะได้รับคำสั่งให้เขียน Automated Tests (ตาม Requirement 9 และ Requirement 10 ข้อเพิ่มเติม "ห้ามสร้างหรือแก้ไข Test Scripts สำหรับ Feature ใหม่ เว้นแต่ได้รับคำสั่งอย่างชัดเจน") เมื่อมีคำสั่งให้เขียน Tests เกณฑ์แต่ละข้อสามารถแปลงเป็น Test Case ได้โดยตรง เพราะระบุ Fixture, ขั้นตอน และผลที่คาดหวังเป็นตัวเลขไว้แล้ว
- เกณฑ์ที่เป็นตัวเลขด้าน Performance ระบุเป็น **เป้าหมาย (Target)** ไม่ใช่เงื่อนไขบังคับผ่าน/ไม่ผ่าน เพราะขึ้นกับเครื่องที่ใช้ทดสอบ รายละเอียดอยู่ในหัวข้อ 16
- ข้อมูลที่ยังไม่ได้ยืนยันจากเอกสารอื่นหรือจาก Repository จะกำกับด้วยคำว่า **ต้องตรวจสอบ** ผู้ทดสอบต้องยืนยันกับเอกสารที่อ้างถึงก่อนบันทึกผล

### 1.2 รูปแบบของเกณฑ์แต่ละข้อ

ทุกเกณฑ์มีองค์ประกอบคงที่ 4 ส่วน

| ส่วน | ความหมาย |
|---|---|
| ID | รูปแบบ `AC-<กลุ่ม>-<ลำดับ>` เช่น `AC-F6-03` คือเกณฑ์ข้อที่ 3 ของ Feature F6 กลุ่มข้ามฟีเจอร์ใช้ `UX`, `PERF`, `PKG`, `TOOL` |
| เงื่อนไขเริ่มต้น | สถานะของแอปและข้อมูลก่อนเริ่มทดสอบ มักอ้างถึง Fixture ในหัวข้อ 2 |
| ขั้นตอน | ลำดับการกระทำที่ผู้ทดสอบทำตามทีละข้อ |
| ผลที่คาดหวัง | สิ่งที่ต้องสังเกตเห็นหรือวัดได้ ถ้าไม่ตรงถือว่าไม่ผ่าน |

Phase ที่เกณฑ์สังกัดระบุไว้ในหัวข้อของเกณฑ์ (ชื่อ Phase ตาม [Development Roadmap](06-development-roadmap.md)) และสรุปรวมในหัวข้อ 19

**การจับคู่กลุ่ม AC กับรหัส Feature ใน [Feature Specification](03-feature-specification.md):** เลขกลุ่มใน ID ของเอกสารนี้จัดตามหัวข้อของ Requirement จึงไม่ตรงกับรหัส F ของ Feature Specification ทุกข้อ ให้ใช้ตารางนี้เมื่อต้องข้ามเอกสาร (Roadmap อ้าง ID ตามเลขกลุ่มของเอกสารนี้ ส่วนรหัสกฎ `Fn-Rm` ในเอกสารอื่นอ้างตาม Feature Specification)

| กลุ่ม AC | หัวข้อในเอกสารนี้ | Feature ใน Feature Specification |
|---|---|---|
| `AC-F1` | 3 Game Profile | F1 |
| `AC-F2` | 4 Item และรูปภาพ | F2 |
| `AC-F3` | 5 Recipe | F3 |
| `AC-F4` | 6 Quest | F4 |
| `AC-F5` | 7 Aggregation และ Gathering List | F5 (Tracking Targets) และ F6 (Aggregation, Gathering List) |
| `AC-F6` | 8 Manual Inventory | F7 |
| `AC-F7` | 9 Overlay | F9 |
| `AC-F8` | 10 Capture | F10 |
| `AC-F9` | 11 Consume / Craft | F8 |
| `AC-F10` | 12 Settings และ Hotkeys | F11 (ส่วน Settings, Hotkeys, Overlay, Window bounds) |
| `AC-F11` | 13 Backup / Restore / Export / Import | F11 (ส่วน Backup) |
| `AC-F12` | 14 Migrations และความปลอดภัยของข้อมูล | F12 |

ท้ายชื่อเกณฑ์ที่เกี่ยวกับความเสี่ยงมีแท็ก `[ความเสี่ยง: R-xx]` อ้าง ID ใน [Risks & Limitations](07-risks-and-limitations.md) (R-01 ถึง R-28 คือความเสี่ยง, L-01 ถึง L-12 คือข้อจำกัดที่ยอมรับ) เกณฑ์ที่ผ่านแปลว่าตรวจแล้วว่า Mitigation ของความเสี่ยงนั้นทำงาน ไม่ได้แปลว่าความเสี่ยงหมดไป

### 1.3 การบันทึกผล

- บันทึกผลเป็น `ผ่าน`, `ไม่ผ่าน` หรือ `ยังไม่ทดสอบ` พร้อมวันที่, Build (Commit hash หรือเลขเวอร์ชัน Installer) และสภาพแวดล้อม
- เกณฑ์ที่ไม่ผ่านต้องบันทึกค่าที่สังเกตได้จริงเทียบกับค่าที่คาดหวัง
- เกณฑ์ที่ผูกกับ Hotkey ให้ทดสอบด้วยค่า Default ตามหัวข้อ 2.5 เว้นแต่ระบุไว้ในขั้นตอน

### 1.4 สภาพแวดล้อมทดสอบ

| รหัส | สภาพแวดล้อม | ใช้กับ |
|---|---|---|
| ENV-DEV | เครื่องพัฒนา Windows 11 Pro x64, Bun 1.4.2, รัน `bun run dev` หรือ `bun x electron .` | เกณฑ์ F1–F12 ระหว่างพัฒนา |
| ENV-W11 | Windows 11 x64 ติดตั้งใหม่ (VM หรือเครื่องจริง) ไม่มี Node.js, Bun หรือ Visual Studio Build Tools | เกณฑ์ PKG, PERF และการทดสอบซ้ำของ F1–F12 บน Installer |
| ENV-W10 | Windows 10 x64 ติดตั้งใหม่ (VM หรือเครื่องจริง) เงื่อนไขเดียวกับ ENV-W11 | เกณฑ์ PKG |
| ENV-DPI | จอที่ตั้ง Scale 150% (และ 125%, 200% สำหรับ PKG) | เกณฑ์ F8 และ PKG |
| ENV-MULTI | เครื่องที่ต่อจอ 2 จอขึ้นไป ซึ่งมี Scale ต่างกันอย่างน้อย 1 คู่ | เกณฑ์ F7, F8 และ PKG |
| ENV-GAME | เกมที่ตั้งค่าเป็น Borderless Windowed ได้ และสลับเป็น Fullscreen Exclusive ได้ (เกมที่ทีมเลือกใช้ทดสอบ ต้องตรวจสอบ) | เกณฑ์ F7 และ F8 |

ตำแหน่งข้อมูลที่ใช้ตรวจในทุกสภาพแวดล้อมตาม Data Model คือ `%APPDATA%\looter-app\data\gamelooter.sqlite` (ไฟล์ `-wal` และ `-shm` จะมีขณะเปิดแอป) และรูปภาพที่ `%APPDATA%\looter-app\data\images\<profile_id>\<item_id>.png` กับ `%APPDATA%\looter-app\data\images\<profile_id>\thumbs\<item_id>.png`

การตรวจค่าใน SQLite โดยตรง (เช่น `PRAGMA user_version`) ใช้เครื่องมือภายนอก เช่น `sqlite3` CLI หรือ DB Browser for SQLite เครื่องมือที่ทีมจะใช้ ต้องตรวจสอบ และต้องปิดแอปก่อนอ่านไฟล์เพื่อให้ WAL ถูก Checkpoint แล้ว

---

## 2. ชุดข้อมูลทดสอบ (Fixtures)

ทุก Fixture สร้างใน Game Profile ชื่อ `Testbed` เว้นแต่ระบุอื่น ตัวเลขคาดหวังทั้งหมดคำนวณตาม Algorithm ใน [Data Model](04-data-model.md) หัวข้อการคำนวณ Materials (Canonical Algorithm เดียวกับที่ Feature Specification อ้างถึง) ลำดับ Ingredient ใน Recipe คือ `sort_order` จากน้อยไปมาก และลำดับ Target คือ `priority` จากน้อยไปมาก

### 2.1 Fixture A: ตัวอย่าง Requirement 3.5 (ไม่มี Nested Recipe)

Items (category `material` เว้นแต่ระบุ): `Iron Ore`, `Wood`, `Leather`, `Iron Armor` (`equipment`)

| Target | ชนิด | Requirements | priority |
|---|---|---|---|
| Quest A | quest | Iron Ore × 10, Wood × 5 | 1 |
| Quest B | quest | Iron Ore × 15, Leather × 8 | 2 |
| Craft C | recipe (output `Iron Armor` × 1, `target_qty` 1) | Iron Ore × 20, Wood × 10 | 3 |

Inventory: Iron Ore 20, Wood 5, Leather 3, Iron Armor 0

ผลลัพธ์คาดหวังของ Gathering List

| Item | Required | Owned | Missing |
|---|---:|---:|---:|
| Iron Ore | 45 | 20 | 25 |
| Wood | 15 | 5 | 10 |
| Leather | 8 | 3 | 5 |

Overall Progress = Σ min(Owned, Required) / Σ Required = (20 + 5 + 3) / (45 + 15 + 8) = **28 / 68**

ผลจัดสรร (allocated) รายเป้าหมายตามลำดับ priority

| Target | Item | จัดสรร / ต้องการ | ขาดสำหรับเป้าหมายนี้ |
|---|---|---:|---:|
| Quest A | Iron Ore | 10 / 10 | 0 |
| Quest A | Wood | 5 / 5 | 0 |
| Quest B | Iron Ore | 10 / 15 | 5 |
| Quest B | Leather | 3 / 8 | 5 |
| Craft C | Iron Ore | 0 / 20 | 20 |
| Craft C | Wood | 0 / 10 | 10 |

### 2.2 Fixture B: Nested Recipe (คำนวณตาม Canonical Algorithm)

Items: `Iron Sword` (`equipment`), `Iron Ingot`, `Iron Ore`, `Coal`, `Wood` (`material`)

| Recipe | Output | Ingredients (ตาม sort_order) |
|---|---|---|
| R1 | Iron Sword × 1 | Iron Ingot × 4 (`mode` = `craft`), Wood × 2 (`mode` = `gather`) |
| R2 | Iron Ingot × 2 | Iron Ore × 3 (`mode` = `craft`, ไม่มี Recipe จึงทำงานเหมือน `gather`), Coal × 1 (`mode` = `gather`) |

Inventory: Iron Ingot 1, Iron Ore 2, Coal 0, Wood 0, Iron Sword 0

Tracking Target T1: recipe R1, `target_qty` 1, `priority` 1

ลำดับการคำนวณ

1. runs(R1) = ceil(1 / 1) = 1 ความต้องการระดับแรก: Iron Ingot 4 (`craft`), Wood 2 (`gather`)
2. Iron Ingot: หักที่มีอยู่ก่อน take = min(1, 4) = 1 เหลือ 3; มี Recipe R2 และ `mode` = `craft` จึง runs(R2) = ceil(3 / 2) = 2; surplus = 2 × 2 − 3 = 1 (เก็บไว้ใน available สำหรับ Target ถัดไป); ขยายเป็น Iron Ore 3 × 2 = 6 และ Coal 1 × 2 = 2
3. Iron Ore: take = min(2, 6) = 2 เหลือ 4 เป็น Raw Material
4. Coal: take 0 เหลือ 2
5. Wood: take 0 เหลือ 2

ผลลัพธ์คาดหวังของ Gathering List (เฉพาะ Raw Materials)

| Item | Required | Owned | Missing |
|---|---:|---:|---:|
| Iron Ore | 6 | 2 | 4 |
| Coal | 2 | 0 | 2 |
| Wood | 2 | 0 | 2 |

Overall Progress = (2 + 0 + 0) / (6 + 2 + 2) = **2 / 10**

Craft Plan (ส่วนแยก ไม่นับเป็น Gather Item)

| Recipe | จำนวนครั้ง (runs) | ผลผลิต | Intermediate Item | Required | Owned |
|---|---:|---:|---|---:|---:|
| R2 (Iron Ingot) | 2 | 4 | Iron Ingot | 4 | 1 |

ตัวแปรของ Fixture B ที่ใช้ในเกณฑ์

- **B-gather**: เปลี่ยน `mode` ของ Ingredient Iron Ingot ใน R1 เป็น `gather` ผลคือ Gathering List = Iron Ingot 4 / 1 / 3, Wood 2 / 0 / 2 (Iron Ore และ Coal ไม่ปรากฏ) Craft Plan ว่าง Overall Progress = 1 / 6
- **B-owned**: Inventory Iron Ingot = 4 (ค่าอื่นเท่าเดิม) ผลคือ Gathering List = Wood 2 / 0 / 2 เท่านั้น Craft Plan ว่าง Overall Progress = 0 / 2
- **B-direct**: เพิ่ม Ingredient Iron Ore × 1 (`mode` = `gather`, sort_order 3) ใน R1 ผลคือ Iron Ore 7 / 2 / 5 (Owned 2 ถูกหักครั้งเดียวในขั้นตอนขยาย Iron Ingot ส่วนความต้องการตรง 1 หน่วยไม่ได้หักซ้ำ) Coal 2 / 0 / 2, Wood 2 / 0 / 2 Overall Progress = 2 / 11
- **B-surplus**: เพิ่ม Quest `Smith's Favor` ต้องการ Iron Ingot × 1 (`mode` = `craft`) เป็น Target T2 `priority` 2 ผลคือ Gathering List เท่ากับ Fixture B เดิม และ R2 ยัง 2 runs (ไม่สั่ง craft เพิ่ม เพราะ surplus 1 จาก R2 ถูกจัดสรรให้ T2) Craft Plan แสดง Iron Ingot Required เพิ่มเป็น 5 / Owned 1 และหน้า Quest Tracker แสดง Iron Ingot จัดสรร 1 / 1 สำหรับ T2

### 2.3 Fixture C: การจัดสรรตามลำดับ Priority

Item: `Iron Ore` Inventory: Iron Ore 20

| Target | Requirements | priority เริ่มต้น |
|---|---|---|
| Quest A | Iron Ore × 10 | 1 |
| Quest B | Iron Ore × 15 | 2 |

Global: Required 25, Owned 20, Missing 5 (ไม่เปลี่ยนไม่ว่าลำดับใด)

| ลำดับ | Quest A (จัดสรร / ต้องการ) | Quest B (จัดสรร / ต้องการ) |
|---|---:|---:|
| A ก่อน B | 10 / 10 | 10 / 15 (ขาด 5) |
| B ก่อน A | 5 / 10 (ขาด 5) | 15 / 15 |

### 2.4 Fixture D: Consume และ Craft

- Quest A จาก Fixture A (Iron Ore × 10, Wood × 5)
- Recipe R2 จาก Fixture B (Iron Ore × 3 + Coal × 1 → Iron Ingot × 2)
- กรณี D-ok: Inventory Iron Ore 20, Wood 5, Coal 3, Iron Ingot 1
- กรณี D-short: Inventory Iron Ore 12, Wood 3, Coal 1, Iron Ingot 1

### 2.5 Hotkeys Default (ตาม Architecture Proposal และ Feature Specification)

| การกระทำ | Accelerator (บน Windows คือ Ctrl) |
|---|---|
| Toggle overlay visible | `CommandOrControl+Shift+O` |
| Toggle overlay mode (View ⇄ Interactive) | `CommandOrControl+Shift+M` |
| Start region capture | `CommandOrControl+Shift+X` |
| Import image from clipboard | `CommandOrControl+Shift+V` |
| Overlay: next / previous pinned target | `CommandOrControl+Shift+]` / `CommandOrControl+Shift+[` |

---

## 3. F1 Multi-Game Support: Game Profile (Requirement 3.1)

#### AC-F1-01 สร้าง Game Profile ใหม่ (Phase 1)

- เงื่อนไขเริ่มต้น: แอปเปิดอยู่ที่ Game Dashboard (`#/`) ยังไม่มี Profile ชื่อ `Testbed`
- ขั้นตอน:
  1. เลือก "สร้าง Profile" กรอกชื่อ `Testbed` แล้วบันทึก
  2. ปิดแอปแล้วตรวจตาราง `game_profile`
- ผลที่คาดหวัง: Profile `Testbed` ปรากฏเป็น Card บน Dashboard และถูกตั้งเป็น Active Profile ทันที แถวใน `game_profile` มี `name` = `Testbed`, `created_at` และ `updated_at` เป็น ISO-8601 UTC, `icon_path` เป็น NULL

#### AC-F1-02 ชื่อ Profile ซ้ำแบบไม่สนตัวพิมพ์ถูกปฏิเสธ (Phase 1)

- เงื่อนไขเริ่มต้น: มี Profile `Testbed`
- ขั้นตอน:
  1. สร้าง Profile ชื่อ `testbed`
  2. สร้าง Profile ชื่อ `TESTBED `
- ผลที่คาดหวัง: ทั้งสองครั้งถูกปฏิเสธพร้อมข้อความว่าชื่อซ้ำ ไม่มีแถวใหม่ใน `game_profile` (ข้อจำกัด `UNIQUE COLLATE NOCASE`) ชื่อที่มีช่องว่างหัวท้ายถูกตัดก่อนตรวจซ้ำ (การตัดช่องว่าง ต้องตรวจสอบกับ Feature Specification)

#### AC-F1-03 เปลี่ยนชื่อ Profile (Phase 1)

- เงื่อนไขเริ่มต้น: มี Profile `Testbed` และ `Other`
- ขั้นตอน:
  1. เปลี่ยนชื่อ `Testbed` เป็น `Testbed 2`
  2. เปลี่ยนชื่อ `Testbed 2` เป็น `other`
- ผลที่คาดหวัง: ขั้นตอน 1 สำเร็จ ชื่อบน Card และ Title ของทุกหน้าจอเปลี่ยนทันที `updated_at` เปลี่ยน ขั้นตอน 2 ถูกปฏิเสธเพราะซ้ำกับ `Other`

#### AC-F1-04 สลับ Active Profile และจำค่าไว้ (Phase 1)

- เงื่อนไขเริ่มต้น: มี Profile `Testbed` และ `Other`, Active คือ `Testbed`
- ขั้นตอน:
  1. คลิก Card `Other` บน Dashboard
  2. เปิด Item Library แล้วกลับมา Dashboard
  3. ปิดแอปแล้วเปิดใหม่
- ผลที่คาดหวัง: หลังขั้นตอน 1 ทุกหน้าจอแสดงข้อมูลของ `Other` โดยไม่ต้องรีสตาร์ต หลังขั้นตอน 3 แอปเปิดที่ `Other` ตาราง `app_setting` มี `key` = `active_profile_id` ชี้ไปที่ id ของ `Other` และ `game_profile.last_opened_at` ของ `Other` ถูกอัปเดต

#### AC-F1-05 ข้อมูลแต่ละ Profile แยกจากกัน: Item ชื่อเดียวกันคนละ Profile เป็นคนละ Item (Phase 2)

- เงื่อนไขเริ่มต้น: มี Profile `Testbed` และ `Other`
- ขั้นตอน:
  1. ใน `Testbed` สร้าง Item `Iron Ore` ตั้ง Owned = 20
  2. สลับไป `Other` สร้าง Item `Iron Ore` ตั้ง Owned = 3
  3. สลับกลับ `Testbed`
- ผลที่คาดหวัง: ขั้นตอน 2 สำเร็จ (ไม่ติด UNIQUE เพราะคนละ `profile_id`) ตาราง `item` มี 2 แถวชื่อ `Iron Ore` คนละ `profile_id` และคนละ `id` Inventory ของ `Testbed` ยังเป็น 20 Recipes, Quests, Gathering List และ Overlay ของแต่ละ Profile ไม่แสดงข้อมูลของอีก Profile

#### AC-F1-06 ลบ Profile ต้องยืนยันและลบข้อมูลทั้งหมดของ Profile นั้น (Phase 2)

- เงื่อนไขเริ่มต้น: Profile `Other` มี Item 2 รายการ (1 รายการมีรูป), Recipe 1, Quest 1, Tracking Target 1
- ขั้นตอน:
  1. ใน Settings เลือกลบ Profile `Other`
  2. ยกเลิกที่กล่องยืนยัน
  3. เลือกลบอีกครั้งแล้วยืนยัน
- ผลที่คาดหวัง: หลังขั้นตอน 2 ไม่มีอะไรเปลี่ยน หลังขั้นตอน 3 แถวของ `Other` ใน `game_profile`, `item`, `inventory`, `recipe`, `recipe_ingredient`, `quest`, `quest_requirement`, `tracking_target` หายทั้งหมด (`ON DELETE CASCADE`) โฟลเดอร์ `images\<profile_id>` ของ `Other` ถูกลบ (ลบหลัง Commit ตาม F1-R9) ถ้า `Other` เป็น Active Profile แอปสลับไป Profile ที่เหลือหรือแสดงสถานะไม่มี Profile โดยไม่ Crash

#### AC-F1-07 Dashboard แสดง Progress ภาพรวมต่อ Profile (Phase 2)

- เงื่อนไขเริ่มต้น: `Testbed` มี Fixture A, `Other` ไม่มี Target
- ขั้นตอน:
  1. เปิด Game Dashboard
- ผลที่คาดหวัง: Card `Testbed` แสดง Overall Progress 28 / 68 (หรือ 41% ถ้าแสดงเป็นเปอร์เซ็นต์ โดยปัดตามกติกาใน UI/UX Design Plan ต้องตรวจสอบ) Card `Other` แสดงสถานะไม่มีเป้าหมาย ไม่แสดง 0 / 0 เป็น NaN หรือ Infinity

---

## 4. F2 Item Database & Image Management (Requirement 3.2)

#### AC-F2-01 สร้าง Item พร้อมหมวดหมู่ (Phase 2)

- เงื่อนไขเริ่มต้น: Active Profile `Testbed` ว่าง
- ขั้นตอน:
  1. ใน Item Library (`#/items`) สร้าง Item `Iron Ore` หมวด `material`
  2. สร้าง `Iron Sword` หมวด `equipment`, `Health Potion` หมวด `consumable`, `Old Key` หมวด `quest`, `Mystery Box` หมวด `other`
- ผลที่คาดหวัง: ทั้ง 5 รายการปรากฏในรายการพร้อม Badge หมวดหมู่ ตัวเลือกหมวดหมู่มีเฉพาะ 5 ค่า (`material`, `equipment`, `consumable`, `quest`, `other`) ค่า Default คือ `material` แถวใน `item` มี `profile_id` ของ `Testbed`, `pinned` = 0 และมีแถว `inventory` ที่ `owned` = 0 สำหรับแต่ละ Item (สร้างพร้อม Item หรือสร้างเมื่อใช้ครั้งแรก ต้องตรวจสอบกับ Data Model แต่หน้าจอต้องแสดง Owned 0 ทันที)

#### AC-F2-02 ชื่อ Item ซ้ำใน Profile เดียวกันถูกปฏิเสธ (Phase 2)

- เงื่อนไขเริ่มต้น: มี Item `Iron Ore`
- ขั้นตอน:
  1. สร้าง Item ชื่อ `iron ore`
  2. แก้ไข Item `Wood` (สร้างก่อน) ให้ชื่อเป็น `IRON ORE`
- ผลที่คาดหวัง: ทั้งสองกรณีถูกปฏิเสธพร้อมข้อความชี้ว่าซ้ำกับ `Iron Ore` ไม่มีการเขียนลงฐานข้อมูล (`UNIQUE (profile_id, name COLLATE NOCASE)`) การสร้าง Item ชื่อว่างหรือมีแต่ช่องว่างถูกปฏิเสธเช่นกัน

#### AC-F2-03 แก้ไขชื่อ หมวดหมู่ และ Notes (Phase 2)

- เงื่อนไขเริ่มต้น: มี Item `Iron Ore` ที่ถูกใช้ใน Recipe และ Quest ของ Fixture A
- ขั้นตอน:
  1. เปลี่ยนชื่อเป็น `Iron Ore (raw)` เปลี่ยนหมวดเป็น `other` ใส่ Notes `found in cave`
  2. เปิด Recipes, Quest Tracker และ Gathering List
- ผลที่คาดหวัง: ชื่อใหม่ปรากฏในทุกหน้าจอที่อ้าง Item นี้โดยที่ Recipe และ Quest ยังอ้าง `item.id` เดิม (ไม่เกิด Item ใหม่) `updated_at` เปลี่ยน

#### AC-F2-04 ค้นหาและกรอง (Phase 2)

- เงื่อนไขเริ่มต้น: Item จาก AC-F2-01
- ขั้นตอน:
  1. พิมพ์ `iron` ในช่องค้นหา
  2. ล้างช่องค้นหา เลือกตัวกรองหมวด `consumable`
  3. พิมพ์ `potion` ขณะกรอง `equipment`
- ผลที่คาดหวัง: ขั้นตอน 1 แสดง `Iron Ore` และ `Iron Sword` (ไม่สนตัวพิมพ์) ขั้นตอน 2 แสดงเฉพาะ `Health Potion` ขั้นตอน 3 แสดงรายการว่างพร้อมข้อความไม่พบ ผลการกรองปรากฏทันทีขณะพิมพ์โดยไม่ต้องกดปุ่ม

#### AC-F2-05 นำเข้าไฟล์รูปภาพและสร้าง Thumbnail (Phase 2)

- เงื่อนไขเริ่มต้น: มี Item `Iron Ore` ไม่มีรูป เตรียมไฟล์ PNG ขนาด 300 × 200 px และ JPG 1 ไฟล์
- ขั้นตอน:
  1. ใน Item Library เลือก Item แล้วเลือก "Import image file" เลือกไฟล์ PNG
  2. ทำซ้ำกับ Item `Wood` โดยเลือกไฟล์ JPG
  3. ตรวจโฟลเดอร์ `%APPDATA%\looter-app\data\images\<profile_id>\`
- ผลที่คาดหวัง: Dialog เปิดด้วย `dialog.showOpenDialog` กรองเฉพาะไฟล์รูปภาพ หลังเลือกมีไฟล์ `<item_id>.png` (บันทึกเป็น PNG เสมอ) และ `thumbs\<item_id>.png` ขนาด 64 × 64 px ใน `item.image_path` และ `item.thumbnail_path` เก็บ Path แบบ Relative ต่อ `%APPDATA%\looter-app\data` (เช่น `images\<profile_id>\<item_id>.png`) ไม่ใช่ Absolute Path รูปแสดงในรายการทันที

#### AC-F2-06 วางรูปจาก Clipboard ด้วยปุ่มใน Item Library (Phase 2) [ความเสี่ยง: R-12]

- เงื่อนไขเริ่มต้น: มี Item `Leather` ไม่มีรูป
- ขั้นตอน:
  1. เปิดรูปใดก็ได้ใน Paint คัดลอกส่วนหนึ่งเข้า Clipboard
  2. ใน Item Library เลือก `Leather` แล้วกดปุ่ม "Paste from clipboard"
  3. ล้าง Clipboard (คัดลอกข้อความแทน) แล้วกดปุ่มเดิมอีกครั้ง
- ผลที่คาดหวัง: ขั้นตอน 2 สร้างไฟล์ PNG และ Thumbnail ตามรูปแบบใน AC-F2-05 ขั้นตอน 3 แสดงข้อความว่าไม่มีรูปภาพใน Clipboard และไม่เปลี่ยนรูปเดิม การอ่าน Clipboard ทำใน Main Process ผ่าน Clipboard API ของ Electron 44 (`clipboard.read()` คืน `ClipboardItem[]`) ไม่มี Error ใน Console เกี่ยวกับ `readImage`

#### AC-F2-07 Thumbnail แสดงในทุกหน้าจอที่เกี่ยวข้อง (Phase 2, Overlay ใน Phase 3)

- เงื่อนไขเริ่มต้น: Fixture A โดย `Iron Ore` มีรูป ส่วน `Wood` ไม่มีรูป
- ขั้นตอน:
  1. เปิด Recipes, Quest Tracker, Gathering List
  2. (Phase 3) เปิด Overlay
- ผลที่คาดหวัง: ทุกหน้าจอแสดง Thumbnail ของ `Iron Ore` และแสดง Placeholder (ไอคอนแทน ไม่ใช่รูปแตก) สำหรับ `Wood` รูปโหลดจาก Path ภายใต้ `userData` ได้ภายใต้ `file://` หรือ Custom Protocol ตาม Architecture Proposal (วิธีส่งรูปให้ Renderer ต้องตรวจสอบกับ Architecture Proposal)

#### AC-F2-08 ลบ Item ที่ถูกใช้งานถูกปฏิเสธพร้อมรายการที่ใช้ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A (`Iron Ore` ถูกใช้ใน Quest A, Quest B และ Recipe ของ Craft C)
- ขั้นตอน:
  1. ลบ Item `Iron Ore`
- ผลที่คาดหวัง: ระบบปฏิเสธ (`ON DELETE RESTRICT` ของ `recipe_ingredient.item_id` และ `quest_requirement.item_id`) ข้อความระบุชื่อทุกที่ที่ใช้ ได้แก่ Quest `Quest A`, Quest `Quest B` และ Recipe ที่ให้ `Iron Armor` Item และ Inventory ไม่เปลี่ยน ไม่มี Stack Trace ให้ผู้ใช้เห็น

#### AC-F2-09 ลบ Item ที่เป็นเพียง Inventory หรือ Recipe Output ลบได้แบบ Cascade (Phase 2)

- เงื่อนไขเริ่มต้น: Item `Health Potion` มี Owned 5 ไม่ถูกอ้างที่ใด และ Item `Iron Armor` เป็น Output ของ Recipe Craft C ซึ่งเป็น Tracking Target
- ขั้นตอน:
  1. ลบ `Health Potion` แล้วยืนยัน
  2. ลบ `Iron Armor` แล้วยืนยัน
- ผลที่คาดหวัง: ขั้นตอน 1 ลบสำเร็จ แถว `inventory` หายด้วย ขั้นตอน 2 กล่องยืนยันเตือนว่า Recipe และ Tracking Target ที่เกี่ยวข้องจะถูกลบด้วย เมื่อยืนยัน `recipe`, `recipe_ingredient` ของ Recipe นั้น และ `tracking_target` ของ Craft C หาย Gathering List คำนวณใหม่ทันที (Iron Ore 25 / 20 / 5, Wood 5 / 5 / 0, Leather 8 / 3 / 5) ไฟล์รูปและ Thumbnail ของ Item ที่ถูกลบถูกลบออกจากดิสก์

#### AC-F2-10 เปลี่ยนรูปและลบรูป (Phase 2)

- เงื่อนไขเริ่มต้น: `Iron Ore` มีรูปจาก AC-F2-05
- ขั้นตอน:
  1. Import รูปใหม่ให้ `Iron Ore`
  2. เลือก "ลบรูป"
- ผลที่คาดหวัง: ขั้นตอน 1 ไฟล์ `<item_id>.png` และ Thumbnail ถูกเขียนทับ ไม่มีไฟล์เก่าค้าง ขั้นตอน 2 ไฟล์ทั้งสองถูกลบ `image_path` และ `thumbnail_path` เป็น NULL ทุกหน้าจอกลับไปแสดง Placeholder

#### AC-F2-11 Pin Item (Phase 2, ผลบน Overlay ใน Phase 3)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. Pin `Leather` ใน Item Library
  2. ปิดและเปิดแอปใหม่
- ผลที่คาดหวัง: `item.pinned` = 1 สถานะ Pin คงอยู่หลังรีสตาร์ต และ (Phase 3) Overlay แสดง `Leather` ในส่วน Pinned ตาม AC-F7-08

---

## 5. F3 Recipe & Crafting Tracker (Requirement 3.3)

#### AC-F3-01 สร้าง Recipe พร้อม Ingredients, จำนวน และ mode (Phase 2)

- เงื่อนไขเริ่มต้น: Items ของ Fixture B
- ขั้นตอน:
  1. ใน Recipes (`#/recipes`) สร้าง R2: Output `Iron Ingot` × 2, Ingredients Iron Ore × 3 (`craft`), Coal × 1 (`gather`)
  2. สร้าง R1: Output `Iron Sword` × 1, Ingredients Iron Ingot × 4 (`craft`), Wood × 2 (`gather`)
- ผลที่คาดหวัง: ตาราง `recipe` มี 2 แถวที่ `output_qty` ตรงตามที่กรอก `recipe_ingredient` มี 4 แถวที่ `qty`, `mode`, `sort_order` ตรงตามลำดับที่กรอก ค่า Default ของ `mode` คือ `craft` การบันทึก Recipe และ Ingredients ทั้งหมดอยู่ใน Transaction เดียว (ตรวจตาม AC-F12-07)

#### AC-F3-02 หนึ่ง Output Item มีได้หนึ่ง Recipe (Phase 2)

- เงื่อนไขเริ่มต้น: มี R2 (Output `Iron Ingot`)
- ขั้นตอน:
  1. สร้าง Recipe ใหม่ที่ Output เป็น `Iron Ingot` × 1 จาก Coal × 5
- ผลที่คาดหวัง: ถูกปฏิเสธพร้อมข้อความว่า `Iron Ingot` มี Recipe อยู่แล้ว และเสนอให้แก้ไข Recipe เดิม (`UNIQUE (output_item_id)`) ไม่มีแถวใหม่

#### AC-F3-03 แก้ไขและลบ Recipe (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture B และ T1 เป็น Tracking Target
- ขั้นตอน:
  1. แก้ R2 ให้ Iron Ore × 4 แล้วบันทึก
  2. ลบ R1 แล้วยืนยัน
- ผลที่คาดหวัง: หลังขั้นตอน 1 Gathering List แสดง Iron Ore 8 / 2 / 6 ทันที (4 × 2 runs) หลังขั้นตอน 2 Recipe, Ingredients ของ R1 และ `tracking_target` T1 หาย (Cascade) Gathering List ว่าง Items และ Inventory ไม่เปลี่ยน

#### AC-F3-04 การตรวจสอบค่าที่กรอก (Phase 2)

- เงื่อนไขเริ่มต้น: หน้าสร้าง Recipe
- ขั้นตอน:
  1. ตั้ง `output_qty` = 0 แล้วบันทึก
  2. ตั้ง Ingredient qty = 0 และ qty = −3 แล้วบันทึก
  3. เพิ่ม Ingredient เป็น Item เดียวกับ Output
  4. เพิ่ม Ingredient Item เดียวกันสองแถว
- ผลที่คาดหวัง: ทุกกรณีถูกปฏิเสธด้วยข้อความที่ระบุช่องที่ผิด ไม่เกิด Error จาก SQLite CHECK หรือ PRIMARY KEY ที่หลุดถึงผู้ใช้ (การตรวจสอบทำใน Main Process ก่อนเขียน)

#### AC-F3-05 ตรวจจับ Circular Dependency และปฏิเสธพร้อมเส้นทาง (Phase 2) [ความเสี่ยง: R-19]

- เงื่อนไขเริ่มต้น: Items `Wood`, `Plank`, `Crate` มี Recipe `Plank` × 1 ← Wood × 2 และ Recipe `Crate` × 1 ← Plank × 4
- ขั้นตอน:
  1. สร้าง Recipe Output `Wood` × 1 ← Crate × 1 แล้วบันทึก
  2. แก้ Recipe `Plank` ให้มี Ingredient Plank × 1 แล้วบันทึก
  3. สร้าง Recipe Output `Wood` × 1 ← Plank × 1 โดยที่ Plank มี `mode` = `gather`
- ผลที่คาดหวัง: ขั้นตอน 1 ถูกปฏิเสธพร้อมเส้นทางวงจร `Wood → Crate → Plank → Wood` ขั้นตอน 2 ถูกปฏิเสธ (อ้างตัวเอง) ขั้นตอน 3 ถูกปฏิเสธเช่นกัน เพราะการตรวจวงจรทำบนกราฟ Recipe โดยไม่ขึ้นกับ `mode` (ตาม F3-R6 การตรวจวงจรไม่สนใจ `mode`) ไม่มีแถวใดถูกเขียน

#### AC-F3-06 Nested Preview แสดง Raw Materials ทั้งหมด (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture B (ยังไม่ต้องมี Target)
- ขั้นตอน:
  1. เปิด R1 ดูส่วน Preview โดยกำหนดจำนวนที่ต้องการสร้าง = 1
- ผลที่คาดหวัง: Preview แสดงลำดับชั้น Iron Sword → Iron Ingot × 4 (ขยายผ่าน R2) → Iron Ore × 6, Coal × 2 และ Wood × 2 พร้อมสรุป Raw Materials: Iron Ore 6, Coal 2, Wood 2 และ Craft Plan: R2 × 2 runs (Preview แสดงทั้งวัตถุดิบ "ตามสูตร" (Gross ไม่หัก Inventory) และ "หักของที่มีแล้ว" ตาม F3-R8 ชุดที่หัก Owned ใช้การคำนวณเดียวกับ Gathering List ตามหัวข้อ 2.2 และในกรณีนี้ Iron Ore 6, Coal 2, Wood 2 ได้ผลเท่ากับ Required ของทั้งสองชุด)

#### AC-F3-07 target_qty คูณจำนวน Materials (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. เปลี่ยน `target_qty` ของ Craft C เป็น 2
- ผลที่คาดหวัง: Gathering List เปลี่ยนเป็น Iron Ore 65 / 20 / 45, Wood 25 / 5 / 20, Leather 8 / 3 / 5 Overall Progress 28 / 98

#### AC-F3-08 ปัดจำนวนครั้ง craft ขึ้นเมื่อ output_qty มากกว่า 1 (Phase 2)

- เงื่อนไขเริ่มต้น: Items ของ Fixture B, Recipe R2 เท่านั้น, Inventory ทั้งหมด 0
- ขั้นตอน:
  1. เพิ่ม Tracking Target ชนิด recipe = R2, `target_qty` = 3
- ผลที่คาดหวัง: runs = ceil(3 / 2) = 2 Gathering List แสดง Iron Ore 6 / 0 / 6, Coal 2 / 0 / 2 Craft Plan แสดง R2 × 2 runs ผลผลิต 4 (เกินความต้องการ 1)

---

## 6. F4 Quest Requirements Tracker (Requirement 3.4)

#### AC-F4-01 สร้าง Quest พร้อม Requirements (Phase 2)

- เงื่อนไขเริ่มต้น: Items `Iron Ore`, `Wood`, `Magic Crystal`
- ขั้นตอน:
  1. ใน Quest Tracker (`#/quests`) สร้าง Quest `Ancient Equipment` Requirements Iron Ore × 10, Wood × 5, Magic Crystal × 8
- ผลที่คาดหวัง: `quest.status` = `active`, `completed_at` NULL แถว `quest_requirement` 3 แถว `qty` ตรง `mode` Default `craft` การกรอก qty 0 หรือ Item ซ้ำถูกปฏิเสธเช่นเดียวกับ AC-F3-04

#### AC-F4-02 เปลี่ยนสถานะ Quest (Phase 2)

- เงื่อนไขเริ่มต้น: Quest `Ancient Equipment` สถานะ `active`
- ขั้นตอน:
  1. เปลี่ยนเป็น `paused`
  2. เปลี่ยนเป็น `completed`
  3. เปลี่ยนกลับเป็น `active`
- ผลที่คาดหวัง: สถานะเปลี่ยนตามลำดับ `completed_at` ถูกตั้งเมื่อเป็น `completed` และกลับเป็น NULL เมื่อเป็น `active` อีกครั้ง (ตาม F4-R2) รายการ Quest แยกกลุ่มหรือกรองตามสถานะได้

#### AC-F4-03 การ Complete Quest ไม่เปลี่ยน Inventory (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A, Quest A เป็น Tracking Target
- ขั้นตอน:
  1. เปลี่ยน Quest A เป็น `completed`
  2. เปิด Item Library ดู Owned ของ Iron Ore และ Wood
- ผลที่คาดหวัง: Iron Ore ยัง 20 และ Wood ยัง 5 (ตาม Requirement 10 ข้อ 13) Quest A ไม่ถูกนับใน Gathering List อีก (Gathering List = Iron Ore 35 / 20 / 15, Wood 10 / 5 / 5, Leather 8 / 3 / 5) วิธีไม่นับตาม F4-R5 คือแถว `tracking_target` ยังอยู่แต่ถูกข้ามเพราะสถานะไม่ใช่ `active` ผลลัพธ์ตัวเลขต้องเป็นตามนี้

#### AC-F4-04 Progress รายเป้าหมายแสดงเป็นจำนวนที่จัดสรร (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. เปิด Quest Tracker ดู Quest A และ Quest B
- ผลที่คาดหวัง: Quest A แสดง Iron Ore 10 / 10, Wood 5 / 5 Quest B แสดง Iron Ore 10 / 15 (ขาด 5), Leather 3 / 8 (ขาด 5) ตามตารางจัดสรรในหัวข้อ 2.1 ป้ายกำกับระบุว่า "จัดสรร (allocated)" และมีคำอธิบายว่าไม่ใช่ Inventory ของ Quest นั้น ไม่มีช่องให้แก้จำนวนจัดสรรโดยตรง

#### AC-F4-05 mode ของ Requirement ใช้กฎเดียวกับ Ingredient (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture B-surplus (Quest `Smith's Favor` ต้องการ Iron Ingot × 1)
- ขั้นตอน:
  1. ถอด T1 ออกจาก Tracking Target ให้เหลือ `Smith's Favor` อย่างเดียว ตั้ง Inventory Iron Ingot = 0
  2. ดู Gathering List
  3. เปลี่ยน `mode` ของ Requirement เป็น `gather`
- ผลที่คาดหวัง: ขั้นตอน 2 แสดง Iron Ore 3 / 2 / 1, Coal 1 / 0 / 1 และ Craft Plan R2 × 1 ขั้นตอน 3 แสดง Iron Ingot 1 / 0 / 1 เท่านั้น Craft Plan ว่าง

#### AC-F4-06 ลบ Quest (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. ลบ Quest B แล้วยืนยัน
- ผลที่คาดหวัง: แถว `quest`, `quest_requirement` และ `tracking_target` ของ Quest B หาย Items และ Inventory ไม่เปลี่ยน Gathering List = Iron Ore 30 / 20 / 10, Wood 15 / 5 / 10 (Leather ไม่ปรากฏ)

#### AC-F4-07 ติดตามหลาย Quests พร้อมกันและเห็นสิ่งที่ขาดทันที (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. เปิด Quest Tracker โดยไม่คลิกเข้า Quest ใด
- ผลที่คาดหวัง: รายการ Quest แต่ละแถวแสดงสรุปจำนวน Item ที่ยังขาดของ Quest นั้น (Quest A ขาด 0 รายการ, Quest B ขาด 2 รายการ) โดยไม่ต้องเปิดดูทีละ Quest

---

## 7. F5 Global Material Aggregation และ Gathering List (Requirement 3.5)

#### AC-F5-01 รวม Materials ชนิดเดียวกันจากทุก Target (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. เปิด Gathering List (`#/gathering`)
- ผลที่คาดหวัง: ตารางแสดง Iron Ore 45 / 20 / 25, Wood 15 / 5 / 10, Leather 8 / 3 / 5 ตรงตามตัวอย่าง Requirement 3.5 ทุกตัวเลข ไม่มีแถว `Iron Armor` ในส่วน Gather Items

#### AC-F5-02 Overall Progress (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. ดูส่วนสรุปท้าย Gathering List และ Game Dashboard
- ผลที่คาดหวัง: แสดง 28 / 68 ทั้งสองที่ สูตรคือ Σ min(Owned, Required) / Σ Required เฉพาะ Gather Items

#### AC-F5-03 เพิ่มหรือถอด Target แล้วตัวเลขเปลี่ยนทันที (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. ถอด Craft C ออกจาก Tracking Targets
  2. เพิ่ม Craft C กลับ
- ผลที่คาดหวัง: หลังขั้นตอน 1 ตารางเป็น Iron Ore 25 / 20 / 5, Wood 5 / 5 / 0, Leather 8 / 3 / 5 Progress 28 / 38 โดยไม่ต้องกด Refresh หรือเปลี่ยนหน้า หลังขั้นตอน 2 กลับเป็นค่าของ AC-F5-01

#### AC-F5-04 เลือกเฉพาะ Target ที่ต้องการคำนวณ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A พร้อม Quest `Ancient Equipment` จาก AC-F4-01 ซึ่งยังไม่เป็น Target
- ขั้นตอน:
  1. ใน Gathering List เปิดส่วนเลือก Target
- ผลที่คาดหวัง: แสดง Quest ทุกตัวและ Recipe ทุกตัวของ Profile โดยติ๊กเฉพาะที่เป็น Tracking Target อยู่ (Quest A, Quest B, Craft C) การติ๊ก `Ancient Equipment` เพิ่มแถว `tracking_target` ชนิด `quest` และ Magic Crystal 8 / 0 / 8 ปรากฏทันที

#### AC-F5-05 การจัดสรรตามลำดับ Priority ที่ผู้ใช้เปลี่ยนได้ (Phase 2) [ความเสี่ยง: R-19]

- เงื่อนไขเริ่มต้น: Fixture C
- ขั้นตอน:
  1. ดู Progress ของ Quest A และ Quest B ใน Quest Tracker และ Gathering List
  2. ลากหรือใช้ปุ่มเลื่อนให้ Quest B อยู่ก่อน Quest A
  3. ปิดและเปิดแอปใหม่
- ผลที่คาดหวัง: ขั้นตอน 1: A 10 / 10, B 10 / 15 (ขาด 5) ขั้นตอน 2: B 15 / 15, A 5 / 10 (ขาด 5) ทันที Global Required 25 / Owned 20 / Missing 5 ไม่เปลี่ยนทั้งสองกรณี ขั้นตอน 3 ลำดับคงอยู่ (`tracking_target.priority` ถูกบันทึก)

#### AC-F5-06 Nested Recipe ขยายถึง Raw Materials และแสดง Craft Plan (Phase 2) [ความเสี่ยง: R-19]

- เงื่อนไขเริ่มต้น: Fixture B
- ขั้นตอน:
  1. เปิด Gathering List
- ผลที่คาดหวัง: Gather Items = Iron Ore 6 / 2 / 4, Coal 2 / 0 / 2, Wood 2 / 0 / 2 Overall Progress 2 / 10 ส่วน Craft Plan แยกต่างหากแสดง R2 (Iron Ingot) × 2 runs พร้อม Required 4 / Owned 1 Iron Ingot ไม่ถูกนับใน Overall Progress

#### AC-F5-07 หัก Intermediate Item ที่มีอยู่แล้วก่อนขยาย (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture B-owned (Iron Ingot Owned 4)
- ขั้นตอน:
  1. เปิด Gathering List
- ผลที่คาดหวัง: Gather Items = Wood 2 / 0 / 2 เท่านั้น ไม่มี Iron Ore หรือ Coal Craft Plan ว่าง Overall Progress 0 / 2

#### AC-F5-08 ตัวเลือก gather แทนการขยาย (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture B-gather
- ขั้นตอน:
  1. เปิด Gathering List
- ผลที่คาดหวัง: Gather Items = Iron Ingot 4 / 1 / 3, Wood 2 / 0 / 2 Craft Plan ว่าง Overall Progress 1 / 6 เมื่อสลับ `mode` กลับเป็น `craft` ผลลัพธ์กลับเป็น AC-F5-06 ทันที

#### AC-F5-09 ไม่นับ Owned ซ้ำเมื่อ Item เดียวกันถูกต้องการทั้งทางตรงและผ่าน Recipe ย่อย (Phase 2) [ความเสี่ยง: R-19]

- เงื่อนไขเริ่มต้น: Fixture B-direct
- ขั้นตอน:
  1. เปิด Gathering List
- ผลที่คาดหวัง: Iron Ore 7 / 2 / 5 (Owned 2 ถูกใช้ครั้งเดียว), Coal 2 / 0 / 2, Wood 2 / 0 / 2 Overall Progress 2 / 11

#### AC-F5-10 Surplus จากการ craft ถูกใช้กับ Target ถัดไป (Phase 2) [ความเสี่ยง: R-19]

- เงื่อนไขเริ่มต้น: Fixture B-surplus
- ขั้นตอน:
  1. เปิด Gathering List และ Quest Tracker
- ผลที่คาดหวัง: Gathering List เท่ากับ AC-F5-06 ทุกค่า และ Craft Plan ยัง R2 × 2 runs ไม่ใช่ 3 (Required เพิ่มเป็น 5 / Owned 1 เพราะ T2 ต้องการ Iron Ingot อีก 1) Quest `Smith's Favor` แสดง Iron Ingot จัดสรร 1 / 1 พร้อมหมายเหตุว่ามาจากผลผลิตที่วางแผน craft

#### AC-F5-11 Owned มากกว่า Required ไม่ทำให้ Missing ติดลบ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A แล้วตั้ง Leather Owned = 10
- ขั้นตอน:
  1. ดู Gathering List
- ผลที่คาดหวัง: Leather 8 / 10 / 0 แสดงสถานะครบ Overall Progress 33 / 68 (min(10, 8) = 8)

#### AC-F5-12 ตัวเลขอ้างอิงข้อมูลปัจจุบันเสมอ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. แก้ Requirement ของ Quest B จาก Iron Ore × 15 เป็น × 25
  2. แก้ Owned ของ Wood จากหน้า Item Library เป็น 15
- ผลที่คาดหวัง: Gathering List แสดง Iron Ore 55 / 20 / 35 และ Wood 15 / 15 / 0 ทันทีโดยไม่มีค่าที่คำนวณไว้ก่อนค้างอยู่ (Requirement 5: ไม่เก็บค่าซ้ำโดยไม่จำเป็น) ตรวจฐานข้อมูลแล้วไม่มีตารางหรือคอลัมน์ที่เก็บ Required/Missing

#### AC-F5-13 จัดเรียงรายการที่ยังขาดก่อนเป็นค่าเริ่มต้น และซ่อนรายการที่ครบแล้ว (Phase 4)

- เงื่อนไขเริ่มต้น: Fixture A แล้วตั้ง Wood Owned = 15
- ขั้นตอน:
  1. เปิด Gathering List
  2. เปิดตัวเลือก "ซ่อนรายการที่ครบแล้ว"
  3. ปิดและเปิดแอปใหม่
- ผลที่คาดหวัง: ขั้นตอน 1 ลำดับคือ Iron Ore (ขาด 25), Leather (ขาด 5), Wood (ครบ) โดยรายการครบมีสีสถานะต่างจากรายการขาด ขั้นตอน 2 Wood หายจากตารางแต่ Overall Progress ยังนับ Wood (38 / 68) ขั้นตอน 3 ตัวเลือกคงอยู่ (เก็บใน `app_setting.preferences`)

#### AC-F5-14 ค้นหาและกรองใน Gathering List (Phase 4)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. พิมพ์ `ore` ในช่องค้นหา
  2. กรองตาม Target = Quest B
- ผลที่คาดหวัง: ขั้นตอน 1 เหลือ Iron Ore ขั้นตอน 2 เหลือ Iron Ore และ Leather โดยตัวเลข Global ไม่เปลี่ยน (ตัวกรองเป็นการแสดงผล ไม่ใช่การถอด Target)

---

## 8. F6 Manual Inventory Tracking (Requirement 3.6)

#### AC-F6-01 ปุ่ม + และ − (Phase 2) [ความเสี่ยง: R-18]

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. ใน Gathering List กด `+` ที่ Iron Ore 2 ครั้ง
  2. กด `−` 1 ครั้ง
- ผลที่คาดหวัง: Owned 20 → 21 → 22 → 21 Missing 25 → 24 → 23 → 24 Overall Progress เปลี่ยนตาม (29 / 68 ที่ Owned 21) `inventory.owned` ในฐานข้อมูลเป็น 21 และ `inventory.updated_at` เปลี่ยน

#### AC-F6-02 กำหนดจำนวนโดยตรง (Phase 2) [ความเสี่ยง: R-18]

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. คลิกตัวเลข Owned ของ Wood พิมพ์ `12` กด Enter
  2. คลิกอีกครั้ง พิมพ์ `abc` กด Enter
  3. คลิกอีกครั้ง พิมพ์ `7` กด Esc
- ผลที่คาดหวัง: ขั้นตอน 1 Owned = 12 Missing = 3 ขั้นตอน 2 ค่าไม่เปลี่ยนและแสดงข้อผิดพลาด ขั้นตอน 3 ยกเลิก ค่ายัง 12

#### AC-F6-03 ปรับหลายหน่วยในครั้งเดียว +1 / +5 / +10 (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A (Iron Ore Owned 20)
- ขั้นตอน:
  1. เลือกขนาดก้าว 5 แล้วกด `+` 1 ครั้ง
  2. เลือกขนาดก้าว 10 แล้วกด `+` 1 ครั้ง
  3. เลือกขนาดก้าว 1 แล้วกด `−` 1 ครั้ง
- ผลที่คาดหวัง: Owned 20 → 25 → 35 → 34 Missing 25 → 20 → 10 → 11 ขนาดก้าวที่ให้เลือกมีอย่างน้อย 1, 5, 10 (ชุดค่า `app_setting.preferences.stepSizes` ค่าเริ่มต้น [1, 5, 10] ตาม F7-R4) ขั้นที่เลือกอยู่เป็นสถานะของหน้าจอ (ค่าเริ่มต้น 1) ไม่ถูกบันทึกข้ามการเปิดแอป และแสดงเป็นตัวเลือกแบบ Segmented ตาม UI/UX Design Plan

#### AC-F6-04 จำนวนไม่ติดลบ (Phase 2)

- เงื่อนไขเริ่มต้น: Item `Coal` Owned 0 และ Item `Wood` Owned 3
- ขั้นตอน:
  1. กด `−` ที่ Coal
  2. พิมพ์ `-5` เป็นค่า Owned ของ Coal
  3. เลือกขนาดก้าว 10 แล้วกด `−` ที่ Wood
- ผลที่คาดหวัง: ขั้นตอน 1 ค่ายัง 0 (ปุ่มปิดใช้งานหรือไม่มีผล) ขั้นตอน 2 ถูกปฏิเสธ ค่ายัง 0 ขั้นตอน 3 ค่าของ Wood ไม่ต่ำกว่า 0 (ระบบปัดเป็น 0 ตาม F7-R2 และปุ่ม `−` ปิดใช้งานที่ 0 ตาม F7-R10) ไม่มี Error `CHECK constraint failed` หลุดถึงผู้ใช้ในทุกกรณี และค่าที่แสดงบนหน้าจอตรงกับฐานข้อมูล

#### AC-F6-05 Missing และ Progress อัปเดตแบบ Real-time ทุกหน้าจอ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A เปิด Gathering List
- ขั้นตอน:
  1. กด `+` ที่ Leather 5 ครั้ง
  2. สลับไป Quest Tracker ดู Quest B แล้วไป Game Dashboard
- ผลที่คาดหวัง: Leather 8 / 8 / 0 เปลี่ยนสถานะเป็นครบทันทีหลังกดครั้งที่ 5 Quest B แสดง Leather 8 / 8 Dashboard แสดง 33 / 68 โดยไม่ต้องโหลดหน้าใหม่ (ค่าถูก Push ผ่าน `gathering:changed`)

#### AC-F6-06 Auto-save และคงอยู่หลังปิดเปิดแอป (Phase 2) [ความเสี่ยง: R-14]

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. ตั้ง Iron Ore Owned = 33 โดยไม่กดปุ่มบันทึกใด ๆ
  2. ปิดแอปทันทีจากปุ่มปิดหน้าต่าง
  3. เปิดแอปใหม่
- ผลที่คาดหวัง: Iron Ore Owned = 33 ไม่มีปุ่ม "Save" ในหน้าจอ ค่าอยู่ใน `inventory.owned` ของไฟล์ `%APPDATA%\looter-app\data\gamelooter.sqlite`

#### AC-F6-07 ข้อมูลคงอยู่หลังรีสตาร์ตเครื่อง (Phase 2) [ความเสี่ยง: R-14]

- เงื่อนไขเริ่มต้น: Fixture A บน ENV-W11 ติดตั้งจาก Installer
- ขั้นตอน:
  1. ตั้ง Wood Owned = 9 และ Pin Leather
  2. รีสตาร์ต Windows โดยไม่ปิดแอปก่อน
  3. เปิดแอป
- ผลที่คาดหวัง: Wood Owned = 9, Leather ยัง Pinned, Active Profile เดิม ไม่มีข้อความฐานข้อมูลเสียหาย (WAL ถูก Recover อัตโนมัติ)

#### AC-F6-08 Inventory เดียวใช้ร่วมกันทุก Target ใน Profile (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture C
- ขั้นตอน:
  1. กด `+` Iron Ore 5 ครั้งจากหน้า Quest A
  2. ดู Quest B และ Gathering List
- ผลที่คาดหวัง: Owned เป็น 25 ที่เดียว Quest A 10 / 10, Quest B 15 / 15, Global 25 / 25 / 0 ไม่มี Inventory แยกราย Quest

#### AC-F6-09 Inventory แยกตาม Profile (Phase 2)

- เงื่อนไขเริ่มต้น: AC-F1-05 (Iron Ore ใน `Testbed` = 20, ใน `Other` = 3)
- ขั้นตอน:
  1. ใน `Other` กด `+` Iron Ore 2 ครั้ง
  2. สลับไป `Testbed`
- ผลที่คาดหวัง: `Other` = 5, `Testbed` ยัง 20

---

## 9. F7 Windows In-Game Overlay (Requirement 3.7)

#### AC-F7-01 เปิด Overlay ด้วย Hotkey และแสดงทับเกม Borderless Windowed (Phase 3) [ความเสี่ยง: R-03, R-04]

- เงื่อนไขเริ่มต้น: ENV-GAME เกมตั้งค่า Borderless Windowed, Fixture A, แอปเปิดอยู่แต่ย่อหน้าต่างหลัก
- ขั้นตอน:
  1. โฟกัสหน้าต่างเกม กด `Ctrl+Shift+O`
  2. คลิกในเกมเพื่อให้เกมได้โฟกัสอีกครั้ง รอ 10 วินาที
  3. กด `Ctrl+Shift+O` อีกครั้ง
- ผลที่คาดหวัง: Overlay ปรากฏทับเกมโดยเกมยังมีโฟกัส (ไม่ย่อเกม) Overlay ยังอยู่บนสุดหลังขั้นตอน 2 ขั้นตอน 3 ซ่อน Overlay หน้าต่าง Overlay ไม่ปรากฏบน Taskbar (`skipTaskbar`) พื้นหลังโปร่งใส เห็นเกมผ่านบริเวณที่ไม่มีเนื้อหา

#### AC-F7-02 View Mode เป็น Click-through (Phase 3) [ความเสี่ยง: R-04]

- เงื่อนไขเริ่มต้น: Overlay แสดงอยู่ใน View Mode ทับปุ่มหรือเมนูของเกม
- ขั้นตอน:
  1. คลิกบนบริเวณ Overlay ที่ทับปุ่มของเกม
  2. ลากเมาส์ผ่าน Overlay
- ผลที่คาดหวัง: คลิกส่งถึงเกม (ปุ่มของเกมทำงาน) Overlay ไม่ได้รับโฟกัสและไม่ขยับ Cursor ของเกมแสดงตามปกติ (`setIgnoreMouseEvents(true, { forward: true })`)

#### AC-F7-03 Interactive Mode ใช้ปุ่ม + และ − ได้ (Phase 3) [ความเสี่ยง: R-04]

- เงื่อนไขเริ่มต้น: Overlay แสดงอยู่, Fixture A, หน้าต่างหลักเปิด Gathering List อยู่บนจออื่นหรือข้างกัน
- ขั้นตอน:
  1. กด `Ctrl+Shift+M` เพื่อเข้า Interactive Mode
  2. กด `+` ที่ Iron Ore บน Overlay 2 ครั้ง และ `−` 1 ครั้ง
- ผลที่คาดหวัง: Overlay แสดง Iron Ore 21 / 45 Missing 24 และหน้าต่างหลักแสดงค่าเดียวกันภายใน 100 ms (ดู AC-PERF-02) ฐานข้อมูลเป็น 21 ใน Interactive Mode Overlay มีตัวบ่งชี้โหมดที่มองเห็นได้ชัด (เช่น ขอบหรือสีหัวข้อ ตาม UI/UX Design Plan)

#### AC-F7-04 สลับโหมดด้วย Hotkey และจำโหมดล่าสุด (Phase 3)

- เงื่อนไขเริ่มต้น: Overlay อยู่ใน View Mode
- ขั้นตอน:
  1. กด `Ctrl+Shift+M` สองครั้ง สังเกตแต่ละครั้ง
  2. ตั้งเป็น Interactive แล้วปิดแอป เปิดใหม่ เปิด Overlay
- ผลที่คาดหวัง: ครั้งแรกเป็น Interactive ครั้งที่สองกลับเป็น View (กด `Esc` ใน Overlay ขณะ Interactive ได้ผลเท่ากัน) หลังขั้นตอน 2 Overlay เปิดในโหมดที่บันทึกไว้ (`app_setting.overlay.mode` ตาม F9-R3) ผู้ใช้ตั้ง View เป็นโหมดเริ่มต้นได้ใน Settings → Overlay (ค่าเริ่มต้น `view`)

#### AC-F7-05 ปรับ Opacity และจำค่า (Phase 3)

- เงื่อนไขเริ่มต้น: Overlay แสดงอยู่
- ขั้นตอน:
  1. ใน Settings → Overlay ปรับ Opacity ไปค่าต่ำสุดที่อนุญาต แล้วไปค่าสูงสุด
  2. ตั้งค่ากลาง (เช่น 70%) ปิดและเปิดแอปใหม่
- ผลที่คาดหวัง: Overlay เปลี่ยนความทึบทันทีขณะเลื่อน (`setOpacity`) ที่ค่าต่ำสุดข้อความยังอ่านได้ ที่ค่าสูงสุด = 100% ช่วงค่าที่แน่นอน ต้องตรวจสอบกับ UI/UX Design Plan หลังขั้นตอน 2 Overlay เปิดที่ 70% (`app_setting.overlay.opacity`)

#### AC-F7-06 ย้ายตำแหน่งและปรับขนาด บันทึก Bounds (Phase 3) [ความเสี่ยง: R-11]

- เงื่อนไขเริ่มต้น: Overlay ใน Interactive Mode
- ขั้นตอน:
  1. ลาก Overlay ไปมุมล่างขวาของจอ ปรับขนาดให้กว้างขึ้น
  2. สลับเป็น View Mode แล้วกลับ Interactive
  3. ปิดแอป เปิดใหม่ เปิด Overlay
- ผลที่คาดหวัง: Overlay ย้ายและปรับขนาดได้เฉพาะ Interactive Mode ตำแหน่งและขนาดคงเดิมในขั้นตอน 2 และ 3 (`app_setting.overlay.bounds`) ถ้าจอเดิมไม่มีแล้ว Overlay ต้องปรากฏในจอที่มองเห็นได้

#### AC-F7-07 Compact Mode (Phase 3)

- เงื่อนไขเริ่มต้น: Overlay แสดง Fixture A
- ขั้นตอน:
  1. เปิด Compact Mode จาก Overlay (Interactive) หรือ Settings
- ผลที่คาดหวัง: แต่ละรายการใช้พื้นที่น้อยลง (เช่น หนึ่งบรรทัดต่อ Item) แต่ยังแสดง Thumbnail, ชื่อ, Owned / Required และ Missing ค่าถูกจำ (`app_setting.overlay.compact`) และ Overall Progress ยังแสดง

#### AC-F7-08 แสดง Pinned Items และ Pinned Targets พร้อม Hotkey เลื่อนเป้าหมาย (Phase 3)

- เงื่อนไขเริ่มต้น: Fixture A, Pin Item `Leather` และ Pin Target Quest A กับ Craft C
- ขั้นตอน:
  1. เปิด Overlay
  2. กด `Ctrl+Shift+]` แล้ว `Ctrl+Shift+[`
- ผลที่คาดหวัง: ส่วน Pinned แสดง `Leather` 3 / 8 Missing 5 ขั้นตอน 2 Overlay เลื่อนไปแสดงรายละเอียดของ Target ถัดไป (Craft C) แล้วกลับมา Quest A โดยแสดงชื่อ Target ปัจจุบันชัดเจน รายการที่ไม่ได้ Pin ไม่หายจากส่วนรวม (การจัดวางส่วน Pinned กับส่วนรวม ต้องตรวจสอบกับ UI/UX Design Plan)

#### AC-F7-09 เนื้อหา Overlay ตรงตาม Mockup ของ Requirement 3.7 (Phase 3)

- เงื่อนไขเริ่มต้น: Fixture A, Iron Ore มีรูป
- ขั้นตอน:
  1. เปิด Overlay
- ผลที่คาดหวัง: แต่ละแถวแสดง [รูป] ชื่อ, `Owned / Required` และ `Missing n` ได้แก่ Iron Ore 20 / 45 Missing 25, Wood 5 / 15 Missing 10, Leather 3 / 8 Missing 5 และท้ายรายการ Overall Progress 28 / 68 รายการที่ยังขาดอยู่ก่อนรายการที่ครบ

#### AC-F7-10 Overlay และหน้าต่างหลักเป็นแหล่งข้อมูลเดียวกัน (Phase 3)

- เงื่อนไขเริ่มต้น: Overlay และ Gathering List เปิดพร้อมกัน
- ขั้นตอน:
  1. กด `+` Wood ในหน้าต่างหลัก
  2. ถอด Quest B ออกจาก Target ในหน้าต่างหลัก
  3. สลับ Active Profile เป็น `Other`
- ผลที่คาดหวัง: Overlay อัปเดตทุกครั้งโดยไม่ต้องปิดเปิด ขั้นตอน 3 Overlay แสดงข้อมูลของ `Other` (`profile:changed` และ `gathering:changed` ถูก Push ไปทั้งสองหน้าต่าง)

#### AC-F7-11 กลับมาอยู่บนสุดเมื่อเกมแย่ง Topmost (Phase 3) [ความเสี่ยง: R-03]

- เงื่อนไขเริ่มต้น: ENV-GAME, Overlay แสดงอยู่
- ขั้นตอน:
  1. สลับเกมจาก Windowed เป็น Borderless Windowed ขณะ Overlay เปิด
  2. Alt+Tab ไปโปรแกรมอื่นแล้วกลับมาเกม
- ผลที่คาดหวัง: Overlay กลับมาอยู่บนสุดภายในช่วงเวลาที่ Architecture Proposal กำหนดสำหรับการ Re-apply `setAlwaysOnTop` (ค่าช่วงเวลา ต้องตรวจสอบ) โดยไม่ต้องกด Hotkey ซ้ำ

#### AC-F7-12 ข้อจำกัด Fullscreen Exclusive ถูกสื่อสารชัดเจน (Phase 3) [ความเสี่ยง: R-01, R-02, L-04]

- เงื่อนไขเริ่มต้น: ENV-GAME ตั้งค่าเกมเป็น Fullscreen Exclusive
- ขั้นตอน:
  1. กด `Ctrl+Shift+O`
  2. เปิด Settings → Overlay
- ผลที่คาดหวัง: Overlay ไม่แสดงทับเกม (ข้อจำกัดของระบบปฏิบัติการ ไม่ถือว่าไม่ผ่าน) Settings มีคำอธิบายว่า Overlay รองรับ Borderless Windowed และแนะนำให้เปลี่ยนโหมดเกม แอปไม่พยายาม Inject หรือหลบเลี่ยง Anti-Cheat ใด ๆ และไม่ Crash

#### AC-F7-13 สถานะแสดงผลของ Overlay คงอยู่หลังรีสตาร์ต (Phase 3)

- เงื่อนไขเริ่มต้น: Overlay แสดงอยู่
- ขั้นตอน:
  1. ปิดแอปขณะ Overlay แสดง แล้วเปิดใหม่
  2. ซ่อน Overlay ปิดแอป แล้วเปิดใหม่
- ผลที่คาดหวัง: ขั้นตอน 1 Overlay กลับมาแสดงเอง ขั้นตอน 2 ไม่แสดง (`app_setting.overlay.visible`) (ตาม F9-R2 ค่า `visible` ถูกคืนเมื่อเริ่มแอป)

---

## 10. F8 Screenshot & Capture Workflow (Requirement 3.8)

#### AC-F8-01 เริ่ม Capture ด้วย Hotkey และเห็น Screenshot ของจอที่เคอร์เซอร์อยู่ (Phase 4)

- เงื่อนไขเริ่มต้น: ENV-GAME Borderless Windowed, แอปเปิดอยู่
- ขั้นตอน:
  1. วางเคอร์เซอร์บนจอเกม กด `Ctrl+Shift+X`
- ผลที่คาดหวัง: Capture window (`capture.html`) แบบ Frameless เต็มจอปรากฏบนจอนั้นภายใน 1 วินาที (เป้าหมาย) แสดงภาพนิ่งของจอ ณ ขณะกด พร้อมคำแนะนำให้ลากเลือกบริเวณและกด Esc เพื่อยกเลิก Capture window ไม่ปรากฏบน Taskbar

#### AC-F8-02 เลือกบริเวณ ตั้งชื่อ และสร้าง Item ใหม่ (Phase 4)

- เงื่อนไขเริ่มต้น: ต่อจาก AC-F8-01
- ขั้นตอน:
  1. ลากเลือกบริเวณไอคอน Item ในเกม
  2. ใน Dialog เลือก "สร้าง Item ใหม่" กรอกชื่อ `Magic Crystal` หมวด `material` บันทึก
- ผลที่คาดหวัง: Capture window ปิดทันทีหลังปล่อยเมาส์ Dialog แสดงภาพที่ Crop แล้ว หลังบันทึกมี Item `Magic Crystal` ใน Active Profile พร้อม `<item_id>.png` และ `thumbs\<item_id>.png` (64 × 64) ตามรูปแบบ AC-F2-05 ขั้นตอนทั้งหมดไม่เกิน 3 การกระทำหลังเลือกบริเวณ (เลือกประเภท, กรอกชื่อ, บันทึก)

#### AC-F8-03 ผูกภาพกับ Item ที่มีอยู่ (Phase 4)

- เงื่อนไขเริ่มต้น: มี Item `Wood` ไม่มีรูป
- ขั้นตอน:
  1. Capture บริเวณใดก็ได้ ใน Dialog เลือก "ผูกกับ Item ที่มีอยู่" ค้นหา `wood` เลือก `Wood` บันทึก
- ผลที่คาดหวัง: `Wood` ได้รูปใหม่ ไม่เกิด Item ซ้ำ ช่องค้นหาใน Dialog กรองได้ทันทีเหมือน AC-F2-04

#### AC-F8-04 Crop ตรง Pixel บนจอ Scale 150% (Phase 4) [ความเสี่ยง: R-10]

- เงื่อนไขเริ่มต้น: ENV-DPI (150%) เปิดภาพอ้างอิงที่มีสี่เหลี่ยมสีทึบขนาด 300 × 200 px (Physical Pixel) ที่ Zoom 100% พร้อมเส้นขอบสีตัดกัน
- ขั้นตอน:
  1. กด `Ctrl+Shift+X` ลากเลือกให้ครอบสี่เหลี่ยมพอดีขอบ
  2. บันทึกเป็น Item `DPI Test`
  3. เปิดไฟล์ `<item_id>.png` ด้วยโปรแกรมดูภาพที่แสดงขนาดไฟล์เป็น Pixel
- ผลที่คาดหวัง: ไฟล์มีขนาดเท่ากับบริเวณที่เลือกใน Physical Pixel (300 × 200 px เมื่อลากตรงขอบ คลาดเคลื่อนได้ไม่เกิน 1 px ต่อด้านจากการลาก) ไม่ใช่ 200 × 133 px และไม่มีการย่อขยายที่ทำให้ขอบเบลอ Pixel มุมทั้งสี่มีสีของสี่เหลี่ยม (Screenshot ใช้ `thumbnailSize` = ขนาดจอ × `scaleFactor` และ Crop ด้วยพิกัดที่คูณ `scaleFactor` แล้ว)

#### AC-F8-05 Multi-monitor เลือกจอที่เคอร์เซอร์อยู่ (Phase 4) [ความเสี่ยง: R-11]

- เงื่อนไขเริ่มต้น: ENV-MULTI จอหลัก 100% จอรอง 150%
- ขั้นตอน:
  1. วางเคอร์เซอร์บนจอรอง กด `Ctrl+Shift+X`
  2. Esc แล้ววางเคอร์เซอร์บนจอหลัก กดอีกครั้ง
- ผลที่คาดหวัง: ขั้นตอน 1 Capture window เต็มจอรองและแสดงภาพของจอรอง จอหลักไม่มีหน้าต่างทึบขึ้นมา ขั้นตอน 2 สลับเป็นจอหลัก ขนาดภาพที่ Crop จากจอรองเป็นไปตาม AC-F8-04 ด้วย `scaleFactor` ของจอรอง

#### AC-F8-06 ยกเลิกและทำลายหน้าต่าง Capture (Phase 4)

- เงื่อนไขเริ่มต้น: Capture window เปิดอยู่
- ขั้นตอน:
  1. กด Esc
  2. เปิด Capture อีกครั้ง แล้วคลิกโดยไม่ลาก
  3. ตรวจจำนวน Process ของแอปใน Task Manager หลังปิด
- ผลที่คาดหวัง: ขั้นตอน 1 และ 2 ปิด Capture window โดยไม่สร้าง Item จำนวน Process กลับเท่ากับก่อนเริ่ม Capture (Capture window ถูก Destroy ไม่ใช่ซ่อน) การกด `Ctrl+Shift+X` ซ้ำขณะ Capture window เปิดอยู่ไม่สร้างหน้าต่างซ้อน

#### AC-F8-07 ภาพดำหรือถูกปฏิเสธ แสดงทางเลือกสำรอง (Phase 4) [ความเสี่ยง: R-08, R-09, L-05]

- เงื่อนไขเริ่มต้น: ENV-GAME ตั้งค่า Fullscreen Exclusive หรือเปิดเนื้อหาที่ถูกป้องกัน (เช่น วิดีโอ DRM) เต็มจอ
- ขั้นตอน:
  1. กด `Ctrl+Shift+X`
- ผลที่คาดหวัง: เมื่อภาพที่จับได้เป็นสีดำทั้งหมด (เกณฑ์ตรวจจับ เช่น สัดส่วน Pixel ดำ ต้องตรวจสอบกับ Feature Specification) หรือการจับภาพถูกปฏิเสธ แอปไม่เปิดหน้าเลือกบริเวณบนภาพดำ แต่แสดงข้อความอธิบายพร้อมทางเลือก "กด Win+Shift+S แล้ว Paste from clipboard" และ "Import image file" ไม่มี Crash และหน้าต่างหลักยังใช้งานได้

#### AC-F8-08 วางภาพจาก Clipboard หลัง Win+Shift+S ด้วย Hotkey (Phase 4) [ความเสี่ยง: R-08, R-12]

- เงื่อนไขเริ่มต้น: แอปเปิดอยู่ Active Profile `Testbed`
- ขั้นตอน:
  1. กด Win+Shift+S เลือกบริเวณไอคอนในเกม (Snipping Tool คัดลอกลง Clipboard)
  2. กด `Ctrl+Shift+V`
  3. ใน Dialog กรอกชื่อ `Clip Test` บันทึก
- ผลที่คาดหวัง: Dialog เดียวกับ AC-F8-02 เปิดพร้อมภาพจาก Clipboard สร้าง Item พร้อม PNG และ Thumbnail ขนาดภาพเท่ากับที่ Snipping Tool คัดลอก (ไม่มีการย่อ)

#### AC-F8-09 Clipboard ไม่มีรูป (Phase 4) [ความเสี่ยง: R-12]

- เงื่อนไขเริ่มต้น: คัดลอกข้อความลง Clipboard
- ขั้นตอน:
  1. กด `Ctrl+Shift+V`
- ผลที่คาดหวัง: แสดงข้อความว่าไม่มีรูปภาพใน Clipboard ไม่เปิด Dialog สร้าง Item

#### AC-F8-10 ภาพที่ Capture ใช้ได้ทันทีใน Recipe, Quest และ Overlay (Phase 4)

- เงื่อนไขเริ่มต้น: Fixture A โดย `Leather` ไม่มีรูป Overlay เปิดอยู่
- ขั้นตอน:
  1. Capture ภาพผูกกับ `Leather`
- ผลที่คาดหวัง: Thumbnail ของ Leather ปรากฏใน Gathering List, Quest B, Recipes ที่ใช้ Leather และบน Overlay โดยไม่ต้องรีสตาร์ตหรือเปิด Overlay ใหม่

#### AC-F8-11 สร้าง Item อย่างรวดเร็วจาก Gathering List หรือ Overlay (Phase 4)

- เงื่อนไขเริ่มต้น: Fixture A
- ขั้นตอน:
  1. ใช้ปุ่ม "เพิ่ม Item เร็ว" ใน Gathering List กรอกชื่อ `Herb` กด Enter
- ผลที่คาดหวัง: Item `Herb` ถูกสร้างใน Active Profile หมวด `material` Owned 0 ภายในหนึ่งขั้นตอน และโฟกัสยังอยู่ในหน้าเดิม (การมีปุ่มนี้บน Overlay ต้องตรวจสอบกับ UI/UX Design Plan)

---

## 11. F9 Consume Materials และ Craft (Requirement 10 ข้อ 13)

#### AC-F9-01 Consume Materials ของ Quest หักจำนวนใน Transaction เดียว (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture D-ok
- ขั้นตอน:
  1. ใน Quest Tracker เลือก Quest A กด "Consume materials"
  2. อ่านกล่องยืนยัน แล้วยืนยัน
- ผลที่คาดหวัง: กล่องยืนยันแสดงรายการที่จะหัก (Iron Ore −10, Wood −5) และผลหลังหัก (10, 0) และตัวเลือก "ตั้งสถานะ Quest เป็น Completed ด้วย" ที่ติ๊กอยู่เป็นค่าเริ่มต้น (F8-R7) ปุ่มยืนยันไม่ใช่ปุ่ม Default ของ `Enter` (F8-R12) หลังยืนยัน `inventory.owned` Iron Ore = 10, Wood = 0 และสถานะ Quest A เปลี่ยนเป็น `completed` เฉพาะเมื่อไม่ได้ยกเลิกตัวเลือกนั้น (ถ้ายกเลิกตัวเลือก สถานะ Quest A ไม่เปลี่ยน) Gathering List คำนวณใหม่ทันที

#### AC-F9-02 Consume ถูกปฏิเสธทั้งหมดเมื่อมี Item ใดไม่พอ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture D-short (Iron Ore 12 พอ, Wood 3 ไม่พอ)
- ขั้นตอน:
  1. เลือก Quest A กด "Consume materials" แล้วยืนยัน
- ผลที่คาดหวัง: ถูกปฏิเสธพร้อมข้อความระบุว่า Wood ขาด 2 Iron Ore ยัง 12 และ Wood ยัง 3 (ไม่มีการหักบางส่วน เพราะทำใน Transaction เดียวและตรวจก่อนเขียน) ปุ่มยืนยันอาจปิดใช้งานไว้ก่อนเมื่อไม่พอ แต่ถ้ามีการแข่งกันเปลี่ยนค่าระหว่างเปิดกล่องยืนยัน ผลต้องเป็นการปฏิเสธทั้งหมดเช่นกัน

#### AC-F9-03 Craft หัก Ingredients และเพิ่ม Output (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture D-ok (Iron Ore 20, Coal 3, Iron Ingot 1)
- ขั้นตอน:
  1. ใน Recipes เลือก R2 กด "Craft" ระบุ 2 runs ยืนยัน
- ผลที่คาดหวัง: Iron Ore 20 → 14, Coal 3 → 1, Iron Ingot 1 → 5 ทั้งสามค่าเปลี่ยนพร้อมกัน (Transaction เดียว) กล่องยืนยันแสดงทั้งรายการหักและรายการเพิ่ม การหักใช้ Ingredient ระดับตรงของ Recipe นั้นคูณ runs ไม่ขยาย Recipe ย่อย (นโยบายนี้ ต้องตรวจสอบกับ Feature Specification)

#### AC-F9-04 Craft ถูกปฏิเสธเมื่อ Ingredient ไม่พอ (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture D-short (Coal 1)
- ขั้นตอน:
  1. Craft R2 จำนวน 2 runs ยืนยัน
- ผลที่คาดหวัง: ถูกปฏิเสธ ระบุ Coal ขาด 1 Iron Ore 12, Coal 1, Iron Ingot 1 ไม่เปลี่ยน

#### AC-F9-05 ยกเลิกกล่องยืนยัน (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture D-ok
- ขั้นตอน:
  1. กด "Consume materials" ของ Quest A แล้วกดยกเลิก
  2. กด "Craft" R2 แล้วกดยกเลิก
- ผลที่คาดหวัง: ไม่มีค่าใดเปลี่ยนทั้งสองกรณี

#### AC-F9-06 Craft ของ Recipe ที่เป็น Target ลด target_qty ตามจำนวนที่ Craft (Phase 2) [ความเสี่ยง: R-19]

- เงื่อนไขเริ่มต้น: Fixture D-ok, R2 เป็น Tracking Target `target_qty` 4
- ขั้นตอน:
  1. ใน Recipes เลือก R2 กด "Craft" ระบุ 1 run เห็นตัวเลือก "ลด `target_qty` ตามจำนวนที่ Craft" ติ๊กอยู่เป็นค่าเริ่มต้น (F8-R11) แล้วยืนยัน
  2. ทำซ้ำโดยยกเลิกตัวเลือกนั้น
- ผลที่คาดหวัง: ขั้นตอน 1 Iron Ore 20 → 17, Coal 3 → 2, Iron Ingot 1 → 3 และ `target_qty` ของ R2 ลดจาก 4 เป็น 2 (ลง `output_qty × runs` = 2) ทั้งหมดใน Transaction เดียว ขั้นตอน 2 Inventory เปลี่ยนเท่ากัน แต่ `target_qty` ไม่เปลี่ยน Recipe ไม่มีคำสั่ง "Consume materials" แยกต่างหาก (Consume มีเฉพาะ Quest ตาม F8-R1) การ Craft จนเหลือ `target_qty` ≤ 0 ลบแถว `tracking_target` ออกใน Transaction เดียวกัน

---

## 12. F10 Settings และ Hotkeys (Requirement 4 ข้อ 7, Requirement 5)

#### AC-F10-01 ค่า Default ของ Hotkeys (Phase 3) [ความเสี่ยง: R-05]

- เงื่อนไขเริ่มต้น: ติดตั้งใหม่ ไม่มี `app_setting.hotkeys`
- ขั้นตอน:
  1. เปิด Settings → Hotkeys
- ผลที่คาดหวัง: แสดง 6 รายการตามหัวข้อ 2.5 ด้วยค่า Default ทุกค่าลงทะเบียนสำเร็จ (ไม่มีเครื่องหมายเตือน) และใช้งานได้จากหน้าต่างเกมที่มีโฟกัส

#### AC-F10-02 เปลี่ยน Hotkey แล้วมีผลทันทีและจำค่า (Phase 3)

- เงื่อนไขเริ่มต้น: Hotkeys เป็น Default
- ขั้นตอน:
  1. เปลี่ยน "Toggle overlay visible" เป็น `CommandOrControl+Alt+O` บันทึก
  2. กด `Ctrl+Shift+O` แล้วกด `Ctrl+Alt+O`
  3. ปิดและเปิดแอปใหม่ กด `Ctrl+Alt+O`
- ผลที่คาดหวัง: ขั้นตอน 2 ค่าเดิมไม่มีผล ค่าใหม่สลับ Overlay ได้โดยไม่ต้องรีสตาร์ต (ยกเลิกและลงทะเบียนใหม่ด้วย `globalShortcut`) ขั้นตอน 3 ยังใช้ได้ (`app_setting.hotkeys`) ปุ่ม "คืนค่า Default" คืนค่าทั้งหมดตามหัวข้อ 2.5

#### AC-F10-03 Hotkey ซ้ำกันภายในแอปถูกปฏิเสธ (Phase 3)

- เงื่อนไขเริ่มต้น: Hotkeys เป็น Default
- ขั้นตอน:
  1. ตั้ง "Start region capture" เป็น `CommandOrControl+Shift+O` (ซ้ำกับ Toggle overlay visible) บันทึก
- ผลที่คาดหวัง: ถูกปฏิเสธก่อนบันทึก พร้อมระบุว่าซ้ำกับการกระทำใด ค่าเดิมคงอยู่ Accelerator ที่ไม่ถูกต้องตามรูปแบบของ Electron (เช่น `Shift` เดี่ยว ๆ) ถูกปฏิเสธด้วยเช่นกัน

#### AC-F10-04 Hotkey ชนกับโปรแกรมอื่น แสดงใน Settings (Phase 3) [ความเสี่ยง: R-05]

- เงื่อนไขเริ่มต้น: โปรแกรมภายนอกจอง `Ctrl+Shift+X` ไว้ก่อน (เช่น Script AutoHotkey `^+x::return` เครื่องมือที่ทีมเลือกใช้ ต้องตรวจสอบ) แล้วจึงเปิดแอป
- ขั้นตอน:
  1. เปิด Settings → Hotkeys
  2. กด `Ctrl+Shift+O`
  3. ปิดโปรแกรมภายนอก แล้วกด "ลงทะเบียนใหม่" (หรือบันทึก Hotkey เดิมซ้ำ)
- ผลที่คาดหวัง: ขั้นตอน 1 รายการ "Start region capture" มีเครื่องหมายเตือนว่าลงทะเบียนไม่สำเร็จ (`globalShortcut.register` คืนค่า `false`) พร้อมคำแนะนำให้เปลี่ยนค่า ขั้นตอน 2 Hotkey อื่นยังทำงาน ขั้นตอน 3 เครื่องหมายเตือนหายและ Hotkey ใช้ได้

#### AC-F10-05 ตำแหน่งและขนาดหน้าต่างหลักถูกจำ (Phase 1)

- เงื่อนไขเริ่มต้น: แอปเปิดอยู่
- ขั้นตอน:
  1. ย้ายและปรับขนาดหน้าต่างหลัก ปิดแอป เปิดใหม่
  2. Maximize ปิด เปิดใหม่
- ผลที่คาดหวัง: หน้าต่างเปิดที่ตำแหน่งและขนาดเดิม (`app_setting.window`) และสถานะ Maximize ถูกจำ ถ้าตำแหน่งเดิมอยู่นอกจอที่มีอยู่ หน้าต่างถูกย้ายเข้ามาในพื้นที่ที่มองเห็นได้ ไม่มี Log `console.log` ของตำแหน่งหน้าต่างเหมือนโค้ดเดิมใน `electron/settings/index.js`

#### AC-F10-06 Preferences ถูกจำ (Phase 2, ธีมและการจัดเรียงใน Phase 4)

- เงื่อนไขเริ่มต้น: ค่า Default
- ขั้นตอน:
  1. แก้ชุดขนาดก้าว (`stepSizes`) เป็น [1, 5, 25], เปิด "ซ่อนรายการที่ครบแล้ว", เปลี่ยนการจัดเรียง (Phase 4) (ธีมยังไม่มีตัวเลือกให้ผู้ใช้ตาม F11-R8)
  2. ปิดและเปิดแอปใหม่
- ผลที่คาดหวัง: ทุกค่าคงอยู่ในคีย์ `app_setting.preferences` (JSON หนึ่งค่า) และมีผลกับทุก Profile (Preferences ไม่ผูกกับ Profile ตาม F11-R8) ขั้นที่เลือกอยู่ของหน้าจอไม่ถูกบันทึก

#### AC-F10-07 การตั้งค่า Overlay จาก Settings (Phase 3)

- เงื่อนไขเริ่มต้น: Overlay แสดงอยู่
- ขั้นตอน:
  1. ใน Settings → Overlay เปลี่ยน Opacity, Compact, และโหมดเริ่มต้น
- ผลที่คาดหวัง: Overlay เปลี่ยนตามทันทีทุกค่า และค่าทั้งหมดอยู่ใต้คีย์ `app_setting.overlay` เป็น JSON เดียว (`bounds`, `opacity`, `mode`, `compact`, `visible`)

#### AC-F10-08 ส่วน About แสดงเวอร์ชันและสถานะ Update (Phase 5) [ความเสี่ยง: R-26]

- เงื่อนไขเริ่มต้น: Installer เวอร์ชันตาม `package.json`
- ขั้นตอน:
  1. เปิด Settings → About
- ผลที่คาดหวัง: แสดงเวอร์ชันแอปตรงกับ `package.json` และ Installer, เวอร์ชัน Electron, Path ของโฟลเดอร์ข้อมูล (`%APPDATA%\looter-app\data`) พร้อมปุ่มเปิดโฟลเดอร์ ส่วน Update ระบุว่ายังไม่เปิดใช้ Auto-update และไม่มีการเรียกเครือข่ายใด ๆ (ดู AC-PKG-05)

---

## 13. F11 Backup, Restore, Export และ Import (Requirement 5)

#### AC-F11-01 Export สร้าง ZIP พร้อม manifest (Phase 5) [ความเสี่ยง: R-14, R-17]

- เงื่อนไขเริ่มต้น: Profile `Testbed` มี Fixture A และ B รวมรูป 3 ไฟล์, Profile `Other` มี Item 1 รายการ
- ขั้นตอน:
  1. Settings → Backup เลือก "Export" เลือกตำแหน่งไฟล์
  2. เปิด ZIP ด้วยโปรแกรมบีบอัด
- ผลที่คาดหวัง: ZIP มี `manifest.json` (ฟิลด์ `appVersion`, `schemaVersion`, `exportedAt`), ไฟล์ฐานข้อมูล (สำเนาจาก `db.backup()` ไม่มี `-wal`/`-shm`) และโฟลเดอร์ `images\` ครบทุกไฟล์ของทุก Profile การ Export ทำได้ขณะแอปเปิดและมีข้อมูลเปลี่ยนแปลงอยู่โดยไม่ Error

#### AC-F11-02 Import บนเครื่องติดตั้งใหม่ได้ข้อมูลเท่าเดิม (Phase 5)

- เงื่อนไขเริ่มต้น: ENV-W11 ติดตั้งใหม่ ไม่มีข้อมูล ไฟล์ ZIP จาก AC-F11-01
- ขั้นตอน:
  1. Settings → Backup เลือก "Import" เลือก ZIP ยืนยันว่าจะแทนที่ข้อมูลปัจจุบัน
  2. ตรวจทุกหน้าจอและฐานข้อมูล
- ผลที่คาดหวัง: จำนวนแถวในทุกตารางเท่ากับต้นทาง, Gathering List ของ `Testbed` แสดง 45 / 20 / 25, 15 / 5 / 10, 8 / 3 / 5, รูปทั้ง 3 แสดงได้, ลำดับ Target เท่าเดิม, Active Profile และ Hotkeys ที่บันทึกใน `app_setting` เท่าเดิม แอปไม่ต้องรีสตาร์ตด้วยมือ (หรือรีสตาร์ตเองโดยอัตโนมัติ ต้องตรวจสอบกับ Feature Specification)

#### AC-F11-03 Round-trip: Export → Import → Export ได้ข้อมูลเหมือนเดิม (Phase 5)

- เงื่อนไขเริ่มต้น: ต่อจาก AC-F11-02
- ขั้นตอน:
  1. Export อีกครั้งเป็นไฟล์ที่สอง
  2. เปรียบเทียบ ZIP ทั้งสอง
- ผลที่คาดหวัง: รายชื่อไฟล์ใน ZIP เท่ากัน ไฟล์รูปเหมือนกันทุก Byte `manifest.json` ต่างกันเฉพาะ `exportedAt` ข้อมูลในฐานข้อมูลเท่ากันทุกตาราง (เปรียบเทียบด้วย `sqlite3 .dump` หรือ Query นับแถวและ Checksum เครื่องมือ ต้องตรวจสอบ)

#### AC-F11-04 Import ไฟล์ที่ไม่ถูกต้องถูกปฏิเสธและข้อมูลเดิมไม่เปลี่ยน (Phase 5) [ความเสี่ยง: R-16]

- เงื่อนไขเริ่มต้น: มีข้อมูล Fixture A เตรียม ZIP ที่ไม่มี `manifest.json`, ZIP ที่ `manifest.json` เสีย และไฟล์ที่ไม่ใช่ ZIP
- ขั้นตอน:
  1. Import แต่ละไฟล์
- ผลที่คาดหวัง: ทุกกรณีถูกปฏิเสธพร้อมเหตุผล ข้อมูลเดิมยังอยู่ครบ (การตรวจ manifest เกิดก่อนแตะไฟล์ใน `data\`)

#### AC-F11-05 Import ตาม schemaVersion (Phase 5) [ความเสี่ยง: R-16]

- เงื่อนไขเริ่มต้น: ZIP ที่ `schemaVersion` สูงกว่าที่แอปรองรับ และ ZIP ที่ `schemaVersion` ต่ำกว่า (ถ้ามี Migration มากกว่า 1 แล้ว)
- ขั้นตอน:
  1. Import แต่ละไฟล์
- ผลที่คาดหวัง: เวอร์ชันสูงกว่าถูกปฏิเสธพร้อมข้อความให้อัปเดตแอป เวอร์ชันต่ำกว่าถูก Import แล้วรัน Migration ในโฟลเดอร์ชั่วคราวก่อนสลับ ผลลัพธ์ `PRAGMA user_version` เท่ากับเวอร์ชันปัจจุบันของแอป นโยบายเวอร์ชันสูงกว่า ต้องตรวจสอบกับ Feature Specification

#### AC-F11-06 Restore เป็น Atomic (Phase 5) [ความเสี่ยง: R-16]

- เงื่อนไขเริ่มต้น: มีข้อมูล Fixture A และ ZIP ที่ถูกต้องแต่ไฟล์ฐานข้อมูลภายในถูกทำให้เสียหาย (ตัดท้ายไฟล์)
- ขั้นตอน:
  1. Import ZIP นั้น
- ผลที่คาดหวัง: Import ล้มเหลวที่ขั้นตรวจสอบหรือ Migration ในโฟลเดอร์ชั่วคราว ข้อมูลเดิมใน `data\` ไม่ถูกแตะ แอปยังเปิด Fixture A ได้ตามปกติ ไม่มีไฟล์ชั่วคราวค้าง

#### AC-F11-07 สำรองข้อมูลก่อน Restore (Phase 5) [ความเสี่ยง: R-14]

- เงื่อนไขเริ่มต้น: มีข้อมูล Fixture A
- ขั้นตอน:
  1. Import ZIP ที่ถูกต้อง (ข้อมูลต่างชุด)
- ผลที่คาดหวัง: ก่อนสลับข้อมูล แอปสร้างสำเนาของข้อมูลเดิมไว้ (ย้าย `data` เดิมไป `<userData>backupspre-restore-<timestamp>` ตาม F11-R11) และแจ้งตำแหน่งให้ผู้ใช้ทราบหลัง Restore สำเร็จ

---

## 14. F12 Schema Migrations และความปลอดภัยของข้อมูล (Requirement 5)

#### AC-F12-01 ติดตั้งใหม่สร้าง Schema ที่ user_version 1 (Phase 1) [ความเสี่ยง: R-14]

- เงื่อนไขเริ่มต้น: ลบโฟลเดอร์ `%APPDATA%\looter-app\data` (ถ้ามี)
- ขั้นตอน:
  1. เปิดแอปจนถึง Game Dashboard แล้วปิด
  2. เปิดไฟล์ `gamelooter.sqlite` ด้วยเครื่องมือภายนอก
- ผลที่คาดหวัง: `PRAGMA user_version` = 1, `PRAGMA journal_mode` = `wal`, มีตาราง `game_profile`, `item`, `inventory`, `recipe`, `recipe_ingredient`, `quest`, `quest_requirement`, `tracking_target`, `app_setting` ครบ พร้อม Index `item(profile_id, name)`, `recipe(profile_id)`, `quest(profile_id, status)`, `tracking_target(profile_id, priority)`, `recipe_ingredient(item_id)`, `quest_requirement(item_id)` และข้อจำกัด CHECK/UNIQUE ตาม Data Model โฟลเดอร์ `images\` ถูกสร้าง Migration อยู่ที่ `electron/database/migrations/001-*.ts`

#### AC-F12-02 เปิดแอปซ้ำไม่รัน Migration ซ้ำ (Phase 1)

- เงื่อนไขเริ่มต้น: ต่อจาก AC-F12-01 มี Profile 1 รายการ
- ขั้นตอน:
  1. เปิดและปิดแอป 3 ครั้ง
- ผลที่คาดหวัง: `user_version` ยัง 1 ข้อมูลครบ ไม่มี Error ใน Log ว่า "table already exists"

#### AC-F12-03 อัปเกรด Schema คงข้อมูลเดิมและสำรองก่อน Migrate (Phase 5 หรือเมื่อมี Migration 002) [ความเสี่ยง: R-15]

- เงื่อนไขเริ่มต้น: ฐานข้อมูล `user_version` = N ที่มี Fixture A และรูป 1 ไฟล์ Build ใหม่ที่มี Migration N+1 (ถ้ายังไม่มี Migration จริง ให้ใช้ Migration ทดสอบที่เพิ่มคอลัมน์ NULL ได้ในสาขาทดสอบ ต้องตรวจสอบแนวทางกับ Roadmap)
- ขั้นตอน:
  1. ติดตั้ง Build ใหม่ทับ แล้วเปิดแอป
  2. ตรวจ Gathering List และฐานข้อมูล
- ผลที่คาดหวัง: `user_version` = N+1 Gathering List ยังเป็น 45 / 20 / 25, 15 / 5 / 10, 8 / 3 / 5 รูปยังแสดง มีไฟล์สำรองของฐานข้อมูลก่อน Migrate (ตำแหน่ง ต้องตรวจสอบกับ Data Model) Migration แต่ละไฟล์รันใน Transaction เดียวและ Bump `user_version` ทีละขั้น

#### AC-F12-04 Migration ล้มเหลวต้อง Rollback (Phase 5) [ความเสี่ยง: R-15]

- เงื่อนไขเริ่มต้น: Build ทดสอบที่ Migration N+1 ถูกทำให้ล้มเหลวกลางทาง (เช่น SQL ผิด) ฐานข้อมูล `user_version` = N
- ขั้นตอน:
  1. เปิดแอป
- ผลที่คาดหวัง: แอปแสดงข้อความว่าอัปเกรดฐานข้อมูลไม่สำเร็จพร้อมตำแหน่งไฟล์สำรอง `user_version` ยัง N ข้อมูลเดิมครบ ไม่มีตารางหรือคอลัมน์ครึ่ง ๆ กลาง ๆ จาก Migration ที่ล้มเหลว

#### AC-F12-05 ไฟล์ JSON ของโค้ดเดิมไม่มีผล (Phase 1)

- เงื่อนไขเริ่มต้น: มีโฟลเดอร์ `%APPDATA%\looter-app\Database\` ที่มี `Game.json`, `Item.json`, `ItemCraft.json`, `Recipe.json`, `public.json`, `publuc.json` จากโค้ดเดิม
- ขั้นตอน:
  1. เปิดแอป
- ผลที่คาดหวัง: แอปเปิดปกติ ไม่อ่าน ไม่เขียน และไม่ลบไฟล์เหล่านั้น (ไม่มี Migration จาก JSON) ไม่มี Log ที่อ้าง `jsonpath-plus` หรือ `yaml`

#### AC-F12-06 Foreign Keys ถูกบังคับทุก Connection (Phase 1)

- เงื่อนไขเริ่มต้น: Schema จาก AC-F12-01
- ขั้นตอน:
  1. ทดสอบตาม AC-F2-08 (RESTRICT) และ AC-F1-06 (CASCADE)
  2. ใช้เครื่องมือภายนอกขณะปิดแอป ตรวจ `PRAGMA foreign_key_check`
- ผลที่คาดหวัง: พฤติกรรม RESTRICT และ CASCADE เป็นไปตามเกณฑ์ที่อ้าง `foreign_key_check` ไม่คืนแถวใด (ไม่มี Orphan) โค้ดเปิดฐานข้อมูลตั้ง `PRAGMA foreign_keys = ON` ทุกครั้ง

#### AC-F12-07 การเขียนหลายแถวอยู่ใน Transaction เดียว (Phase 2)

- เงื่อนไขเริ่มต้น: หน้าสร้าง Recipe
- ขั้นตอน:
  1. สร้าง Recipe ที่มี Ingredient 3 แถว โดยแถวที่ 3 อ้าง Item ที่ถูกลบไปแล้วจากอีกหน้าต่างหรือจากการแก้ไขพร้อมกัน (จำลองด้วยการลบ Item ขณะ Dialog เปิดอยู่)
- ผลที่คาดหวัง: การบันทึกล้มเหลวทั้งชุด ไม่มีแถว `recipe` ที่ไม่มี Ingredient ค้าง (`db.transaction()` ครอบ Recipe และ Ingredients) ข้อความแจ้งว่า Item ใดไม่มีแล้ว

#### AC-F12-08 ไม่มีการเขียนลงไฟล์นอก userData (Phase 1)

- เงื่อนไขเริ่มต้น: ติดตั้งจาก Installer บน ENV-W11
- ขั้นตอน:
  1. ใช้งานแอปครบทุกหน้าจอ 5 นาที รวม Capture และ Export ไปโฟลเดอร์ที่ผู้ใช้เลือก
  2. ตรวจโฟลเดอร์ติดตั้งและ `%APPDATA%\looter-app`
- ผลที่คาดหวัง: ไฟล์ที่แอปสร้างเองทั้งหมดอยู่ใน `%APPDATA%\looter-app\data` (ยกเว้นไฟล์ Export ที่ผู้ใช้เลือกตำแหน่งและไฟล์ Log/Cache ของ Chromium ใต้ `%APPDATA%\looter-app`) โฟลเดอร์ติดตั้งไม่ถูกเขียน

---

## 15. เกณฑ์ข้ามฟีเจอร์: UX (Requirement 4)

#### AC-UX-01 Dark Mode เป็นค่าเริ่มต้น (Phase 1)

- เงื่อนไขเริ่มต้น: ติดตั้งใหม่ Windows ตั้งธีมเป็น Light
- ขั้นตอน:
  1. เปิดแอป
- ผลที่คาดหวัง: หน้าต่างหลักแสดงธีมมืดโดยไม่ขึ้นกับธีมของ Windows Title Bar Overlay ใช้สีเข้มเดียวกัน ไม่มีการกะพริบเป็นสีขาวตอนโหลด

#### AC-UX-02 นำทางครบทุกหน้าจอด้วย Hash Route (Phase 1)

- เงื่อนไขเริ่มต้น: แอปเปิดอยู่
- ขั้นตอน:
  1. คลิกเมนูไปยัง Game Dashboard, Item Library, Recipes, Quest Tracker, Gathering List, Settings ตามลำดับ
  2. กด Back ของ Router (ถ้ามี) หรือสังเกต URL ใน DevTools
- ผลที่คาดหวัง: Route เป็น `#/`, `#/items`, `#/recipes`, `#/quests`, `#/gathering`, `#/settings` ตามลำดับ เมนูปัจจุบันถูกเน้น โหลดจาก `file://` ใน Build จริงได้ (Hash History) ไม่มีหน้าว่างหรือ 404

#### AC-UX-03 ใช้งานด้วยคีย์บอร์ดได้ (Phase 2)

- เงื่อนไขเริ่มต้น: Gathering List แสดง Fixture A
- ขั้นตอน:
  1. ใช้ Tab เลื่อนไปที่ปุ่ม `+` ของ Iron Ore กด Enter
  2. Tab ไปที่ตัวเลข Owned พิมพ์ค่า Enter
- ผลที่คาดหวัง: ทุกปุ่มและช่องกรอกเข้าถึงได้ด้วย Tab มี Focus Indicator ที่มองเห็น (ต้องไม่ถูกลบด้วย `outline: none` แบบโค้ดเดิมโดยไม่มีสไตล์ทดแทน) การกระทำเทียบเท่าการใช้เมาส์

#### AC-UX-04 สีสถานะและ Progress Bar แยกรายการครบกับรายการขาด (Phase 2)

- เงื่อนไขเริ่มต้น: Fixture A แล้วตั้ง Wood Owned = 15
- ขั้นตอน:
  1. ดู Gathering List
- ผลที่คาดหวัง: Wood ใช้สีสถานะครบ Iron Ore และ Leather ใช้สีสถานะขาด แต่ละแถวมี Progress Bar สัดส่วน Owned / Required (Iron Ore 44%, Leather 38% โดยประมาณ) สีตาม UI/UX Design Plan และอ่านได้ในธีมมืด

#### AC-UX-05 สรุป Materials ที่ต้องเก็บในหน้าจอเดียว (Phase 2)

- เงื่อนไขเริ่มต้น: Profile ที่มี Target 10 รายการ และ Gather Items 30 รายการ
- ขั้นตอน:
  1. เปิด Gathering List
- ผลที่คาดหวัง: เห็น Required / Owned / Missing และ Overall Progress ของทั้ง Profile ในหน้าเดียวโดยเลื่อนในตารางเดียว ไม่ต้องเปิดดูทีละ Target

---

## 16. เกณฑ์ข้ามฟีเจอร์: Performance (เป้าหมาย)

ค่าทั้งหมดในหัวข้อนี้เป็น **เป้าหมาย** ที่ใช้เปรียบเทียบระหว่าง Build และใช้ประกอบการตัดสินใจใน Phase 5 ไม่ใช่เงื่อนไขบังคับผ่าน/ไม่ผ่าน วัดบน ENV-W11 ด้วย Build จาก Installer และบันทึกสเปกเครื่องที่ใช้วัดทุกครั้ง ("PC ทั่วไป" หมายถึงเครื่องที่ทีมกำหนดเป็นเครื่องอ้างอิง ต้องตรวจสอบ)

#### AC-PERF-01 Overlay ขณะไม่มีการเปลี่ยนแปลงใช้ CPU ประมาณ 0% (Phase 3) [ความเสี่ยง: R-06, R-07]

- เงื่อนไขเริ่มต้น: Overlay แสดง Fixture A ใน View Mode ไม่มีการกดปุ่มใด
- ขั้นตอน:
  1. เปิด Task Manager → Details สังเกต Process Renderer ของ Overlay 60 วินาที
- ผลที่คาดหวัง: CPU เฉลี่ย ≤ 0.5% และไม่มี Animation หรือ Timer ที่ทำให้ GPU ทำงานต่อเนื่อง (เป้าหมาย) การ Re-apply Always-on-top ตาม AC-F7-11 ต้องไม่ทำให้ค่านี้เกินเป้าหมาย

#### AC-PERF-02 ความหน่วงการอัปเดตหลังกด + / − น้อยกว่า 100 ms (Phase 2 หน้าต่างหลัก, Phase 3 รวม Overlay) [ความเสี่ยง: R-06]

- เงื่อนไขเริ่มต้น: Fixture A, Overlay และ Gathering List แสดงพร้อมกัน
- ขั้นตอน:
  1. บันทึกหน้าจอที่ 60 fps แล้วกด `+` บน Overlay
  2. นับเฟรมจากเฟรมที่ปุ่มถูกกดถึงเฟรมที่ทั้งสองหน้าต่างแสดงค่าใหม่
- ผลที่คาดหวัง: ≤ 6 เฟรม (≈ 100 ms) สำหรับ Profile ที่มี Item ไม่เกิน 500 รายการและ Target ไม่เกิน 50 รายการ (เป้าหมาย) การคำนวณใหม่ทำใน Main Process และ Debounce ไม่เกิน 16 ms

#### AC-PERF-03 เวลาเปิดหน้าต่างหลักน้อยกว่า 3 วินาที (Phase 1 วัดครั้งแรก, Phase 5 ยืนยัน)

- เงื่อนไขเริ่มต้น: ENV-W11 เปิดเครื่องแล้วอย่างน้อย 2 นาที แอปยังไม่เปิด
- ขั้นตอน:
  1. จับเวลาจากดับเบิลคลิก Shortcut จนถึง Game Dashboard ตอบสนองการคลิกได้ ทำ 3 ครั้ง
- ผลที่คาดหวัง: ค่ามัธยฐาน < 3 วินาที (เป้าหมาย) Overlay และ Capture window ไม่ถูกสร้างตอนเริ่ม (Lazy Create) ตรวจได้จากจำนวน Process

#### AC-PERF-04 หน่วยความจำรวมอยู่ในช่วงที่ Architecture Proposal ประเมิน (Phase 3) [ความเสี่ยง: R-06]

- เงื่อนไขเริ่มต้น: หน้าต่างหลักและ Overlay เปิดพร้อมกันด้วย Fixture A
- ขั้นตอน:
  1. รวม Working Set ของทุก Process ของแอปใน Task Manager หลังใช้งาน 5 นาที
- ผลที่คาดหวัง: ประมาณ 150–250 MB (เป้าหมายตาม Architecture Proposal) และไม่เพิ่มขึ้นต่อเนื่องเมื่อกด + / − ซ้ำ 200 ครั้ง (ไม่มี Memory Leak ที่สังเกตได้)

#### AC-PERF-05 การคำนวณรวมกับข้อมูลหลายร้อยแถว (Phase 2)

- เงื่อนไขเริ่มต้น: Profile ที่มี Item 500 รายการ, Recipe 100 รายการซ้อนลึก 4 ชั้น, Target 50 รายการ
- ขั้นตอน:
  1. กด `+` ที่ Item ใดก็ได้ใน Gathering List
- ผลที่คาดหวัง: ตัวเลขอัปเดตภายใน 100 ms (เป้าหมายเดียวกับ AC-PERF-02) ไม่มีการค้างของ UI และ Log เวลาคำนวณ (ถ้ามี) ต่ำกว่า 16 ms

#### AC-PERF-06 ทรัพยากรกลับสู่ปกติหลัง Capture (Phase 4) [ความเสี่ยง: R-06]

- เงื่อนไขเริ่มต้น: แอปเปิดอยู่
- ขั้นตอน:
  1. ทำ Capture 10 ครั้งติดกัน (สำเร็จ 5 ยกเลิก 5)
- ผลที่คาดหวัง: จำนวน Process และหน่วยความจำรวมกลับใกล้ค่าก่อนเริ่ม (ต่างไม่เกิน 20 MB) Capture window ถูก Destroy ทุกครั้ง

---

## 17. เกณฑ์ข้ามฟีเจอร์: Packaging และ Distribution

#### AC-PKG-01 Build สร้าง Installer ตามการตั้งค่า (Phase 1 ตรวจครั้งแรก, Phase 5 ยืนยัน) [ความเสี่ยง: R-13]

- เงื่อนไขเริ่มต้น: ENV-DEV ผ่าน `bun install --frozen-lockfile`
- ขั้นตอน:
  1. รัน `bun run build`
- ผลที่คาดหวัง: ได้ `release/<version>/GameLooter-Windows-<version>-Setup.exe` (NSIS x64), `latest.yml` และ `.blockmap` โดย `<version>` ตรงกับ `package.json` ไม่มี Target อื่นนอกจาก Windows x64 เมื่อเพิ่ม better-sqlite3 แล้ว `electron-builder.json5` ต้องมี `"npmRebuild": false` และ Build ผ่านโดยไม่ต้องมี Python หรือ Visual Studio Build Tools

#### AC-PKG-02 ติดตั้งและใช้งานบน Windows 10 x64 ติดตั้งใหม่ (Phase 5)

- เงื่อนไขเริ่มต้น: ENV-W10
- ขั้นตอน:
  1. รัน Installer เลือกโฟลเดอร์ติดตั้งเอง (`oneClick: false`, `allowToChangeInstallationDirectory: true`)
  2. เปิดแอป ทำ AC-F1-01, AC-F5-01, AC-F6-06
- ผลที่คาดหวัง: ติดตั้งแบบ Per-user สำเร็จโดยไม่ต้องสิทธิ์ Administrator แอปเปิดและเกณฑ์ที่อ้างผ่าน ไม่มีข้อความขาด DLL หรือ Visual C++ Runtime

#### AC-PKG-03 ติดตั้งและใช้งานบน Windows 11 x64 ติดตั้งใหม่ (Phase 5)

- เงื่อนไขเริ่มต้น: ENV-W11
- ขั้นตอน: เหมือน AC-PKG-02
- ผลที่คาดหวัง: เหมือน AC-PKG-02

#### AC-PKG-04 เปิดแอปขณะไม่มีเครือข่าย (Phase 5)

- เงื่อนไขเริ่มต้น: ENV-W11 ปิด Network Adapter ทั้งหมดก่อนเปิดแอปครั้งแรก
- ขั้นตอน:
  1. เปิดแอป สร้าง Profile เพิ่ม Item และรูปจากไฟล์
  2. ปิดแอป เปิดเครือข่าย เปิดแอปอีกครั้ง
- ผลที่คาดหวัง: ทุกขั้นตอนทำงานเหมือนมีเครือข่าย ไม่มีข้อความรอการเชื่อมต่อหรือ Timeout ไม่มีความล่าช้าในการเปิดจากการพยายามเชื่อมต่อ

#### AC-PKG-05 ไม่มีการเรียกเครือข่าย (Phase 5) [ความเสี่ยง: R-17, R-26]

- เงื่อนไขเริ่มต้น: ENV-W11 เปิดเครือข่าย เปิด Resource Monitor → Network หรือเครื่องมือจับ Packet (เครื่องมือ ต้องตรวจสอบ)
- ขั้นตอน:
  1. ใช้งานแอปครบทุกหน้าจอรวม Overlay, Capture, Export 10 นาที
- ผลที่คาดหวัง: ไม่มี Connection ขาออกจาก Process ของแอปเลย (ไม่มี Telemetry, ไม่มี Update Check, ไม่มี Font หรือ Script จาก CDN) Font ทั้งหมดโหลดจาก `public/fonts` ภายใน Package

#### AC-PKG-06 SmartScreen กับ Installer ที่ไม่ได้ลงนาม (Phase 5) [ความเสี่ยง: R-24, L-09]

- เงื่อนไขเริ่มต้น: ENV-W11 ดาวน์โหลด Installer ผ่านเบราว์เซอร์ (ให้มี Mark of the Web)
- ขั้นตอน:
  1. รัน Installer
- ผลที่คาดหวัง: Windows SmartScreen แสดงคำเตือน "Windows protected your PC" และติดตั้งต่อได้ผ่าน "More info → Run anyway" พฤติกรรมนี้ถือว่าคาดหมาย (ไม่มี Certificate) และต้องถูกระบุใน README หรือหน้า Release พร้อมขั้นตอนข้างต้น

#### AC-PKG-07 ถอนการติดตั้งไม่ลบข้อมูลผู้ใช้ (Phase 5)

- เงื่อนไขเริ่มต้น: ติดตั้งแล้วมีข้อมูล Fixture A
- ขั้นตอน:
  1. ถอนการติดตั้งจาก Settings → Apps
  2. ติดตั้งใหม่แล้วเปิดแอป
- ผลที่คาดหวัง: `%APPDATA%\looter-app\data` ยังอยู่ (`deleteAppDataOnUninstall: false`) หลังติดตั้งใหม่ข้อมูลกลับมาครบ

#### AC-PKG-08 ไอคอนแอปขนาด ≥ 256 × 256 (Phase 5) [ความเสี่ยง: R-23]

- เงื่อนไขเริ่มต้น: ก่อน Release
- ขั้นตอน:
  1. รัน `bun run build` อ่าน Log
  2. ตรวจไอคอนของ `.exe`, Shortcut และ Title Bar บน Windows 11
- ผลที่คาดหวัง: ไม่มีข้อความ "default Electron icon is used" ไอคอนเป็นของ GameLooter ทุกตำแหน่ง ไฟล์ `.ico` มีเลเยอร์ 256 × 256 (ปัจจุบัน `public/looter.ico` เป็น 128 × 128 จึงต้องแก้ก่อน Release)

#### AC-PKG-09 better-sqlite3 ทำงานใน Package (Phase 1) [ความเสี่ยง: R-13]

- เงื่อนไขเริ่มต้น: Build ที่มี better-sqlite3 ติดตั้งบน ENV-W11
- ขั้นตอน:
  1. เปิดแอป ทำ AC-F12-01
  2. ตรวจโฟลเดอร์ติดตั้ง
- ผลที่คาดหวัง: ฐานข้อมูลถูกสร้างและใช้งานได้ โมดูลอยู่ที่ `resources\app.asar.unpacked\node_modules\better-sqlite3\` พร้อม `prebuilds\win32-x64.node` ไม่มี Error "The module was compiled against a different Node.js version" ขนาด Package ไม่รวม Prebuild ของแพลตฟอร์มอื่นเมื่อการตัด `files` ตาม Roadmap ถูกทำแล้ว (Phase 5)

#### AC-PKG-10 High-DPI 100% ถึง 200% (Phase 5) [ความเสี่ยง: R-10]

- เงื่อนไขเริ่มต้น: ENV-DPI
- ขั้นตอน:
  1. ตั้ง Scale 100%, 125%, 150%, 200% ทีละค่า (Sign out/in ตามที่ Windows ต้องการ) เปิดแอปและ Overlay
- ผลที่คาดหวัง: ข้อความและ Thumbnail คมชัดทุกค่า Layout ไม่ล้น Overlay ปรากฏที่ตำแหน่งเดิมเมื่อเทียบกับจอ Capture ผ่าน AC-F8-04 ที่ 150% และ 200%

#### AC-PKG-11 Multi-monitor: หน้าต่างกลับมาในจอที่มองเห็น (Phase 5) [ความเสี่ยง: R-11]

- เงื่อนไขเริ่มต้น: ENV-MULTI หน้าต่างหลักและ Overlay อยู่บนจอรอง
- ขั้นตอน:
  1. ปิดแอป ถอดจอรอง เปิดแอป
- ผลที่คาดหวัง: หน้าต่างหลักและ Overlay ปรากฏบนจอหลักทั้งหมด (ไม่อยู่นอกจอ) เมื่อต่อจอรองกลับและเปิดแอปใหม่ ตำแหน่งที่บันทึกล่าสุดถูกใช้

#### AC-PKG-12 Security Baseline ของ Renderer (Phase 1)

- เงื่อนไขเริ่มต้น: Build ใด ๆ หลัง Phase 1
- ขั้นตอน:
  1. เปิด DevTools ในหน้าต่างหลัก รัน `typeof require`, `typeof process`, `typeof window.ipcRenderer`, `typeof window.api`
  2. อ่าน Console ตอนเริ่ม
- ผลที่คาดหวัง: สามค่าแรกเป็น `"undefined"` และ `window.api` เป็น `"object"` ที่มีเฉพาะ Namespace ตาม `electron/ipc/contracts.ts` (เช่น `profiles`, `items`, `inventory`, `tracking`, `gathering`, `overlay`, `capture`, `backup`, `on`) ไม่มี `invoke(channel)` แบบรับ Channel ใด ๆ Console ไม่มีคำเตือน "Insecure Content-Security-Policy" (ต้องมี CSP ใน `index.html` และ `overlay.html` การเพิ่ม CSP อยู่ใน Phase 1 หรือไม่ ต้องตรวจสอบกับ Roadmap)

---

## 18. เกณฑ์ข้ามฟีเจอร์: Tooling และ Repository

รันบน ENV-DEV ทุกครั้งก่อน Merge PR ของแต่ละ Phase

#### AC-TOOL-01 ติดตั้ง Dependencies จาก Lockfile (ทุก Phase)

- เงื่อนไขเริ่มต้น: ลบ `node_modules`
- ขั้นตอน:
  1. `bun install --frozen-lockfile`
- ผลที่คาดหวัง: สำเร็จโดยไม่แก้ `bun.lock` ไม่มี Lifecycle Script ใดรันนอกจากของ `electron` (`trustedDependencies: ["electron"]`) better-sqlite3 13 ไม่มี Install Script จึงไม่ต้องเพิ่มใน `trustedDependencies`

#### AC-TOOL-02 Lint ผ่าน (ทุก Phase)

- ขั้นตอน:
  1. `bun run lint`
- ผลที่คาดหวัง: `eslint .` จบด้วย 0 problems โค้ดใหม่ทั้งหมดใน `electron/**/*.ts` และ `src/**/*.{ts,vue}` อยู่ในขอบเขต Lint รายการ `ignores` ของ `electron/database/**`, `electron/settings/**`, `electron/helper.js` ถูกถอดออกเมื่อโค้ดเดิมถูกแทนที่ใน Phase 1

#### AC-TOOL-03 Type Check ผ่านเมื่อมี Node.js (ทุก Phase) [ความเสี่ยง: R-20]

- เงื่อนไขเริ่มต้น: Node.js 24 LTS อยู่ใน PATH (Bun รัน vue-tsc ไม่ได้)
- ขั้นตอน:
  1. `node --version`
  2. `bun run typecheck`
- ผลที่คาดหวัง: `typecheck:renderer` (vue-tsc กับ `tsconfig.app.json`) และ `typecheck:main` (tsc กับ `tsconfig.node.json`) ผ่านทั้งคู่ ไม่มี `any` ที่ไม่ตั้งใจใน IPC Contracts ถ้าไม่มี Node.js คำสั่งต้องล้มเหลวอย่างชัดเจน ไม่ใช่ผ่านแบบไม่ตรวจไฟล์ `.vue` และผลนี้ต้องถูกบันทึกใน PR ว่ารันที่ใด

#### AC-TOOL-04 Vite Build ผ่านโดยไม่มีคำเตือน (ทุก Phase)

- ขั้นตอน:
  1. `bun x vite build`
- ผลที่คาดหวัง: ได้ `dist/` (รวม `index.html`, `overlay.html`, `capture.html` เมื่อมีแล้ว), `dist-electron/main.js`, `dist-electron/preload.js` ไม่มีคำเตือน Unresolved Asset หรือ Chunk Size

#### AC-TOOL-05 Packaging Build ผ่าน (ทุก Phase) [ความเสี่ยง: R-13]

- ขั้นตอน:
  1. `bun run build`
- ผลที่คาดหวัง: ตาม AC-PKG-01 และ Log ไม่มี Error จาก @electron/rebuild

#### AC-TOOL-06 Audit ไม่มี Advisory ใน Runtime Dependencies (ทุก Phase) [ความเสี่ยง: R-22]

- ขั้นตอน:
  1. `bun audit`
- ผลที่คาดหวัง: Advisory ที่เหลือมีเฉพาะใน Build-time Dependencies (ปัจจุบัน 3 รายการ: `braces`, `sprintf-js`, `tmp`) ไม่มี Advisory ระดับ High หรือ Critical ในแพ็กเกจที่ถูก Bundle หรือ Unpack ลง Installer (`dependencies` ของ `package.json`) ผลถูกบันทึกใน PR

#### AC-TOOL-07 ไม่มี Whitespace Error และไฟล์ Generated ไม่ถูก Commit (ทุก Phase)

- ขั้นตอน:
  1. `git diff --check`
  2. `git status --short` หลัง Build
- ผลที่คาดหวัง: ขั้นตอน 1 ไม่มีผลลัพธ์ ขั้นตอน 2 ไม่มี `dist/`, `dist-electron/`, `release/`, `data/`, `node_modules/` ปรากฏเป็น Untracked หรือ Modified

#### AC-TOOL-08 Renderer ไม่ Import Node.js หรือ Electron (ทุก Phase)

- ขั้นตอน:
  1. ค้นหาใน `src/` ด้วย `rg "from 'electron'|from \"electron\"|node:" src`
  2. ตรวจ `vite.config.mts`
- ผลที่คาดหวัง: ไม่พบผลลัพธ์ใน `src/` ไม่มี `vite-plugin-electron-renderer` หรือ Polyfill ของ Node ใน Renderer `electron/domain/*.ts` ไม่ Import จาก `electron`

#### AC-TOOL-09 Dev Server และ HMR (ทุก Phase)

- ขั้นตอน:
  1. `bun run dev`
  2. แก้ไขข้อความใน Component ของ Renderer และแก้ไขไฟล์ใน `electron/`
- ผลที่คาดหวัง: Renderer อัปเดตโดยไม่รีโหลดทั้งหน้า Main/Preload ถูก Build ใหม่และ Electron รีสตาร์ตอัตโนมัติ

#### AC-TOOL-10 เวอร์ชันเครื่องมือตามข้อตกลง (ทุก Phase) [ความเสี่ยง: R-20, R-21]

- ขั้นตอน:
  1. อ่าน `package.json`
- ผลที่คาดหวัง: `typescript` อยู่ในช่วง `~5.9.x` (ห้าม TypeScript 6 หรือ 7), `packageManager` = `bun@1.4.2`, `engines.bun >= 1.4.2`, `engines.node >= 20.19.0`, `electron` = `44.7.0`, `better-sqlite3` อยู่ใน `dependencies` (ไม่ใช่ `devDependencies`) เมื่อเพิ่มแล้ว, `jsonpath-plus` และ `yaml` ถูกถอดเมื่อ Data Layer เดิมถูกแทนที่

---

## 19. ตารางสรุปเกณฑ์ปิดแต่ละ Phase

Phase จะถือว่าปิดได้เมื่อเกณฑ์ในคอลัมน์ "ต้องผ่าน" ผ่านทั้งหมดบน ENV-DEV และ (ตั้งแต่ Phase 2) ซ้ำบน ENV-W11 ด้วย Installer ส่วนเกณฑ์ PERF ต้องถูกวัดและบันทึกค่าแม้ไม่ถึงเป้าหมาย เกณฑ์ของ Phase ก่อนหน้าต้องยังผ่าน (Regression) ทุกครั้งที่ปิด Phase ถัดไป

| Phase | ต้องผ่าน | ต้องวัดและบันทึก (เป้าหมาย) |
|---|---|---|
| Phase 1 — Foundation | AC-F1-01, AC-F1-02, AC-F1-03, AC-F1-04, AC-F10-05, AC-F12-01, AC-F12-02, AC-F12-05, AC-F12-06, AC-F12-08, AC-UX-01, AC-UX-02, AC-PKG-01, AC-PKG-09, AC-PKG-12, AC-TOOL-01 ถึง AC-TOOL-10 | AC-PERF-03 |
| Phase 2 — Core Tracking | AC-F1-05, AC-F1-06, AC-F1-07, AC-F2-01 ถึง AC-F2-11 (ยกเว้นส่วน Overlay ของ AC-F2-07 และ AC-F2-11), AC-F3-01 ถึง AC-F3-08, AC-F4-01 ถึง AC-F4-07, AC-F5-01 ถึง AC-F5-12, AC-F6-01 ถึง AC-F6-09, AC-F9-01 ถึง AC-F9-06, AC-F10-06 (ส่วนขนาดก้าวและซ่อนรายการครบ), AC-F12-07, AC-UX-03, AC-UX-04, AC-UX-05, AC-TOOL-01 ถึง AC-TOOL-10 | AC-PERF-02 (หน้าต่างหลัก), AC-PERF-05 |
| Phase 3 — Windows Overlay | AC-F2-07 และ AC-F2-11 (ส่วน Overlay), AC-F7-01 ถึง AC-F7-13, AC-F10-01, AC-F10-02, AC-F10-03, AC-F10-04, AC-F10-07, AC-TOOL-01 ถึง AC-TOOL-10 | AC-PERF-01, AC-PERF-02 (รวม Overlay), AC-PERF-04 |
| Phase 4 — Capture & Productivity | AC-F5-13, AC-F5-14, AC-F8-01 ถึง AC-F8-11, AC-F10-06 (ส่วนธีมและการจัดเรียง), AC-TOOL-01 ถึง AC-TOOL-10 | AC-PERF-06 |
| Phase 5 — Optimization & Distribution | AC-F10-08, AC-F11-01 ถึง AC-F11-07, AC-F12-03, AC-F12-04, AC-PKG-02 ถึง AC-PKG-08, AC-PKG-10, AC-PKG-11, AC-TOOL-01 ถึง AC-TOOL-10 และ Regression ของเกณฑ์ทุก Phase บน ENV-W10 และ ENV-W11 | AC-PERF-01 ถึง AC-PERF-06 (ยืนยันค่าสุดท้ายก่อน Release) |

หมายเหตุการปิด Phase

- Phase 1 ปิดได้โดยยังไม่มี Overlay, Capture หรือ Hotkeys จึงไม่มีเกณฑ์ F7, F8 และ F10-01 ถึง F10-04
- AC-F12-03 และ AC-F12-04 ต้องการ Migration ลำดับที่ 2 ถ้าก่อน Release ยังมี Migration เดียว ให้ทดสอบด้วย Migration ทดสอบในสาขาแยกตามที่ระบุในเกณฑ์ และบันทึกว่าใช้วิธีใด
- เกณฑ์ที่กำกับว่า ต้องตรวจสอบ ต้องได้ข้อสรุปจากเอกสารที่อ้างถึงก่อนเริ่มทดสอบ Phase นั้น และปรับข้อความของเกณฑ์ให้ตรงโดยคง ID เดิม
