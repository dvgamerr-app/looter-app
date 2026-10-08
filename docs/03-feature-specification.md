# Feature Specification

รายละเอียดการทำงานของทุก Feature ตาม Requirement 3.x และ 4 ของ GameLooter ในรูปแบบกฎที่ตรวจสอบได้ เพื่อใช้เป็นฐานร่วมของ Data Model, UI/UX Design Plan, Development Roadmap และ Acceptance Criteria

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง:

- [Repository Audit Report](01-repository-audit.md)
- [Architecture Proposal](02-architecture-proposal.md)
- [Data Model](04-data-model.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Development Roadmap](06-development-roadmap.md)
- [Risks & Limitations](07-risks-and-limitations.md)
- [Acceptance Criteria](08-acceptance-criteria.md)

## 1. ขอบเขตและวิธีอ่านเอกสาร

### 1.1 รายการ Feature และ Phase ที่รับผิดชอบ

| รหัส | Feature | Requirement | Phase ตาม Roadmap |
|---|---|---|---|
| F1 | Game Profile Management | 3.1 | Phase 1 — Foundation |
| F2 | Item Library | 3.2, 4 | Phase 2 — Core Tracking (Image จาก File/Clipboard), Phase 4 (Image จาก Capture) |
| F3 | Recipes | 3.3 | Phase 2 — Core Tracking |
| F4 | Quests | 3.4 | Phase 2 — Core Tracking |
| F5 | Tracking Targets | 3.5 | Phase 2 — Core Tracking |
| F6 | Global Material Aggregation และ Gathering List | 3.5, 4 | Phase 2 — Core Tracking (คำนวณและแสดงผล), Phase 4 (Filters, Sorting, Hide Complete) |
| F7 | Manual Inventory | 3.6, 4 | Phase 2 — Core Tracking |
| F8 | Consume Materials และ Craft Actions | 3.3, 3.4, §10 ข้อ 13 | Phase 2 — Core Tracking |
| F9 | Windows Overlay | 3.7 | Phase 3 — Windows Overlay |
| F10 | Screenshot และ Capture Workflow | 3.2, 3.8 | Phase 4 — Capture & Productivity |
| F11 | Settings | 4, 5 | Phase 1 (Settings Store, Profiles), Phase 3 (Hotkeys, Overlay Display), Phase 5 (Backup/Restore, About/Update) |
| F12 | Persistence Rules | 5 | Phase 1 — Foundation |

ลำดับงานและ Definition of Done ของแต่ละ Phase อยู่ใน [Development Roadmap](06-development-roadmap.md) เกณฑ์ตรวจรับรายข้ออยู่ใน [Acceptance Criteria](08-acceptance-criteria.md) (เลขกลุ่ม `AC-Fn` ในเอกสารนั้นจัดตามหัวข้อ Requirement จึงไม่ตรงกับรหัส F ในตารางนี้ทุกข้อ ดูตารางจับคู่ใน 1.2 ของเอกสารนั้น)

### 1.2 โครงสร้างของแต่ละ Feature

ทุก Feature เขียนด้วยหัวข้อเดียวกัน ได้แก่ วัตถุประสงค์, User stories, กฎการทำงาน (ข้อกำหนดเชิงหน้าที่แบบเรียงเลข ใช้อ้างอิงใน Acceptance Criteria ด้วยรหัส เช่น F6-R4), ขั้นตอนการใช้งาน, Edge cases และ Error handling, ข้อมูลที่เกี่ยวข้อง (ตารางตาม [Data Model](04-data-model.md)), IPC ที่ใช้ (ชื่อ `window.api.*` และชื่อ Channel) และนอกขอบเขต

### 1.3 ข้อกำหนดร่วมที่ใช้กับทุก Feature

1. **Active Profile**: Profile ที่ `id` ถูกบันทึกใน `app_setting` key `active_profile_id` ทุกคำสั่งที่อ่านหรือเขียนข้อมูลเกม (Items, Recipes, Quests, Inventory, Tracking Targets) ทำงานกับ Active Profile เท่านั้น Main Process เป็นผู้เติม `profile_id` จากค่านี้เอง Renderer ไม่ส่ง `profile_id` มาในคำสั่งใดนอกจากกลุ่ม `profiles`
2. **ขอบเขต Process**: Main Process เป็นเจ้าของ Database, ไฟล์ภาพ, Hotkeys, Capture, Clipboard และ Overlay Window ทั้งหมด Renderer (Main Window, Overlay, Capture window) เรียกใช้ผ่าน `window.api.*` ที่ Preload สร้างจาก `electron/ipc/contracts.ts` เท่านั้น ไม่มี `ipcRenderer` ดิบให้ Renderer ใช้ (ดู [Architecture Proposal](02-architecture-proposal.md))
3. **รูปแบบคำสั่ง**: คำสั่งแบบ Request/Response ใช้ Channel ชื่อ `<domain>:<action>` ผ่าน `ipcMain.handle` และคืนผลลัพธ์แบบ Typed ในรูป `{ ok: true, data }` หรือ `{ ok: false, error: { code, message, details? } }` รหัส `code` ที่ใช้ในเอกสารนี้สรุปในหัวข้อ 14.2 รายละเอียด Type ขั้นสุดท้ายอยู่ใน `electron/ipc/contracts.ts`
4. **Push events**: Main Process ส่งการเปลี่ยนแปลงไปยังทุก Window ที่เปิดอยู่ด้วย `webContents.send` บน Channel `<domain>:changed` Renderer สมัครรับด้วย `window.api.on('<domain>:changed', cb)` และยกเลิกด้วยฟังก์ชันที่คืนกลับมา รายการ Push events ทั้งหมดอยู่ในหัวข้อ 14.1
5. **กฎการคำนวณใหม่**: หลังทุกการเขียนที่กระทบผลรวมวัตถุดิบ (Items, Recipes, Quests, Tracking Targets, Inventory, การสลับ Profile) Main Process คำนวณ Gathering List ใหม่ (Debounce 16 ms สำหรับการเขียนต่อเนื่อง) แล้วส่ง `gathering:changed` ไปทั้ง Main Window และ Overlay Renderer ไม่คำนวณผลรวมเองในทุกกรณี
6. **การตรวจสอบข้อมูลเข้า**: Handler ทุกตัวตรวจสอบ Input ใน Main Process ก่อนเขียน ข้อความชื่อ (name) ถูก `trim` ก่อนตรวจและบันทึก ต้องไม่ว่างและยาวไม่เกิน 100 ตัวอักษร (ค่าเสนอ) ช่อง `notes` ยาวไม่เกิน 2,000 ตัวอักษร (ค่าเสนอ) จำนวน (qty, owned, output_qty, target_qty) ต้องเป็นจำนวนเต็มตามข้อจำกัด `CHECK` ของตารางนั้น ค่าที่ไม่ผ่านคืน `VALIDATION`
7. **การเขียนหลายแถว**: ทุกคำสั่งที่เขียนมากกว่าหนึ่งแถว (เช่น บันทึก Recipe พร้อม Ingredients, ลบ Profile, Consume/Craft, Reorder) ทำใน `db.transaction()` เดียว ล้มเหลวเมื่อใดให้ Rollback ทั้งหมดและคืน Error โดยไม่มีการเขียนบางส่วน
8. **Timestamps**: ทุกคอลัมน์ `*_at` เก็บเป็นข้อความ ISO-8601 UTC Main Process เป็นผู้กำหนดค่า Renderer ไม่ส่งเวลา
9. **ภาพ Item ใน Renderer**: Item DTO ที่ส่งให้ Renderer มี `imageUrl` และ `thumbnailUrl` ที่ Main Process แปลงจาก `image_path` และ `thumbnail_path` แล้ว พร้อม Cache-busting จาก `updated_at` รูปแบบ URL ที่ใช้โหลดไฟล์ภาพภายใต้ `file://` กำหนดใน [Architecture Proposal](02-architecture-proposal.md)
10. **สถานะว่าง**: ทุกหน้าจอต้องมี Empty state ที่บอกขั้นตอนถัดไป (เช่น ยังไม่มี Profile, ยังไม่มี Tracking Target) ตาม [UI/UX Design Plan](05-ui-ux-design-plan.md)

## 2. F1 Game Profile Management

### 2.1 วัตถุประสงค์

แยกข้อมูลของแต่ละเกมออกจากกันโดยสมบูรณ์ และให้ผู้ใช้สร้าง สลับ เปลี่ยนชื่อ และลบ Profile ได้โดยไม่กระทบเกมอื่น (Requirement 3.1) เป็น Feature แรกของ Phase 1 เพราะทุกตารางข้อมูลเกมผูกกับ `game_profile`

### 2.2 User stories

- ในฐานะผู้เล่นหลายเกม ฉันต้องการสร้าง Profile แยกต่อเกม เพื่อไม่ให้ Items ของเกมหนึ่งปนกับอีกเกม
- ในฐานะผู้เล่น ฉันต้องการสลับเกมได้จาก Game Dashboard ในคลิกเดียว และให้แอปเปิดเกมล่าสุดที่ใช้งานเมื่อเริ่มแอป
- ในฐานะผู้เล่น ฉันต้องการเปลี่ยนชื่อ Profile ได้เมื่อตั้งชื่อผิด โดยข้อมูลอื่นไม่เปลี่ยน
- ในฐานะผู้เล่น ฉันต้องการลบ Profile ของเกมที่เลิกเล่น และรู้ล่วงหน้าว่าจะเสียข้อมูลอะไรบ้าง

### 2.3 กฎการทำงาน

1. F1-R1 Profile หนึ่งรายการคือหนึ่งแถวใน `game_profile` ข้อมูลเกมทุกชนิด (Items, Inventory, Recipes, Quests, Tracking Targets, ไฟล์ภาพ) อ้างอิง `profile_id` ของแถวนั้น
2. F1-R2 `name` ต้องไม่ซ้ำกับ Profile อื่นโดยไม่สนตัวพิมพ์เล็กใหญ่ (`UNIQUE COLLATE NOCASE`) เช่น "V Rising" และ "v rising" ถือว่าซ้ำ การสร้างหรือเปลี่ยนชื่อที่ซ้ำคืน `DUPLICATE_NAME`
3. F1-R3 Active Profile มีได้ไม่เกินหนึ่งรายการ เก็บใน `app_setting.active_profile_id` เมื่อสร้าง Profile แรกของระบบ ให้ตั้งเป็น Active ทันที
4. F1-R4 การสลับ Profile ต้องทำครบทุกข้อภายในคำสั่งเดียว: บันทึก `active_profile_id`, ตั้ง `last_opened_at` ของ Profile นั้นเป็นเวลาปัจจุบัน, ส่ง `profile:changed`, คำนวณ Gathering List ของ Profile ใหม่และส่ง `gathering:changed` Renderer ต้องล้าง Store ทุกตัวและโหลดข้อมูลใหม่เมื่อได้รับ `profile:changed`
5. F1-R5 เมื่อเริ่มแอป ให้เปิด Profile ตาม `active_profile_id` ถ้าค่านั้นว่างหรือชี้ไปยังแถวที่ไม่มีอยู่ ให้เลือก Profile ที่ `last_opened_at` ล่าสุดแทน (แถวที่ `last_opened_at` เป็น NULL อยู่ท้ายสุด) ถ้าไม่มี Profile เลย ให้แสดงสถานะ Onboarding ที่ Game Dashboard และปิดการเข้าถึงหน้าจออื่นจนกว่าจะสร้าง Profile แรก
6. F1-R6 Game Dashboard แสดง Profile ทั้งหมดเป็นการ์ด เรียงตาม `last_opened_at` ล่าสุดก่อน แต่ละการ์ดแสดงชื่อ จำนวน Items/Recipes/Quests และ Overall Progress ของ Profile นั้น (คำนวณตาม F6 โดย Main Process) Profile ที่ Active ต้องมีสถานะเด่นชัด
7. F1-R7 การเปลี่ยนชื่อใช้กฎเดียวกับการสร้าง และอัปเดต `updated_at` ไม่กระทบ `id` หรือข้อมูลลูก
8. F1-R8 การลบต้องมี Confirmation dialog ที่แสดงจำนวนข้อมูลที่จะหายไป ได้แก่ Items, Recipes, Quests, Tracking Targets และจำนวนไฟล์ภาพ พร้อมข้อความว่าการลบถาวรและกู้คืนไม่ได้นอกจากมี Backup ปุ่มยืนยันต้องเป็นปุ่มทำลาย (Destructive) และไม่ใช่ปุ่ม Default ของ Dialog
9. F1-R9 การลบทำใน Transaction เดียว โดยอาศัย `ON DELETE CASCADE` จาก `game_profile` ลงไปทุกตาราง หลัง Commit แล้วจึงลบโฟลเดอร์ `<userData>\data\images\<profile_id>\` ถ้าลบโฟลเดอร์ไม่สำเร็จให้บันทึก Log และถือว่าการลบสำเร็จ (ไฟล์กำพร้าไม่กระทบความถูกต้องของข้อมูล)
10. F1-R10 ถ้าลบ Profile ที่ Active อยู่ ให้สลับไป Profile ที่ `last_opened_at` ล่าสุดที่เหลือ ถ้าไม่เหลือเลยให้ล้าง `active_profile_id` ซ่อน Overlay และกลับสู่สถานะ Onboarding
11. F1-R11 Data isolation: Handler นอกกลุ่ม `profiles` ทุกตัวต้องกรองด้วย `profile_id` ของ Active Profile ทั้งการอ่านและการเขียน และต้องปฏิเสธ (`NOT_FOUND`) เมื่อ `id` ที่ Renderer ส่งมาเป็นของ Profile อื่น แม้แถวนั้นมีอยู่จริง
12. F1-R12 `icon_path` เป็นค่าเลือกได้ ใน Phase 1 ให้เป็น NULL และการ์ดแสดงอักษรตัวแรกของชื่อแทน การเลือกไฟล์ไอคอนของ Profile อยู่นอกขอบเขต Phase 1
13. F1-R13 ภาพที่ค้างอยู่ระหว่างขั้นตอน Capture (Pending image ตาม F10) ผูกกับ Profile ที่ Active ขณะสร้าง เมื่อสลับ Profile ให้ยกเลิก Pending image ทั้งหมดและแจ้งผู้ใช้

### 2.4 ขั้นตอนการใช้งาน

สร้าง Profile:

1. ผู้ใช้กด "สร้าง Profile" ที่ Game Dashboard (หรือที่ Settings > Profiles)
2. กรอกชื่อเกม แล้วกดบันทึก
3. ระบบตรวจสอบชื่อ สร้างแถว และถ้าเป็น Profile แรกให้ตั้งเป็น Active
4. Game Dashboard แสดงการ์ดใหม่ทันทีจาก `profile:changed`

สลับ Profile:

1. ผู้ใช้กดการ์ด Profile หรือเลือกจาก Profile switcher ในแถบนำทาง
2. ระบบทำตาม F1-R4 แล้วทุกหน้าจอและ Overlay แสดงข้อมูลของ Profile ใหม่

เปลี่ยนชื่อ:

1. ผู้ใช้เลือก "เปลี่ยนชื่อ" บนการ์ดหรือใน Settings > Profiles
2. แก้ไขชื่อในที่ (Inline) หรือใน Dialog แล้วยืนยัน

ลบ:

1. ผู้ใช้เลือก "ลบ" บนการ์ดหรือใน Settings > Profiles
2. ระบบแสดง Confirmation dialog ตาม F1-R8
3. ผู้ใช้ยืนยัน ระบบลบตาม F1-R9 และ F1-R10

### 2.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| ชื่อว่างหรือมีแต่ช่องว่าง | `VALIDATION` และฟอร์มแสดงข้อความใต้ช่องกรอก |
| ชื่อซ้ำต่างกันเพียงตัวพิมพ์ | `DUPLICATE_NAME` พร้อมชื่อที่ชนกัน |
| ลบ Profile สุดท้าย | อนุญาต แล้วเข้าสู่ Onboarding ตาม F1-R10 |
| ลบ Profile ที่ Active ขณะ Overlay แสดงอยู่ | Overlay ซ่อนทันที และแสดงใหม่เมื่อมี Active Profile อีกครั้งตามสถานะที่บันทึกไว้ |
| `active_profile_id` ชี้ไปแถวที่ไม่มี (เช่น Restore Backup ชุดอื่น) | Fallback ตาม F1-R5 และเขียนค่าใหม่ทับ |
| ลบโฟลเดอร์ภาพไม่สำเร็จ (ไฟล์ถูกล็อก) | ถือว่าการลบสำเร็จ บันทึก Log ไฟล์กำพร้าล้างได้ภายหลังด้วยคำสั่ง "ล้างไฟล์ภาพที่ไม่ถูกใช้" ใน Settings ตาม [Data Model](04-data-model.md) ซึ่งอยู่นอกขอบเขต Phase 1 (กำหนดเป็น Phase 5 ใน Roadmap P5-04) |
| สลับ Profile ระหว่างที่ Capture window เปิดอยู่ | ปิด Capture window และยกเลิก Pending image ตาม F1-R13 |

### 2.6 ข้อมูลที่เกี่ยวข้อง

`game_profile` (`id`, `name`, `icon_path`, `created_at`, `updated_at`, `last_opened_at`), `app_setting` key `active_profile_id` และ Cascade ไปยัง `item`, `inventory`, `recipe`, `recipe_ingredient`, `quest`, `quest_requirement`, `tracking_target` รวมถึงโฟลเดอร์ `<userData>\data\images\<profile_id>\`

### 2.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `profiles.list()` | `profiles:list` | คืน Profile ทั้งหมดพร้อมจำนวน Items/Recipes/Quests และ Overall Progress, ระบุรายการ Active |
| `profiles.create({ name })` | `profiles:create` | สร้าง Profile |
| `profiles.rename({ id, name })` | `profiles:rename` | เปลี่ยนชื่อ |
| `profiles.delete({ id })` | `profiles:delete` | ลบแบบ Cascade |
| `profiles.getDeleteSummary({ id })` | `profiles:getDeleteSummary` | จำนวนข้อมูลที่จะหายสำหรับ Confirmation dialog |
| `profiles.switch({ id })` | `profiles:switch` | ตั้ง Active Profile |
| `profiles.getActive()` | `profiles:getActive` | Profile ปัจจุบันหรือ `null` |
| `on('profile:changed')` | `profile:changed` | Payload: `{ activeProfileId, profiles }` |

### 2.8 นอกขอบเขต

Template หรือ Preset ของเกม, การคัดลอก Profile, การ Export/Import เฉพาะบาง Profile (Backup ใน F11 ครอบคลุมทุก Profile), การซิงก์ข้ามเครื่อง, ไอคอน Profile (Phase หลัง)

## 3. F2 Item Library

### 3.1 วัตถุประสงค์

เป็นคลังข้อมูล Item ของ Profile ปัจจุบัน ที่ทุก Feature อื่นอ้างอิงด้วย `item.id` เดียวกัน (Requirement 3.2 และ 5) พร้อมภาพประกอบเพื่อให้ผู้ใช้จำ Item ได้โดยไม่พึ่งเพียงชื่อ

### 3.2 User stories

- ในฐานะผู้เล่น ฉันต้องการเพิ่ม Item พร้อมหมวดหมู่ เพื่อนำไปใช้ใน Recipe และ Quest ได้ทันที
- ในฐานะผู้เล่น ฉันต้องการใส่ภาพ Item จากไฟล์ จาก Clipboard หรือจากการ Capture หน้าจอ เพื่อจำรูปร่าง Item ได้
- ในฐานะผู้เล่น ฉันต้องการค้นหา Item ด้วยชื่อหรือหมวดหมู่ได้ทันทีที่พิมพ์
- ในฐานะผู้เล่น ฉันต้องการ Pin Item ที่ต้องเก็บบ่อย เพื่อให้แสดงใน Overlay เสมอ
- ในฐานะผู้เล่น ฉันต้องการรู้ว่า Item ถูกใช้ที่ไหน ก่อนลบ

### 3.3 กฎการทำงาน

1. F2-R1 Item หนึ่งรายการคือหนึ่งแถวใน `item` ของ Active Profile ชื่อต้องไม่ซ้ำภายใน Profile โดยไม่สนตัวพิมพ์เล็กใหญ่ (`UNIQUE (profile_id, name COLLATE NOCASE)`) การสร้างหรือเปลี่ยนชื่อที่ซ้ำคืน `DUPLICATE_NAME` พร้อม `id` ของ Item ที่ชน เพื่อให้ UI เสนอ "เปิด Item ที่มีอยู่" ได้
2. F2-R2 `category` มีค่าได้ 5 แบบตามตาราง: `material` (Materials), `equipment` (Equipment), `consumable` (Consumables), `quest` (Quest Items), `other` ค่าเริ่มต้นคือ `material` UI แสดงชื่อหมวดเป็นภาษาอังกฤษตาม Requirement 3.1
3. F2-R3 ทุก Item ที่สร้างใหม่ต้องมีแถว `inventory` คู่กัน (`owned = 0`) ใน Transaction เดียวกับการสร้าง เพื่อให้ทุกหน้าจออ่าน `owned` ได้โดยไม่ต้องจัดการกรณีไม่มีแถว
4. F2-R4 รายการ Item รองรับการค้นหาด้วยข้อความ (จับคู่บางส่วนของชื่อ ไม่สนตัวพิมพ์) และการกรองด้วยหมวดหมู่ พร้อมตัวกรอง "Pinned เท่านั้น" ผลลัพธ์เรียงตามชื่อ (A ถึง Z) โดย Item ที่ Pinned อยู่บนสุด การค้นหาทำที่ Main Process ผ่าน `items:list` หรือทำใน Renderer จากรายการที่โหลดครบแล้วก็ได้ แต่ต้องตอบสนองทันทีที่พิมพ์ (ไม่มีปุ่มค้นหา)
5. F2-R5 `pinned` เป็นสถานะต่อ Item ใช้โดย Overlay (F9) และตัวกรอง สลับได้จาก Item Library, Gathering List และ Overlay (Interactive mode)
6. F2-R6 ภาพของ Item มีได้หนึ่งภาพ เก็บเป็นไฟล์ PNG ที่ `<userData>\data\images\<profile_id>\<item_id>.png` และ Thumbnail ที่ `<userData>\data\images\<profile_id>\thumbs\<item_id>.png` ตาราง `item` เก็บเฉพาะ Path สัมพัทธ์กับ `<userData>\data` ใน `image_path` และ `thumbnail_path`
7. F2-R7 แหล่งภาพมี 3 ทาง และทุกทางต้องให้ผลเหมือนกัน: (ก) Import ไฟล์จากเครื่อง, (ข) Paste จาก Clipboard, (ค) Capture จากหน้าจอ (F10) ทุกทางสร้าง Pending image ใน Main Process ก่อน แล้วผูกกับ Item ผ่านคำสั่งเดียวกัน (`items:create` พร้อม `pendingImageId` หรือ `items:attachImage`)
8. F2-R8 เมื่อผูกภาพ Main Process บันทึกไฟล์ต้นฉบับเป็น PNG (เต็มกรอบที่ผู้ใช้เลือก) และสร้าง Thumbnail ขนาด 64×64 px เป็น PNG โดยย่อให้ด้านยาวสุดเป็น 64 px รักษาสัดส่วน (ไม่ขยายภาพที่เล็กกว่า) แล้ว Pad พื้นหลังโปร่งใสกึ่งกลางให้เป็น 64×64 พอดี ไม่ตัดขอบและไม่บิดสัดส่วน (ขั้นตอน `nativeImage.crop()`/`resize()` และการเขียนไฟล์แบบ `.tmp` + rename กำหนดใน [Data Model](04-data-model.md)) การเขียนไฟล์ทั้งสองและการอัปเดต `image_path`, `thumbnail_path`, `updated_at` ต้องสำเร็จทั้งหมด ถ้าเขียนไฟล์ไม่สำเร็จให้ลบไฟล์ที่เขียนไปแล้วและไม่แตะ Database (`IO`)
9. F2-R9 การแทนที่ภาพเดิมต้องมี Confirmation ("Item นี้มีภาพอยู่แล้ว ต้องการแทนที่หรือไม่") ไฟล์ใหม่เขียนทับ Path เดิม และ `updated_at` เปลี่ยนเพื่อให้ Renderer โหลดภาพใหม่ (ไม่ใช้ Cache เดิม)
10. F2-R10 การลบภาพ (ไม่ลบ Item) ลบไฟล์ทั้งสองและตั้ง `image_path`, `thumbnail_path` เป็น NULL ทุกหน้าจอแสดง Placeholder แทน
11. F2-R11 Thumbnail ต้องแสดงทุกที่ที่มีชื่อ Item ได้แก่ Item Library, Recipes (Output และ Ingredients), Quest Tracker (Requirements), Gathering List, Craft plan, Confirmation dialog ของ F8 และ Overlay ถ้าไม่มีภาพให้แสดง Placeholder ที่มีอักษรตัวแรกของชื่อ
12. F2-R12 กฎการลบ Item: ถ้ามี `recipe_ingredient` หรือ `quest_requirement` อ้างถึง Item นั้น (`ON DELETE RESTRICT`) ให้ปฏิเสธด้วย `ITEM_IN_USE` พร้อม `details.usages` (`kind`, `id`, `label` ตาม Data Model) และ UI ต้องแสดงรายการที่ใช้ Item นั้น (ชื่อ Recipe ที่ใช้เป็น Ingredient, ชื่อ Quest ที่ใช้เป็น Requirement) พร้อมลิงก์ไปแก้ไข ผู้ใช้ต้องเอา Item ออกจากที่เหล่านั้นก่อนจึงลบได้
13. F2-R13 ถ้า Item เป็น Output ของ Recipe (`recipe.output_item_id` ซึ่งเป็น `ON DELETE CASCADE`) การลบ Item จะลบ Recipe นั้น รวม Ingredients และ Tracking Target ของ Recipe นั้นด้วย Confirmation dialog ต้องระบุชื่อ Recipe ที่จะถูกลบตามไปอย่างชัดเจน
14. F2-R14 ถ้า Item มีเพียงแถว `inventory` (และ/หรือเป็น Output ของ Recipe ตาม F2-R13) การลบจะ Cascade แถวเหล่านั้นและลบไฟล์ภาพหลัง Commit
15. F2-R15 การลบ Item ที่มี `owned > 0` ต้องแจ้งจำนวนที่ถืออยู่ใน Confirmation dialog เพราะจำนวนนั้นจะหายไปด้วย

### 3.4 ขั้นตอนการใช้งาน

เพิ่ม Item แบบเร็ว:

1. ที่ Item Library กด "เพิ่ม Item" หรือกด Enter ในช่องค้นหาเมื่อไม่พบผลลัพธ์ (ชื่อที่พิมพ์กลายเป็นชื่อ Item ใหม่)
2. เลือกหมวดหมู่ (ค่าเริ่มต้น Materials) และใส่ภาพได้ทันทีหรือภายหลัง
3. บันทึก Item ปรากฏในรายการพร้อม `owned = 0`

ใส่ภาพจากไฟล์:

1. เปิด Item แล้วเลือก "Import image" ระบบเปิด `dialog.showOpenDialog` กรองเฉพาะไฟล์ภาพ
2. ระบบอ่านไฟล์ สร้าง Pending image และแสดง Preview
3. ผู้ใช้ยืนยัน ระบบบันทึกตาม F2-R8

ใส่ภาพจาก Clipboard:

1. ผู้ใช้คัดลอกภาพ (เช่น Win+Shift+S) แล้วกด "Paste from clipboard" ใน Item หรือกด Hotkey `CommandOrControl+Shift+V`
2. ระบบอ่าน Clipboard ตาม F10-R12 ถ้ามีภาพให้แสดง Preview และยืนยันเหมือนกรณีไฟล์ ถ้ากดจาก Hotkey จะเปิด Dialog "ตั้งชื่อ Item / ผูกกับ Item ที่มีอยู่" ตาม F10

ลบ Item:

1. เลือก "ลบ" ระบบเรียก `items:getUsage` เพื่อตรวจการอ้างอิงก่อนเปิด Dialog
2. ถ้าใช้งานอยู่ แสดงรายการตาม F2-R12 และไม่มีปุ่มลบ ถ้าไม่ใช้งาน แสดง Confirmation ตาม F2-R13 ถึง F2-R15

### 3.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| ตั้งชื่อซ้ำขณะสร้างจาก Capture dialog | เสนอสลับเป็น "ผูกภาพกับ Item ที่มีอยู่" โดยไม่ต้องกรอกใหม่ |
| เปลี่ยนหมวดหมู่ของ Item ที่ใช้ใน Recipe/Quest | อนุญาต หมวดหมู่ไม่กระทบการคำนวณ |
| ไฟล์ภาพหายจากดิสก์แต่ Database ยังอ้างถึง | แสดง Placeholder และปุ่ม "ใส่ภาพใหม่" ไม่ถือเป็น Error ของระบบ การตั้ง Path ที่ชี้ไฟล์หายเป็น NULL ทำผ่านคำสั่ง "ล้างไฟล์ภาพที่ไม่ถูกใช้" ใน Settings และอัตโนมัติหลัง Restore ตาม [Data Model](04-data-model.md) อยู่นอกขอบเขต Phase 2 |
| ไฟล์ Import ไม่ใช่รูปแบบที่อ่านได้ | `UNSUPPORTED_IMAGE` รูปแบบที่รองรับแน่นอนคือ PNG และ JPEG ผ่าน `nativeImage` รูปแบบอื่น (WebP, BMP, GIF) ต้องตรวจสอบกับ Electron 44 ตอน Implement |
| Clipboard ไม่มีภาพ | `CLIPBOARD_EMPTY` พร้อมคำแนะนำให้ใช้ Win+Shift+S ก่อน |
| ลบ Item ขณะมี Pending image ค้างสำหรับ Item นั้น | ยกเลิก Pending image นั้นหลังลบสำเร็จ |
| Item ชื่อยาวหรือมีอักขระพิเศษ | จำกัดความยาวตามข้อ 1.3 ข้อ 6 ไม่จำกัดชุดอักขระ (ชื่อ Item ในเกมอาจมีสัญลักษณ์) |

### 3.6 ข้อมูลที่เกี่ยวข้อง

`item` (`id`, `profile_id`, `name`, `category`, `image_path`, `thumbnail_path`, `notes`, `pinned`, `created_at`, `updated_at`), `inventory` (สร้างคู่กัน), การอ้างอิงจาก `recipe.output_item_id` (CASCADE), `recipe_ingredient.item_id` (RESTRICT), `quest_requirement.item_id` (RESTRICT), ไฟล์ใน `<userData>\data\images\<profile_id>\` ดัชนี `item(profile_id, name)` รองรับการค้นหา

### 3.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `items.list({ search?, category?, pinnedOnly? })` | `items:list` | รายการ Item ของ Active Profile พร้อม `owned`, `imageUrl`, `thumbnailUrl` |
| `items.get({ id })` | `items:get` | Item เดียวพร้อมรายละเอียด |
| `items.create({ name, category?, notes?, pendingImageId? })` | `items:create` | สร้าง Item และแถว `inventory` และผูกภาพถ้ามี |
| `items.update({ id, name?, category?, notes? })` | `items:update` | แก้ไขข้อมูล |
| `items.setPinned({ id, pinned })` | `items:setPinned` | Pin/Unpin |
| `items.attachImage({ id, pendingImageId, replace? })` | `items:attachImage` | ผูก Pending image กับ Item ที่มีอยู่ |
| `items.removeImage({ id })` | `items:removeImage` | ลบภาพ |
| `items.getUsage({ id })` | `items:getUsage` | รายการ Recipe/Quest ที่อ้างถึง Item และ Recipe ที่ Item เป็น Output |
| `items.delete({ id })` | `items:delete` | ลบตาม F2-R12 ถึง F2-R15 |
| `capture.importFile()`, `capture.fromClipboard()`, `capture.discard({ pendingImageId })` | ดู F10 | สร้างหรือยกเลิก Pending image |
| `on('items:changed')` | `items:changed` | Payload: `{ profileId, itemIds? }` Renderer โหลดรายการใหม่ |

### 3.8 นอกขอบเขต

OCR หรือการตรวจจับ Item อัตโนมัติจากภาพ (Requirement 3.2 ระบุว่าไม่จำเป็น), หลายภาพต่อ Item, การแก้ไขภาพ (Crop ซ้ำ, หมุน) หลังบันทึก, Tag อิสระนอกเหนือจาก 5 หมวดหมู่, การนำเข้า Item จำนวนมากจาก CSV (ข้อมูลตัวอย่างใน `data/*.csv` เป็นของ Dev เท่านั้น)

## 4. F3 Recipes

### 4.1 วัตถุประสงค์

บันทึกสูตรการ Craft ว่า Item ปลายทางหนึ่งหน่วยการผลิตใช้ Ingredients อะไรจำนวนเท่าใด รองรับ Nested Recipes และป้องกัน Circular Dependencies (Requirement 3.3) เพื่อให้ F6 ขยายสูตรถึงวัตถุดิบระดับล่างสุดได้อย่างไม่กำกวม

### 4.2 User stories

- ในฐานะผู้เล่น ฉันต้องการบันทึกว่า Iron Sword × 1 ใช้ Iron Ore × 10, Wood × 5, Leather × 3 เพื่อไม่ต้องเปิดเมนูเกมซ้ำ
- ในฐานะผู้เล่น ฉันต้องการระบุว่า Ingredient ใดฉันจะ Craft เองและ Ingredient ใดจะไปเก็บ เพื่อให้ Gathering List บอกวัตถุดิบที่ถูกต้อง
- ในฐานะผู้เล่น ฉันต้องการดูล่วงหน้าว่าถ้าจะสร้าง N ชิ้น ต้องใช้วัตถุดิบระดับล่างสุดรวมเท่าใด
- ในฐานะผู้เล่น ฉันต้องการให้แอปเตือนทันทีเมื่อฉันเผลอสร้างสูตรที่วนกลับมาหาตัวเอง

### 4.3 กฎการทำงาน

1. F3-R1 Recipe หนึ่งรายการคือหนึ่งแถวใน `recipe` ของ Active Profile มี Output Item หนึ่งรายการ (`output_item_id`) และ `output_qty` (จำนวนที่ได้ต่อการ Craft หนึ่งรอบ ค่าเริ่มต้น 1 ต้องมากกว่า 0)
2. F3-R2 Output Item หนึ่งรายการมีได้เพียงหนึ่ง Recipe (`UNIQUE (output_item_id)`) การสร้าง Recipe ที่ Output ซ้ำคืน `DUPLICATE_RECIPE` พร้อม `id` ของ Recipe เดิม และ UI เสนอ "แก้ไข Recipe ที่มีอยู่" Recipe หลายแบบต่อ Item เดียวอยู่นอกขอบเขต (เป็น Migration ในอนาคตตาม Data Model)
3. F3-R3 Ingredient หนึ่งรายการคือหนึ่งแถวใน `recipe_ingredient` ประกอบด้วย `item_id`, `qty` (ต่อหนึ่งรอบ มากกว่า 0), `mode` (`craft` หรือ `gather` ค่าเริ่มต้น `craft`) และ `sort_order` Item เดียวกันปรากฏใน Recipe เดียวได้ครั้งเดียว (Primary Key `(recipe_id, item_id)`) ถ้าผู้ใช้เพิ่มซ้ำให้รวมเป็นแถวเดิมและแก้ `qty`
4. F3-R4 ความหมายของ `mode`: `craft` หมายถึงเมื่อขาด Ingredient นี้ ให้ขยายผ่าน Recipe ของ Ingredient นั้น (ถ้ามี) จนถึงวัตถุดิบ `gather` หมายถึงถือเป็นวัตถุดิบที่ต้องไปเก็บเสมอ แม้ Ingredient นั้นจะมี Recipe ของตัวเอง Ingredient ที่ตั้ง `craft` แต่ไม่มี Recipe จะทำงานเหมือน `gather` และ UI ต้องแสดงสถานะนี้ให้เห็น (เช่น ป้าย "ไม่มี Recipe")
5. F3-R5 Output Item ต้องไม่เป็น Ingredient ของตัวเอง (`CYCLE` แบบตรง)
6. F3-R6 การตรวจ Circular Dependencies ทำที่ Main Process ทุกครั้งที่บันทึก Recipe (สร้างหรือแก้ไข) โดยเดินกราฟจาก Ingredient แต่ละตัวผ่าน Recipe ของมัน (ไม่สนใจ `mode` เพราะ `mode` เปลี่ยนภายหลังได้) ถ้าเดินไปถึง Output Item ของ Recipe ที่กำลังบันทึก ให้ปฏิเสธด้วย `CYCLE` และ `details.path` เป็นลำดับชื่อ Item ที่ครบวง เช่น `Iron Sword → Iron Ingot → Iron Ore → Iron Sword` ข้อความใน UI ต้องแสดงเส้นทางนี้ทั้งเส้น
7. F3-R7 การบันทึก Recipe พร้อม Ingredients ทั้งชุดทำใน Transaction เดียว (ลบ Ingredients เดิมที่ไม่อยู่ในชุดใหม่, Upsert ที่เหลือ) ล้มเหลวที่ข้อใดให้ Rollback ทั้งหมด
8. F3-R8 Nested preview: หน้าจอ Recipes แสดงโครงสร้างต้นไม้ของ Recipe ที่เลือกสำหรับจำนวน Output ที่ผู้ใช้ระบุ (ค่าเริ่มต้น `output_qty` หนึ่งรอบ) โดยขยาย Ingredient ที่ `mode = craft` และมี Recipe ลงไปทุกระดับ และสรุป "วัตถุดิบระดับล่างสุดรวม" สองชุด: "ตามสูตร" (Gross ไม่หัก Inventory ใช้ดูสูตรล้วน) และ "หักของที่มีแล้ว" ซึ่งคำนวณด้วยอัลกอริทึมของ F6 แบบ Target เดียว (Recipe นั้นกับจำนวนที่ระบุ และ `owned` จริง) ตาม [Data Model](04-data-model.md) เพื่อให้ตัวเลขตรงกับ Gathering List เมื่อ Recipe นี้ถูกติดตามเพียงรายการเดียว ตัวเลขที่จัดสรรร่วมกับ Target อื่นดูได้ที่ Gathering List (F6) เท่านั้น
9. F3-R9 จำนวนรอบที่ต้อง Craft เพื่อให้ได้ N ชิ้น คือ `ceil(N / output_qty)` และวัตถุดิบต่อระดับคือ `qty × รอบ` Preview ต้องแสดงรอบและส่วนเกิน (Surplus) เมื่อ N หารด้วย `output_qty` ไม่ลงตัว
10. F3-R10 การขยายต้นไม้ใน Preview ใช้ Visited set ป้องกันการวนซ้ำเชิงป้องกัน แม้ F3-R6 จะกันวงไว้แล้ว
11. F3-R11 Recipe เพิ่มเข้า Tracking Targets ได้จากหน้าจอ Recipes โดยระบุ `target_qty` (จำนวน Output ที่ต้องการ ค่าเริ่มต้น 1) ตาม F5
12. F3-R12 การลบ Recipe ลบ `recipe_ingredient` และ `tracking_target` ของ Recipe นั้น (CASCADE) แต่ไม่ลบ Output Item และ Ingredients ต้องมี Confirmation ที่บอกว่า Recipe นี้ถูกติดตามอยู่หรือไม่
13. F3-R13 `station` และ `notes` เป็นข้อมูลประกอบ ไม่กระทบการคำนวณ

### 4.4 ขั้นตอนการใช้งาน

1. ที่หน้าจอ Recipes กด "สร้าง Recipe"
2. เลือก Output Item จากรายการ Item (ค้นหาได้ และสร้าง Item ใหม่จากช่องเดียวกันได้ถ้ายังไม่มี) และกำหนด `output_qty`
3. เพิ่ม Ingredients ทีละรายการ: เลือก Item, ใส่ `qty`, เลือก `mode` (ค่าเริ่มต้น `craft`)
4. ระบบตรวจ Cycle ทันทีที่เพิ่ม Ingredient (เรียก `recipes:validate` กับร่างปัจจุบัน) และแสดงข้อความถ้าพบ
5. กดบันทึก ระบบตรวจซ้ำที่ Main Process แล้วบันทึกตาม F3-R7
6. เลือก "Preview" เพื่อดูต้นไม้และวัตถุดิบรวมสำหรับจำนวนที่ต้องการ และกด "ติดตาม" เพื่อเพิ่มเป็น Tracking Target

### 4.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| เพิ่ม Ingredient ที่ทำให้เกิดวง | `CYCLE` พร้อมเส้นทางครบวง ไม่บันทึก |
| แก้ไข Recipe อื่นภายหลังจนเกิดวงกับ Recipe นี้ | ตรวจที่ Recipe ที่กำลังบันทึกเสมอ จึงถูกจับได้ที่จุดที่ทำให้ครบวง |
| Ingredient `craft` ที่ Recipe ของมันถูกลบภายหลัง | ทำงานเหมือน `gather` ตาม F3-R4 และ UI แสดงป้าย "ไม่มี Recipe" |
| `output_qty` มากกว่า 1 และต้องการจำนวนไม่ลงตัว | แสดงรอบและ Surplus ตาม F3-R9 |
| Recipe ไม่มี Ingredient เลย | อนุญาตให้บันทึก (ใช้บันทึกสูตรที่ยังไม่รู้ส่วนประกอบ) แต่ UI แสดงเตือน และ F6 ถือว่า Recipe นั้นไม่มีวัตถุดิบ |
| ลบ Recipe ที่เป็นเส้นทางขยายของ Recipe อื่น | อนุญาต Recipe อื่นที่อ้าง Output Item นั้นเป็น Ingredient จะเปลี่ยนไปทำงานแบบ `gather` โดยอัตโนมัติ |
| ต้นไม้ลึกมาก | ไม่จำกัดความลึก ความซับซ้อนเป็น O(targets × ingredients × depth) ตาม Data Model |

### 4.6 ข้อมูลที่เกี่ยวข้อง

`recipe` (`id`, `profile_id`, `output_item_id`, `output_qty`, `station`, `notes`, `created_at`, `updated_at`), `recipe_ingredient` (`recipe_id`, `item_id`, `qty`, `mode`, `sort_order`), `tracking_target` (kind `recipe`), ดัชนี `recipe(profile_id)`, `recipe_ingredient(item_id)` อัลกอริทึมตรวจวงและขยายต้นไม้อยู่ใน `electron/domain/*.ts` ตาม [Data Model](04-data-model.md)

### 4.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `recipes.list()` | `recipes:list` | Recipe ทั้งหมดพร้อม Output Item, จำนวน Ingredients และสถานะติดตาม |
| `recipes.get({ id })` | `recipes:get` | Recipe พร้อม Ingredients |
| `recipes.create({ outputItemId, outputQty, station?, notes?, ingredients[] })` | `recipes:create` | สร้างพร้อม Ingredients และตรวจ Cycle |
| `recipes.update({ id, ...same })` | `recipes:update` | แก้ไขทั้งชุดใน Transaction เดียว |
| `recipes.delete({ id })` | `recipes:delete` | ลบ |
| `recipes.validate({ id?, outputItemId, ingredients[] })` | `recipes:validate` | ตรวจ Cycle ของร่าง คืน `{ ok }` หรือ `CYCLE` พร้อม `path` |
| `recipes.expand({ id, quantity })` | `recipes:expand` | ต้นไม้ Nested preview และวัตถุดิบรวมทั้งแบบ Gross และแบบหัก Inventory (Target เดียว) ตาม F3-R8 |
| `on('recipes:changed')` | `recipes:changed` | Payload: `{ profileId, recipeIds? }` |

### 4.8 นอกขอบเขต

Recipe หลายแบบต่อ Output Item, โอกาสสำเร็จหรือผลผลิตแบบสุ่ม, เวลาในการ Craft, ค่าใช้จ่ายเป็นเงินในเกม, การนำเข้าสูตรจากแหล่งภายนอก

## 5. F4 Quests

### 5.1 วัตถุประสงค์

บันทึก Quest ที่ต้องรวบรวม Items หลายชนิด ติดตามหลาย Quest พร้อมกัน กำหนดสถานะ และดูได้ทันทีว่าแต่ละ Quest ยังขาดอะไร (Requirement 3.4) โดยตัวเลขต่อ Quest เป็นการจัดสรรจาก Inventory กลาง ไม่ใช่ Inventory ของ Quest เอง (§10 ข้อ 12)

### 5.2 User stories

- ในฐานะผู้เล่น ฉันต้องการบันทึก Quest "Ancient Equipment" พร้อม Requirements เพื่อไม่ต้องเดินกลับไปหา NPC
- ในฐานะผู้เล่น ฉันต้องการพัก Quest ที่ยังไม่ทำ เพื่อให้ Gathering List ไม่นับวัตถุดิบของมัน
- ในฐานะผู้เล่น ฉันต้องการเห็นว่า Quest นี้ได้รับการจัดสรรวัตถุดิบไปแล้วเท่าใด และยังขาดอะไร
- ในฐานะผู้เล่น ฉันต้องการกด Complete โดยไม่ให้แอปหักของในกระเป๋าเองโดยพลการ

### 5.3 กฎการทำงาน

1. F4-R1 Quest หนึ่งรายการคือหนึ่งแถวใน `quest` ของ Active Profile มี `name` (ไม่บังคับไม่ซ้ำ เพราะเกมอาจมี Quest ชื่อเดียวกันหลายรอบ), `status`, `notes`, `completed_at`
2. F4-R2 `status` มีค่า `active` (ค่าเริ่มต้น), `paused`, `completed` เปลี่ยนได้ทุกทิศทาง เมื่อเปลี่ยนเป็น `completed` ให้ตั้ง `completed_at` เป็นเวลาปัจจุบัน เมื่อเปลี่ยนออกจาก `completed` ให้ล้าง `completed_at`
3. F4-R3 การเปลี่ยนสถานะไม่เปลี่ยน `inventory.owned` ในทุกกรณี (§10 ข้อ 13) การหักวัตถุดิบเป็นคำสั่ง "Consume materials" แยกตาม F8
4. F4-R4 Requirement หนึ่งรายการคือหนึ่งแถวใน `quest_requirement` ประกอบด้วย `item_id`, `qty` (มากกว่า 0), `mode` (`craft`/`gather` ความหมายเดียวกับ F3-R4) และ `sort_order` Item เดียวกันต่อ Quest มีได้แถวเดียว
5. F4-R5 Quest เข้าร่วมการคำนวณ F6 ก็ต่อเมื่อมีแถว `tracking_target` (kind `quest`) และ `status = active` Quest ที่ `paused` หรือ `completed` ยังคงแถว `tracking_target` ไว้ (ลำดับ Priority ไม่หาย) แต่ไม่ถูกนับ และแสดงในรายการ Target ด้วยสถานะ "ไม่ถูกนับ" ข้อกำหนดนี้กำหนดในเอกสารฉบับนี้เพื่อให้ `paused` มีความหมายต่างจากการเอาออกจาก Tracking
6. F4-R6 Per-quest progress: สำหรับ Quest ที่ติดตามและ `active` หน้าจอ Quest Tracker แสดงต่อ Requirement ว่า "จัดสรร (allocated) X / ต้องการ Y" และ "ขาด Y − X" โดย X มาจาก `allocation[target][item]` ของ F6 ป้ายกำกับต้องใช้คำว่า "จัดสรร (allocated)" เสมอ ห้ามใช้คำว่า "มี" หรือ "Owned" กับตัวเลขต่อ Quest
7. F4-R7 Quest ที่ไม่ได้ติดตาม หรือ `paused`/`completed` แสดง Requirements โดยไม่มีตัวเลขจัดสรร พร้อมปุ่ม "ติดตาม" หรือสถานะที่อธิบายว่าทำไมจึงไม่นับ
8. F4-R8 Missing list ต่อ Quest คือ Requirements ที่ `ขาด > 0` เรียงตาม `sort_order` และต้องสอดคล้องกับ Gathering List เสมอ (ข้อมูลชุดเดียวกันจาก `gathering:changed`)
9. F4-R9 การบันทึก Quest พร้อม Requirements ทั้งชุดทำใน Transaction เดียว (เหมือน F3-R7)
10. F4-R10 การลบ Quest ลบ `quest_requirement` และ `tracking_target` ของ Quest นั้น (CASCADE) ไม่กระทบ Item และ Inventory ต้องมี Confirmation
11. F4-R11 รายการ Quest กรองตามสถานะได้ (ค่าเริ่มต้นแสดง `active` และ `paused` ส่วน `completed` ยุบอยู่ในส่วนท้าย) และค้นหาด้วยชื่อได้
12. F4-R12 ปุ่ม "Consume materials" อยู่ที่ Quest Tracker ต่อ Quest และทำงานตาม F8 ปุ่ม "Complete" เปลี่ยนเฉพาะสถานะ

### 5.4 ขั้นตอนการใช้งาน

1. ที่ Quest Tracker กด "สร้าง Quest" ใส่ชื่อ
2. เพิ่ม Requirements ทีละรายการ (Item, `qty`, `mode`) แล้วบันทึก
3. กด "ติดตาม" เพื่อเพิ่มเข้า Tracking Targets (เปิดเป็นค่าเริ่มต้นได้จากตัวเลือกในฟอร์ม)
4. ระหว่างเล่น ดูตัวเลขจัดสรรและ Missing list ต่อ Quest
5. เมื่อส่ง Quest ในเกม กด "Consume materials" (F8) แล้วเลือกให้ตั้งสถานะ Completed ใน Dialog เดียวกัน หรือกด "Complete" อย่างเดียวถ้าไม่ต้องการหักวัตถุดิบ

### 5.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| Requirement ที่ `mode = craft` และ Item มี Recipe | F6 ขยายผ่าน Recipe นั้น ตัวเลขจัดสรรต่อ Quest แสดงที่ระดับ Requirement (Item ปลายทาง) ไม่ใช่วัตถุดิบย่อย |
| Quest ที่ไม่มี Requirement | บันทึกได้ ไม่ส่งผลต่อ F6 |
| เปลี่ยน Quest จาก `completed` กลับเป็น `active` | กลับเข้าการคำนวณทันทีถ้ายังมี `tracking_target` |
| ลบ Item ที่ Quest ใช้ | ถูกกันด้วย F2-R12 ผู้ใช้ต้องเอาออกจาก Quest ก่อน |
| Quest ซ้ำชื่อ | อนุญาต UI อาจเตือนเบา ๆ แต่ไม่ปฏิเสธ |

### 5.6 ข้อมูลที่เกี่ยวข้อง

`quest` (`id`, `profile_id`, `name`, `status`, `notes`, `created_at`, `updated_at`, `completed_at`), `quest_requirement` (`quest_id`, `item_id`, `qty`, `mode`, `sort_order`), `tracking_target` (kind `quest`), ดัชนี `quest(profile_id, status)`, `quest_requirement(item_id)`

### 5.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `quests.list({ status? })` | `quests:list` | Quest ทั้งหมดพร้อมจำนวน Requirements และสถานะติดตาม |
| `quests.get({ id })` | `quests:get` | Quest พร้อม Requirements |
| `quests.create({ name, notes?, requirements[], track? })` | `quests:create` | สร้างพร้อม Requirements และเพิ่มเข้า Tracking ถ้า `track` |
| `quests.update({ id, name?, notes?, requirements[]? })` | `quests:update` | แก้ไขทั้งชุด |
| `quests.setStatus({ id, status })` | `quests:setStatus` | เปลี่ยนสถานะ (ไม่แตะ Inventory) |
| `quests.delete({ id })` | `quests:delete` | ลบ |
| `inventory.consume(...)` | ดู F8 | Consume materials |
| `gathering.get()` / `on('gathering:changed')` | ดู F6 | ตัวเลขจัดสรรต่อ Quest (`perTarget[]`) |
| `on('quests:changed')` | `quests:changed` | Payload: `{ profileId, questIds? }` |

### 5.8 นอกขอบเขต

Quest chain หรือเงื่อนไขปลดล็อก, รางวัล Quest, กำหนดเวลา/Reset รายวัน, การแบ่งขั้นตอนย่อยของ Quest

## 6. F5 Tracking Targets

### 6.1 วัตถุประสงค์

ให้ผู้ใช้เลือกว่า Quests และ Recipes รายการใดจะถูกนำมารวมใน Gathering List (Requirement 3.5 "รองรับการเลือกเฉพาะ Quests หรือ Recipes ที่ต้องการนำมาคำนวณ") จัดลำดับความสำคัญสำหรับการจัดสรร และ Pin เพื่อแสดงใน Overlay

### 6.2 User stories

- ในฐานะผู้เล่น ฉันต้องการเลือกเฉพาะ Quest และ Recipe ที่จะทำวันนี้ เพื่อให้ Gathering List ไม่ยาวเกินไป
- ในฐานะผู้เล่น ฉันต้องการเอา Quest ออกจากรายการติดตามโดยไม่ต้องลบ Quest ทิ้ง
- ในฐานะผู้เล่น ฉันต้องการจัดลำดับว่า Quest ใดควรได้รับวัตถุดิบก่อน เพื่อให้ตัวเลขจัดสรรสะท้อนสิ่งที่ฉันจะทำก่อน
- ในฐานะผู้เล่น ฉันต้องการ Pin Target ที่กำลังทำ เพื่อสลับดูใน Overlay ด้วย Hotkey

### 6.3 กฎการทำงาน

1. F5-R1 Target หนึ่งรายการคือหนึ่งแถวใน `tracking_target` ของ Active Profile เป็น Quest (`kind = quest`, `quest_id`) หรือ Recipe (`kind = recipe`, `recipe_id`) อย่างใดอย่างหนึ่งตาม `CHECK` ของตาราง Quest หรือ Recipe หนึ่งรายการเป็น Target ได้ครั้งเดียว (`UNIQUE (quest_id)`, `UNIQUE (recipe_id)`) การเพิ่มซ้ำคืน `DUPLICATE_TARGET`
2. F5-R2 การเพิ่มหรือเอาออกจาก Tracking ไม่สร้างหรือลบ Quest/Recipe การเอาออกลบเฉพาะแถว `tracking_target` ("include/exclude โดยไม่ลบ") แล้วจัด `priority` ของ Target ที่เหลือใหม่เป็น 1..n ใน Transaction เดียวกัน (ตาม Data Model)
3. F5-R3 Target แบบ Recipe มี `target_qty` (จำนวน Output ที่ต้องการ มากกว่า 0 ค่าเริ่มต้น 1) แก้ไขได้ตลอด Target แบบ Quest ไม่ใช้ `target_qty` (เก็บค่า 1)
4. F5-R4 `priority` เป็นจำนวนเต็มที่ไม่ซ้ำกันภายใน Profile ค่าน้อยถูกจัดสรรก่อน Target ใหม่ได้ `priority` ต่อท้ายรายการ (สูงสุด + 1)
5. F5-R5 การจัดลำดับใหม่ส่งลำดับ `id` ทั้งหมดของ Profile ใน `tracking:reorder` Main Process เขียน `priority` ใหม่เป็น 1..n ใน Transaction เดียว และปฏิเสธ (`VALIDATION`) ถ้ารายการไม่ครบหรือมี `id` แปลกปลอม
6. F5-R6 UI รองรับการจัดลำดับด้วยการลากวาง (Mouse) และด้วย Keyboard: โฟกัสแถวแล้วกด `Alt+ArrowUp` / `Alt+ArrowDown` เพื่อเลื่อนหนึ่งตำแหน่ง ทุกการเลื่อนบันทึกทันที
7. F5-R7 `pinned` เป็นสถานะต่อ Target ใช้โดย Overlay (F9) สลับได้จาก Gathering List, Quest Tracker, Recipes และ Overlay (Interactive mode)
8. F5-R8 Target ที่เป็น Quest `paused`/`completed` ยังอยู่ในรายการและคงลำดับ แต่ไม่ถูกนับ (F4-R5) และแสดงสถานะชัดเจน Target แบบ Recipe ไม่มีสถานะ ผู้ใช้ลดหรือเอาออกเองเมื่อ Craft เสร็จ (F8-R11 ช่วยทำให้อัตโนมัติ)
9. F5-R9 ทุกการเปลี่ยนแปลง Target ทำให้ F6 คำนวณใหม่และส่ง `gathering:changed` ทันที (Requirement 3.5 "เมื่อมีการเพิ่มหรือลบ Quest หรือ Recipe จำนวนรวมต้องอัปเดตทันที")
10. F5-R10 รายการ Target แสดงใน Gathering List (แผงด้านข้างหรือส่วนบน) พร้อมชนิด ชื่อ จำนวนรอบ/`target_qty` ความคืบหน้าแบบจัดสรร และปุ่ม Pin/เอาออก

### 6.4 ขั้นตอนการใช้งาน

1. ผู้ใช้กด "ติดตาม" ที่ Quest หรือ Recipe (หรือกด "เพิ่ม Target" ใน Gathering List แล้วเลือกจากรายการ) สำหรับ Recipe ระบบถาม `target_qty`
2. Target ปรากฏท้ายรายการ และ Gathering List อัปเดต
3. ลากแถวหรือใช้ Keyboard เพื่อจัดลำดับ ตัวเลขจัดสรรต่อ Target เปลี่ยนตามทันที
4. กด Pin เพื่อให้ Target นั้นวนแสดงใน Overlay
5. กด "เอาออก" เพื่อหยุดนับโดย Quest/Recipe ยังอยู่

### 6.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| ลบ Quest/Recipe ที่เป็น Target | แถว Target หายตาม CASCADE และ `priority` ที่เหลืออาจไม่ต่อเนื่อง ซึ่งยอมรับได้ (ลำดับสัมพัทธ์ยังถูกต้อง) การเอาออกผ่าน `tracking:remove` (F5-R2) หรือการ Reorder ครั้งถัดไปจะจัดเป็น 1..n |
| Reorder ส่งรายการไม่ครบ (เช่น ข้อมูลใน Renderer เก่า) | `VALIDATION` และ Renderer โหลดรายการใหม่จาก `tracking:changed` |
| ลด `target_qty` ต่ำกว่า 1 | `VALIDATION` ถ้าต้องการหยุดให้เอาออกจาก Tracking |
| Recipe ที่ไม่มี Ingredient เป็น Target | นับเป็น Target ที่ไม่มีวัตถุดิบ ไม่แสดงแถวใน Gathering List และไม่แสดงใน Craft plan (Craft plan มีเฉพาะ Item ระดับกลาง) |
| ไม่มี Target เลย | Gathering List แสดง Empty state พร้อมปุ่มเพิ่ม Target |

### 6.6 ข้อมูลที่เกี่ยวข้อง

`tracking_target` (`id`, `profile_id`, `kind`, `quest_id`, `recipe_id`, `target_qty`, `priority`, `pinned`, `created_at`), ดัชนี `tracking_target(profile_id, priority)`

### 6.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `tracking.list()` | `tracking:list` | Target ทั้งหมดเรียงตาม `priority` พร้อมชื่อและสถานะของ Quest/Recipe |
| `tracking.add({ kind, questId? , recipeId?, targetQty? })` | `tracking:add` | เพิ่ม Target |
| `tracking.remove({ id })` | `tracking:remove` | เอาออก (ไม่ลบ Quest/Recipe) |
| `tracking.update({ id, targetQty })` | `tracking:update` | แก้ `target_qty` |
| `tracking.reorder(ids)` | `tracking:reorder` | จัดลำดับใหม่ทั้งชุด |
| `tracking.setPinned({ id, pinned })` | `tracking:setPinned` | Pin/Unpin |
| `on('tracking:changed')` | `tracking:changed` | Payload: `{ profileId }` |

### 6.8 นอกขอบเขต

Target แบบ Item เดี่ยว (ใช้ Pin Item ใน F2 แทน), กลุ่ม Target หรือ Preset, กำหนดเส้นตายต่อ Target

## 7. F6 Global Material Aggregation และ Gathering List

### 7.1 วัตถุประสงค์

รวมวัตถุดิบจาก Targets ทั้งหมดเป็นรายการเดียวที่บอก Required / Owned / Missing อย่างถูกต้องแม้มี Shared Inventory และ Nested Recipes (Requirement 3.5 ซึ่งระบุว่าเป็น Feature สำคัญที่สุด) และแสดงในหน้าจอ Gathering List ที่ใช้ระหว่างเล่นได้ (Requirement 4) อัลกอริทึมเต็มเป็นเอกสาร [Data Model](04-data-model.md) หัวข้อ Aggregation และโค้ดอยู่ใน `electron/domain/*.ts` เอกสารนี้อธิบายความหมายของตัวเลขและพฤติกรรมของหน้าจอ

### 7.2 User stories

- ในฐานะผู้เล่น ฉันต้องการเห็นรายการเดียวว่าต้องออกไปเก็บอะไรบ้างและเท่าใด สำหรับทุก Quest และ Recipe ที่เลือก
- ในฐานะผู้เล่น ฉันต้องการให้ของที่มีอยู่แล้วถูกนับครั้งเดียว ไม่ใช่นับให้ทุก Quest ซ้ำ ๆ
- ในฐานะผู้เล่น ฉันต้องการให้แอปหัก Item ระดับกลางที่ฉันมีอยู่ก่อน แล้วค่อยบอกว่าต้องเก็บวัตถุดิบเพิ่มเท่าใด
- ในฐานะผู้เล่น ฉันต้องการเห็น Item ที่ยังขาดอยู่บนสุด และซ่อนที่ครบแล้ว

### 7.3 กฎการทำงาน

1. F6-R1 Input ของการคำนวณคือ Active Profile, `tracking_target` ที่นับได้ (F4-R5, F5-R8) เรียงตาม `priority` น้อยไปมาก, `inventory.owned` ของทุก Item และ Recipes พร้อม Ingredients ทั้งหมดของ Profile
2. F6-R2 ความหมายของ Target: Quest ให้ Requirements ตรงตาม `quest_requirement` ส่วน Recipe ให้ Ingredients ของ Recipe คูณจำนวนรอบ `ceil(target_qty / output_qty)` (Output Item ของ Target แบบ Recipe ไม่ถูกหักจาก Inventory ตามอัลกอริทึมใน Data Model ดูข้อสังเกตใน F8-R11)
3. F6-R3 Shared pool: Inventory ของ Profile เป็นกองกลางเดียว ระบบไล่ Target ตามลำดับ Priority และ "จ่าย" ของที่มีให้ Target ก่อนหน้าก่อน ของหนึ่งชิ้นถูกจัดสรรให้ Target เดียวเท่านั้น (ไม่นับจำนวนที่มีอยู่ซ้ำ ตาม Requirement 3.5)
4. F6-R4 Nested resolution: เมื่อ Requirement/Ingredient ขาด และ `mode = craft` และ Item นั้นมี Recipe ให้คิดจำนวนรอบที่ต้อง Craft, บันทึกเข้า Craft plan, ขยายลงไปยัง Ingredients ของ Recipe นั้นด้วยจำนวนรอบ และนำส่วนเกินจากรอบที่ไม่ลงตัวกลับเข้ากองกลางให้ Target ถัดไปใช้ได้ ถ้า `mode = gather` หรือไม่มี Recipe ให้ถือเป็นวัตถุดิบที่ต้องเก็บ (Leaf) Item ระดับกลางที่มีอยู่แล้วถูกหักก่อนขยายเสมอ (§10 ข้อ 11)
5. F6-R5 ตัวเลขในตาราง Gathering List ต่อ Leaf item: `Required` = จำนวนรวมที่ Targets ต้องการ Item นั้นที่ระดับเก็บ (ผลรวมของส่วนที่จัดสรรจากของที่มีและส่วนที่ยังขาด ในทุกจุดที่ Item นั้นถูกแก้เป็น Leaf), `Owned` = `inventory.owned` ของ Item, `Missing` = `max(0, Required − Owned)`
6. F6-R6 Craft plan: Item ระดับกลางที่ต้อง Craft (ไม่รวมรอบของ Recipe ที่เป็น Target เอง ซึ่ง Craft ได้จากหน้า Recipes ตาม F8-R10) แสดงในส่วน "Craft plan" แยกจากตารางวัตถุดิบ เป็นแถว "Recipe × รอบ" พร้อม Required/Owned ของ Item ระดับกลางนั้นและ Ingredients ต่อรอบ Item ระดับกลางไม่ถูกนับเป็นวัตถุดิบที่ต้องเก็บ ถ้า Item เดียวกันเป็นทั้ง Leaf (จาก Target ที่ตั้ง `gather`) และระดับกลาง (จาก Target ที่ตั้ง `craft`) จะปรากฏทั้งสองส่วนด้วยตัวเลขของแต่ละบทบาท
7. F6-R7 Overall Progress = Σ `min(Owned, Required)` / Σ `Required` ของทุก Leaf item แสดงเป็น "X / Y" และ Progress bar ที่ Gathering List, Game Dashboard และ Overlay
8. F6-R8 Per-target progress คือ `allocation[target][item]` เทียบกับจำนวนที่ Target ต้องการ ป้ายกำกับ "จัดสรร (allocated)" ตาม F4-R6 สำหรับ Target แบบ Recipe แสดงที่ระดับ Ingredient ของ Recipe นั้น
9. F6-R9 Item ที่ไม่ถูก Target ใดต้องการจะไม่ปรากฏใน Gathering List แม้ `owned > 0`
10. F6-R10 การเรียงลำดับค่าเริ่มต้นคือ "ขาดก่อน" (`missing-first`): `Missing` มากไปน้อย แล้วตามด้วยชื่อ ตัวเลือกอื่น: ชื่อ (`name`), หมวดหมู่ (`category`) ชุดค่าตาม [Data Model](04-data-model.md) ค่าที่เลือกบันทึกใน `app_setting.preferences.sort` การเรียงตาม Required ที่ Roadmap กล่าวถึง ต้องตรวจสอบว่าจะเพิ่มเป็นค่าที่สี่หรือไม่
11. F6-R11 "ซ่อนรายการที่ครบแล้ว" ยุบ Item ที่ `Missing = 0` ไว้ในส่วน "ครบแล้ว (n)" ที่ขยายดูได้ ค่าที่เลือกบันทึกใน `app_setting.preferences.hideComplete` และ Overlay ใช้ค่าเดียวกัน
12. F6-R12 ตัวกรอง: ค้นหาด้วยชื่อ, หมวดหมู่, Pinned เท่านั้น, และเลือกดูเฉพาะ Target ที่ต้องการ (ตัวกรองมุมมอง ไม่เปลี่ยนการจัดสรร) ตัวกรองมุมมองไม่บันทึกข้ามการเปิดแอป
13. F6-R13 Real-time: Main Process คำนวณใหม่หลังทุกการเขียนที่กระทบ (ข้อ 1.3 ข้อ 5) และส่งผลทั้งชุดใน `gathering:changed` ไปยัง Main Window และ Overlay Renderer แสดงผลจาก Payload ล่าสุดเท่านั้น ไม่มีการคำนวณซ้ำใน Renderer และไม่มีค่าที่เก็บซ้ำใน Database (Requirement 5)
14. F6-R14 แถวแต่ละแถวมีปุ่ม `+`/`−` และช่องแก้ไข `Owned` โดยตรงตาม F7 และสถานะสี: ครบ (Missing = 0), ยังขาด, และยังไม่มีเลย (Owned = 0) ตาม [UI/UX Design Plan](05-ui-ux-design-plan.md)
15. F6-R15 Craft plan แต่ละแถวมีปุ่ม "Craft" ที่เปิด Dialog ของ F8 สำหรับ Recipe นั้นด้วยจำนวนรอบที่แผนแนะนำ

### 7.4 ตัวอย่างตาม Requirement 3.5

Targets (ไม่มี Nested Recipe, Priority ตามลำดับ): Quest A ต้องการ Iron Ore × 10, Wood × 5; Quest B ต้องการ Iron Ore × 15, Leather × 8; Craft C (Target แบบ Recipe, `target_qty` 1, `output_qty` 1) ใช้ Iron Ore × 20, Wood × 10 Inventory: Iron Ore 20, Wood 5, Leather 3

| Item | Required | Owned | Missing |
|---|---:|---:|---:|
| Iron Ore | 45 | 20 | 25 |
| Wood | 15 | 5 | 10 |
| Leather | 8 | 3 | 5 |

Overall Progress = (20 + 5 + 3) / (45 + 15 + 8) = 28 / 68

การจัดสรรต่อ Target (ลำดับ A, B, C):

| Target | Item | ต้องการ | จัดสรร (allocated) | ขาด |
|---|---|---:|---:|---:|
| Quest A | Iron Ore | 10 | 10 | 0 |
| Quest A | Wood | 5 | 5 | 0 |
| Quest B | Iron Ore | 15 | 10 | 5 |
| Quest B | Leather | 8 | 3 | 5 |
| Craft C | Iron Ore | 20 | 0 | 20 |
| Craft C | Wood | 10 | 0 | 10 |

ถ้าผู้ใช้ย้าย Craft C ขึ้นเป็นลำดับแรก ตัวเลขในตารางรวมไม่เปลี่ยน แต่การจัดสรรจะกลายเป็น Craft C ได้ Iron Ore 20 และ Wood 5 ส่วน Quest A และ B ขาดทั้งหมด นี่คือเหตุผลที่ตัวเลขต่อ Target ต้องมีป้าย "จัดสรร"

ตัวอย่าง Nested (ชุดเดียวกับ Fixture B ใน [Acceptance Criteria](08-acceptance-criteria.md) 2.2 และ [Data Model](04-data-model.md) 7.4 (e)): Recipe Iron Sword × 1 ใช้ Iron Ingot × 4 (`craft`) และ Wood × 2 (`gather`); Recipe Iron Ingot (Output 2 ต่อรอบ) ใช้ Iron Ore × 3 (`craft` แต่ไม่มี Recipe จึงทำงานเหมือน `gather`) และ Coal × 1 (`gather`); Inventory: Iron Ingot 1, Iron Ore 2, Coal 0, Wood 0; Target คือ Iron Sword × 1 ระบบหัก Iron Ingot ที่มี 1 ก่อน เหลือ 3 จึง Craft Iron Ingot 2 รอบ (ได้ 4 ชิ้น เหลือส่วนเกิน 1) ใช้ Iron Ore 6 และ Coal 2 ผลลัพธ์: ตารางวัตถุดิบแสดง Iron Ore 6 / 2 / 4, Coal 2 / 0 / 2, Wood 2 / 0 / 2 (Overall Progress 2 / 10) และ Craft plan แสดงเฉพาะ Iron Ingot × 2 รอบ (Required 4 / Owned 1) ตัวอย่างเต็มหลายกรณีอยู่ใน Data Model

### 7.5 ขั้นตอนการใช้งาน

1. เปิดหน้าจอ Gathering List (`#/gathering`) ระบบแสดงตารางวัตถุดิบ, Craft plan, Overall Progress และแผง Targets
2. ขณะเก็บของ กด `+`/`−` หรือพิมพ์จำนวนใน `Owned` ตัวเลข Missing และ Progress เปลี่ยนทันที
3. เปิด "ซ่อนรายการที่ครบแล้ว" เมื่อรายการยาว
4. ใช้ช่องค้นหาหรือตัวกรองหมวดหมู่เพื่อหา Item เฉพาะ
5. เมื่อวัตถุดิบของ Recipe ระดับกลางครบ กด "Craft" ใน Craft plan (F8)

### 7.6 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| Ingredient `craft` ที่ Recipe ถูกลบไป | ถือเป็น Leaf ทันที ตัวเลขเปลี่ยนในรอบคำนวณถัดไป |
| วงในข้อมูล (ไม่ควรเกิดเพราะ F3-R6) | Visited set ป้องกัน ระบบถือ Item นั้นเป็น Leaf, บันทึก Log และส่ง `warnings` รหัส `CYCLE_GUARD` พร้อม `path` มากับผลลัพธ์ Gathering List แสดงคำเตือนโดยไม่หยุดการคำนวณ |
| `output_qty` ไม่ลงตัวกับจำนวนที่ขาด | ส่วนเกินกลับเข้ากองกลางให้ Target ถัดไป (F6-R4) จึงไม่เกิดการเก็บเกิน |
| Item เดียวกันเป็นทั้ง Leaf และระดับกลาง | แสดงทั้งสองส่วนตาม F6-R6 |
| ไม่มี Target ที่นับได้ | ตารางว่าง Overall Progress แสดง "0 / 0" และข้อความแนะนำ |
| การเขียนต่อเนื่องเร็วมาก (กด `+` รัว) | Debounce 16 ms รวมเป็นการคำนวณครั้งเดียว Renderer รับ Payload ล่าสุดเท่านั้น |
| Profile มีข้อมูลหลายร้อยแถว | คำนวณแบบ Synchronous ใน Main Process เสร็จในระดับมิลลิวินาที (ดู [Risks & Limitations](07-risks-and-limitations.md) ถ้าโตกว่านั้น) |

### 7.7 ข้อมูลที่เกี่ยวข้อง

อ่านจาก `tracking_target`, `quest`, `quest_requirement`, `recipe`, `recipe_ingredient`, `inventory`, `item` ไม่มีตารางเก็บผลลัพธ์ (คำนวณสดทุกครั้ง) ค่าตั้งค่า `app_setting.preferences` (`sort`, `hideComplete`)

### 7.8 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `gathering.get()` | `gathering:get` | ผลลัพธ์ชุดเต็มตามรูปร่าง `AggregationResult` ใน Data Model (DTO ใน `contracts.ts` ชื่อ `GatheringResult`) ที่ Main Process เติมข้อมูลแสดงผลแล้ว: `items[]` (Leaf: itemId, name, category, thumbnailUrl, pinned, required, owned, missing), `craftPlan[]` (recipeId, outputItemId, ชื่อและ Thumbnail ของ Output, runs, required, owned, ingredientsPerRun), `perTarget[]` (targetId, rows: itemId, need, allocated และ missing = need − allocated, leafRows: itemId, allocated), `overall { owned, required }`, `warnings[]` |
| `on('gathering:changed')` | `gathering:changed` | Payload เดียวกับ `gathering.get()` |
| `settings.update({ preferences })` | ดู F11 | บันทึก `sort`, `hideComplete` |

### 7.9 นอกขอบเขต

การแนะนำเส้นทางเก็บของหรือตำแหน่งในเกม, ราคาตลาด, การเลือกซื้อแทนเก็บ, การแชร์รายการ, การคำนวณบน Renderer

## 8. F7 Manual Inventory

### 8.1 วัตถุประสงค์

ให้ผู้ใช้บันทึกจำนวน Item ที่มีจริงด้วยตนเองอย่างรวดเร็วที่สุด โดยไม่อ่าน Memory, Process หรือ API ของเกม (Requirement 3.6) จำนวนนี้คือ `inventory.owned` ที่ F6 ใช้คำนวณ

### 8.2 User stories

- ในฐานะผู้เล่น ฉันต้องการกด `+` หนึ่งครั้งเมื่อเก็บของได้ โดยไม่ต้องพิมพ์
- ในฐานะผู้เล่น ฉันต้องการเพิ่มทีละ 5 หรือ 10 เมื่อเก็บได้เป็นกอง
- ในฐานะผู้เล่น ฉันต้องการพิมพ์จำนวนตรง ๆ เมื่อเช็คกระเป๋าในเกมแล้ว
- ในฐานะผู้เล่น ฉันต้องการให้ตัวเลขยังอยู่ครบหลังปิดแอปหรือรีสตาร์ตเครื่อง

### 8.3 กฎการทำงาน

1. F7-R1 จำนวนที่มีเก็บใน `inventory.owned` หนึ่งแถวต่อ Item (`item_id` เป็น Primary Key) ค่าเป็นจำนวนเต็มไม่ติดลบ (`CHECK (owned >= 0)`) และไม่เกิน 999,999 (ค่าเสนอ เพื่อจำกัดความกว้างของ UI)
2. F7-R2 การปรับแบบสัมพัทธ์ (`inventory:adjust` ด้วย `delta` บวกหรือลบ) คำนวณ `owned + delta` ถ้าผลต่ำกว่า 0 ให้ปัดเป็น 0 (ไม่ปฏิเสธ เพื่อให้กด `−` รัวได้โดยไม่เจอ Error) ถ้าเกินค่าสูงสุดให้ปัดเป็นค่าสูงสุด ผลลัพธ์คืน `owned` ใหม่
3. F7-R3 การกำหนดค่าโดยตรง (`inventory:set` ด้วย `owned`) ต้องเป็นจำนวนเต็มในช่วงที่กำหนด ค่าที่ไม่ผ่าน (ติดลบ, ทศนิยม, ไม่ใช่ตัวเลข) คืน `VALIDATION` และช่องกรอกแสดงค่าเดิม
4. F7-R4 Step sizes: ปุ่ม `+`/`−` ใช้ขั้นที่เลือกอยู่จากชุด `app_setting.preferences.stepSizes` ค่าเริ่มต้น `[1, 5, 10]` ตั้งค่าได้ใน Settings เป็น 1 ถึง 3 ค่าที่เป็นจำนวนเต็มบวกไม่ซ้ำกัน ขั้นที่เลือกอยู่เป็นสถานะของหน้าจอ (ค่าเริ่มต้น 1) และแสดงเป็นตัวเลือกแบบ Segmented ที่ Gathering List และ Overlay
5. F7-R5 ปุ่ม `+`/`−` และช่องแก้ไขอยู่ในทุกแถวของ Gathering List, Item Library, Requirements ใน Quest Tracker, Ingredients ใน Recipes และ Overlay (Interactive mode)
6. F7-R6 Autosave: ทุกคำสั่งเขียน `inventory` ทันทีใน Main Process (Upsert แถว, ตั้ง `updated_at`) และคืนผลหลัง Commit ไม่มีปุ่มบันทึก ไม่มีการรอรวมหลายคลิก
7. F7-R7 หลังเขียนสำเร็จ Main Process ส่ง `inventory:changed` (itemId, owned) ไปทุก Window ทันที และ F6 คำนวณใหม่ (Debounce 16 ms) แล้วส่ง `gathering:changed` Renderer อัปเดตช่อง `Owned` จาก `inventory:changed` และ Missing/Progress จาก `gathering:changed`
8. F7-R8 Persistence: ค่าที่ Commit แล้วต้องอยู่ครบหลังปิดแอป, Crash หรือรีสตาร์ตเครื่อง ตาม F12 (WAL + Transaction)
9. F7-R9 Keyboard: เมื่อแถวมีโฟกัส กด `+` หรือ `=` เพิ่มตามขั้นที่เลือก, `-` ลดตามขั้นที่เลือก, `Enter` เข้าสู่การแก้ไขค่าโดยตรง, `Enter` อีกครั้งยืนยัน, `Escape` ยกเลิก, `ArrowUp`/`ArrowDown` เลื่อนแถว ปุ่มทุกปุ่มต้องมี `aria-label` ระบุชื่อ Item และขั้น
10. F7-R10 ปุ่ม `−` ปิดการใช้งานเมื่อ `owned = 0` (แสดงแต่กดไม่ได้) เพื่อสื่อว่าไม่ติดลบ

### 8.4 ขั้นตอนการใช้งาน

1. เลือกขั้น (1/5/10) ที่ส่วนหัวของรายการ ถ้าต้องการขั้นอื่นจาก 1
2. กด `+` ที่แถว Item ตัวเลข Owned เพิ่ม Missing ลด และ Progress ขยับทันที
3. หรือคลิกตัวเลข Owned พิมพ์ค่าใหม่ แล้วกด Enter
4. ไม่ต้องกดบันทึก ค่าถูกเขียนแล้ว

### 8.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| กด `−` จนถึง 0 แล้วกดต่อ | ค่าคงที่ 0 ไม่มี Error |
| พิมพ์ค่าว่างแล้ว Enter | ถือเป็นยกเลิก ค่าเดิมคงอยู่ |
| พิมพ์ `1e3` หรือค่าที่มีหน่วย | `VALIDATION` |
| Item ไม่มีแถว `inventory` (ข้อมูลจาก Migration เก่า) | Upsert สร้างแถวใหม่ด้วยค่าที่ขอ |
| เขียน Database ล้มเหลว (ดิสก์เต็ม, ไฟล์ล็อก) | `IO` และ UI แสดงค่าเดิมพร้อมข้อความ ไม่มีการ Retry อัตโนมัติ |
| ปรับจาก Overlay และ Main Window พร้อมกัน | ทุกคำสั่งผ่าน Main Process ตามลำดับ ค่าสุดท้ายถูกส่งกลับทั้งสอง Window |

### 8.6 ข้อมูลที่เกี่ยวข้อง

`inventory` (`item_id`, `owned`, `updated_at`), `app_setting.preferences.stepSizes`

### 8.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `inventory.adjust({ itemId, delta })` | `inventory:adjust` | ปรับสัมพัทธ์ ปัดที่ 0 และค่าสูงสุด คืน `{ itemId, owned }` |
| `inventory.set({ itemId, owned })` | `inventory:set` | กำหนดค่าโดยตรง |
| `on('inventory:changed')` | `inventory:changed` | Payload: `{ profileId, changes: [{ itemId, owned }] }` |
| `on('gathering:changed')` | ดู F6 | Missing/Progress ใหม่ |

### 8.8 นอกขอบเขต

การอ่าน Inventory จากเกมทุกรูปแบบ (Requirement 3.6 และ 9), ประวัติการเปลี่ยนแปลงหรือ Undo, Inventory หลายช่อง (คลัง, ตัวละคร), การแชร์ Inventory ข้าม Profile

## 9. F8 Consume Materials และ Craft Actions

### 9.1 วัตถุประสงค์

ให้ผู้ใช้ตัดวัตถุดิบออกจาก Inventory เมื่อส่ง Quest หรือ Craft จริงในเกม ด้วยคำสั่งที่ชัดเจน มี Confirmation และเป็น Transaction เดียว (§10 ข้อ 13) โดยการเปลี่ยนสถานะ Quest ไม่แตะ Inventory (F4-R3)

### 9.2 User stories

- ในฐานะผู้เล่น ฉันต้องการกดปุ่มเดียวเมื่อส่ง Quest แล้ว ให้แอปหักของตามที่ Quest ใช้ไป โดยเห็นก่อนว่าจะหักอะไร
- ในฐานะผู้เล่น ฉันต้องการกด Craft แล้วให้แอปหัก Ingredients และบวก Output ให้พร้อมกัน
- ในฐานะผู้เล่น ฉันต้องการให้แอปปฏิเสธเมื่อของไม่พอ แทนที่จะหักบางส่วนแล้วติดลบ

### 9.3 กฎการทำงาน

1. F8-R1 "Consume materials" ของ Quest หัก `quest_requirement` ทุกแถวของ Quest นั้น (Item และ `qty` โดยตรง ไม่ขยาย Nested) ออกจาก `inventory.owned`
2. F8-R2 "Craft" ของ Recipe รับจำนวนรอบ `runs` (มากกว่า 0 ค่าเริ่มต้น 1 หรือค่าที่ Craft plan แนะนำ) หัก `recipe_ingredient` ทุกแถว × `runs` และบวก `output_qty × runs` ให้ Output Item ใน Transaction เดียวกัน ไม่ขยาย Nested: การ Craft Item ระดับกลางทำผ่าน Craft ของ Recipe นั้นเอง (ปุ่มใน Craft plan ตาม F6-R15)
3. F8-R3 ทั้งสองคำสั่งต้องเปิด Confirmation dialog ก่อนเสมอ เนื้อหา: ชื่อ Quest/Recipe, จำนวนรอบ (Craft), ตารางแถวละ Item ประกอบด้วย Thumbnail, ชื่อ, จำนวนที่จะหัก, Owned ก่อน → Owned หลัง และแถว Output (Craft) ที่แสดง "+ `output_qty × runs`" แถวที่ Owned หลังติดลบต้องเน้นสีและระบุจำนวนที่ขาด
4. F8-R4 ถ้ามีแถวใดที่ Owned หลังติดลบ ปุ่มยืนยันต้องปิดการใช้งาน และ Dialog แสดงข้อความว่าของไม่พอ พร้อมรายการที่ขาด ผู้ใช้ปรับ Inventory ก่อนแล้วกลับมาใหม่ได้โดย Dialog ไม่ปิด (ตัวเลขใน Dialog อัปเดตจาก `inventory:changed`)
5. F8-R5 Main Process ตรวจซ้ำภายใน Transaction (อ่าน `owned` ปัจจุบันของทุก Item ที่เกี่ยวข้อง) ถ้าแถวใดจะติดลบ ให้ Rollback ทั้งหมดและคืน `INSUFFICIENT_MATERIALS` พร้อม `details.items` (itemId, name, need, owned ตาม Data Model) ไม่มีการเขียนบางส่วนในทุกกรณี
6. F8-R6 สำเร็จแล้ว Main Process ส่ง `inventory:changed` ที่รวมทุก Item ที่เปลี่ยน และ F6 คำนวณใหม่
7. F8-R7 Dialog ของ Consume (Quest) มีตัวเลือก "ตั้งสถานะ Quest เป็น Completed ด้วย" ค่าเริ่มต้นเปิด เมื่อเลือกจะเปลี่ยนสถานะใน Transaction เดียวกับการหัก (ตั้ง `completed_at`) เหตุผล: ถ้าหักของแล้ว Quest ยัง `active` Gathering List จะเรียกร้องวัตถุดิบเดิมซ้ำทันที ตัวเลือกนี้ไม่ขัดกับ F4-R3 เพราะทิศทางคือ "หักแล้วจึง Complete" ไม่ใช่ "Complete แล้วหัก"
8. F8-R8 การ Consume สำหรับ Quest ที่ `completed` อยู่แล้วทำได้ (กรณีผู้ใช้กด Complete ก่อน) โดย Dialog ซ่อนตัวเลือกในข้อ F8-R7
9. F8-R9 คำสั่งทั้งสองรองรับ `dryRun: true` เพื่อให้ Renderer ขอเนื้อหา Dialog จาก Main Process (ตัวเลขปัจจุบันจริง) โดยไม่เขียน
10. F8-R10 Craft ทำได้กับ Recipe ใดก็ได้ของ Profile ไม่จำเป็นต้องเป็น Target (ปุ่ม Craft อยู่ที่หน้าจอ Recipes ด้วย)
11. F8-R11 ถ้า Recipe ที่ Craft เป็น Target อยู่ Dialog มีตัวเลือก "ลด `target_qty` ตามจำนวนที่ Craft" ค่าเริ่มต้นเปิด เมื่อเลือกจะลด `target_qty` ลง `output_qty × runs` และเอา Target ออกเมื่อเหลือ ≤ 0 ใน Transaction เดียวกัน เหตุผล: อัลกอริทึมของ Target แบบ Recipe นับจาก Ingredients × รอบ โดยไม่หัก Output ที่ถืออยู่ (F6-R2) ถ้าไม่ลด Target Gathering List จะเรียกร้อง Ingredients รอบใหม่ทันทีหลัง Craft
12. F8-R12 ปุ่มยืนยันใน Dialog ต้องไม่ใช่ปุ่ม Default ของ Keyboard `Enter` (ต้องกดหรือ Tab ไปที่ปุ่มก่อน) เพื่อป้องกันการหักโดยไม่ตั้งใจระหว่างเล่น

### 9.4 ขั้นตอนการใช้งาน

Consume (Quest):

1. ที่ Quest Tracker กด "Consume materials" ของ Quest
2. ระบบเรียก `inventory.consume({ questId, dryRun: true })` และแสดง Dialog ตาม F8-R3
3. ถ้าพอ ผู้ใช้เลือกว่าจะ Complete ด้วยหรือไม่ แล้วกดยืนยัน
4. ระบบเขียนใน Transaction เดียว แล้วทุกหน้าจออัปเดต

Craft (Recipe):

1. ที่ Recipes หรือ Craft plan กด "Craft" ระบบเปิด Dialog พร้อมจำนวนรอบ (แก้ได้) และแสดงจำนวนรอบสูงสุดที่ของพอ
2. ผู้ใช้ยืนยัน ระบบหัก Ingredients และบวก Output พร้อมกัน

### 9.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| ของถูกปรับจาก Overlay ระหว่าง Dialog เปิด | Dialog อัปเดตตัวเลขจาก `inventory:changed` และ F8-R5 ตรวจซ้ำตอนยืนยัน |
| Quest ไม่มี Requirement | ปุ่ม Consume ปิดการใช้งาน |
| Recipe ไม่มี Ingredient | Craft ได้ (บวก Output เท่านั้น) Dialog แจ้งว่าไม่มีการหัก |
| Output Item เป็นหนึ่งใน Ingredients ของตัวเอง | ถูกกันแล้วโดย F3-R5 |
| `runs` ทำให้ Output เกินค่าสูงสุดของ F7-R1 | `VALIDATION` พร้อมจำนวนรอบสูงสุดที่ทำได้ |
| ยืนยันซ้ำสองครั้ง (Double click) | ปุ่มปิดการใช้งานทันทีหลังคลิกแรกจนได้ผลลัพธ์ |
| Transaction ล้มเหลวด้วยเหตุอื่น (I/O) | `IO` ไม่มีการเขียนใด ๆ Dialog ยังเปิดให้ลองใหม่ |

### 9.6 ข้อมูลที่เกี่ยวข้อง

`inventory`, `quest_requirement`, `recipe_ingredient`, `recipe.output_item_id`, `recipe.output_qty`, `quest.status`/`completed_at` (ตัวเลือก F8-R7), `tracking_target.target_qty` (ตัวเลือก F8-R11)

### 9.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `inventory.consume({ questId, dryRun?, completeQuest? })` | `inventory:consume` | หัก Requirements ของ Quest คืนแผน (`rows`, `ok`, รายการที่ขาดในรูปเดียวกับ `details.items`) เมื่อ `dryRun` |
| `inventory.craft({ recipeId, runs, dryRun?, reduceTarget? })` | `inventory:craft` | หัก Ingredients × รอบ และบวก Output คืนแผนเมื่อ `dryRun` |
| `on('inventory:changed')`, `on('gathering:changed')`, `on('quests:changed')`, `on('tracking:changed')` | | ผลหลังสำเร็จ |

### 9.8 นอกขอบเขต

การ Craft แบบ Nested ในคำสั่งเดียว (Craft ระดับกลางให้อัตโนมัติ), Undo หลังยืนยัน, การ Consume บางส่วน, การคำนวณผลพลอยได้หรือของเสียจากการ Craft

## 10. F9 Windows Overlay

### 10.1 วัตถุประสงค์

แสดงรายการวัตถุดิบทับหน้าต่างเกมโดยไม่ต้อง Alt+Tab รองรับโหมดดูอย่างเดียว (คลิกทะลุ) และโหมดกดปุ่มได้ ปรับความโปร่งใส ย้าย ย่อ และ Pin ได้ (Requirement 3.7) เป้าหมายคือเกม Borderless Windowed โดยไม่ใช้ Injection หรือหลบเลี่ยง Anti-Cheat (§10 ข้อ 9) ข้อจำกัดกับ Fullscreen Exclusive และ Anti-Cheat อยู่ใน [Risks & Limitations](07-risks-and-limitations.md) และรายละเอียด Window options อยู่ใน [Architecture Proposal](02-architecture-proposal.md)

### 10.2 User stories

- ในฐานะผู้เล่น ฉันต้องการเห็นรายการของที่ต้องเก็บมุมจอขณะเล่น โดยเมาส์ยังควบคุมเกมได้ตามปกติ
- ในฐานะผู้เล่น ฉันต้องการกด Hotkey เพื่อสลับเป็นโหมดกดปุ่ม แล้วกด `+` ได้ทันทีเมื่อเก็บของได้
- ในฐานะผู้เล่น ฉันต้องการให้ Overlay เล็ก จาง และอยู่ตำแหน่งเดิมทุกครั้งที่เปิด
- ในฐานะผู้เล่น ฉันต้องการวนดูเฉพาะ Quest ที่ Pin ไว้ด้วย Hotkey

### 10.3 กฎการทำงาน

1. F9-R1 Overlay เป็น `BrowserWindow` แยก โหลด `overlay.html` (Vite entry แยก) แบบ Transparent, Frameless, Always-on-top, ไม่แสดงใน Taskbar สร้างแบบ Lazy ครั้งแรกที่ต้องแสดง และซ่อน (ไม่ทำลาย) เมื่อปิด เพื่อให้เปิดครั้งถัดไปเร็ว
2. F9-R2 การมองเห็น: สลับด้วย Hotkey `CommandOrControl+Shift+O` (ค่าเริ่มต้น), ปุ่มใน Main Window และ Settings สถานะ `visible` บันทึกใน `app_setting.overlay` และคืนค่าเมื่อเริ่มแอป (ถ้าเคยเปิดค้างไว้จะเปิดให้) Overlay ไม่แสดงเมื่อไม่มี Active Profile
3. F9-R3 สองโหมด: **View** (ค่าเริ่มต้นของ `overlay.mode`) ใช้ `setIgnoreMouseEvents(true, { forward: true })` ทุกคลิกทะลุไปยังเกม ปุ่ม `+`/`−` และตัวควบคุมถูกซ่อน และ Window ต้องไม่แย่งโฟกัสจากเกม **Interactive** ใช้ `setIgnoreMouseEvents(false)` ปุ่มทุกปุ่มใช้งานได้ ส่วนหัวเป็นพื้นที่ลากย้าย และมีมุมสำหรับปรับขนาด สลับด้วย Hotkey `CommandOrControl+Shift+M` หรือปุ่มใน Overlay (เห็นเฉพาะ Interactive) และกด `Escape` ใน Overlay เพื่อกลับเป็น View โหมดปัจจุบันต้องมีสัญลักษณ์บอกที่ส่วนหัวเสมอ โหมดล่าสุดบันทึกใน `app_setting.overlay.mode` และใช้เมื่อแสดง Overlay ครั้งถัดไป (ผู้ใช้ตั้ง "โหมดเริ่มต้นเมื่อแสดง" ได้ใน Settings > Overlay ซึ่งเขียนค่าเดียวกัน)
4. F9-R4 Opacity ปรับได้ช่วง 20% ถึง 100% (ค่าเริ่มต้น 90%) ผ่าน `setOpacity()` ตั้งจาก Settings และจาก Slider ใน Overlay (Interactive) ค่าบันทึกใน `app_setting.overlay.opacity`
5. F9-R5 Bounds (x, y, width, height) บันทึกใน `app_setting.overlay.bounds` ด้วย Debounce 200 ms หลังย้ายหรือปรับขนาด เมื่อแสดงครั้งถัดไปให้ใช้ค่าที่บันทึก ถ้ายังไม่มีค่า (`bounds = null`) ให้วางที่มุมขวาบนของ Display หลักตาม Data Model ถ้าอยู่นอกทุก Display ที่มีอยู่ ให้ย้ายเข้าสู่ Display ที่ใกล้ที่สุด (ใช้หลักการเดียวกับ `eventSetPosition` ใน `electron/settings/index.js` ที่เขียนใหม่เป็น TypeScript) ขนาดต่ำสุด 220×160 px (ค่าเสนอ)
6. F9-R6 Compact mode (`app_setting.overlay.compact`): แถวสูงลดลง แสดง Thumbnail ขนาดเล็ก ชื่อ และ "Owned / Required" บรรทัดเดียว ไม่มี Progress bar ส่วน Missing แสดงเป็นตัวเลขสั้น ปุ่ม `+`/`−` ยังมีใน Interactive mode โหมดปกติแสดง Thumbnail, ชื่อ, "Owned / Required", "Missing n", Progress bar และปุ่ม สลับได้จาก Settings และปุ่มใน Overlay
7. F9-R7 เนื้อหาต่อแถว: Item Image (Thumbnail หรือ Placeholder), Name, Owned, Required, Missing และ Progress (สีตามสถานะเดียวกับ Gathering List) ส่วนท้ายแสดง Overall Progress "X / Y" ส่วนหัวแสดงชื่อ Profile หรือชื่อ Target ที่กำลังดู ตามแบบใน Requirement 3.7
8. F9-R8 Scope ของเนื้อหา: ค่าเริ่มต้นคือ "ทั้งหมด" = Leaf items จาก Gathering List โดยถ้ามี Item ที่ Pinned (F2-R5) ให้แสดงเฉพาะ Item ที่ Pinned และถ้าไม่มี Item ใด Pinned ให้แสดงทั้งหมดตามการเรียง "ขาดก่อน" และเคารพ `hideComplete` นอกจากนี้ Target ที่ Pinned (F5-R7) แต่ละรายการเป็น Scope ของตัวเอง แสดง Requirements/Ingredients ของ Target นั้นพร้อมตัวเลข "จัดสรร (allocated)" และ Missing ตามการจัดสรร
9. F9-R9 Hotkey `CommandOrControl+Shift+]` / `CommandOrControl+Shift+[` วน Scope: ทั้งหมด → Target ที่ Pinned ลำดับที่ 1 → ... → ลำดับสุดท้าย → ทั้งหมด (เรียงตาม `priority`) ถ้าไม่มี Target ที่ Pinned Hotkey ไม่ทำอะไร Scope ที่เลือกอยู่ไม่บันทึกข้ามการเปิดแอป
10. F9-R10 ปุ่ม `+`/`−` ใน Interactive mode ใช้ `inventory:adjust` ตามขั้นที่เลือกใน Overlay (ตัวเลือก 1/5/10 ขนาดเล็กที่ส่วนหัว) ผลลัพธ์แสดงจาก Push events เช่นเดียวกับ Main Window ปุ่ม Pin/Unpin Item และ Target มีใน Interactive mode ด้วย
11. F9-R11 Overlay รับข้อมูลจาก `gathering:changed` และ `inventory:changed` เท่านั้น ไม่เรียก `list` ของตารางอื่น และไม่มี Animation, Transition หรือ Timer ที่ทำงานต่อเนื่อง เพื่อลด CPU/GPU (Requirement 3.7 ข้อสุดท้าย) ภาพใช้ Thumbnail 64 px เท่านั้น
12. F9-R12 Always-on-top ใช้ระดับ `screen-saver` และ Main Process ยืนยันสถานะซ้ำเมื่อ Overlay ถูกบดบัง (บน `blur` และตามช่วงเวลาขณะ `visible`) ตามแนวทางใน Risks & Limitations เพราะบางเกมตั้ง Topmost ทับ
13. F9-R13 Overlay ใช้ Preload และ `window.api` ชุดเดียวกับ Main Window (ข้อ 1.3 ข้อ 2) และเปิด Settings ไม่ได้จาก Overlay โดยตรง (มีปุ่ม "เปิดแอปหลัก" ที่นำ Main Window ขึ้นมา)
14. F9-R14 เมื่อ Overlay ถูกซ่อน ให้ยกเลิกการส่ง `gathering:changed` ไปยัง Overlay (ส่งครั้งเดียวเมื่อแสดงอีกครั้ง) เพื่อประหยัดทรัพยากร
15. F9-R15 Multi-monitor และ High-DPI: Bounds เก็บเป็น DIP (ค่าที่ Electron ใช้กับ `BrowserWindow`) จึงย้ายข้าม Display ที่ Scale ต่างกันได้โดยไม่ต้องแปลง การแสดงผลใช้ Scale ของ Display ที่ Overlay อยู่

### 10.4 ขั้นตอนการใช้งาน

1. เปิดเกมแบบ Borderless Windowed
2. กด `Ctrl+Shift+O` Overlay ปรากฏตำแหน่งเดิมในโหมด View คลิกทะลุไปเกม
3. เมื่อเก็บของได้ กด `Ctrl+Shift+M` เป็น Interactive กด `+` ที่ Item แล้วกด `Escape` (หรือ Hotkey อีกครั้ง) กลับเป็น View
4. กด `Ctrl+Shift+]` เพื่อดูเฉพาะ Quest ที่ Pin ไว้ กดซ้ำเพื่อวนรายการ
5. ตั้งค่า Opacity, Compact และตำแหน่งได้จาก Settings > Overlay หรือใน Interactive mode

### 10.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| เกมเป็น Fullscreen Exclusive | Overlay ไม่ปรากฏทับเกม (ข้อจำกัดของ OS) แอปไม่พยายามหลบเลี่ยง Settings และเอกสารแนะนำให้สลับเกมเป็น Borderless Windowed |
| เกมแย่ง Topmost กลับ | F9-R12 ยืนยัน Always-on-top ซ้ำ |
| Display ที่ Overlay เคยอยู่ถูกถอด | F9-R5 ย้ายเข้า Display ที่ใกล้ที่สุด |
| Hotkey ถูกเกมหรือโปรแกรมอื่นใช้ | `globalShortcut.register` คืน `false` แสดงใน Settings (F11-R4) ผู้ใช้ยังเปิด Overlay ได้จากปุ่มใน Main Window |
| ไม่มี Target ที่นับได้ | Overlay แสดงข้อความสั้น "ไม่มีรายการ" และ Overall "0 / 0" |
| สลับ Profile ขณะ Overlay เปิด | Overlay แสดงข้อมูล Profile ใหม่จาก `gathering:changed` และ Scope กลับเป็น "ทั้งหมด" |
| Anti-Cheat ของเกมตั้งค่าห้าม Overlay | นอกการควบคุมของแอป ดู Risks & Limitations ผู้ใช้ต้องตรวจนโยบายของเกม |
| Opacity ต่ำจนมองไม่เห็นแล้วหาไม่เจอ | Settings มีปุ่ม "รีเซ็ตตำแหน่งและความโปร่งใส" ที่คืนค่าเริ่มต้น |

### 10.6 ข้อมูลที่เกี่ยวข้อง

`app_setting.overlay` (`bounds`, `opacity`, `mode`, `compact`, `visible`), `item.pinned`, `tracking_target.pinned`, ผลลัพธ์จาก F6 (`gathering`, `targets`, `overall`)

### 10.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `overlay.show()` / `overlay.hide()` / `overlay.toggle()` | `overlay:show`, `overlay:hide`, `overlay:toggle` | การมองเห็น |
| `overlay.setMode('view' \| 'interactive')` | `overlay:setMode` | สลับโหมด |
| `overlay.setOpacity({ opacity })` | `overlay:setOpacity` | 0.2 ถึง 1.0 |
| `overlay.setCompact({ compact })` | `overlay:setCompact` | Compact mode |
| `overlay.resetLayout()` | `overlay:resetLayout` | คืน Bounds และ Opacity เริ่มต้น |
| `overlay.getState()` | `overlay:getState` | `{ visible, mode, opacity, compact, bounds, scope }` |
| `overlay.cycleScope({ direction })` | `overlay:cycleScope` | วน Scope (ใช้จาก Hotkey และปุ่ม) |
| `overlay.focusMainWindow()` | `overlay:focusMainWindow` | นำ Main Window ขึ้น |
| `overlay.setBounds({ x, y, width, height })` | `overlay:setBounds` | Grip ปรับขนาด/ลากย้าย; Main บีบไม่ต่ำกว่า 220×160 และให้อยู่ในจอที่มีอยู่จริง แล้วบันทึกแบบ Debounce 200 ms |
| `inventory.adjust(...)`, `items.setPinned(...)`, `tracking.setPinned(...)` | ดู F7, F2, F5 | ปุ่มใน Interactive mode |
| `on('overlay:changed')` | `overlay:changed` | Payload: สถานะเดียวกับ `getState()` |
| `on('gathering:changed')`, `on('inventory:changed')` | ดู F6, F7 | เนื้อหา |

### 10.8 นอกขอบเขต

Injection หรือ Hook เข้าเกม, การตรวจจับว่าเกมใดกำลังทำงานเพื่อสลับ Profile อัตโนมัติ, หลาย Overlay พร้อมกัน, Theme ของ Overlay แยกจากแอป, การซ่อนอัตโนมัติเมื่อเกมไม่ได้โฟกัส (พิจารณาใน Phase หลังหากจำเป็น)

## 11. F10 Screenshot และ Capture Workflow

### 11.1 วัตถุประสงค์

ให้ผู้ใช้เก็บภาพ Item จากหน้าจอเกมได้ในไม่กี่ขั้นตอน (Requirement 3.8) ครอบคลุม Capture ด้วย `desktopCapturer`, การเลือกบริเวณ, Fallback ผ่าน Clipboard (Win+Shift+S) และ Import ไฟล์ แล้วนำภาพไปผูกกับ Item ใหม่หรือ Item เดิม (§10 ข้อ 10)

### 11.2 User stories

- ในฐานะผู้เล่น ฉันต้องการกด Hotkey เห็นหน้าจอค้าง ลากกรอบรอบไอคอน แล้วตั้งชื่อ จบใน 4 ขั้นตอน
- ในฐานะผู้เล่น ฉันต้องการผูกภาพที่เพิ่ง Capture กับ Item ที่สร้างไว้แล้วโดยไม่ต้องสร้างใหม่
- ในฐานะผู้เล่น เมื่อ Capture ได้ภาพดำ ฉันต้องการทางเลือกที่ใช้ได้ทันที
- ในฐานะผู้เล่น ฉันต้องการให้ภาพคมชัดแม้จอเป็น 150% Scale หรือมีสองจอ

### 11.3 กฎการทำงาน

1. F10-R1 ขั้นตอนหลักตาม Requirement 3.8: (1) ผู้ใช้พบ Item ในเกม (2) กด Hotkey `CommandOrControl+Shift+X` (3) เลือกบริเวณบนภาพหน้าจอที่ค้างไว้ (4) แอปเปิด Dialog ตั้งชื่อ (5) เลือกสร้าง Item ใหม่หรือผูกกับ Item เดิม (6) บันทึกลง Active Profile (7) ภาพใช้ได้ทันทีใน Recipes, Quests, Gathering List และ Overlay
2. F10-R2 เมื่อได้รับ Hotkey Main Process หา Display ใต้เคอร์เซอร์ (`screen.getDisplayNearestPoint(screen.getCursorScreenPoint())`) แล้วเรียก `desktopCapturer.getSources({ types: ['screen'], thumbnailSize })` โดย `thumbnailSize` = ขนาด Display × `scaleFactor` (Physical pixels) เพื่อไม่ให้ภาพเบลอ และจับคู่ Source กับ Display ด้วย `display_id` ภาพที่ได้เก็บไว้ในหน่วยความจำของ Main Process ตลอดช่วง Capture
3. F10-R3 Capture window: `BrowserWindow` Frameless, Fullscreen บน Display นั้น, Always-on-top โหลด `capture.html` แสดงภาพหน้าจอที่ค้างไว้เต็มจอ พร้อม Crosshair และคำแนะนำสั้น ("ลากเพื่อเลือก, Enter ยืนยัน, Esc ยกเลิก") Baseline เปิดหนึ่ง Window บน Display ใต้เคอร์เซอร์ การเปิดพร้อมกันทุก Display เป็นส่วนขยาย (ต้องตรวจสอบความจำเป็นหลัง Phase 4) Capture window ถูกทำลายทันทีเมื่อจบ (ไม่เก็บไว้ใช้ซ้ำ)
4. F10-R4 การเลือกบริเวณ: ลากด้วย Mouse ได้สี่เหลี่ยม แสดงขนาดเป็นพิกเซลขณะลาก ปรับขอบได้ก่อนยืนยัน ขนาดต่ำสุด 8×8 px (ค่าเสนอ) `Enter` หรือ Double click ยืนยัน `Escape` ยกเลิก พิกัดที่ Renderer ส่งคือ CSS pixels ของ Capture window Main Process คูณ `scaleFactor` ของ Display นั้นเป็น Physical pixels ก่อน `nativeImage.crop`
5. F10-R5 ผลจาก Crop กลายเป็น Pending image ใน Main Process (`pendingImageId`, PNG buffer, กว้าง × สูง, แหล่งที่มา `capture`) Main Process ส่ง `capture:changed` ด้วย `phase: 'captured'` พร้อม Preview (Data URL ขนาดย่อ) ไปยัง Main Window แล้วนำ Main Window ขึ้นมาเปิด Dialog "ตั้งชื่อ Item" Pending image ไม่ถูกเขียนลงดิสก์จนกว่าจะยืนยัน
6. F10-R6 Dialog ตั้งชื่อ Item: แสดง Preview, ช่องชื่อที่ค้นหา Item เดิมขณะพิมพ์ (Autocomplete), ตัวเลือกหมวดหมู่ (เมื่อสร้างใหม่), ปุ่ม "สร้าง Item ใหม่" และ "ผูกกับ Item ที่มีอยู่" (เลือกจากรายการ) ถ้า Item เดิมมีภาพแล้ว ต้องยืนยันการแทนที่ (F2-R9) ปุ่ม "ยกเลิก" เรียก `capture.discard`
7. F10-R7 การบันทึกใช้ `items:create` พร้อม `pendingImageId` หรือ `items:attachImage` ตาม F2-R7 และ F2-R8 สำเร็จแล้วส่ง `items:changed` ทุกหน้าจอและ Overlay แสดงภาพได้ทันที (Requirement 3.8 ข้อ 7)
8. F10-R8 Pending image มีได้หลายรายการแต่ Dialog แสดงทีละรายการ (คิวตามลำดับ) Pending image ที่ไม่ถูกใช้ภายใน 10 นาที (ค่าเสนอ) หรือเมื่อสลับ Profile/ปิดแอป ถูกทิ้ง
9. F10-R9 Multi-monitor: จับเฉพาะ Display ใต้เคอร์เซอร์ หาก Display มี `scaleFactor` ต่างกัน ใช้ค่าของ Display นั้น ไม่ผสม
10. F10-R10 การตรวจภาพดำ: หลังได้ภาพหน้าจอ Main Process สุ่มตรวจพิกเซล (เช่น ตารางตัวอย่าง 16×16 จุด) ถ้าทุกจุดเป็นสีดำหรือเกือบดำ ให้ถือว่า Capture ล้มเหลวแบบ "ภาพดำ" และข้ามการเปิด Capture window ไปแสดงข้อความ Fallback ทันที (F10-R13) ผู้ใช้ยังเลือก "เปิด Capture window ต่อ" ได้ถ้าต้องการ เกณฑ์การตรวจเป็นรายละเอียด Implementation ต้องตรวจสอบกับภาพจริงจากเกมใน Phase 4
11. F10-R11 ถ้า `getSources` คืนรายการว่าง โยน Error หรือ Permission ถูกปฏิเสธ (`display-capture` ใน `session.setPermissionRequestHandler`) ให้แสดงข้อความ `CAPTURE_FAILED` พร้อม Fallback (F10-R13) ไม่มีการ Retry อัตโนมัติ
12. F10-R12 Clipboard fallback: Hotkey `CommandOrControl+Shift+V` หรือปุ่ม "Paste from clipboard" เรียก `clipboard.read()` (Electron 44 เป็น Promise ของ `ClipboardItem[]`) หา Item ที่ `types` มี `image/png` (หรือ `image/*` อื่น) อ่านด้วย `getType()` → `Blob` → `Buffer` แล้วแปลงเป็น PNG ผ่าน `nativeImage` กลายเป็น Pending image แหล่งที่มา `clipboard` แล้วเข้าสู่ Dialog เดียวกับ F10-R6 ถ้าไม่มีภาพคืน `CLIPBOARD_EMPTY` Implement กับ API ใหม่ของ Electron 44 เท่านั้น (`readImage`/`availableFormats` ถูกถอดแล้ว)
13. F10-R13 ข้อความ Fallback ต้องบอกขั้นตอนที่ทำได้ทันที: "กด Win+Shift+S เลือกบริเวณ Item แล้วกด Ctrl+Shift+V หรือปุ่ม Paste from clipboard" และ "หรือสลับเกมเป็น Borderless Windowed แล้วลองใหม่" พร้อมปุ่ม "Paste from clipboard" และ "Import image" ในข้อความนั้น
14. F10-R14 Import ไฟล์: `dialog.showOpenDialog` กรองไฟล์ภาพ อ่านด้วย `nativeImage.createFromPath` ถ้าอ่านไม่ได้ (ว่างเปล่า) คืน `UNSUPPORTED_IMAGE` ไฟล์ต้นฉบับไม่ถูกย้ายหรือแก้ไข ผลเป็น Pending image แหล่งที่มา `file`
15. F10-R15 Capture window ต้องไม่เปิดซ้อน: Hotkey ที่กดระหว่างมี Capture ค้างอยู่ถูกละเลย และ Overlay ถูกซ่อนชั่วคราวระหว่าง Capture เพื่อไม่ให้ติดในภาพ แล้วแสดงคืนหลังจบ
16. F10-R16 ไม่มี OCR หรือการตรวจจับ Item อัตโนมัติ ผู้ใช้ตั้งชื่อเอง (Requirement 3.2)

### 11.4 ขั้นตอนการใช้งาน

เส้นทางหลัก:

1. ในเกม (Borderless Windowed) วางเมาส์บนจอที่มี Item แล้วกด `Ctrl+Shift+X`
2. หน้าจอค้าง ลากกรอบรอบไอคอน Item กด Enter
3. Main Window ขึ้นมาพร้อม Dialog พิมพ์ชื่อ (หรือเลือก Item เดิมจาก Autocomplete) เลือกหมวดหมู่ กดบันทึก
4. กลับเข้าเกม ภาพแสดงใน Overlay ทันที

เส้นทาง Fallback:

1. กด Win+Shift+S เลือกบริเวณ Item (ภาพเข้า Clipboard)
2. กด `Ctrl+Shift+V` Dialog ตั้งชื่อเปิดพร้อม Preview
3. บันทึกเหมือนเส้นทางหลัก

เส้นทาง Import:

1. ที่ Item Library เปิด Item แล้วกด "Import image" (หรือกด "เพิ่ม Item จากไฟล์ภาพ")
2. เลือกไฟล์ ยืนยัน Preview แล้วบันทึก

### 11.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| เกม Fullscreen Exclusive | ภาพมักดำ (F10-R10) หรือเกมถูกย่อเมื่อ Capture window รับโฟกัส แสดง Fallback ตาม F10-R13 |
| เนื้อหาที่ OS ป้องกัน (DRM) | ภาพดำ จัดการเหมือนข้างต้น |
| Display ถูกถอดระหว่าง Capture | ยกเลิก Capture พร้อมข้อความ และทิ้ง Pending image |
| เคอร์เซอร์อยู่บน Display ที่ Scale 150% | `thumbnailSize` และ Crop ใช้ `scaleFactor` 1.5 ของ Display นั้น (F10-R2, F10-R4) |
| เลือกบริเวณเล็กกว่าขั้นต่ำ | Capture window แสดงเตือนและไม่ยืนยัน |
| Clipboard มีเฉพาะข้อความ | `CLIPBOARD_EMPTY` |
| Clipboard มีภาพรูปแบบอื่นที่ไม่ใช่ PNG | ลอง `image/*` ที่มี ถ้า `nativeImage` อ่านไม่ได้ให้ `UNSUPPORTED_IMAGE` |
| ผู้ใช้ยกเลิก Dialog ตั้งชื่อ | Pending image ถูกทิ้ง ไม่มีไฟล์ถูกเขียน |
| ชื่อซ้ำกับ Item เดิม | เสนอสลับเป็น "ผูกกับ Item ที่มีอยู่" (F2 Edge case) |
| Hotkey ถูกใช้โดยโปรแกรมอื่น | แสดงใน Settings (F11-R4) ผู้ใช้เริ่ม Capture จากปุ่มใน Item Library ได้ |
| Anti-Cheat บล็อกการจับภาพ | ภาพดำหรือล้มเหลว ใช้ Fallback ดู Risks & Limitations |

### 11.6 ข้อมูลที่เกี่ยวข้อง

Pending image (หน่วยความจำของ Main Process ไม่อยู่ใน Database), ผลลัพธ์เขียนลง `item.image_path`, `item.thumbnail_path` และไฟล์ตาม F2-R6, `app_setting.hotkeys`

### 11.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `capture.start()` | `capture:start` | เริ่ม Capture (ปุ่มใน Item Library ใช้ช่องทางเดียวกับ Hotkey) |
| `capture.cancel()` | `capture:cancel` | ยกเลิก Capture ที่ค้าง |
| `capture.commitSelection({ rect })` | `capture:commitSelection` | Capture window ส่งสี่เหลี่ยมที่เลือก (CSS pixels) |
| `capture.fromClipboard()` | `capture:fromClipboard` | อ่าน Clipboard เป็น Pending image |
| `capture.importFile()` | `capture:importFile` | เปิด Dialog เลือกไฟล์เป็น Pending image |
| `capture.importPath({ path })` | `capture:importPath` | Drag-and-drop ไฟล์ (Preload ใช้ `webUtils.getPathForFile`; Main ตรวจนามสกุลและอ่านผ่าน `nativeImage`; ถ้าใช้ API นี้ใน Sandbox ไม่ได้ ให้ตัด Drag-and-drop เหลือ `importFile`) |
| `capture.listPending()` | `capture:listPending` | Pending image ที่ค้างอยู่ (เมื่อ Main Window เพิ่งโหลด) |
| `capture.discard({ pendingImageId })` | `capture:discard` | ทิ้ง Pending image |
| `items.create(...)`, `items.attachImage(...)` | ดู F2 | บันทึกจริง |
| `on('capture:changed')` | `capture:changed` | Payload: `{ phase: 'started' \| 'captured' \| 'cancelled' \| 'failed', pending?: { id, source, width, height, previewDataUrl }, error? }` |

### 11.8 นอกขอบเขต

OCR, การจับภาพวิดีโอหรือต่อเนื่อง, การจับภาพเฉพาะหน้าต่างเกม (`types: ['window']`) ซึ่งอาจพิจารณาภายหลัง, การแก้ไขภาพหลัง Crop, การอัปโหลดภาพไปที่ใด ๆ

## 12. F11 Settings

### 12.1 วัตถุประสงค์

รวมการตั้งค่า Hotkeys, Overlay, Preferences, Profiles, Backup/Restore และข้อมูลเกี่ยวกับแอปไว้หน้าจอเดียว (Requirement 4 ข้อ 7 และ 5) โดยทุกค่าเก็บใน `app_setting` และมีผลทันทีโดยไม่ต้องรีสตาร์ต ยกเว้น Restore

### 12.2 User stories

- ในฐานะผู้เล่น ฉันต้องการเปลี่ยน Hotkey ที่ชนกับปุ่มในเกม และรู้ทันทีถ้าปุ่มใหม่ใช้ไม่ได้
- ในฐานะผู้เล่น ฉันต้องการตั้งค่า Overlay ครั้งเดียวแล้วใช้ได้ตลอด
- ในฐานะผู้เล่น ฉันต้องการสำรองข้อมูลทั้งหมดเป็นไฟล์เดียว และกู้คืนบนเครื่องใหม่ได้
- ในฐานะผู้เล่น ฉันต้องการรู้เวอร์ชันแอปและตำแหน่งไฟล์ข้อมูล

### 12.3 กฎการทำงาน

Hotkeys:

1. F11-R1 Hotkeys ที่ตั้งได้มี 6 รายการตามค่าเริ่มต้น (ชื่อ Key ใน `app_setting.hotkeys` ตาม Data Model): Toggle overlay visible `toggleOverlay` = `CommandOrControl+Shift+O`, Toggle overlay mode `toggleOverlayMode` = `CommandOrControl+Shift+M`, Start region capture `startCapture` = `CommandOrControl+Shift+X`, Import image from clipboard `importClipboard` = `CommandOrControl+Shift+V`, Overlay next pinned target `overlayNextTarget` = `CommandOrControl+Shift+]`, Overlay previous pinned target `overlayPrevTarget` = `CommandOrControl+Shift+[` ค่าเก็บเป็น Accelerator string ของ Electron
2. F11-R2 การตั้งค่าใช้ตัวบันทึกคีย์ (กดชุดปุ่มที่ต้องการ) แปลงเป็น Accelerator ต้องมี Modifier อย่างน้อยหนึ่งตัว (`CommandOrControl`, `Alt`, `Shift`) เพื่อไม่ให้แย่งปุ่มธรรมดาจากเกม ค่าที่ไม่ผ่านคืน `VALIDATION`
3. F11-R3 Accelerator เดียวกันใช้กับสองการกระทำไม่ได้ ตรวจที่ Main Process ก่อนลงทะเบียน คืน `HOTKEY_CONFLICT` พร้อมชื่อการกระทำที่ใช้อยู่
4. F11-R4 การลงทะเบียนใช้ `globalShortcut.register` ถ้าคืน `false` (ถูกโปรแกรมอื่นหรือเกมใช้) ให้คืน `HOTKEY_REGISTER_FAILED` คงค่าเดิมไว้ และแสดงสถานะ "ลงทะเบียนไม่สำเร็จ" ข้างรายการนั้นใน Settings ทั้งตอนตั้งค่าและตอนเริ่มแอป (รายการที่ลงทะเบียนไม่สำเร็จตอนเริ่มแอปต้องมีสัญลักษณ์เตือนที่เมนู Settings)
5. F11-R5 เมื่อเปลี่ยนค่าใด Main Process ยกเลิกการลงทะเบียนเดิมของรายการนั้นและลงทะเบียนใหม่ทันที มีปุ่ม "คืนค่าเริ่มต้น" ต่อรายการและทั้งชุด Hotkeys ทั้งหมดถูกยกเลิกเมื่อปิดแอป (`will-quit`)
6. F11-R6 Hotkey แต่ละรายการปิดการใช้งานได้ (ค่าว่าง) โดยไม่ลบค่าเริ่มต้น

Overlay display:

7. F11-R7 ตั้งค่า Opacity (Slider 20 ถึง 100%), Compact mode, โหมดเริ่มต้นเมื่อแสดง (`view`/`interactive` เขียน `overlay.mode`), แสดง Overlay เมื่อเริ่มแอป (อ่าน/เขียน `overlay.visible`), ปุ่ม "รีเซ็ตตำแหน่งและความโปร่งใส" (F9-R5, F9-R4) และคำอธิบายข้อจำกัด Fullscreen Exclusive แบบย่อพร้อมลิงก์ไปเอกสาร

Preferences:

8. F11-R8 `app_setting.preferences` มี `theme` (`dark` ค่าเริ่มต้น ค่า `light`/`system` สงวนไว้ตาม Data Model แต่ Light Theme เป็นงานหลัง Phase 5 ตาม [UI/UX Design Plan](05-ui-ux-design-plan.md) จึงยังไม่มีตัวเลือกให้ผู้ใช้), `sort` (ค่าเริ่มต้น `missing-first` ตาม F6-R10), `hideComplete` (ค่าเริ่มต้น `false`), `stepSizes` (ค่าเริ่มต้น `[1, 5, 10]` ตาม F7-R4; ขั้นที่เลือกอยู่ไม่ถูกบันทึก), `sidebarCollapsed` (ค่าเริ่มต้น `false`) และ `itemView` (`grid`/`table` ค่าเริ่มต้น `grid`) ที่ UI/UX Design Plan §2.1 และ §3.2 เพิ่มและ Data Model §3.12 รับไว้ การเปลี่ยนค่ามีผลทันทีทุก Window ผ่าน `settings:changed`

Profiles:

9. F11-R9 ส่วน Profiles แสดงรายการ Profile พร้อมสร้าง เปลี่ยนชื่อ ลบ และตั้ง Active ด้วยกฎเดียวกับ F1 ทุกข้อ

Backup / Restore / Export / Import:

10. F11-R10 Backup และ Export เป็นสิ่งเดียวกัน: ไฟล์ ZIP ที่บรรจุโฟลเดอร์ `data\` ทั้งหมด (ทุก Profile) โดย `gamelooter.sqlite` ถูกคัดลอกด้วย `db.backup()` เพื่อความสอดคล้อง (ไม่คัดลอก `-wal`/`-shm` ตรง ๆ) และมี `manifest.json` ที่ระดับบนสุด บรรจุ `appVersion`, `schemaVersion` (`PRAGMA user_version`), `exportedAt` และ Field ระบุรูปแบบไฟล์กับสรุป Profile (`format`, `formatVersion`, `profiles`) ตามโครงสร้างเต็มใน [Data Model](04-data-model.md) ผู้ใช้เลือกปลายทางผ่าน Save dialog ชื่อไฟล์เริ่มต้น `gamelooter-backup-<YYYYMMDD-HHmm>.zip` ตาม Data Model ใช้ไลบรารี `fflate` (เวอร์ชันต้องตรวจสอบตอน Implement)
11. F11-R11 Restore และ Import เป็นสิ่งเดียวกัน (แทนที่ข้อมูลทั้งหมด ไม่ Merge): ขั้นตอน (1) ผู้ใช้เลือกไฟล์ (2) Main Process อ่านและตรวจ `manifest.json` (3) แสดงสรุป (`appVersion`, `schemaVersion`, `exportedAt`, จำนวน Profile และ Item จากไฟล์ SQLite ในชุด) พร้อมคำเตือนว่าข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ (4) ผู้ใช้ยืนยัน (5) ระบบสร้าง Backup ของข้อมูลปัจจุบันอัตโนมัติก่อน (6) แตกไฟล์ลงโฟลเดอร์ชั่วคราว เปิด SQLite ตรวจ `PRAGMA integrity_check` และรัน Migrations จนถึงเวอร์ชันปัจจุบัน (7) ปิด Database หลัก สลับโฟลเดอร์แบบ Atomic ด้วย rename สองครั้ง (`data\` → `backups\pre-restore-<timestamp>\` แล้ว `restore-tmp-<timestamp>\` → `data\` ตาม Data Model) (8) แอป Relaunch ตัวเอง (`app.relaunch()` แล้ว `app.exit()`) เพื่อเปิดข้อมูลชุดใหม่อย่างสะอาด
12. F11-R12 การตรวจ Manifest ต้องปฏิเสธด้วย `BACKUP_INVALID` เมื่อ: ไม่มี `manifest.json`, JSON ไม่ถูกต้อง, ขาด Field ใด, `format` ไม่ใช่ค่าของแอป, `schemaVersion` ไม่ใช่จำนวนเต็ม, ไม่มี `gamelooter.sqlite` ในชุด, มี Entry ที่ Path ไม่ปลอดภัย (ขึ้นต้นด้วย `/`, มี `..` หรือ Drive letter), หรือ `integrity_check`/`foreign_key_check` ไม่ผ่าน และปฏิเสธด้วย `BACKUP_TOO_NEW` เมื่อ `schemaVersion` มากกว่าเวอร์ชันที่แอปนี้รองรับ (ข้อความ: "ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อน") `schemaVersion` ที่เก่ากว่าได้รับการ Migrate ใน F11-R11 ข้อ (6)
13. F11-R13 ความล้มเหลวหลังขั้น (6) ก่อนการสลับเสร็จ ต้องไม่ทิ้งข้อมูลปัจจุบันไว้ในสภาพเสีย: ถ้าสลับไม่สำเร็จให้คืนโฟลเดอร์เดิมกลับและแสดง `IO` พร้อมตำแหน่ง Backup อัตโนมัติจากขั้น (5)
14. F11-R14 ไฟล์ภาพที่ไม่มีใน ZIP (เช่น Backup ที่ผู้ใช้ลบรูปออกเอง) ไม่ทำให้ Restore ล้มเหลว หลัง Restore ระบบรันการล้างไฟล์ภาพที่ไม่ถูกใช้อัตโนมัติตาม Data Model (Path ที่ไฟล์หายถูกตั้งเป็น NULL) Item เหล่านั้นแสดง Placeholder

About:

15. F11-R15 แสดงชื่อแอปและเวอร์ชัน (`package.json` ปัจจุบัน 1.0.0), เวอร์ชัน Electron/Chromium/Node จาก `process.versions`, `schemaVersion` ปัจจุบัน, ตำแหน่ง `<userData>\data` พร้อมปุ่ม "เปิดโฟลเดอร์ข้อมูล" (`shell.openPath`) และลิงก์ GitHub Releases สำหรับดาวน์โหลดเวอร์ชันใหม่ด้วยตนเอง ส่วน "ตรวจสอบอัปเดต" เป็นงาน Phase 5 (ออกแบบ electron-updater + GitHub Releases ยังไม่บังคับใช้ ไม่มี Certificate ติดตั้งแบบ Unsigned จะมี SmartScreen warning ตาม Architecture Proposal)

### 12.4 ขั้นตอนการใช้งาน

เปลี่ยน Hotkey:

1. Settings > Hotkeys กด "เปลี่ยน" ที่รายการ แล้วกดชุดปุ่มใหม่
2. ระบบตรวจ Modifier, ตรวจชนภายในแอป, ลงทะเบียนกับ OS และแสดงผลทันที ถ้าไม่สำเร็จค่าเดิมคงอยู่พร้อมข้อความ

Backup:

1. Settings > Backup กด "สร้าง Backup" เลือกตำแหน่ง
2. ระบบสร้าง ZIP แล้วแสดงตำแหน่งไฟล์

Restore:

1. Settings > Backup กด "กู้คืนจากไฟล์" เลือก ZIP
2. ระบบแสดงสรุปจาก Manifest และคำเตือน
3. ผู้ใช้ยืนยัน ระบบทำตาม F11-R11 แล้ว Relaunch

### 12.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| ตั้ง Hotkey ที่ Windows สงวนไว้ (เช่น `Super`-based) | `HOTKEY_REGISTER_FAILED` ค่าเดิมคงอยู่ |
| ลงทะเบียน Hotkey ล้มเหลวตอนเริ่มแอปเพราะเกมเปิดก่อน | สถานะแสดงใน Settings มีปุ่ม "ลองอีกครั้ง" ต่อรายการ |
| Backup ขณะเขียน Database | `db.backup()` ให้สำเนาที่สอดคล้อง ณ จุดเวลาเดียว |
| ดิสก์ปลายทางเต็มระหว่างสร้าง ZIP | `IO` ลบไฟล์ ZIP ที่เขียนค้าง |
| ZIP ถูกแก้ไขหรือเสีย | `BACKUP_INVALID` ข้อมูลปัจจุบันไม่ถูกแตะ |
| Restore ไฟล์ที่ `schemaVersion` ใหม่กว่า | `BACKUP_TOO_NEW` |
| Restore ไฟล์ที่ `active_profile_id` ชี้ไป Profile ที่ไม่มี | F1-R5 Fallback หลัง Relaunch |
| ปิดแอประหว่าง Restore | ขั้น (7) ออกแบบให้มีโฟลเดอร์เดิมหรือใหม่ครบอย่างน้อยหนึ่งชุดเสมอ ตอนเริ่มแอปครั้งถัดไปตรวจโฟลเดอร์สำรองที่ค้างและกู้คืน (รายละเอียดใน Data Model) |
| เปลี่ยน Theme ขณะ Overlay เปิด | Overlay และ Capture window เป็น Dark เสมอ (ไม่ตาม `theme`) เพื่อความอ่านง่ายบนเกม ตาม [UI/UX Design Plan](05-ui-ux-design-plan.md) |

### 12.6 ข้อมูลที่เกี่ยวข้อง

`app_setting` keys `hotkeys`, `overlay`, `window`, `preferences`, `active_profile_id`; `PRAGMA user_version`; โฟลเดอร์ `<userData>\data` ทั้งหมดและ `manifest.json` ในไฟล์ Backup; โฟลเดอร์ Backup อัตโนมัติ `<userData>\backups\` (อยู่นอก `data\` จึงไม่ถูกรวมใน ZIP) ตาม Data Model

### 12.7 IPC ที่ใช้

| `window.api` | Channel | หน้าที่ |
|---|---|---|
| `settings.get()` | `settings:get` | ค่าทั้งหมด (`hotkeys`, `overlay`, `preferences`) พร้อมสถานะลงทะเบียนของแต่ละ Hotkey |
| `settings.update({ preferences?, overlay? })` | `settings:update` | บันทึกบางส่วน (Merge) |
| `settings.setHotkey({ action, accelerator })` | `settings:setHotkey` | ตั้ง Hotkey (`action` = Key ใน `hotkeys` ตาม F11-R1) คืน `{ ok }` หรือ `HOTKEY_CONFLICT` / `HOTKEY_REGISTER_FAILED` / `VALIDATION` |
| `settings.resetHotkeys({ action? })` | `settings:resetHotkeys` | คืนค่าเริ่มต้นรายการเดียวหรือทั้งหมด |
| `settings.retryHotkeys()` | `settings:retryHotkeys` | ลงทะเบียนรายการที่ล้มเหลวอีกครั้ง |
| `backup.pickPath({ mode: 'save' \| 'open' })` | `backup:pickPath` | Dialog เลือกไฟล์ คืน Path หรือ `null` |
| `backup.export(path)` | `backup:export` | สร้าง ZIP |
| `backup.inspect(path)` | `backup:inspect` | อ่าน Manifest และสรุปเนื้อหา (ไม่เขียน) |
| `backup.restore(path)` | `backup:restore` | กู้คืนและ Relaunch |
| `app.getInfo()` | `app:getInfo` | เวอร์ชัน, `schemaVersion`, Path ข้อมูล |
| `app.openDataFolder()` | `app:openDataFolder` | เปิดโฟลเดอร์ใน Explorer |
| `profiles.*` | ดู F1 | ส่วน Profiles |
| `on('settings:changed')` | `settings:changed` | Payload: ค่าเดียวกับ `settings.get()` |

### 12.8 นอกขอบเขต

Backup อัตโนมัติตามกำหนดเวลา (นอกจากก่อน Migration/Restore), Cloud backup, Import แบบ Merge หรือเลือกบาง Profile, Auto-update ใน Phase 1, การตั้งค่าภาษา UI (ต้องตรวจสอบความต้องการ), Keybinding ภายในแอป (ไม่ใช่ Global)

## 13. F12 Persistence Rules

### 13.1 วัตถุประสงค์

รับประกันว่าข้อมูลทุกชนิดถูกบันทึกทันที คงอยู่หลังปิดแอปหรือ Crash และย้ายไปใช้ Schema ใหม่ได้อย่างปลอดภัย (Requirement 5) ด้วย SQLite ผ่าน better-sqlite3 13 ใน Main Process (§10 ข้อ 7) รายละเอียด Schema, ลำดับ Migration และโครงสร้างไฟล์อยู่ใน [Data Model](04-data-model.md)

### 13.2 User stories

- ในฐานะผู้เล่น ฉันไม่ต้องการกดบันทึกเลย
- ในฐานะผู้เล่น ฉันต้องการให้ตัวเลขทั้งหมดอยู่ครบแม้แอปปิดกะทันหันหรือไฟดับ
- ในฐานะผู้เล่น ฉันต้องการอัปเดตแอปโดยไม่เสียข้อมูล และมีสำเนาถ้าการอัปเดตผิดพลาด

### 13.3 กฎการทำงาน

1. F12-R1 Database เดียวที่ `<userData>\data\gamelooter.sqlite` (`<userData>` = `%APPDATA%\looter-app`) เปิดโดย Main Process เท่านั้น หนึ่ง Connection ตลอดอายุแอป Renderer ไม่มีสิทธิ์เข้าถึงไฟล์
2. F12-R2 ตอนเปิด Database ตั้ง `PRAGMA journal_mode = WAL` และ `PRAGMA foreign_keys = ON` ทุกครั้ง (`PRAGMA synchronous = FULL` ตาม Data Model) WAL ทำให้การเขียนแต่ละ Transaction เป็น Atomic และทนต่อ Crash ไฟล์ `-wal` และ `-shm` อยู่ข้างไฟล์หลักขณะเปิด
3. F12-R3 Autosave: ทุกคำสั่งที่เปลี่ยนข้อมูลเขียนลง Database ภายใน Handler ของคำสั่งนั้นก่อนคืนผล ไม่มีสถานะ "ยังไม่บันทึก" ใน Renderer และไม่มี Cache เขียนภายหลัง ยกเว้นค่าที่เปลี่ยนถี่มาก (Bounds ของ Window/Overlay) ซึ่ง Debounce 200 ms แล้วเขียน (แนวคิดเดียวกับ `debounce()` ใน `electron/helper.js` ที่เขียนใหม่เป็น TypeScript)
4. F12-R4 ทุกการเขียนหลายแถวอยู่ใน `db.transaction()` (ข้อ 1.3 ข้อ 7) การเขียนแถวเดียวเป็น Atomic อยู่แล้ว
5. F12-R5 Schema version เก็บใน `PRAGMA user_version` Migrations เป็นโมดูล TypeScript เรียงลำดับใน `electron/database/migrations/NNN-name.ts` แต่ละโมดูลรันใน Transaction ของตัวเอง และ `user_version` ถูกตั้งเป็นเลขของโมดูลนั้นภายใน Transaction เดียวกัน
6. F12-R6 ลำดับตอนเริ่มแอป: (1) สร้างโฟลเดอร์ `data\` และ `images\` ถ้ายังไม่มี (2) เปิด Database และตั้ง PRAGMA (3) `PRAGMA quick_check` ถ้าไม่ผ่านไปข้อ F12-R9 (4) อ่าน `user_version` (5) ถ้าน้อยกว่าเวอร์ชันล่าสุด: สร้าง Backup ของไฟล์ Database ด้วย `db.backup()` ไปยัง `<userData>\backups\gamelooter-v<user_version เดิม>-<timestamp>.sqlite` (เก็บไว้ 5 ไฟล์ล่าสุด ตาม Data Model) แล้วรัน Migrations ที่ขาดทีละโมดูล (6) ถ้า `user_version` มากกว่าเวอร์ชันล่าสุด: ไม่เปิด แสดง Dialog ว่าข้อมูลมาจากแอปเวอร์ชันใหม่กว่า และปิดแอป (7) ลงทะเบียน IPC handlers (8) สร้าง Main Window
7. F12-R7 Migration ล้มเหลว: Transaction ของโมดูลนั้น Rollback, `user_version` คงค่าก่อนหน้า, แอปปิด Database แสดง Dialog ระบุโมดูลที่ล้มเหลว ข้อความ Error และตำแหน่ง Backup จากข้อ F12-R6 (5) แล้วปิดแอป ไม่รันต่อด้วย Schema ครึ่งเดียว
8. F12-R8 Database ว่าง (ติดตั้งครั้งแรก) ถือว่า `user_version = 0` และรัน Migrations ทั้งหมด ไม่ต้องสร้าง Backup
9. F12-R9 ไฟล์เสียหาย (`quick_check` ไม่ผ่านหรือเปิดไม่ได้): แสดง Dialog พร้อมทางเลือก "กู้คืนจาก Backup" (เปิด F11-R11) หรือ "เริ่มใหม่" (เปลี่ยนชื่อไฟล์เสียเป็น `.corrupt-<timestamp>` แล้วสร้างใหม่) ไม่ลบไฟล์เสียทิ้งโดยอัตโนมัติ
10. F12-R10 Settings: `app_setting.value` เป็น JSON ต่อ Key เมื่ออ่านแล้วไม่ผ่าน Schema (ขาด Field, ชนิดผิด) ให้ใช้ค่าเริ่มต้นเฉพาะ Field ที่ผิดและเขียนค่าที่แก้แล้วกลับ ไม่ทำให้แอปเริ่มไม่ได้
11. F12-R11 Main Window bounds (`app_setting.window`) บันทึกแบบ Debounce เมื่อย้าย ปรับขนาด Maximize/Unmaximize และคืนค่าตอนสร้าง Window โดยตรวจว่าอยู่ใน Display ที่มีอยู่ (เหมือน F9-R5) ค่า `maximized` เก็บแยก
12. F12-R12 ปิดแอป: บน `before-quit` ล้าง Debounce ที่ค้าง (เขียนทันที), ยกเลิก Hotkeys, ทำลาย Overlay/Capture windows, แล้ว `db.close()` ซึ่ง Checkpoint WAL กลับเข้าไฟล์หลัก
13. F12-R13 ไฟล์ภาพเป็นส่วนหนึ่งของข้อมูลที่ต้องคงอยู่ (F2-R6) การเขียนไฟล์ภาพทำก่อน Commit แถว Database ที่อ้างถึง และลบหลัง Commit การลบแถว เพื่อให้ Database ไม่อ้างไฟล์ที่ไม่มีอยู่ในกรณีล้มเหลวกลางทาง (ไฟล์กำพร้ายอมรับได้ Path ที่ชี้ไฟล์หายไม่ยอมรับ)
14. F12-R14 ข้อมูล JSON เก่าของ Scaffold ใน `%APPDATA%\looter-app\Database\*.json` ไม่ถูกอ่านและไม่ถูกลบ ไม่มี Migration จากไฟล์เหล่านั้น (ไม่เคยมีข้อมูลผู้ใช้จริง)
15. F12-R15 ค่าที่คำนวณได้ (Required, Missing, Progress, Allocation) ไม่ถูกเก็บลง Database (Requirement 5 "ไม่เก็บค่าซ้ำโดยไม่จำเป็น")

### 13.4 ขั้นตอนการใช้งาน

ผู้ใช้ไม่มีขั้นตอนโดยตรง นอกจากกรณี Dialog ตอนเริ่มแอป:

1. เปิดแอปหลังอัปเดต ระบบแจ้ง "กำลังอัปเดตข้อมูล" สั้น ๆ ถ้ามี Migration (ปกติเสร็จในเสี้ยววินาที)
2. ถ้าเกิดปัญหา Dialog แสดงทางเลือกตาม F12-R7 หรือ F12-R9

### 13.5 Edge cases และ Error handling

| กรณี | พฤติกรรม |
|---|---|
| ไฟดับระหว่าง Transaction | WAL ทำให้ Transaction นั้นหายทั้งก้อน ข้อมูลก่อนหน้าครบ |
| เปิดแอปสองตัวพร้อมกัน | ใช้ `app.requestSingleInstanceLock()` ตัวที่สองส่งโฟกัสให้ตัวแรกแล้วปิด ไม่เปิด Database ซ้ำ |
| โฟลเดอร์ `data\` อยู่บนไดรฟ์เครือข่ายหรือ OneDrive | WAL บนไฟล์ระบบเครือข่ายไม่น่าเชื่อถือ แจ้งเตือนใน Risks & Limitations ไม่รองรับอย่างเป็นทางการ |
| ดิสก์เต็ม | `IO` ต่อคำสั่ง ข้อมูลเดิมไม่เสีย |
| Backup ก่อน Migration เขียนไม่สำเร็จ | ไม่รัน Migration แสดง Dialog และปิดแอป (ความปลอดภัยของข้อมูลมาก่อน) |
| Downgrade แอป | F12-R6 (6) ปฏิเสธ ผู้ใช้ Restore จาก Backup ก่อน Migration ได้ |
| ไฟล์ Database ถูกล็อกโดยโปรแกรมอื่น (เช่น Viewer) | เปิดไม่ได้ แสดง Dialog ให้ปิดโปรแกรมนั้นแล้วลองใหม่ |

### 13.6 ข้อมูลที่เกี่ยวข้อง

ทุกตารางใน Data Model, `PRAGMA user_version`, `app_setting` (`window`, `overlay`, `preferences`, `hotkeys`, `active_profile_id`), ไฟล์ `gamelooter.sqlite` (+ `-wal`, `-shm`), โฟลเดอร์ `images\`, โฟลเดอร์ Backup อัตโนมัติ `<userData>\backups\` ตาม Data Model

### 13.7 IPC ที่ใช้

ไม่มีคำสั่งเฉพาะจาก Renderer นอกจาก `app.getInfo()` (F11) ทุกกฎทำงานใน Main Process ก่อนสร้าง Window หรือภายใน Handler ของ Feature อื่น Dialog ตอนเริ่มแอปใช้ `dialog.showMessageBox` ของ Main Process โดยตรง

### 13.8 นอกขอบเขต

การเข้ารหัสไฟล์ข้อมูล, ซิงก์หลายเครื่อง, การเก็บประวัติเวอร์ชันของข้อมูล, การ Compact/Vacuum อัตโนมัติ (พิจารณาใน Phase 5), Migration ย้อนกลับ (Down migration)

## 14. ภาคผนวก

### 14.1 สรุป IPC ทั้งหมด

คำสั่ง (Request/Response ผ่าน `ipcMain.handle`) จัดกลุ่มตาม Domain:

| Domain | Channels |
|---|---|
| `profiles` | `list`, `create`, `rename`, `delete`, `getDeleteSummary`, `switch`, `getActive` |
| `items` | `list`, `get`, `create`, `update`, `setPinned`, `attachImage`, `removeImage`, `getUsage`, `delete` |
| `recipes` | `list`, `get`, `create`, `update`, `delete`, `validate`, `expand` |
| `quests` | `list`, `get`, `create`, `update`, `setStatus`, `delete` |
| `tracking` | `list`, `add`, `remove`, `update`, `reorder`, `setPinned` |
| `inventory` | `adjust`, `set`, `consume`, `craft` |
| `gathering` | `get` |
| `overlay` | `show`, `hide`, `toggle`, `setMode`, `setOpacity`, `setCompact`, `resetLayout`, `getState`, `cycleScope`, `focusMainWindow`, `setBounds` |
| `capture` | `start`, `cancel`, `commitSelection`, `fromClipboard`, `importFile`, `importPath`, `listPending`, `discard` |
| `settings` | `get`, `update`, `setHotkey`, `resetHotkeys`, `retryHotkeys` |
| `backup` | `pickPath`, `export`, `inspect`, `restore` |
| `app` | `getInfo`, `openDataFolder` |

Push events (Main → ทุก Window ผ่าน `webContents.send`, สมัครด้วย `window.api.on`):

| Channel | เมื่อใด | Payload โดยย่อ |
|---|---|---|
| `profile:changed` | สร้าง/เปลี่ยนชื่อ/ลบ/สลับ Profile | `{ activeProfileId, profiles }` |
| `items:changed` | Item หรือภาพเปลี่ยน | `{ profileId, itemIds? }` |
| `recipes:changed` | Recipe เปลี่ยน | `{ profileId, recipeIds? }` |
| `quests:changed` | Quest หรือสถานะเปลี่ยน | `{ profileId, questIds? }` |
| `tracking:changed` | Target เพิ่ม/ลบ/ลำดับ/Pin เปลี่ยน | `{ profileId }` |
| `inventory:changed` | `owned` เปลี่ยน | `{ profileId, changes[] }` |
| `gathering:changed` | ผลรวมคำนวณใหม่ (หลังทุกข้อข้างบน, Debounce 16 ms) | ผลลัพธ์ชุดเต็มของ F6 |
| `overlay:changed` | สถานะ Overlay เปลี่ยน | สถานะเดียวกับ `overlay.getState()` |
| `settings:changed` | ค่าตั้งค่าหรือสถานะ Hotkey เปลี่ยน | ค่าเดียวกับ `settings.get()` |
| `capture:changed` | ขั้นตอน Capture/Clipboard/Import เปลี่ยน | `{ phase, pending?, error? }` |
| `capture:frame` | ส่งเฉพาะ Capture window ที่เพิ่งสร้าง (ไม่ Broadcast ไปทุก Window) | `{ frameUrl, displayBounds, imageWidth, imageHeight }` |

หมายเหตุการตั้งชื่อ: ชื่อ Push event ใช้ชื่อ Domain เดียวกับคำสั่ง ยกเว้น `profile:changed` ซึ่งใช้รูปเอกพจน์เป็นชื่อมาตรฐานร่วมของทุกเอกสาร (ดู [Architecture Proposal](02-architecture-proposal.md)) รายการ Channel ในหัวข้อนี้เป็นรายการอ้างอิงที่เอกสารอื่นต้องใช้ชื่อเดียวกัน

### 14.2 รหัส Error ที่ใช้ในเอกสารนี้

| Code | ความหมาย | ใช้ใน |
|---|---|---|
| `VALIDATION` | Input ไม่ผ่านการตรวจ (ว่าง, ยาวเกิน, ไม่ใช่จำนวนเต็ม, นอกช่วง, รายการไม่ครบ) | ทุก Feature |
| `NOT_FOUND` | ไม่พบแถว หรือแถวเป็นของ Profile อื่น | ทุก Feature |
| `DUPLICATE_NAME` | ชื่อซ้ำ (ไม่สนตัวพิมพ์) | F1, F2 |
| `DUPLICATE_RECIPE` | Output Item มี Recipe แล้ว | F3 |
| `DUPLICATE_TARGET` | Quest/Recipe เป็น Target อยู่แล้ว | F5 |
| `ITEM_IN_USE` | ลบ Item ไม่ได้เพราะถูกอ้างถึง (RESTRICT) พร้อม `details.usages` | F2 |
| `CYCLE` | พบ Circular Dependency พร้อม `details.path` | F3 |
| `CYCLE_GUARD` (Warning ไม่ใช่ Error) | Guard ขณะคำนวณพบวงในข้อมูล ส่งมาใน `warnings` ของผลลัพธ์ F6 พร้อม `path` | F6 |
| `INSUFFICIENT_MATERIALS` | ของไม่พอสำหรับ Consume/Craft พร้อม `details.items` | F8 |
| `CAPTURE_FAILED` | จับภาพหน้าจอไม่ได้ หรือภาพดำ | F10 |
| `CLIPBOARD_EMPTY` | Clipboard ไม่มีภาพ | F2, F10 |
| `UNSUPPORTED_IMAGE` | อ่านไฟล์/ข้อมูลภาพไม่ได้ | F2, F10 |
| `HOTKEY_CONFLICT` | Accelerator ซ้ำกับการกระทำอื่นในแอป | F11 |
| `HOTKEY_REGISTER_FAILED` | `globalShortcut.register` คืน `false` | F11, F9, F10 |
| `BACKUP_INVALID` | Manifest หรือเนื้อหา Backup ไม่ถูกต้อง | F11 |
| `BACKUP_TOO_NEW` | `schemaVersion` ใหม่กว่าที่รองรับ | F11 |
| `IO` | อ่าน/เขียนไฟล์หรือ Database ล้มเหลว | ทุก Feature |
| `FORBIDDEN` | Window ที่เรียกไม่มีสิทธิ์เรียก Channel นั้น (ตรวจ Sender Role ใน Main) | ทุก Feature |
| `INTERNAL` | ข้อผิดพลาดที่ไม่คาดคิด บันทึก Stack ใน Log และคืนข้อความทั่วไปให้ Renderer | ทุก Feature |

### 14.3 ค่าที่ระบุว่า "ค่าเสนอ" และ "ต้องตรวจสอบ"

| รายการ | สถานะ | ที่อ้างอิง |
|---|---|---|
| ความยาวสูงสุดของชื่อ 100 และ `notes` 2,000 ตัวอักษร | ค่าเสนอ | 1.3 ข้อ 6 |
| `owned` สูงสุด 999,999 | ค่าเสนอ | F7-R1 |
| ขนาดต่ำสุดของ Overlay 220×160 px, Opacity เริ่มต้น 90% | ค่าเสนอ | F9-R4, F9-R5 |
| ขนาดบริเวณเลือกต่ำสุด 8×8 px, อายุ Pending image 10 นาที | ค่าเสนอ | F10-R4, F10-R8 |
| ชื่อไฟล์ Backup เริ่มต้น | ค่าเสนอ | F11-R10 |
| Debounce 200 ms สำหรับบันทึก Bounds ของ Window/Overlay | ค่าเสนอ | F9-R5, F12-R3 |
| การเรียง Gathering List ตาม Required เป็นตัวเลือกที่สี่ของ `sort` | ต้องตรวจสอบกับ Roadmap และ Data Model | F6-R10 |
| รูปแบบภาพที่ `nativeImage` ของ Electron 44 อ่านได้นอกจาก PNG/JPEG | ต้องตรวจสอบตอน Implement | F2 Edge cases, F10-R14 |
| การเปิด Capture window ทุก Display พร้อมกัน | ต้องตรวจสอบความจำเป็นหลัง Phase 4 | F10-R3 |
| เกณฑ์ตรวจภาพดำ | ต้องตรวจสอบกับภาพจริงจากเกม | F10-R10 |
| เวอร์ชัน `fflate` | ต้องตรวจสอบตอน Implement | F11-R10 |
| Phase ของคำสั่ง "ล้างไฟล์ภาพที่ไม่ถูกใช้" | ตัดสินแล้ว: Phase 5 (Roadmap P5-03 สำหรับ Cleanup ระหว่าง Restore และ P5-04 สำหรับปุ่มใน Settings) | F1, F2 Edge cases, F11-R14 |
| ตัวเลือก `theme` ค่า `light`/`system` | สงวนไว้ตาม Data Model, Light Theme เป็นงานหลัง Phase 5 ตาม UI/UX Design Plan | F11-R8 |
| การตั้งค่าภาษา UI | ต้องตรวจสอบความต้องการ | F11 นอกขอบเขต |
