# UI/UX Design Plan

แผนการออกแบบหน้าจอหลัก, Overlay, Capture Flow, User Flows, Component Inventory และ Visual System ของ GameLooter เพื่อใช้เป็นข้อกำหนดในการสร้าง Renderer ตั้งแต่ Phase 1 ถึง Phase 4

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง

- [Repository Audit Report](01-repository-audit.md)
- [Architecture Proposal](02-architecture-proposal.md)
- [Feature Specification](03-feature-specification.md)
- [Data Model](04-data-model.md)
- [Development Roadmap](06-development-roadmap.md)
- [Risks & Limitations](07-risks-and-limitations.md)
- [Acceptance Criteria](08-acceptance-criteria.md)

กฎการทำงานของแต่ละ Feature (การคำนวณ, การตรวจสอบข้อมูล, Transaction, การจัดสรร) อยู่ใน Feature Specification และ Data Model เอกสารนี้อธิบายเฉพาะสิ่งที่ผู้ใช้เห็นและวิธีโต้ตอบ ชื่อหน้าจอ, Route, Table, Hotkey และ IPC ใช้ชื่อเดียวกับเอกสารอื่นทั้งหมด

---

## 1. หลักการออกแบบ

Requirement 4 กำหนดหลักการไว้ 11 ข้อ และประโยคนำ 1 ข้อ ("เน้นความเร็วในการใช้งานระหว่างเล่นเกม") ตารางนี้แปลงแต่ละข้อเป็นกฎที่ตรวจสอบได้ และระบุหน้าจอที่กฎนั้นมีผล รหัสกฎ `F1-R1` ถึง `F12-R12` ที่อ้างถึงในเอกสารนี้คือกฎการทำงานใน Feature Specification

| # | หลักการจาก Requirement 4 | กฎที่ใช้จริง | มีผลกับ |
|---|---|---|---|
| 1 | Minimal และอ่านง่าย | หน้าจอละ 1 Primary Action (ปุ่มสี Accent เพียงปุ่มเดียวต่อหน้าจอ) ไม่มีองค์ประกอบตกแต่ง ไม่มี Shadow ซ้อน ไม่มี Gradient ลำดับชั้นของข้อความไม่เกิน 3 ระดับ (Heading 18 px, Body 14 px, Caption 12 px) | ทุกหน้าจอ |
| 2 | Dark Mode เป็นค่าเริ่มต้น | `:root { color-scheme: dark }` และ Token สีทั้งหมดนิยามสำหรับ Dark ก่อน Theme เก็บใน `app_setting.preferences.theme` ค่าเริ่มต้น `dark` Overlay และ Capture window เป็น Dark เสมอไม่ขึ้นกับ Theme Light Theme เป็นงานหลัง Phase`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)(ดู §8.1) | Main window, Overlay, Capture window |
| 3 | แสดงไอคอน Item ชัดเจน | ทุกแถวที่มีชื่อ Item ต้องมี `ItemThumbnail` อยู่หน้าชื่อเสมอ ขนาดมาตรฐาน 64 px ในการ์ดและ Dialog, 40 px ในตาราง, 32 px ใน Overlay แบบ Full, 24 px ใน Overlay แบบ Compact Item ที่ไม่มีรูปแสดง Placeholder ตัวอักษรแรกของชื่อ ไม่ปล่อยช่องว่าง | ทุกหน้าจอ, Overlay |
| 4 | ลดจำนวน Click ให้น้อยที่สุด | กำหนด Click Budget ต่อ Action (ตาราง §1.1) และห้ามเกิน Action ที่ทำบ่อยที่สุด (ปรับ Owned) ต้องเป็น 1 Click จากหน้าจอที่เปิดอยู่ ไม่มีปุ่ม Save สำหรับจำนวน | Gathering List, Item Library, Overlay |
|`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)| การเพิ่มหรือลด Item ต้องทำได้ทันที | `QuantityStepper` อัปเดตตัวเลขในหน้าจอทันที (Optimistic) แล้วเรียก `window.api.inventory.adjust({ itemId, delta })` ค่า Owned จริงมาจาก Push Event `inventory:changed` และ Missing/Progress มาจาก `gathering:changed` (F7-R7) `adjust` ไม่ปฏิเสธค่าที่จะติดลบแต่ Main ปัดเป็น 0 (F7-R2) จึงไม่มี Error ระหว่างกด `−` รัว ส่วน `set` ที่ไม่ผ่านการตรวจ (`VALIDATION`) ให้คืนค่าเดิมในช่องและแสดง Toast ไม่มี Modal ไม่มี Spinner สำหรับการปรับจำนวน | Gathering List, Item Library, Quest Tracker, Overlay |
| 6 | Progress Bar และสถานะสี | ใช้ Status Role 4 ค่า `ok`, `warning`, `missing`, `neutral` (นิยามใน §8.2) ทุกแถวของ Gathering List และ Overlay มี `ProgressBar` และ `StatusBadge` สีต้องมาพร้อมตัวเลขและข้อความเสมอ ห้ามสื่อสถานะด้วยสีอย่างเดียว | Gathering List, Quest Tracker, Game Dashboard, Overlay |
| 7 | จัดเรียง Items ที่ยังขาดก่อนเป็นค่าเริ่มต้น | Sort เริ่มต้นของ Gathering List และ Overlay คือ `missing DESC, name ASC` (`missing-first` ตาม F6-R10) รายการที่ `missing = 0` อยู่ท้ายเสมอ ตัวเลือกอื่น (ชื่อ, หมวดหมู่; ตัวเลือกเรียงตาม Required ยังไม่อยู่ใน Data Model ต้องตรวจสอบ ดู F6-R10) เก็บใน `app_setting.preferences.sort` | Gathering List, Overlay |
| 8 | ซ่อนหรือยุบ Items ที่เก็บครบแล้วได้ | Toggle "ซ่อนที่ครบแล้ว" ยุบแถวสถานะ `ok` เป็นแถวสรุปเดียว "ครบแล้ว N รายการ" ที่คลิกเพื่อขยายได้ ค่าเก็บใน `app_setting.preferences.hideComplete` และใช้ร่วมกันระหว่าง Gathering List กับ Overlay | Gathering List, Overlay |
| 9 | ค้นหาและกรอง Items ได้รวดเร็ว | ช่องค้นหาทุกหน้าจอโฟกัสได้ด้วย `/` หรือ `Ctrl+F` กรองฝั่ง Renderer จากข้อมูลที่อยู่ในหน่วยความจำแล้ว (ไม่ยิง IPC ต่อการพิมพ์) ตัวกรองหมวดหมู่เป็น Chip กดครั้งเดียว ผลลัพธ์อัปเดตทุกครั้งที่พิมพ์ | Item Library, Recipes, Quest Tracker, Gathering List |
| 10 | รองรับ Mouse และ Keyboard | ทุก Action ที่ทำด้วย Mouse ได้ต้องทำด้วย Keyboard ได้ (ตาราง Shortcut ในแต่ละหน้าจอและ §9) รายการทุกชนิดรองรับ `↑`/`↓`, `Home`/`End`, `Enter`, `Delete` ปุ่มไอคอนทุกปุ่มมี `aria-label` และ Tooltip ที่บอก Shortcut | ทุกหน้าจอ, Overlay (Interactive) |
| 11 | แสดงภาพรวม Materials ที่ต้องออกไปเก็บในหน้าจอเดียว | Gathering List เป็นตารางเดียว ไม่แบ่งหน้า (Pagination) ใช้ Virtual Scrolling เมื่อเกิน 200 แถว Craft Plan อยู่ในหน้าจอเดียวกันเป็น Section ที่ยุบได้ | Gathering List |
| 12 | เน้นความเร็วระหว่างเล่นเกม | ทุก Action ที่ใช้ระหว่างเล่นเกมมี Global Hotkey (ตาราง Hotkeys ใน F11-R1 และ §4.7) Overlay ไม่มี Animation และไม่มี Transition | Overlay, Capture window |

### 1.1 Click Budget

นับจากสถานะที่หน้าจอนั้นเปิดอยู่แล้ว การพิมพ์ข้อความนับเป็น 1 ขั้น (Typing) ไม่นับเป็น Click

| Action | งบสูงสุด | ลำดับที่ออกแบบ |
|---|---|---|
| เพิ่ม/ลด Owned ตาม Step ปัจจุบัน | 1 Click หรือ 1 Key | กด `+` หรือ `−` ในแถว |
| กำหนด Owned เป็นค่าที่ต้องการ | 1 Click + Typing + Enter | คลิกตัวเลข Owned (เลือกทั้งหมดอัตโนมัติ) พิมพ์ กด Enter |
| เปลี่ยน Step (ค่าจาก `preferences.stepSizes` ค่าเริ่มต้น 1, 5, 10) | 1 Click | Segmented Control บน Toolbar ของหน้าจอนั้น (Step ที่เลือกเป็นสถานะของหน้าจอ ค่าเริ่มต้น 1 ตาม F7-R4) |
| เลือก/ยกเลิก Tracking Target | 2 Click | เปิด `TargetPicker` แล้วติ๊ก Checkbox (Picker ค้างอยู่จนกว่าจะปิด) |
| สร้าง Item ด้วยมือ | 1 Click + Typing + Enter | ปุ่ม "Item ใหม่" พิมพ์ชื่อ Enter (หมวดหมู่ใช้ค่าเริ่มต้น `material`) |
| สร้าง Item จากภาพหน้าจอ | 1 Hotkey + 1 Drag + Enter + Typing + Enter | ดู §5 |
| สลับ Game Profile | 2 Click | เปิด `ProfileSwitcher` แล้วเลือก |
| Consume Materials | 2 Click | ปุ่ม "Consume materials" แล้วยืนยัน |
| เปิด/ปิด Overlay | 0 Click (Hotkey) หรือ 1 Click (ปุ่มใน Title Bar) | |
| ซ่อนที่ครบแล้ว | 1 Click หรือ `H` | |
| Pin Item ไป Overlay | 1 Click หรือ `P` | ไอคอน Pin ท้ายแถว |

### 1.2 Keyboard Parity

- ทุก List, Grid และ Table เป็น `role="listbox"` หรือ `role="grid"` ที่มี 1 แถวโฟกัสได้ (Roving Tabindex) การเลื่อน `↑`/`↓` ไม่ต้องกด Tab ทีละปุ่ม
- Action บนแถวที่โฟกัสใช้ Key เดี่ยว (`+`, `−`, `Enter`, `Delete`, `P`) โดย Key เดี่ยวทำงานเฉพาะเมื่อโฟกัสไม่ได้อยู่ใน `input`, `textarea` หรือ `select`
- Shortcut ภายในแอปต้องไม่ซ้ำกับ Global Hotkey ทั้ง 6 รายการ (`CommandOrControl+Shift+O/M/X/V/]/[`) เพราะ `globalShortcut` จะดักไว้ก่อนเสมอ
- Dialog ทุกตัวใช้ `<dialog>` แบบ Modal โฟกัสถูกขังไว้ใน Dialog, `Esc` ปิด, `Enter` ใน Field ใดก็ได้เท่ากับกดปุ่มยืนยัน (ยกเว้น `textarea`) ข้อยกเว้น: `ConsumeMaterialsDialog` และ `ConfirmDialog` ของ Action ทำลายข้อมูลไม่มีปุ่ม Default สำหรับ `Enter` ต้องคลิกหรือ `Tab` ไปที่ปุ่มยืนยันก่อน (F8-R12, F1-R8)

### 1.3 ความหนาแน่นของข้อมูล (Density)

เป้าหมายคือเห็นรายการวัตถุดิบให้มากที่สุดในหน้าจอเดียว (Requirement 4 ข้อ "แสดงภาพรวม Materials ที่ต้องออกไปเก็บในหน้าจอเดียว") โดยไม่ลดขนาดตัวอักษรต่ำกว่าเกณฑ์ใน §8.3

| บริบท | ความสูงแถว | Token | ผลที่ขนาดเริ่มต้น/ต่ำสุด |
|---|---|---|---|
| ตารางใน Main window (Gathering List, Item Library แบบ Table, Ingredients, Requirements) | 40 px | `--size-row` | Gathering List แสดงได้ ≥ 10 แถวที่ 960 × 600 px หลังหัก Title Bar, Toolbar, Target Bar, Header และ Footer |
| การ์ด Item (Grid) | 72 px + บรรทัดชื่อและ Stepper | `--size-row-card` | ≥ 4 คอลัมน์ที่ 960 px เมื่อ Sidebar ยุบ |
| Overlay แบบ Full | 56 px | `--size-row-overlay` | 5 แถวที่ 320 × 420 px (ไม่นับ Header และ Footer) |
| Overlay แบบ Compact | 32 px | `--size-row-compact` |`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)แถวที่ 280 × 240 px |

- ระยะห่างแนวตั้งระหว่างแถวเป็น 0 (ใช้เส้นแบ่ง 1 px สี `--color-border`) ไม่มี Padding ภายนอกซ้อนกันหลายชั้น และไม่มี Wrapper ที่มีไว้เพื่อระยะห่างอย่างเดียว (ตามแนวทางใน Repository Guide)
- ไม่มี Pagination ในรายการใด รายการยาวใช้ Virtual Scrolling (เกณฑ์ 200 แถว) เพื่อคง DOM ให้เล็ก
- ข้อมูลรองในแถว (หมวดหมู่, "ใช้ใน N Recipe") ใช้ Caption 12 px สี `--color-text-muted` ในบรรทัดเดียวกับชื่อ ไม่ขึ้นบรรทัดใหม่ ยกเว้นในการ์ด

---

## 2. Information Architecture และ Navigation

### 2.1 โครงหน้าต่างหลัก (App Shell)

Main window ใช้ `titleBarStyle: 'hidden'` + `titleBarOverlay` ตามที่มีอยู่ใน `electron/main.ts` ดังนั้นปุ่มควบคุมหน้าต่าง (Minimize, Maximize, Close) เป็นของ Windows และวาดทับมุมขวาบน พื้นที่ที่เหลือของ Title Bar เป็น HTML ที่แอปวาดเอง

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ▣ GameLooter   [▼ V-Rising        ]        [◎ Capture] [▣ Overlay]  – □ ✕ │  ← title (40 px, drag region)
├──────────┬───────────────────────────────────────────────────────────────┤
│ ⌂ Dashboard                                                               │
│ ▤ Items  │                                                                │
│ ⚒ Recipes│                      <router-view>                             │  ← desktop
│ ! Quests │                                                                │
│ ☰ Gather │                                                                │
│ ⚙ Settings                                                                │
│          │                                                                │
│ ‹ collapse                                                                │
└──────────┴───────────────────────────────────────────────────────────────┘
```

- Grid ของ `#app` ขยายจาก `'title' / 'desktop'` ที่มีอยู่เป็น `'title title' / 'sidebar desktop'`
- ความสูง Title Bar กำหนดจาก `env(titlebar-area-height, 40px)` ซึ่ง Window Controls Overlay ของ Chromium ใส่ให้เมื่อใช้ `titleBarOverlay` และตั้ง `titleBarOverlay.height: 40` ใน `electron/main.ts` ให้ตรงกับ `h-10` ที่ `src/App.vue` ใช้อยู่ ค่านี้แทน `var(--system-titleBar-height)` ที่ `src/index.css` อ้างถึงแต่ไม่เคยนิยาม (ดู Repository Audit Report)
- พื้นที่ขวาสุดของ Title Bar กว้าง `env(titlebar-area-width)` ถึงขอบหน้าต่างสงวนไว้ให้ปุ่มของ Windows ห้ามวางปุ่มของแอปทับ
- Sidebar กว้าง 200 px หรือยุบเป็น 56 px (ไอคอนอย่างเดียว) สถานะยุบเก็บใน `app_setting.preferences.sidebarCollapsed` (Key ที่เอกสารนี้เสนอเพิ่มจากชุดใน F11-R8 ดู §11) และยุบอัตโนมัติเมื่อหน้าต่างแคบกว่า 1100 px (§10.1)

### 2.2 Sidebar และ Route

| ลำดับ | หน้าจอ | Route | ไอคอน | Shortcut | ต้องมี Active Profile |
|---|---|---|---|---|---|
| 1 | Game Dashboard | `#/` | ⌂ | `Ctrl+1` | ไม่ (เป็นหน้าสร้าง Profile เมื่อยังไม่มี) |
| 2 | Item Library | `#/items` | ▤ | `Ctrl+2` | ใช่ |
| 3 | Recipes | `#/recipes` | ⚒ | `Ctrl+3` | ใช่ |
| 4 | Quest Tracker | `#/quests` | ! | `Ctrl+4` | ใช่ |
|`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)| Gathering List | `#/gathering` | ☰ | `Ctrl+5` | ใช่ |
| 6 | Settings | `#/settings` | ⚙ | `Ctrl+6` | ไม่ |

- Router: `vue-router` 4 แบบ Hash History (ตาม Architecture Proposal §1) เพราะหน้าโหลดจาก `file://`
- Route Guard: ถ้า `active_profile_id` ไม่มีค่า (ไม่มี Profile เลย) ทุก Route ที่ต้องมี Active Profile จะ Redirect ไป `#/` และ Sidebar แสดงรายการ 2–5 เป็น Disabled พร้อม Tooltip "สร้าง Game Profile ก่อน"
- Route ย่อยที่ใช้ Query แทน Path เพื่อให้ Deep Link จาก Toast และ Dashboard ทำงานได้: `#/items?id=12`, `#/recipes?id=3`, `#/quests?id=7`, `#/settings?section=hotkeys`
- Sidebar แสดง Badge ตัวเลขเล็กที่ Gathering List = จำนวน Item ที่ยังขาด (`missing > 0`) อัปเดตจาก `gathering:changed`
- Sidebar แสดงสัญลักษณ์เตือนสี `warning` ที่ Settings เมื่อมี Hotkey ที่ลงทะเบียนไม่สำเร็จตอนเริ่มแอป (F11-R4) หายเมื่อผู้ใช้แก้หรือปิด Hotkey นั้น

### 2.3 Title Bar

| องค์ประกอบ | ตำแหน่ง | พฤติกรรม |
|---|---|---|
| โลโก้ + "GameLooter" | ซ้าย | Drag Region (ใช้ `-webkit-app-region: drag` ที่มีอยู่) |
| `ProfileSwitcher` | ถัดจากชื่อแอป | ปุ่ม Dropdown แสดงไอคอนและชื่อ Active Profile กด `Ctrl+P` เปิด รายการ Profile เรียงตาม `last_opened_at` ล่าสุดก่อน มีรายการท้ายสุด "สร้าง Profile ใหม่…" และ "จัดการ Profile…" (ไป `#/settings?section=profiles`) |
| ปุ่ม Capture | ขวา ก่อนปุ่ม Overlay | เรียก `window.api.capture.start()` Tooltip แสดง Hotkey ปัจจุบัน |
| ปุ่ม Overlay | ขวาสุดก่อนพื้นที่ปุ่ม Windows | Toggle แสดง/ซ่อน Overlay สถานะกดค้าง (Pressed) เมื่อ Overlay แสดงอยู่ Tooltip แสดง Hotkey ปัจจุบัน |
| Live Region | ซ่อน (`sr-only`) | `aria-live="polite"` สำหรับประกาศการเปลี่ยนจำนวน (§9.3) |

ทุกปุ่มใน Title Bar ต้องมี `-webkit-app-region: no-drag` (กฎนี้มีอยู่แล้วใน `src/index.css` สำหรับ `button` และ `a`)

### 2.4 Dialog, Toast และ Confirmation

| รูปแบบ | ใช้เมื่อ | กฎ |
|---|---|---|
| Modal Dialog (`BaseDialog`) | สร้าง/แก้ไข Item, Quest, Profile; Capture → Item; Consume/Craft Confirmation; Restore Confirmation | กว้างสูงสุด 560 px, ปุ่มยืนยันอยู่ขวาสุด, `Esc` ปิด, ปิดแล้วคืนโฟกัสไปที่ปุ่มที่เปิด |
| Inline Editor | Recipes (Pane ขวา), จำนวน Owned, ชื่อ Profile (F2) | บันทึกเมื่อ Blur หรือ Enter, `Esc` ยกเลิกและคืนค่าเดิม |
| Toast (`ToastStack`) | ผลลัพธ์ของ Action ที่ไม่บล็อกการทำงาน: บันทึก Item แล้ว, Hotkey ลงทะเบียนไม่สำเร็จ, Capture ล้มเหลว, Backup เสร็จ | มุมขวาล่างของ Main window, หายเองใน`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)วินาที (ข้อผิดพลาดไม่หายเอง), มีปุ่ม Action ได้ 1 ปุ่ม, ไม่มี Animation ใน Overlay |
| Confirmation | ลบ Profile/Item/Recipe/Quest, Consume, Craft, Restore, Reset Hotkeys, แทนที่รูปของ Item (F2-R9) | ข้อความต้องระบุสิ่งที่จะหายหรือเปลี่ยนเป็นตัวเลข (เช่น "ลบ 24 Items, 6 Recipes, 3 Quests, 2 Tracking Targets และไฟล์ภาพ 20 ไฟล์" ตาม F1-R8) ปุ่มยืนยันของ Action ทำลายข้อมูลใช้สี `missing` และไม่ใช่ปุ่ม Default ของ `Enter` |

---

## 3. หน้าจอหลัก

รูปแบบการอธิบายทุกหน้าจอ: วัตถุประสงค์, Layout, Wireframe, Component หลัก, Primary/Secondary Action, States และ Shortcut ตัวเลขใน Wireframe เป็นตัวอย่างจาก Requirement 3.3–3.5

### 3.1 Game Dashboard (`#/`)

**วัตถุประสงค์:** เลือกและสลับ Game Profile, เห็น Overall Progress ของ Profile ที่เปิดอยู่, กระโดดไปงานที่ทำบ่อยใน 1 Click

**Layout:** สองส่วนซ้อนกัน ส่วนบนเป็น Grid ของ `ProfileCard` (กว้าง 220 px ต่อการ์ด, Wrap ตามความกว้าง) ส่วนล่างเป็นสรุปของ Active Profile

```
┌ Game Profiles ──────────────────────────────────────────── [+ Profile ใหม่] ┐
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                       │
│ │ [V] V-Rising  │ │ [V] Valheim   │ │ ┌ ─ ─ ─ ─ ─ ┐ │                       │
│ │ ● Active      │ │ เปิดล่าสุด 2 วัน│ │   + สร้าง     │                       │
│ │ 24 Items      │ │ 61 Items      │ │   Profile     │                       │
│ │ 6 Recipes     │ │ 9 Recipes     │ │ └ ─ ─ ─ ─ ─ ┘ │                       │
│ │ 3 Quests      │ │ 0 Quests      │ │               │                       │
│ │ ███████░░ 41% │ │ ░░░░░░░░░ –   │ │               │                       │
│ └───────────────┘ └───────────────┘ └───────────────┘                       │
├ V-Rising ───────────────────────────────────────────────────────────────────┤
│ Overall Progress  ████████████░░░░░░░░░░░░░░  28 / 68        [Gathering List]│
│                                                                              │
│ ยังขาดมากที่สุด                         Active Tracking Targets             │
│ [IMG] Iron Ore   20 / 45  ขาด 25 ███░░    1. Quest A        จัดสรร 15/15    │
│ [IMG] Wood       `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)/ 15  ขาด 10 ██░░░    2. Quest B        จัดสรร 13/23    │
│ [IMG] Leather     3 /  8  ขาด `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)███░░    3. Craft C ×1     จัดสรร  0/30    │
│                                                                              │
│ [◎ Capture Item]  [▣ แสดง Overlay]  [▤ Item Library]                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component หลัก:** `ProfileCard`, `ProgressBar`, `MaterialRow` (โหมดอ่านอย่างเดียว), `TargetSummaryList`, `EmptyState`

**Primary Action:** สลับ Profile (คลิกการ์ด) **Secondary:** สร้าง Profile, เปิด Gathering List, Capture, แสดง Overlay, Rename (`F2` บนการ์ดที่โฟกัส), ลบ (ผ่านเมนู `…` บนการ์ด → ไป Confirmation)

**ข้อมูลที่แสดง:** การ์ดเรียงตาม `last_opened_at` ล่าสุดก่อน แสดงชื่อ, จำนวน Items/Recipes/Quests และ Overall Progress ของ Profile นั้น (F1-R6) ไอคอนการ์ดใน Phase 1 เป็นอักษรตัวแรกของชื่อ เพราะ `icon_path` เป็น NULL (F1-R12) ตัวเลข Overall Progress และรายการ "ยังขาดมากที่สุด" (5 แถวแรกของ Gathering List ตาม Sort เริ่มต้น) มาจาก `window.api.gathering.get()` และอัปเดตด้วย `gathering:changed` ตัวเลข "จัดสรร" ต่อ Target ใช้ป้ายกำกับ "จัดสรร" เสมอตาม Owner Decision 12 (ตัวอย่างตามลำดับ Priority: Quest A ได้ Iron Ore 10 และ Wood`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)ก่อน = 15/15, Quest B ได้ Iron Ore ที่เหลือ 10 และ Leather 3 = 13/23, Craft C ไม่ได้รับเลย = 0/30)

**States**

| State | การแสดงผล |
|---|---|
| ยังไม่มี Profile (First Run) | `EmptyState` เต็มหน้า: หัวข้อ "เริ่มต้นด้วยการสร้าง Game Profile", ช่องชื่อ Profile โฟกัสอัตโนมัติ, ปุ่ม "สร้าง" กด Enter ได้ทันที ไม่ต้องเปิด Dialog |
| มี Profile แต่ไม่มี Target | ส่วนล่างแสดง `EmptyState` ขนาดเล็ก "ยังไม่มีสิ่งที่ติดตาม" พร้อมปุ่ม "สร้าง Recipe" และ "สร้าง Quest" |
| Loading | Skeleton การ์ด 3 ใบและแถวสรุป 3 แถว ไม่มี Spinner กลางจอ (ข้อมูลมาจาก SQLite ในเครื่อง จึงควรเสร็จภายใน 1 Frame) |
| Error เปิด Database ไม่ได้ | หน้าจอเต็มแสดงข้อความ "เปิดฐานข้อมูลไม่สำเร็จ" พร้อม Path `<userData>\data\gamelooter.sqlite`, ปุ่ม "ลองอีกครั้ง", "เปิดโฟลเดอร์ข้อมูล", "Restore จาก Backup…" Sidebar ทั้งหมด Disabled |
| Profile จำนวนมาก | Grid Wrap ไม่จำกัด ไม่ต้องค้นหา (ปกติไม่เกิน 10) |

**Shortcut:** `Ctrl+N` สร้าง Profile, `↑↓←→` เลื่อนการ์ด, `Enter` สลับไป Profile ที่โฟกัส, `F2` เปลี่ยนชื่อ, `Delete` ลบ (Confirmation)

### 3.2 Item Library (`#/items`)

**วัตถุประสงค์:** CRUD ของ Item, จัดหมวดหมู่, ค้นหา/กรอง, จัดการรูป (Capture, Paste จาก Clipboard, Import ไฟล์), ปรับ Owned โดยตรง

**Layout:** Toolbar ด้านบน + Grid การ์ด (ค่าเริ่มต้น) หรือ Table (สลับได้, เก็บใน `preferences.itemView` ซึ่งเป็น Key ที่เอกสารนี้เสนอเพิ่ม ดู §11) + Dialog แก้ไข

```
┌ Items ─────────────────────────────────────────────────────────────────────┐
│ [🔍 ค้นหา…            ] [ทั้งหมด][material][equipment][consumable][quest][other] │
│ Step [1][5][10]  [☐ 📌 Pinned เท่านั้น]  เรียง [ชื่อ ▼]  มุมมอง [▦][☰]  [+ Item ใหม่ ▼] │
│                                                     ├ สร้างด้วยมือ      Ctrl+N  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐        ├ Capture      Ctrl+Shift+X │
│ │   [IMG]    │ │   [IMG]    │ │    [ I ]   │        ├ Paste จาก Clipboard  C+S+V │
│ │ Iron Ore   │ │ Wood       │ │ Iron Ingot │        └ Import ไฟล์…               │
│ │ material   │ │ material   │ │ material ⚒ │                                     │
│ │ [−] 20 [+] │ │ [−] `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)[+] │ │ [−]  0 [+] │                                     │
│ │ 📌         │ │            │ │            │                                     │
│ └────────────┘ └────────────┘ └────────────┘                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

การ์ด = `ItemCard` (Thumbnail 64 px, ชื่อ, Badge หมวดหมู่, ไอคอน ⚒ เมื่อ Item มี Recipe, `QuantityStepper` สำหรับ `inventory.owned`, ไอคอน Pin) Table = `MaterialRow` แบบ Library (คอลัมน์ Thumbnail 40 px, ชื่อ, หมวดหมู่, Owned, ใช้ใน N Recipe/Quest, Pin, เมนู) ทั้งสองมุมมองเรียงตามชื่อ A–Z โดย Item ที่ Pinned อยู่บนสุด และมีตัวกรอง "Pinned เท่านั้น" (F2-R4) ชื่อหมวดหมู่แสดงเป็นภาษาอังกฤษตามค่าใน `item.category` (F2-R2)

**Dialog แก้ไข (`ItemEditDialog`)**

```
┌ Item ────────────────────────────────────────── ✕ ┐
│ ┌──────┐  ชื่อ        [Iron Ore                 ]  │
│ │ IMG  │  หมวดหมู่    [material ▼]                 │
│ │ 64px │  รูป         [Capture] [Paste] [Import…]  │
│ └──────┘              [ลบรูป]                      │
│ Notes      [                                    ]  │
│ 📌 Pin ไว้ใน Overlay  [ ]                          │
│ ใช้ใน: Recipe "Iron Ingot" (×2), Quest A (×10)     │
│                              [ลบ Item]  [บันทึก]   │
└────────────────────────────────────────────────────┘
```

**Primary Action:** Item ใหม่ (Split Button: ค่าเริ่มต้น "สร้างด้วยมือ") **Secondary:** แก้ไข (คลิกการ์ด/Enter), ปรับ Owned, Pin, ลบ, เปลี่ยนมุมมอง, กรอง

**กฎการลบ:** ถ้า Item ถูกอ้างโดย `recipe_ingredient` หรือ `quest_requirement` ระบบปฏิเสธ (RESTRICT, `ITEM_IN_USE`) Dialog ต้องแสดงรายการที่อ้างถึงพร้อมลิงก์ไปแก้ไขและไม่มีปุ่มลบ (F2-R12) ถ้า Item เป็น Output ของ Recipe `ConfirmDialog` ต้องระบุชื่อ Recipe ที่จะถูกลบตามไป (F2-R13) และถ้า `owned > 0` ต้องแจ้งจำนวนที่ถืออยู่ (F2-R15) ไม่เสนอ "ลบทั้งหมด" ให้ การแทนที่รูปที่มีอยู่แล้วจากปุ่ม Capture/Paste/Import ใน `ItemEditDialog` ต้องผ่าน `ConfirmDialog` ตาม F2-R9

**States**

| State | การแสดงผล |
|---|---|
| ไม่มี Item | `EmptyState`: "ยังไม่มี Item ใน Profile นี้" พร้อมปุ่ม 4 ทาง: สร้างด้วยมือ, Capture, Paste จาก Clipboard, Import ไฟล์ และข้อความ Hotkey |
| ค้นหาไม่พบ | "ไม่พบ Item ที่ตรงกับ "xyz"" พร้อมปุ่ม "สร้าง Item "xyz"" กด `Enter` ในช่องค้นหาได้ผลเดียวกัน (ชื่อที่พิมพ์กลายเป็นชื่อ Item ใหม่ ตาม F2 ขั้นตอนที่ 1) |
| Loading | Skeleton การ์ด 8 ใบ |
| ไฟล์รูปหายจากดิสก์ | Thumbnail แสดง Placeholder พร้อมไอคอนเตือนสี `warning` Tooltip "ไม่พบไฟล์รูป: <path>" ในการ์ด; Dialog มีปุ่มกำหนดรูปใหม่ |
| รายการยาว | Grid ใช้ Virtual Scrolling เมื่อเกิน 200 ใบ ค้นหาและกรองยังทำงานฝั่ง Renderer |
| ชื่อซ้ำ (`UNIQUE (profile_id, name COLLATE NOCASE)`) | Inline Error ใต้ช่องชื่อ "มี Item ชื่อนี้แล้ว" พร้อมลิงก์ "เปิด Item นั้น" |

**Shortcut:** `/` หรือ `Ctrl+F` ค้นหา, `Ctrl+N` Item ใหม่, `↑↓←→` เลื่อน, `Enter` แก้ไข, `+`/`−` ปรับ Owned, `S` วน Step ตาม `preferences.stepSizes`, `P` Pin, `F` สลับ "Pinned เท่านั้น", `Delete` ลบ, `Esc` ล้างคำค้น, `1`–`5` กรองหมวดหมู่ตามลำดับ Chip (`0` = ทั้งหมด)

### 3.3 Recipes (`#/recipes`)

**วัตถุประสงค์:** สร้างและแก้ไข Recipe (Output Item, `output_qty`, `station`, Ingredients พร้อม `qty` และ `mode`), ดู Nested Preview, ตั้งเป็น Tracking Target, Craft

**Layout:** สองคอลัมน์ ซ้ายเป็นรายการ Recipe (กว้าง 300 px) ขวาเป็น `RecipeEditor` แบบ Inline (ไม่ใช่ Dialog เพราะฟอร์มยาว)

```
┌ Recipes ─────────────┬─ Iron Sword ───────────────────────────────────────────┐
│ [🔍 ค้นหา…      ]     │ Output   [IMG] [Iron Sword        ▼]  × [ 1 ]           │
│ [+ Recipe ใหม่]       │ Station  [Forge                  ]                      │
│                      │ Ingredients                                   [+ เพิ่ม] │
│ ▸ [IMG] Iron Sword   │ ≡ [IMG] Iron Ingot   [−] 2 [+]   (craft|gather)  ✕     │
│   ×1 · 3 วัตถุดิบ ⊙   │ ≡ [IMG] Wood         [−]`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)[+]   (craft|gather)  ✕     │
│   [IMG] Iron Ingot   │ ≡ [IMG] Leather      [−] 3 [+]   (craft|gather)  ✕     │
│   ×1 · 2 วัตถุดิบ     │                                                         │
│   [IMG] Cloth        │ Notes    [                                           ] │
│   ×2 · 1 วัตถุดิบ     │ ─ Nested Preview (ขยายถึง Raw Materials) ── สำหรับ [1] ชิ้น ─│
│                      │ ▾ Iron Sword ×1   (1 run, Surplus 0)                   │
│                      │   ▾ Iron Ingot ×2  (craft → Recipe "Iron Ingot" 2 runs) │
│                      │       Iron Ore ×10                                      │
│                      │     Wood ×5                                             │
│                      │     Leather ×3                                          │
│                      │ Raw รวม (Gross ไม่หัก Inventory): Iron Ore 10, Wood 5, Leather 3 │
│                      │                                                         │
│                      │ [ลบ Recipe]      [⊙ Track ×[1]] [⚒ Craft] [บันทึก Ctrl+S]│
└──────────────────────┴─────────────────────────────────────────────────────────┘
```

- รายการซ้าย: Thumbnail 40 px ของ Output Item, ชื่อ, `×output_qty`, จำนวน Ingredient, ไอคอน ⊙ เมื่อถูก Track อยู่
- `IngredientList` แต่ละแถวเป็น `MaterialRow` แบบแก้ไขได้: Handle ≡ ลากเพื่อจัด `sort_order`, `QuantityStepper` สำหรับ `qty` (ต่ำสุด 1), `ModeToggle` สองสถานะ `craft`/`gather` (ค่าเริ่มต้น `craft`; เมื่อ Item ไม่มี Recipe ให้แสดงป้าย "ไม่มี Recipe" ที่มองเห็นได้ข้างสวิตช์ และสวิตช์ Disabled เพราะทำงานเหมือน `gather` ตาม F3-R4)
- "+ เพิ่ม" เปิด `ItemPicker` ค้นหา Item ใน Profile; พิมพ์ชื่อที่ไม่มีแล้วกด Enter = สร้าง Item ใหม่ทันที (หมวดหมู่ `material`) แล้วใส่เป็น Ingredient; เลือก Item ที่อยู่ในรายการแล้ว = โฟกัสไปที่แถวเดิมเพื่อแก้ `qty` ไม่สร้างแถวซ้ำ (F3-R3)
- `RecipePreviewTree` เป็นแบบอ่านอย่างเดียว แสดงสูตรแบบ Gross สำหรับจำนวนชิ้นที่ผู้ใช้ใส่ในช่อง "สำหรับ [N] ชิ้น" โดยไม่หัก `inventory` (F3-R8) ทุกระดับแสดงจำนวนรอบ `ceil(N / output_qty)` และ Surplus เมื่อหารไม่ลงตัว (F3-R9) ตัวเลขที่หักของที่มีแล้วอยู่ใน Gathering List เท่านั้น ไม่กระทบ Tracking
- "Track ×[N]" สร้าง `tracking_target` ชนิด `recipe` ด้วย `target_qty = N` (หรือลบเมื่อ Track อยู่แล้ว) ปุ่มเปลี่ยนเป็น "Untrack" และเพิ่ม `priority` ท้ายสุด
- "Craft" เปิด `ConsumeMaterialsDialog` โหมด Craft (ดู §3.4 และ Feature Specification)

**Cycle Error:** เมื่อบันทึกแล้ว Main ปฏิเสธด้วย `CYCLE` และ `details.path` ให้แสดง Banner สี `missing` เหนือ Ingredients "Recipe วนกลับมาหาตัวเอง: Iron Sword → Iron Ingot → Iron Sword" (แสดงเส้นทางทั้งเส้นตาม F3-R6) และไฮไลต์แถว Ingredient ที่เป็นต้นเหตุ การบันทึกถูกยกเลิกทั้งหมด (ไม่มี Partial Save)

**ลบ Recipe:** `ConfirmDialog` ระบุว่า Recipe นี้ถูก Track อยู่หรือไม่ และบอกว่า Output Item กับ Ingredients จะไม่ถูกลบ (F3-R12)

**States**

| State | การแสดงผล |
|---|---|
| ไม่มี Recipe | Pane ขวาเป็น `EmptyState` "สร้าง Recipe แรก" พร้อมปุ่ม; Pane ซ้ายว่าง |
| ยังไม่เลือก Recipe | Pane ขวา "เลือก Recipe ทางซ้าย หรือสร้างใหม่" |
| มีการแก้ไขที่ยังไม่บันทึก | หัวข้อ Pane ขวามีจุด ● และการสลับ Recipe/Route ถาม "ทิ้งการแก้ไข?" |
| Output Item ซ้ำ (`UNIQUE (output_item_id)`) | Inline Error ใต้ช่อง Output "Item นี้มี Recipe อยู่แล้ว" พร้อมลิงก์เปิด Recipe นั้น |
| Ingredient จำนวนมาก (> 30) | รายการเลื่อนภายใน Pane; Nested Preview ยุบเป็นค่าเริ่มต้น |
| Loading | Skeleton`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)แถวซ้าย, ฟอร์มว่างขวา |

**Shortcut:** `Ctrl+N` Recipe ใหม่, `Ctrl+S` บันทึก, `/` ค้นหา, `↑↓` เลือก Recipe ในรายการซ้าย, ในตาราง Ingredient: `+`/`−` ปรับ qty, `M` สลับ mode, `Delete` เอาออก, `Alt+↑`/`Alt+↓` ย้ายลำดับ, `Ctrl+Enter` เพิ่ม Ingredient, `Esc` ยกเลิกการแก้ไข

### 3.4 Quest Tracker (`#/quests`)

**วัตถุประสงค์:** CRUD ของ Quest, เปลี่ยน `status`, กำหนด Requirements (`qty`, `mode`), ดู Progress ที่จัดสรร, Track/Untrack, Consume Materials

**Layout:** ตัวกรองสถานะด้านบน (ค่าเริ่มต้นแสดง `active` และ `paused` ส่วน `completed` ยุบอยู่ในส่วนท้ายตาม F4-R11) + รายการ `QuestCard` ที่ขยายได้ + `QuestEditDialog`

```
┌ Quests ───────────────────────────────────────────────────────────────────┐
│ สถานะ [ทั้งหมด][active 2][paused 1][completed 5]  [🔍 ค้นหา…    ] [+ Quest ใหม่] │
│                                                                            │
│ ▾ Ancient Equipment                   ● active   ⊙ Tracked (#1)   [⋯]     │
│   จัดสรร (allocated) 15 / 23  ████████░░░░  ⓘ                              │
│   [IMG] Iron Ore      จัดสรร 10 / 10  ครบ      (craft|gather)              │
│   [IMG] Wood          จัดสรร `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)/  5  ครบ                                  │
│   [IMG] Magic Crystal จัดสรร  0 /  8  ขาด 8                                │
│   [แก้ไข] [Consume materials] [ทำเสร็จแล้ว]                                │
│                                                                            │
│ ▸ Quest B                              ● active   ⊙ Tracked (#2)   [⋯]     │
│   จัดสรร 13 / 23  ███████░░░░░                                             │
│ ▸ Quest D                              ‖ paused   ⊙ Tracked (#3) ไม่ถูกนับ   │
│ ▸ Completed (5) ─────────────────────────────────────────────────────────── │
└────────────────────────────────────────────────────────────────────────────┘
```

- ป้าย "จัดสรร (allocated)" ต้องปรากฏทุกที่ที่แสดง Progress ต่อ Quest ไอคอน ⓘ มี Tooltip: "จำนวนนี้มาจาก Inventory กลางของ Profile ที่จัดสรรตามลำดับ Priority ไม่ใช่ของที่ Quest นี้ถือไว้" ห้ามเขียนว่า "มี" หรือ "Owned" ในบริบทต่อ Quest
- `#n` ข้าง Tracked = `priority` ปัจจุบัน คลิกเปิด `TargetPicker` เพื่อจัดลำดับ เมนู `⋯` มี "Pin ไว้ใน Overlay" (`tracking_target.pinned`, F5-R7)
- "ทำเสร็จแล้ว" เปลี่ยน `status` เป็น `completed` และตั้ง `completed_at` โดย **ไม่** เปลี่ยน `inventory` (Owner Decision 13, F4-R3) ปุ่มมี Caption ใต้ปุ่ม "ไม่หักวัตถุดิบ" Quest ที่ `paused`/`completed` ยังคงแถว `tracking_target` และลำดับ Priority ไว้แต่ไม่ถูกนับ การ์ดจึงแสดงป้าย "ไม่ถูกนับ" แทนตัวเลขจัดสรร (F4-R5, F4-R7) การเปลี่ยนกลับเป็น `active` ทำให้กลับเข้าการคำนวณทันที
- "Consume materials" เปิด `ConsumeMaterialsDialog`:

```
┌ Consume materials — Ancient Equipment ──────────────────── ✕ ┐
│ จะหักจำนวนต่อไปนี้ออกจาก Inventory ของ V-Rising ใน 1 Transaction │
│ [IMG] Iron Ore        20 → 10   (−10)                          │
│ [IMG] Wood            `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)→  0   (−5)                           │
│ [IMG] Magic Crystal    3 → −5   (−8)   ✖ ไม่พอ ขาด`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)          │
│ ⚠ มี 1 รายการที่จะติดลบ ระบบจะไม่หักรายการใดเลย                   │
│ [☑] ตั้งสถานะ Quest เป็น Completed ด้วย                          │
│                                   [ยกเลิก]  [ยืนยันการหัก] (disabled) │
└───────────────────────────────────────────────────────────────┘
```

ปุ่มยืนยัน Enabled เฉพาะเมื่อไม่มีแถว "ไม่พอ" และไม่ใช่ปุ่ม Default ของ `Enter` (F8-R12) เนื้อหาตารางขอจาก Main ด้วย `dryRun: true` (F8-R9) และตัวเลขใน Dialog อัปเดตเองจาก `inventory:changed` ขณะเปิดค้าง ผู้ใช้จึงไปปรับ Owned ในหน้าจอด้านหลังแล้วกลับมากดยืนยันได้โดยไม่ต้องปิด (F8-R4) Checkbox "ตั้งสถานะ Quest เป็น Completed ด้วย" ค่าเริ่มต้นติ๊กและซ่อนเมื่อ Quest `completed` อยู่แล้ว (F8-R7, F8-R8) โหมด Craft (เรียกจาก Recipes หรือ Craft Plan) มีช่องจำนวนรอบ `runs`, เพิ่มบรรทัด "และเพิ่ม [IMG] Iron Sword 0 → 1 (+1)" ท้ายรายการ และถ้า Recipe นั้นเป็น Target อยู่ มี Checkbox "ลด `target_qty` ตามจำนวนที่ Craft" ค่าเริ่มต้นติ๊ก (F8-R11)

**`QuestEditDialog`:** ชื่อ, สถานะ, Notes, `IngredientList` แบบเดียวกับ Recipes (เรียกว่า Requirements, แต่ละแถวมี `qty` และ `mode`), ปุ่ม "บันทึก" และ Checkbox "Track ทันทีหลังบันทึก" (ค่าเริ่มต้นติ๊ก)

**States**

| State | การแสดงผล |
|---|---|
| ไม่มี Quest | `EmptyState` "สร้าง Quest แรก" + ตัวอย่างสั้น "Ancient Equipment: Iron Ore ×10, Wood ×5, Magic Crystal ×8" |
| ตัวกรองว่าง | "ไม่มี Quest ที่ paused" |
| Quest ที่ไม่ Track หรือ `paused`/`completed` | การ์ดไม่แสดง Progress ตัวเลข Requirement แสดงเฉพาะ `qty` และแสดงปุ่ม "Track" (ไม่ Track) หรือป้าย "ไม่ถูกนับ (paused)" / "ไม่ถูกนับ (completed)" (F4-R7) |
| Consume ไม่สำเร็จจาก Main (เช่น ข้อมูลเปลี่ยนระหว่างเปิด Dialog) | Dialog แสดง Banner สี `missing` พร้อมตัวเลขใหม่ ไม่ปิดเอง |
| รายการยาว | การ์ดทั้งหมดยุบ (▸) เป็นค่าเริ่มต้นยกเว้นที่ Track อยู่; Virtual Scrolling เกิน 200 การ์ด |

**Shortcut:** `Ctrl+N` Quest ใหม่, `/` ค้นหา, `↑↓` เลือกการ์ด, `Enter`/`Space` ขยาย/ยุบ, `E` แก้ไข, `T` Track/Untrack, `P` Pin Target, `C` Consume materials, `Delete` ลบ, `0`–`3` ตัวกรองสถานะ (ทั้งหมด/active/paused/completed)

### 3.5 Gathering List (`#/gathering`)

**วัตถุประสงค์:** หน้าจอเดียวที่ตอบ "ต้องเก็บอะไร เท่าไร ขาดอะไร" ของทุก Target ที่เลือก และเป็นที่ปรับ Owned ที่ใช้บ่อยที่สุด (Requirement 3.5 และ 3.6)

**Layout:** Toolbar + Target Bar + `GatheringTable` + `CraftPlanSection` (ยุบได้) + Footer Overall Progress

```
┌ Gathering List ────────────────────────────────────────────────────────────────┐
│ Targets: [⊙ Quest A #1] [⊙ Quest B #2] [⊙ Craft C ×1 #3]   [เลือก Targets… T]  │
│ [🔍 ค้นหา…  ] [ทั้งหมด][material][…] [☐ 📌] Step [1][5][10] เรียง [ขาดก่อน ▼] [☐ ซ่อนที่ครบแล้ว H] │
├──────┬───────────────┬──────────┬──────────────────┬─────────┬──────────────┬───┤
│ IMG  │ Item          │ Required │ Owned            │ Missing │ Progress     │ 📌│
├──────┼───────────────┼──────────┼──────────────────┼─────────┼──────────────┼───┤
│ [IMG]│ Iron Ore      │       45 │ [−] [  20 ] [+]  │   ● 25  │ ████░░░░░ 44%│ 📌│
│ [IMG]│ Wood          │       15 │ [−] [  `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)] [+]  │   ● 10  │ ███░░░░░░ 33%│   │
│ [IMG]│ Leather       │        8 │ [−] [   3 ] [+]  │   ● `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก) │ ████░░░░░ 38%│   │
│ ─ ครบแล้ว 2 รายการ (แสดง) ─────────────────────────────────────────────────── │
├──────┴───────────────┴──────────┴──────────────────┴─────────┴──────────────┴───┤
│ ▾ Craft plan (เฉพาะ Intermediate ที่ต้อง Craft)                                    │
│ ไม่มี Item ระดับกลางที่ต้อง Craft (Craft C เป็น Target ของ Recipe: Craft ได้จากหน้า Recipes) │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Overall Progress  ████████████░░░░░░░░░░░░░░░░  28 / 68   ขาด 3 รายการ          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- ค่า Required / Owned / Missing และ Overall Progress เป็นค่าที่ Main คำนวณและส่งผ่าน `gathering:changed` (Data Model §7) Renderer ไม่คำนวณซ้ำ ยกเว้น Optimistic Update ของ Owned ระหว่างรอ `inventory:changed`
- Toolbar มีตัวกรองตาม F6-R12: ค้นหาชื่อ, Chip หมวดหมู่, "Pinned เท่านั้น" (📌) และคลิก `TargetChip` เพื่อดูเฉพาะ Target นั้น (ตัวกรองมุมมอง ไม่เปลี่ยนการจัดสรร และไม่บันทึกข้ามการเปิดแอป) ตัวเลือกเรียง: ขาดก่อน (ค่าเริ่มต้น), ชื่อ, หมวดหมู่ (F6-R10; ตัวเลือก Required ต้องตรวจสอบก่อนเพิ่ม)
- คอลัมน์ Owned: `QuantityStepper` ที่ตัวเลขตรงกลางเป็น `<input type="number" min="0">` คลิกแล้วเลือกทั้งหมด พิมพ์ + Enter เรียก `window.api.inventory.set({ itemId, owned })`; ปุ่ม `+`/`−` เรียก `window.api.inventory.adjust({ itemId, delta: ±step })`
- คอลัมน์ Missing แสดง `StatusBadge` (จุดสี + ตัวเลข) สถานะตาม §8.2
- `TargetPicker` เปิดเป็น Side Panel ด้านขวา (กว้าง 360 px) ไม่ปิด Table:

```
┌ Tracking Targets ─────────────────────── ✕ ┐
│ ลากเพื่อจัดลำดับ Priority (บนสุดได้ก่อน)       │
│ ≡ [☑] Quest A            จัดสรร 15/15  #1   │
│ ≡ [☑] Quest B            จัดสรร 13/23  #2   │
│ ≡ [☑] Craft C   ×[ 1 ]   จัดสรร  0/30  #3 📌│
│ ≡ [☑] Quest D   paused · ไม่ถูกนับ     #4   │
│ ─ Quests ──────── [🔍]                     │
│   [☐] Quest E                              │
│ ─ Recipes ──────── [🔍]                    │
│   [☐] Iron Sword  ×[ 1 ]                   │
│   [☐] Cloth       ×[ 1 ]                   │
└────────────────────────────────────────────┘
```

Checkbox สร้าง/ลบ `tracking_target` (ไม่ลบ Quest/Recipe ตาม F5-R2); ช่อง `×[N]` คือ `target_qty` (Recipe เท่านั้น; Quest ไม่มีช่องนี้); แต่ละแถวแสดงชนิด, ชื่อ, ความคืบหน้าแบบจัดสรร และปุ่ม Pin/เอาออก (F5-R10); Quest ที่ `paused`/`completed` ยังอยู่ในรายการพร้อมป้าย "ไม่ถูกนับ" (F5-R8); ลาก ≡ หรือ `Alt+↑/↓` เรียก `window.api.tracking.reorder(ids)` และบันทึกทันที (F5-R6); 📌 = `tracking_target.pinned`

- Craft Plan: แถวละ 1 Recipe ของ Intermediate Item ที่ต้อง Craft (`craftPlan[recipe]` runs; ไม่รวมรอบของ Recipe ที่เป็น Target เอง ตาม F6-R6) แสดง Required/Owned ของ Output Item, Ingredients ต่อรอบ และปุ่ม "Craft" ที่เปิด `ConsumeMaterialsDialog` โหมด Craft ด้วยจำนวนรอบที่แผนแนะนำ (F6-R15; ผู้ใช้แก้ `runs` ใน Dialog ได้) Intermediate Item ไม่ปรากฏในตารางบน (ไม่นับเป็น Gather Item) ยกเว้น Item เดียวกันเป็น Leaf จาก Target อื่นที่ตั้ง `gather` ซึ่งจะปรากฏทั้งสองส่วนด้วยตัวเลขของแต่ละบทบาท
- Footer: `Overall Progress = Σ min(Owned, Required) / Σ Required` ของ Gather Items ตามตัวอย่าง 28 / 68

**States**

| State | การแสดงผล |
|---|---|
| ไม่มี Target | `EmptyState` เต็มตาราง "ยังไม่ได้เลือกสิ่งที่ติดตาม" ปุ่ม "เลือก Targets…" เปิด `TargetPicker`; ถ้าไม่มี Recipe/Quest เลย ปุ่มเปลี่ยนเป็น "สร้าง Recipe" / "สร้าง Quest" |
| ครบทุกรายการ | ตารางแสดงแถวสรุป "ครบทุกรายการแล้ว (N รายการ)" สี `ok` และ Craft Plan ยังแสดง (ถ้ามี) ไม่มี Animation ฉลอง |
| ค้นหาไม่พบ | "ไม่พบ Item ที่ตรงกับ "xyz" ในรายการที่ติดตาม" |
| Loading | Skeleton 6 แถว (เกิดเฉพาะตอนเปิด Profile ครั้งแรก) |
| รายการยาว | Virtual Scrolling เกิน 200 แถว; Header ตารางและ Footer ติดขอบ (Sticky) |
| `set` ไม่ผ่านการตรวจ (`VALIDATION`: ติดลบ, ทศนิยม, ไม่ใช่ตัวเลข) | คืนค่าเดิมในช่อง + Toast "ค่าไม่ถูกต้อง ใส่จำนวนเต็ม 0 ถึง 999,999" (`adjust` ไม่มีกรณีนี้ เพราะ Main ปัดเป็น 0 หรือค่าสูงสุดตาม F7-R2) |

**Shortcut:** `/` ค้นหา, `T` เปิด `TargetPicker`, `↑↓` เลือกแถว, `+`/`=` และ `−` ปรับ Owned ตาม Step (F7-R9), `Shift` + `+`/`−` ปรับด้วย Step ค่าสูงสุดใน `stepSizes`, `Enter` แก้ไขตัวเลข Owned, `S` วน Step, `H` ซ่อน/แสดงที่ครบแล้ว, `P` Pin Item, `F` สลับ "Pinned เท่านั้น", `C` ยุบ/ขยาย Craft Plan, `Esc` ออกจากช่องตัวเลขโดยคืนค่าเดิม

### 3.6 Settings (`#/settings`)

**วัตถุประสงค์:** Hotkeys, การแสดงผล Overlay, Backup/Restore/Export/Import, จัดการ Profiles, About

**Layout:** รายการ Section ด้านซ้าย (ภายในหน้า Settings, กว้าง 180 px) + เนื้อหาด้านขวา `?section=` ใน Route เลือก Section ได้โดยตรง ทุกค่าบันทึกทันทีเมื่อเปลี่ยน (Auto-save) ไม่มีปุ่ม "บันทึกการตั้งค่า"

```
┌ Settings ───────┬───────────────────────────────────────────────────────────────┐
│ ▸ Hotkeys       │ Hotkeys                                       [คืนค่าเริ่มต้น] │
│   Overlay       │ Action                          Shortcut             สถานะ      │
│   Backup & Data │ เปิด/ปิด Overlay                [Ctrl+Shift+O     ] ● ใช้งานได้ │
│   Profiles      │ สลับโหมด Overlay (View/Interactive) [Ctrl+Shift+M ] ● ใช้งานได้ │
│   About         │ เริ่ม Capture                   [Ctrl+Shift+X     ] ✖ ถูกใช้แล้ว│
│                 │   ↳ ลงทะเบียนไม่สำเร็จ อาจถูกใช้โดยโปรแกรมอื่นหรือเกม กดเพื่อตั้งใหม่ │
│                 │ Import จาก Clipboard             [Ctrl+Shift+V     ] ● ใช้งานได้ │
│                 │ Overlay: Target ถัดไป            [Ctrl+Shift+]     ] ● ใช้งานได้ │
│                 │ Overlay: Target ก่อนหน้า          [Ctrl+Shift+[     ] ● ใช้งานได้ │
└─────────────────┴───────────────────────────────────────────────────────────────┘
```

| Section | เนื้อหา | Component / พฤติกรรม |
|---|---|---|
| Hotkeys | ตาราง 6 Action ตาม F11-R1 | `HotkeyRecorder`: คลิกช่องแล้วกดคีย์ผสม ช่องแสดง Accelerator ที่จะลงทะเบียน ตรวจซ้ำภายในแอปทันที บันทึกลง `app_setting.hotkeys` แล้ว Main ลงทะเบียนใหม่ ผลลัพธ์ (`globalShortcut.register` คืน `false`) แสดงเป็นสถานะ ✖ พร้อมคำอธิบาย และ Toast เมื่อเกิดตอนเริ่มแอป "Hotkey Capture ลงทะเบียนไม่สำเร็จ" กดแล้วไป `#/settings?section=hotkeys` |
| Overlay | Opacity (Slider 20–100 %, Step 5, ค่าเริ่มต้น 90 %), Compact Mode (Toggle), โหมดเริ่มต้นเมื่อแสดง (`view`/`interactive`), แสดง Overlay เมื่อเปิดแอป (Toggle), ซ่อนที่ครบแล้วใน Overlay (ใช้ค่าเดียวกับ Gathering List), ปุ่ม "รีเซ็ตตำแหน่งและขนาด" | ค่าทั้งหมดอยู่ใน `app_setting.overlay` เปลี่ยนแล้ว Overlay อัปเดตทันทีผ่าน Push Event (ไม่ต้องเปิด/ปิดใหม่) Slider มี Preview ค่าเป็นตัวเลข |
| Backup & Data | ที่เก็บข้อมูล (แสดง Path `<userData>\data` + ปุ่ม "เปิดโฟลเดอร์"), ปุ่ม "Export Backup (.zip)…" (เรียก `window.api.backup.export(path)` หลัง Save Dialog), ปุ่ม "Import / Restore…", Backup ล่าสุด (เวลาและขนาด) | Restore แสดง `ConfirmDialog` ที่อ่านจาก `manifest.json`: `appVersion`, `schemaVersion`, `exportedAt`, จำนวน Profile และแจ้งว่า "ข้อมูลปัจจุบันจะถูกสำรองไว้ที่ … ก่อนแทนที่" ระหว่างทำงานปุ่มทั้งหน้า Disabled และแสดงแถบสถานะข้อความ ไม่มี Spinner แบบ Animation |
| Profiles | ตาราง Profile: ไอคอน (คลิกเพื่อเลือกไฟล์ → `icon_path`), ชื่อ (แก้ Inline, `F2`), สร้างเมื่อ, เปิดล่าสุด, จำนวน Item/Recipe/Quest, ปุ่ม "ตั้งเป็น Active", เมนูลบ | ลบ = `ConfirmDialog` ระบุจำนวนข้อมูลที่จะหายและต้องพิมพ์ชื่อ Profile เพื่อยืนยัน (ป้องกันลบผิด เพราะ CASCADE ทั้งหมด) ลบ Active Profile แล้วระบบสลับไป Profile ที่เปิดล่าสุดถัดไป หรือกลับสู่ First Run |
| About | ชื่อแอป, Version จาก `package.json`, Electron/Chromium/Node Version, Schema Version (`PRAGMA user_version`), ลิงก์ Product page/Releases/Discord จาก README, License MIT, ช่อง "ตรวจสอบอัปเดต" แสดงข้อความ "ยังไม่เปิดใช้ใน Phase 1" (Owner Decision 14) | ข้อความอัปเดตเป็น Placeholder ที่เปลี่ยนเป็นปุ่มจริงใน Phase`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)|

**States:** Hotkey ล้มเหลว (ดังตัวอย่าง), Backup กำลังทำงาน (ปุ่ม Disabled + ข้อความ), Import ไฟล์ไม่ถูกต้อง (Banner "ไฟล์ไม่ใช่ Backup ของ GameLooter หรือ manifest.json เสียหาย"), Schema ใหม่กว่าแอป (Banner "Backup นี้สร้างจากเวอร์ชันที่ใหม่กว่า ต้องอัปเดตแอปก่อน"), ไม่มี Profile (Section Profiles แสดงปุ่มสร้าง)

**Shortcut:** `↑↓` เลื่อน Section, `Tab` เข้าเนื้อหา, ใน `HotkeyRecorder`: `Esc` ยกเลิกการตั้ง, `Backspace` ล้างค่า (ปิด Hotkey นั้น)

---

## 4. Overlay Window

Overlay เป็น `BrowserWindow` แยก (Transparent, Frameless, Always-on-top, Skip Taskbar) โหลด `overlay.html` รายละเอียดการสร้างหน้าต่างและข้อจำกัดกับเกมอยู่ใน Architecture Proposal และ Risks & Limitations ส่วนนี้กำหนดสิ่งที่ผู้ใช้เห็น

### 4.1 สองโหมด

| | View | Interactive |
|---|---|---|
| Mouse | Click-through ทั้งหน้าต่าง (`setIgnoreMouseEvents(true, { forward: true })`) เกมได้รับ Mouse ตามปกติ | รับ Mouse ตามปกติ |
| สัญลักษณ์ | Badge มุมขวาบนของ Header "VIEW" สีเทา (`neutral`), ไม่มีเส้นขอบ | Badge "INTERACTIVE" สี Accent, เส้นขอบ 1 px สี Accent รอบ Panel, Cursor ปกติ |
| ปุ่ม `+`/`−` | แสดงแบบจางลง (opacity 0.4) ในแบบ Full, ซ่อนในแบบ Compact | แสดงเต็มสีและกดได้ ทั้งสองแบบ |
| Scroll | ไม่ได้ แสดง "+N รายการ" ที่ท้าย | ล้อ Mouse และ `↑↓` ได้ |
| ย้าย/ปรับขนาด | ไม่ได้ | Header เป็น Drag Region; Grip มุมขวาล่าง (§4.5) |
| Keyboard | ไม่รับ (หน้าต่างไม่โฟกัส) | `Tab`/`Shift+Tab` ระหว่างปุ่ม, `+`/`−` บนแถวที่โฟกัส, `Esc` กลับสู่ View |
| เข้าสู่โหมด | Hotkey `CommandOrControl+Shift+M`, `Esc` จาก Interactive, หรือสลับจาก Settings | Hotkey เดียวกัน หรือปุ่ม "Edit" ใน Title Bar ของ Main window (Dropdown ของปุ่ม Overlay) |

สถานะโหมดล่าสุดเก็บใน `app_setting.overlay.mode` (ค่าเริ่มต้น `view`; "โหมดเริ่มต้นเมื่อแสดง" ใน Settings เขียนค่าเดียวกัน ตาม F9-R3) และเรียกผ่าน `window.api.overlay.setMode('view' | 'interactive')` การสลับโหมดต้องไม่เปลี่ยนตำแหน่งหรือขนาดหน้าต่าง

### 4.2 แบบ Full (ค่าเริ่มต้น 320 × 420 px)

ตรงกับตัวอย่างใน Requirement 3.7 เพิ่มเพียง Header ที่แสดงชื่อ Target ปัจจุบันและ Badge โหมด

```
┌──────────────────────────────────┐
│ MATERIAL TRACKER  ‹ ทั้งหมด ›   VIEW │
│ ─────────────────────────────── │
│ [IMG] Iron Ore                   │
│       20 / 45    Missing 25      │
│       [ − ]      [ + ]           │
│                                  │
│ [IMG] Wood                       │
│       `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)/ 15    Missing 10      │
│       [ − ]      [ + ]           │
│                                  │
│ [IMG] Leather                    │
│        3 / 8     Missing`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)      │
│       [ − ]      [ + ]           │
│ ─────────────────────────────── │
│ Overall Progress: 28 / 68        │
│ ████████████░░░░░░░░░░░░░░░░░░  ◢ │
└──────────────────────────────────┘
```

- แถวสูง 56 px: Thumbnail 32 px, ชื่อ 14 px น้ำหนัก 600, ตัวเลข `Owned / Required` 18 px น้ำหนัก 700 แบบ Tabular, "Missing N" 14 px สีตาม Status (`missing`/`warning`) หรือ "ครบ" สี `ok`
- ปุ่ม `−`/`+` ขนาด 28 × 28 px ห่างกัน ≥ 8 px (§9.4) Step ใช้ค่าเดียวกับที่เลือกในหน้าจอ (ตัวเลือกจาก `preferences.stepSizes`) และแสดง Step ข้างปุ่มเมื่อไม่ใช่ 1 เช่น `[ −5 ]  [ +5 ]`
- Footer: Overall Progress ตัวเลข + `ProgressBar` สูง 4 px; `◢` คือ Resize Grip (แสดงเฉพาะ Interactive)
- `‹ ทั้งหมด ›` คือชื่อ Target ที่เลือกดูอยู่ (§4.6) ลูกศรกดได้ใน Interactive และเท่ากับ Hotkey `[`/`]`

### 4.3 แบบ Compact (ค่าเริ่มต้น 280 × 240 px)

```
┌──────────────────────────────┐
│ TRACKER ‹ Quest A ›     VIEW │
│ [IMG] Iron Ore   20/45  −25  │
│ [IMG] Wood        5/15  −10  │
│ [IMG] Leather     3/8    −5  │
│ [IMG] Magic Crys… 0/8    −8  │
│ +2 รายการ          28/68 ◢  │
└──────────────────────────────┘
```

- แถวสูง 32 px: Thumbnail 24 px, ชื่อ 13 px ตัดด้วย Ellipsis, ตัวเลข 14 px Tabular, Missing แสดงเป็น `−N` สีตาม Status
- ใน Interactive ปุ่ม `−`/`+` ขนาด 28 × 28 px ปรากฏท้ายแถวแทนตัวเลข Missing (ย้าย Missing ไปอยู่หลังตัวเลข Owned/Required ด้วยสี) เพื่อไม่ให้แถวสูงขึ้น
- Footer บรรทัดเดียว: จำนวนที่ไม่พอแสดง + Overall Progress ตัวเลข
- สลับ Full/Compact จาก Settings หรือ Double-click ที่ Header ใน Interactive ค่าเก็บใน `app_setting.overlay.compact`

### 4.4 กฎการอ่านทับเกม

| กฎ | ค่า |
|---|---|
| พื้นหลัง Panel | ทึบ `#0b0d12` (Token `--color-overlay-bg`) ความโปร่งทั้งหน้าต่างมาจาก `setOpacity()` ตาม `app_setting.overlay.opacity` เท่านั้น ไม่ใช้ `backdrop-filter` หรือ Blur (ต้นทุน GPU) |
| ช่วง Opacity | 0.20–1.00 ค่าเริ่มต้น 0.90 Step 0.05 (ตาม F9-R4; ค่าต่ำกว่า 0.40 อ่านยากบนฉากสว่าง Settings มีปุ่มรีเซ็ตตามข้อ 4.5) |
| ข้อความ | `#f5f6f8` บนพื้นเข้ม Contrast ≥ 7:1 ที่ Opacity 1.0; ตัวเลขและชื่อมี `text-shadow: 0 1px 2px #000` เพื่อคง Contrast เมื่อ Opacity ต่ำ |
| ขนาดต่ำสุด | ตัวเลข ≥ 14 px, ชื่อ ≥ 13 px, ไม่มี Caption เล็กกว่า 12 px |
| สี Status | ใช้ Token เดียวกับ Main window แต่เพิ่ม Lightness 10 % (`--color-status-*-overlay`) ให้เด่นบนพื้นเข้ม |
| Animation | ไม่มี `transition`, `animation`, Spinner หรือ Hover Effect ใดๆ ใน `overlay.html` การอัปเดตเปลี่ยนเฉพาะข้อความและความกว้างของ `ProgressBar` ทันที |
| Hover | ไม่มีใน View; ใน Interactive ปุ่มเปลี่ยนเฉพาะสีพื้น (ไม่มี Transition) |
| Font | เหมือน Main window (§8.3) โหลดจาก `/fonts/*.woff2` ภายใน Package เดียวกัน |
| มุมและขอบ | Radius 8 px; เส้นขอบ 1 px แสดงเฉพาะ Interactive |
| ขนาดแถวสูงสุด | ไม่จำกัดจำนวน Item; แถวที่ล้นพื้นที่ซ่อนและสรุปเป็น "+N รายการ" |

### 4.5 ย้ายและปรับขนาด (Interactive)

- **ย้าย:** Header ทั้งแถบเป็น `-webkit-app-region: drag` (ยกเว้นปุ่ม `‹ ›` และ Badge) Cursor เป็น `move` เมื่อชี้ที่ Header
- **ปรับขนาด:** Grip `◢` 16 × 16 px มุมขวาล่าง ลากแล้ว Renderer คำนวณขนาดใหม่และส่งให้ Main ตั้งค่า Bounds ผ่าน `window.api.overlay.setBounds` (`overlay:setBounds`) ขนาดต่ำสุด 220 × 160 px ตาม §10.2 ระหว่างลากแสดงขนาดเป็นตัวเลขที่ Footer เช่น `320 × 420` การปรับขนาดด้วยขอบหน้าต่างแบบ Native บน Transparent Window ต้องตรวจสอบพฤติกรรมจริงบน Electron 44 / Windows 11 ก่อนตัดสินใจใช้แทน Grip
- **บันทึก:** ตำแหน่งและขนาดบันทึกลง `app_setting.overlay.bounds` หลังหยุดลาก 200 ms (Debounce ตาม F9-R5) และคืนค่าเมื่อเปิดแอปครั้งถัดไป ถ้า Bounds อยู่นอกจอที่มีอยู่ Main ย้ายเข้าจอหลัก (Feature Specification)
- **จอหลายจอ:** ลากข้ามจอได้ตามปกติ Bounds เก็บเป็นพิกัดจอแบบ DIP
- **รีเซ็ต:** ปุ่มใน Settings → Overlay คืนค่าเป็น 320 × 420 ที่มุมขวาบนของจอหลัก ห่างขอบ 16 px

### 4.6 รายการที่แสดงและ Pinned List

แหล่งข้อมูลคือผลลัพธ์เดียวกับ Gathering List (`window.api.gathering.get()` + Push `gathering:changed`) ไม่มีการคำนวณใน Overlay

| กรณี | รายการที่แสดง |
|---|---|
| ไม่มีอะไร Pin | มุมมอง "ทั้งหมด": Gather Items ทุกตัว เรียงแบบ Missing-first เคารพ "ซ่อนที่ครบแล้ว" (`preferences.hideComplete`) |
| มี Item ที่ `item.pinned = 1` | Item เหล่านั้นลอยขึ้นบนสุดของ "ทั้งหมด" โดยมีเครื่องหมาย 📌 หน้าชื่อ และไม่ถูกซ่อนแม้ครบแล้ว |
| มี Target ที่ `tracking_target.pinned = 1` | Header มีรายการวน `‹ ทั้งหมด › → ‹ Quest A › → ‹ Craft C ›` ตาม `priority` เมื่อเลือก Target ใดแถวจะแสดง Requirements ของ Target นั้นด้วยตัวเลข "จัดสรร / ต้องการ" และ Footer แสดง "จัดสรร 15 / 23" (ไม่ใช่ Overall) Header แสดงคำว่า "จัดสรร" เสมอ |
| Target เดียวกับ Item Pin | Item Pin มีผลเฉพาะมุมมอง "ทั้งหมด" |
| ไม่มี Target เลย | Panel แสดงข้อความ 2 บรรทัด "ยังไม่ได้เลือกสิ่งที่ติดตาม" และ "เปิดแอปหลักเพื่อเลือก" ไม่มีปุ่ม |
| Profile เปลี่ยน (`profile:changed`) | Overlay โหลดรายการของ Profile ใหม่ทันทีและกลับไปมุมมอง "ทั้งหมด" |

มุมมองที่เลือกอยู่ (`ทั้งหมด` หรือ Target ใด) เป็นสถานะชั่วคราวของ Overlay ไม่บันทึกข้ามการเปิดแอป (F9-R9) จึงไม่มี Key `selectedTarget` ใน `app_setting.overlay`

### 4.7 Hotkeys ที่มีผลกับ Overlay

| Hotkey (ค่าเริ่มต้น) | ผลใน Overlay | Feedback ที่ผู้ใช้เห็น |
|---|---|---|
| `CommandOrControl+Shift+O` | แสดง/ซ่อน Overlay (`app_setting.overlay.visible`) | หน้าต่างปรากฏ/หายทันที ปุ่ม Overlay ใน Title Bar ของ Main window เปลี่ยนสถานะ Pressed |
| `CommandOrControl+Shift+M` | สลับ View ⇄ Interactive | Badge และเส้นขอบเปลี่ยน; เมื่อเข้า Interactive หน้าต่างได้รับโฟกัสและแถวแรกโฟกัส; เมื่อกลับ View โฟกัสคืนให้เกม |
| `CommandOrControl+Shift+]` / `[` | Target ถัดไป / ก่อนหน้าในรายการวน §4.6 | Header เปลี่ยนชื่อ Target ทันที ถ้ามีมุมมองเดียวไม่ทำอะไร |
| `CommandOrControl+Shift+X` | เริ่ม Capture (ไม่ใช่ของ Overlay แต่ Overlay ซ่อนตัวชั่วคราวระหว่าง Capture เพื่อไม่ติดในภาพหน้าจอ และกลับมาหลัง Capture จบ) | Overlay หายไปตอน Capture window เปิด |
| `CommandOrControl+Shift+V` | Import จาก Clipboard (เปิด Dialog ใน Main window) | Main window ถูกนำมาด้านหน้า |

Hotkey ไม่ทำงานเมื่อถูกโปรแกรมอื่นจองไว้ สถานะนี้แสดงใน Settings → Hotkeys เท่านั้น (Overlay ไม่มีที่แสดงข้อผิดพลาด)

---

## 5. Capture Flow UI

ลำดับทางเทคนิค (Hotkey → `desktopCapturer` → Capture window → `nativeImage.crop` → บันทึก PNG + Thumbnail 64 px) อยู่ใน Architecture Proposal ส่วนนี้กำหนดหน้าตาและการโต้ตอบ

### 5.1 Capture window (Selection)

หน้าต่าง Frameless เต็มจอ (Baseline 1 หน้าต่างบนจอที่ Cursor อยู่) แสดงภาพหน้าจอของจอนั้นเป็นพื้นหลัง (ผู้ใช้เห็นเกม "หยุดนิ่ง") Overlay ซ่อนตัวก่อนถ่าย

```
┌────────────────────────────────────────────────────────────────────┐
│          ลากเพื่อเลือกบริเวณ Item · Enter ยืนยัน · Esc ยกเลิก          │  ← Hint bar (หายเมื่อเริ่มลาก)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░ ┌───────────┼──────┐ ░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ───────────────────── │ ภาพจริง   ┼      │ ─────────────────────── │  ← Crosshair ตาม Cursor
│ ░░░░░░░░░░░░░░░░░░░░ │ ไม่ถูกหรี่  │      │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░ └───────────┼──────┘ ┌──────────────┐ ░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░ │ 1024, 612    │ ░░░░░ │  ← Readout (พิกัดและขนาดเป็น Device Pixel)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░ │ 128 × 128 px │ ░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░ └──────────────┘ ░░░░░ │
└────────────────────────────────────────────────────────────────────┘
```

| องค์ประกอบ | กฎ |
|---|---|
| พื้นหลัง | ภาพหน้าจอของจอนั้น หรี่ด้วยชั้นดำ 45 % ยกเว้นบริเวณที่เลือก (แสดงภาพจริง) |
| Cursor | `crosshair` พร้อมเส้นนำแนวตั้ง/แนวนอน 1 px สี `#ffffff` opacity 0.6 ตาม Cursor |
| Readout | กล่องเล็กใกล้ Cursor (เลี่ยงขอบจอ) บรรทัด 1 พิกัด `x, y` บรรทัด 2 ขนาด `w × h px` เป็น Device Pixel (คูณ `display.scaleFactor` แล้ว) ตรงกับขนาดไฟล์ที่จะบันทึก |
| การเลือก | กดค้างแล้วลาก ปล่อยแล้วกรอบคงอยู่พร้อม Handle 8 จุด (ปรับได้) `Space` ค้างระหว่างลาก = ย้ายกรอบ ขนาดต่ำสุด 8 × 8 Device Pixel |
| ยืนยัน | `Enter` หรือ Double-click ในกรอบ หรือปุ่ม "ยืนยัน" เล็กใต้กรอบ (ปรากฏหลังปล่อย Mouse) |
| ยกเลิก | `Esc` หรือคลิกขวา ปิด Capture window และ Overlay กลับมา |
| หลายจอ | Baseline เปิด 1 หน้าต่างบนจอที่ Cursor อยู่ (F10-R3) เท่านั้น จอที่เหลือไม่มีหน้าต่างทึบ; การเปิดทุกจอพร้อมกัน (จอที่เหลือหรี่ 70 % และไม่รับการลาก) เป็นส่วนขยายที่ต้องตรวจสอบความจำเป็นหลัง Phase 4 |
| High-DPI | ภาพพื้นหลังวาดที่ 1 CSS px = 1 DIP โดยใช้ Bitmap ขนาด Device Pixel เพื่อไม่เบลอ (รายละเอียดใน Architecture Proposal) |
| Animation | ไม่มี (Capture window เปิด-ปิดทันที) |

### 5.2 Dialog ตั้งชื่อ Item (`CaptureItemDialog`)

เปิดใน Main window (นำหน้าต่างมาด้านหน้าและโฟกัส) ทันทีหลังยืนยันการเลือก ใช้ Dialog เดียวกันสำหรับภาพจาก Clipboard และไฟล์ Import

```
┌ บันทึกภาพ Item ───────────────────────────────────────── ✕ ┐
│ ┌────────┐ ┌──────┐   ต้นฉบับ 128 × 128 px · Thumbnail 64 px │
│ │        │ │ 64px │                                           │
│ │  crop  │ │ thumb│                                           │
│ └────────┘ └──────┘                                           │
│                                                               │
│ (●) สร้าง Item ใหม่      ( ) ผูกกับ Item ที่มีอยู่                  │
│ ชื่อ        [Iron Ore                            ]             │
│ หมวดหมู่    [material ▼]                                       │
│                                                               │
│ ── เมื่อเลือก "ผูกกับ Item ที่มีอยู่" ──                           │
│ ค้นหา Item  [iron                               ]             │
│   [IMG] Iron Ore        material  (มีรูปอยู่แล้ว → จะแทนที่)      │
│   [ I ] Iron Ingot      material                               │
│                                                               │
│ ⚠ มี Item ชื่อ "Iron Ore" อยู่แล้ว  [ผูกรูปกับ Item นั้นแทน]        │
│                                                               │
│           [ยกเลิก Esc]  [บันทึกและ Capture ต่อ Ctrl+Enter]  [บันทึก Enter] │
└───────────────────────────────────────────────────────────────┘
```

- โฟกัสเริ่มที่ช่องชื่อ; พิมพ์ชื่อแล้ว `Enter` = บันทึกเป็น Item ใหม่หมวด `material` (ตรงกับ Requirement 3.8 ข้อ 4–6)
- Preview แสดงภาพ Crop ที่ขนาดจริง (สูงสุด 256 px) และ Thumbnail 64 px ที่จะใช้ในรายการ เพื่อให้ผู้ใช้เห็นว่าภาพเล็กยังจำได้
- ถ้าชื่อที่พิมพ์ชนกับ `UNIQUE (profile_id, name COLLATE NOCASE)` แสดงคำเตือนพร้อมปุ่มสลับไปโหมด "ผูกกับ Item ที่มีอยู่" โดยเลือก Item นั้นให้เลย (1 Click)
- โหมด "ผูกกับ Item ที่มีอยู่": `ItemPicker` แสดง Thumbnail ปัจจุบันของแต่ละ Item และคำเตือน "จะแทนที่" เมื่อ Item นั้นมีรูปแล้ว
- "บันทึกและ Capture ต่อ" บันทึกแล้วเรียก `window.api.capture.start()` อีกครั้งทันที (สำหรับเก็บ Item ต่อเนื่องจากหน้าจอเดียวกัน)
- หลังบันทึก: Toast "บันทึก Iron Ore แล้ว" พร้อมปุ่ม "เปิด" (ไป `#/items?id=…`) และ Overlay กลับมาแสดง รูปปรากฏใน Recipes, Quest Tracker, Gathering List และ Overlay ทันทีผ่าน Push Event (Requirement 3.8 ข้อ 7)

### 5.3 ทางเข้าของ Clipboard Fallback และ Import ไฟล์

| ทางเข้า | ที่อยู่ | ผล |
|---|---|---|
| Hotkey `CommandOrControl+Shift+V` | ทุกที่ (Global) | อ่าน Clipboard; ถ้ามีภาพ `image/png` หรือ `image/*` เปิด `CaptureItemDialog` พร้อมภาพนั้น |
| ปุ่ม "Paste จาก Clipboard" | Item Library → Split Button "Item ใหม่"; `ItemEditDialog` → ปุ่ม "Paste"; `EmptyState` ของ Item Library | เหมือน Hotkey; ใน `ItemEditDialog` ผูกกับ Item ที่เปิดอยู่โดยตรงไม่ต้องเลือกโหมด |
| ปุ่ม "ใช้ Snipping Tool แล้ว Paste" | ข้อความล้มเหลวของ Capture (§5.4) | แสดงคำแนะนำ "กด Win+Shift+S เลือกบริเวณ แล้วกลับมากด Paste" และปุ่ม "Paste จาก Clipboard" ที่ตรวจ Clipboard อีกครั้ง |
| ปุ่ม "Import ไฟล์…" | Item Library → Split Button; `ItemEditDialog`; `EmptyState` | `dialog.showOpenDialog` ตัวกรอง PNG/JPG/WebP/BMP; เปิด `CaptureItemDialog` พร้อมภาพ |
| Drag-and-drop ไฟล์ลง Item Library | พื้นที่ Grid ทั้งหมด (แสดงกรอบประเมื่อลากเข้า) | เหมือน Import ไฟล์; ต้องตรวจสอบวิธีอ่าน Path ของไฟล์ที่ลากมาใน Sandboxed Renderer (`webUtils.getPathForFile` ใน Preload) ก่อนรวมใน Phase 4; ถ้าไม่ผ่านให้ตัดออก |

### 5.4 ข้อความเมื่อล้มเหลว

ข้อความทั้งหมดแสดงเป็น Toast แบบไม่หายเอง (ข้อผิดพลาด) ใน Main window และนำ Main window มาด้านหน้า

| สถานการณ์ | ข้อความ | ปุ่ม |
|---|---|---|
| ภาพหน้าจอเป็นสีดำทั้งจอ (Fullscreen Exclusive หรือ Protected Content) | "จับภาพหน้าจอไม่ได้ เกมอาจอยู่ในโหมด Fullscreen Exclusive ลองเปลี่ยนเกมเป็น Borderless Windowed หรือใช้ Snipping Tool" | [ใช้ Snipping Tool แล้ว Paste] [Import ไฟล์…] |
| ระบบปฏิเสธสิทธิ์ (`display-capture`) | "ระบบไม่อนุญาตให้จับภาพหน้าจอ" | [ใช้ Snipping Tool แล้ว Paste] [Import ไฟล์…] |
| ไม่มีจอที่ Cursor อยู่ (จอถูกถอด) | "ไม่พบจอที่จะจับภาพ" | [ลองอีกครั้ง] |
| Clipboard ไม่มีภาพ | "Clipboard ไม่มีรูปภาพ กด Win+Shift+S เพื่อเลือกบริเวณก่อน แล้วกด Paste อีกครั้ง" | [ลองอีกครั้ง] |
| ไฟล์ไม่ใช่รูปหรือเปิดไม่ได้ | "เปิดไฟล์ <ชื่อไฟล์> ไม่ได้ รองรับ PNG, JPG, WebP และ BMP" | [เลือกไฟล์อื่น…] |
| บริเวณที่เลือกเล็กกว่า 8 × 8 | แสดงใน Capture window เป็นข้อความใต้ Readout "เล็กเกินไป" ไม่ปิดหน้าต่าง | – |
| เขียนไฟล์ภาพไม่สำเร็จ | "บันทึกรูปไม่สำเร็จที่ <path> ข้อมูล Item ไม่ถูกบันทึก" (Transaction ย้อนกลับ) | [ลองอีกครั้ง] [เปิดโฟลเดอร์ข้อมูล] |
| Hotkey Capture ไม่ได้ลงทะเบียน | แสดงตอนเริ่มแอปตาม §3.6 | [ตั้งค่า Hotkey] |

---

## 6. User Flows

ทุกขั้นตอนระบุหน้าจอในวงเล็บ ขั้นตอนที่เป็น Keyboard ทางเลือกใส่ไว้ท้ายข้อ

### 6.1 เปิดแอปครั้งแรก → สร้าง Profile

1. เปิดแอป Main window แสดง Game Dashboard ในสถานะ First Run (ไม่มี Profile) Sidebar รายการ 2–5 Disabled
2. (Game Dashboard) ช่อง "ชื่อ Game Profile" โฟกัสอยู่แล้ว พิมพ์ "V-Rising"
3. (Game Dashboard) กด Enter หรือคลิก "สร้าง" ระบบสร้าง `game_profile` และตั้ง `active_profile_id`
4. (Game Dashboard) หน้าเปลี่ยนเป็นสถานะ "มี Profile แต่ไม่มี Target" แสดงปุ่ม "สร้าง Recipe" / "สร้าง Quest" และ `ProfileSwitcher` ใน Title Bar แสดง "V-Rising"
5. (ไม่บังคับ) Toast "สร้าง V-Rising แล้ว ตั้งค่า Hotkeys ได้ที่ Settings"

### 6.2 เพิ่ม Items พร้อมรูป

ทางที่ 1 Capture จากเกม

1. เล่นเกมในโหมด Borderless Windowed เปิดหน้า Inventory ของเกมที่เห็นไอคอน Item
2. กด `CommandOrControl+Shift+X` Overlay ซ่อนตัว Capture window เปิดบนจอที่ Cursor อยู่
3. (Capture window) ลากกรอบรอบไอคอน Readout แสดง `64 × 64 px` ปรับ Handle ถ้าต้องการ กด Enter
4. (Main window / `CaptureItemDialog`) พิมพ์ "Pristine Leather" กด Enter
5. Toast "บันทึก Pristine Leather แล้ว" Overlay กลับมา กลับไปเกมได้ทันที (หรือกด `Ctrl+Enter` ในข้อ 4 เพื่อ Capture ชิ้นถัดไปต่อเนื่อง)

ทางที่ 2 Clipboard (เมื่อ Capture ล้มเหลว)

1. Toast "จับภาพหน้าจอไม่ได้…" ปรากฏ
2. กด Win+Shift+S เลือกบริเวณด้วย Snipping Tool ของ Windows
3. กด `CommandOrControl+Shift+V` หรือคลิก "Paste จาก Clipboard" ใน Toast
4. (`CaptureItemDialog`) ตั้งชื่อ กด Enter

ทางที่ 3 Import ไฟล์

1. (Item Library) คลิก "Item ใหม่ ▼" → "Import ไฟล์…" เลือกไฟล์
2. (`CaptureItemDialog`) ตั้งชื่อ กด Enter

ทางที่ 4 สร้างด้วยมือก่อน ใส่รูปทีหลัง

1. (Item Library) `Ctrl+N` พิมพ์ชื่อ Enter
2. (Item Library) เปิด Item นั้น → `ItemEditDialog` → ปุ่ม "Capture" / "Paste" / "Import…" ตามสะดวก

### 6.3 สร้าง Nested Recipe

ตัวอย่าง: Iron Sword ต้องใช้ Iron Ingot ×2 (ซึ่ง Craft จาก Iron Ore ×5 ต่อ 1 Ingot), Wood ×5, Leather ×3

1. (Recipes) `Ctrl+N` Pane ขวาเป็นฟอร์มว่าง โฟกัสที่ช่อง Output
2. (Recipes) พิมพ์ "Iron Ingot" ใน `ItemPicker`; ยังไม่มี Item นี้ กด Enter สร้าง Item ใหม่และตั้งเป็น Output; `output_qty` = 1
3. (Recipes) คลิก "+ เพิ่ม" พิมพ์ "Iron Ore" เลือก; ตั้ง `qty` =`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)(พิมพ์ในช่องหรือกด `+` 4 ครั้ง); `mode` เป็น `gather` อัตโนมัติเพราะ Iron Ore ไม่มี Recipe
4. (Recipes) `Ctrl+S` บันทึก Recipe "Iron Ingot" ปรากฏในรายการซ้าย
5. (Recipes) `Ctrl+N` อีกครั้ง Output = "Iron Sword" (สร้างใหม่) เพิ่ม Ingredient: Iron Ingot ×2 (`mode` = `craft` ค่าเริ่มต้น เพราะมี Recipe), Wood ×5, Leather ×3
6. (Recipes) Nested Preview แสดงต้นไม้: Iron Sword → Iron Ingot ×2 (2 runs) → Iron Ore ×10; Raw รวม Iron Ore 10, Wood 5, Leather 3 ถ้าใน Inventory มี Iron Ingot อยู่ 1 ชิ้น Preview แสดง "มี 1 → Craft 1 run → Iron Ore 5"
7. (Recipes) ถ้าต้องการให้ Iron Ingot นับเป็นของที่ต้องไปหา (ไม่ Craft เอง) คลิก `ModeToggle` เป็น `gather` Preview เปลี่ยนเป็น Iron Ingot ×2 โดยไม่ขยาย
8. (Recipes) `Ctrl+S`; ถ้ามีการวน (เช่นใส่ Iron Sword เป็น Ingredient ของ Iron Ingot) Banner แสดงเส้นทางวนและไม่บันทึก
9. (Recipes) คลิก "Track ×[1]" เพื่อให้เข้าสู่ Gathering List ทันที

### 6.4 สร้าง Quest

1. (Quest Tracker) `Ctrl+N` เปิด `QuestEditDialog` โฟกัสที่ช่องชื่อ
2. พิมพ์ "Ancient Equipment" `Tab` ไปยัง Requirements
3. `Ctrl+Enter` เพิ่มแถว พิมพ์ "Iron Ore" Enter ตั้ง `qty` 10; ทำซ้ำ Wood 5, Magic Crystal 8 (Magic Crystal ยังไม่มี → Enter สร้าง Item ใหม่)
4. Checkbox "Track ทันทีหลังบันทึก" ติ๊กอยู่ กด "บันทึก" (Enter)
5. (Quest Tracker) การ์ด Quest ปรากฏใน Tab Active พร้อม "⊙ Tracked (#n)" และ Progress "จัดสรร (allocated) 0 / 23"

### 6.5 เลือก Tracking Targets และจัดลำดับ Priority

1. (Gathering List) กด `T` หรือคลิก "เลือก Targets…" `TargetPicker` เปิดด้านขวา
2. ติ๊ก Quest A, Quest B, Craft C; ใส่ `×[1]` ให้ Craft C (Recipe)
3. ตารางด้านซ้ายอัปเดตทันทีทุกครั้งที่ติ๊ก (Requirement 3.5: "ต้องอัปเดตทันที")
4. ลาก ≡ ของ Craft C ขึ้นบนสุด หรือโฟกัสแถวแล้ว `Alt+↑` สองครั้ง ลำดับ `#` เปลี่ยนเป็น Craft C #1, Quest A #2, Quest B #3
5. ตัวเลข "จัดสรร" ใน Quest Tracker และ Overlay เปลี่ยนตามลำดับใหม่ (Craft C ได้ Iron Ore ก่อน) ส่วน Required/Owned/Missing รวมไม่เปลี่ยน
6. ติ๊ก 📌 ที่ Quest A เพื่อให้วนดูใน Overlay ได้ด้วย `]`/`[`
7. กด `Esc` ปิด `TargetPicker`

### 6.6 เก็บของด้วย Overlay

1. กด `CommandOrControl+Shift+O` Overlay ปรากฏในโหมด View ที่ตำแหน่งที่บันทึกไว้ แสดง "ทั้งหมด" เรียง Missing-first
2. เล่นเกมตามปกติ Mouse ทะลุ Overlay ได้ เก็บ Iron Ore ได้`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)ชิ้น
3. กด `CommandOrControl+Shift+M` Overlay เป็น Interactive (ขอบ Accent, Badge "INTERACTIVE")
4. คลิก `[+]` ของ Iron Ore`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)ครั้ง (Step 1) หรือเปลี่ยน Step เป็น 5 ในแอปหลักไว้ก่อนแล้วคลิกครั้งเดียว ตัวเลขเปลี่ยนเป็น `25 / 45 Missing 20` ทันที Overall Progress เป็น `33 / 68`
5. กด `Esc` (หรือ Hotkey เดิม) กลับสู่ View โฟกัสคืนเกม
6. กด `CommandOrControl+Shift+]` เพื่อดูเฉพาะ Quest A แถวแสดง "จัดสรร 10 / 10 ครบ", "จัดสรร`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)/ 5 ครบ"
7. เมื่อ Iron Ore ครบ 45 แถวย้ายไปท้ายสุด (หรือหายถ้า "ซ่อนที่ครบแล้ว" เปิด) ข้อมูลเดียวกันปรากฏใน Gathering List ของ Main window

### 6.7 Consume Materials หลังส่ง Quest หรือ Craft

1. ส่ง Quest ในเกมเสร็จแล้ว Alt+Tab มาที่ Main window (หรือใช้ Overlay Interactive ไม่ได้ เพราะ Consume ทำได้เฉพาะในแอปหลัก)
2. (Quest Tracker) ขยายการ์ด "Ancient Equipment" คลิก "Consume materials"
3. (`ConsumeMaterialsDialog`) ตรวจรายการ `Iron Ore 45 → 35 (−10)`, `Wood 15 → 10 (−5)`, `Magic Crystal 8 → 0 (−8)` ไม่มีแถว "ไม่พอ" ปุ่มยืนยัน Enabled คลิกหรือ `Tab` ไปที่ปุ่มแล้วกดยืนยัน (`Enter` ไม่ใช่ปุ่ม Default ตาม F8-R12) ตัวเลือก "ตั้งสถานะ Quest เป็น Completed ด้วย" ติ๊กอยู่เป็นค่าเริ่มต้น
4. Inventory ลดใน 1 Transaction; `gathering:changed` อัปเดต Gathering List และ Overlay; Toast "หักวัตถุดิบของ Ancient Equipment แล้ว"
5. (Quest Tracker) ถ้าไม่ได้ติ๊กตัวเลือก Completed ในขั้น 3 ให้คลิก "ทำเสร็จแล้ว" สถานะเป็น `completed` การ์ดย้ายไปส่วน Completed และไม่ถูกนับใน Gathering List อีก (แถว `tracking_target` ยังอยู่ตาม F4-R5; Inventory ไม่เปลี่ยนจากปุ่มนี้)
6. สำหรับ Recipe: (Recipes หรือ Gathering List → Craft Plan) คลิก "Craft" → Dialog เดียวกันในโหมด Craft แสดงบรรทัดเพิ่ม "+ Iron Sword 0 → 1" ยืนยันแล้วหักวัตถุดิบและเพิ่ม Output ใน Transaction เดียว
7. ถ้าวัตถุดิบใดไม่พอ ปุ่มยืนยัน Disabled พร้อมข้อความ "ระบบจะไม่หักรายการใดเลย" ผู้ใช้ปิด Dialog ไปปรับ Owned ให้ตรงความจริงก่อน

### 6.8 Backup และ Restore

Backup

1. (Settings → Backup & Data) คลิก "Export Backup (.zip)…"
2. Save Dialog ของ Windows เสนอชื่อ `gamelooter-backup-2026-10-08.zip` เลือกที่เก็บ
3. ปุ่มทั้งหน้า Disabled ระหว่างสร้างไฟล์ ข้อความ "กำลังสร้าง Backup…" แล้วเปลี่ยนเป็น "Backup ล่าสุด: 2026-10-08 21:10 (4.2 MB)" Toast "Export เสร็จแล้ว" พร้อมปุ่ม "เปิดโฟลเดอร์"

Restore

1. (Settings → Backup & Data) คลิก "Import / Restore…" เลือกไฟล์ `.zip`
2. (`ConfirmDialog`) แสดงข้อมูลจาก `manifest.json` (`appVersion`, `schemaVersion`, `exportedAt`, จำนวน Profile) และข้อความ "ข้อมูลปัจจุบันจะถูกสำรองไว้ที่ <path> ก่อนแทนที่"; ถ้า `schemaVersion` ใหม่กว่าแอป ปุ่มยืนยัน Disabled พร้อมเหตุผล
3. กด "Restore" ระบบตรวจสอบ → แตกไฟล์ → Migrate → สลับ (Atomic) ระหว่างนี้ Sidebar และ Overlay Disabled
4. เสร็จแล้วแอปโหลดข้อมูลใหม่ทั้งหมด (`profile:changed`) Game Dashboard แสดง Profile จาก Backup Toast "Restore เสร็จแล้ว (3 Profiles)"
5. ถ้าล้มเหลวระหว่างทาง ข้อมูลเดิมยังอยู่ (ไม่ถูกแตะ) Banner สี `missing` อธิบายสาเหตุ

### 6.9 สลับ Game Profile

1. (ทุกหน้าจอ) คลิก `ProfileSwitcher` ใน Title Bar หรือกด `Ctrl+P`
2. เลือก "Valheim" (`↑↓` + Enter ได้)
3. Main บันทึก `active_profile_id` และ `last_opened_at` แล้วส่ง `profile:changed`; ทุกหน้าจอโหลดข้อมูลของ Profile ใหม่; Route ปัจจุบันคงเดิม (ถ้าอยู่ `#/recipes?id=3` และ id นั้นไม่อยู่ใน Profile ใหม่ ให้ล้าง Query)
4. Overlay (ถ้าเปิดอยู่) เปลี่ยนรายการเป็นของ Valheim และกลับมามุมมอง "ทั้งหมด"
5. ทางเลือก: (Game Dashboard) คลิกการ์ด Profile ได้ผลเดียวกัน

---

## 7. Component Inventory (Vue)

ชื่อ Component ทุกตัวเป็น PascalCase หลายคำ (ตามกฎ `vue/multi-word-component-names` ที่เปิดใช้ใน `eslint.config.mjs`) วางใน `src/components/` (ใช้ร่วม), `src/views/` (หน้าจอตาม Route), `src/overlay/` และ `src/capture/` (Entry แยก) Props สรุปเฉพาะที่กำหนดพฤติกรรม Type จริงนิยามใน `electron/ipc/contracts.ts` และนำมาใช้ซ้ำใน Renderer

### 7.1 App Shell และ Navigation

| Component | หน้าที่ | Props / Emits หลัก |
|---|---|---|
| `AppShell` | Grid `title`/`sidebar`/`desktop`, Live Region, `ToastStack` | – |
| `AppTitleBar` | Drag Region, โลโก้, `ProfileSwitcher`, ปุ่ม Capture/Overlay | `overlayVisible: boolean`; emits `toggle-overlay`, `capture` |
| `AppSidebar` | รายการ 6 หน้าจอ, Badge จำนวนที่ขาด, ปุ่มยุบ | `collapsed: boolean`, `missingCount: number`, `profileReady: boolean`; emits `update:collapsed` |
| `ProfileSwitcher` | Dropdown เลือก/สร้าง/จัดการ Profile | `profiles: GameProfile[]`, `activeId: number \| null`; emits `switch(id)`, `create`, `manage` |
| `EmptyState` | ข้อความ + ปุ่มสำหรับสถานะว่าง | `icon`, `title`, `description?`, `actions: { label, shortcut?, onClick }[]` |
| `BaseDialog` | ครอบ `<dialog>` Modal, จัดการโฟกัส, `Esc` | `open: boolean`, `title`, `size: 'sm' \| 'md' \| 'lg'`; emits `close` |
| `ConfirmDialog` | ยืนยัน Action ทำลายข้อมูล | `title`, `message`, `details?: string[]`, `confirmLabel`, `danger: boolean`, `requireText?: string`; emits `confirm`, `cancel` |
| `ToastStack` / `useToast()` | แจ้งผลลัพธ์ | `{ kind: 'info' \| 'ok' \| 'warning' \| 'error', message, action?: { label, onClick }, sticky?: boolean }` |
| `SearchField` | ช่องค้นหาพร้อม `/` Focus และปุ่มล้าง | `modelValue: string`, `placeholder`; emits `update:modelValue` |
| `CategoryFilter` | Chip หมวดหมู่`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)ค่า + ทั้งหมด | `modelValue: ItemCategory \| null`, `counts?: Record<ItemCategory, number>` |
| `StepSelector` | Segmented 1/5/10 | `modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)\| 5 \| 10` (ค่าใน `preferences.step`) |
| `AppIcon` | ไอคอน SVG Inline | `name: IconName`, `size: 16 \| 20 \| 24` |

### 7.2 Item และจำนวน

| Component | หน้าที่ | Props / Emits หลัก |
|---|---|---|
| `ItemThumbnail` | รูป Item ขนาดคงที่ + Placeholder + สถานะไฟล์หาย | `src: string \| null` (Path สัมพัทธ์จาก `thumbnail_path`), `name: string`, `size: 24 \| 32 \| 40 \| 64`, `missingFile?: boolean` |
| `QuantityStepper` | ปุ่ม `−` ตัวเลข `+` พร้อมช่องพิมพ์ | `modelValue: number`, `step: number`, `min: number = 0`, `max?: number`, `size: 'sm' \| 'md' \| 'lg'`, `readonly?: boolean`, `showStep?: boolean`; emits `adjust(delta)`, `set(value)` |
| `ProgressBar` | แถบความคืบหน้า + ARIA | `value: number`, `max: number`, `status: StatusRole`, `height: 4 \| 6 \| 8`, `label?: string` |
| `StatusBadge` | จุดสี + ข้อความ/ตัวเลข | `status: StatusRole`, `text: string` |
| `ItemCard` | การ์ดใน Item Library | `item: Item`, `owned: number`, `hasRecipe: boolean`, `step: number`; emits `open`, `adjust(delta)`, `set(value)`, `toggle-pin` |
| `ItemPicker` | ค้นหา/เลือก Item และสร้างใหม่ทันที | `items: Item[]`, `exclude?: number[]`, `allowCreate: boolean`, `placeholder`; emits `select(item)`, `create(name)` |
| `ItemEditDialog` | ฟอร์ม Item + ปุ่มรูป 3 ทาง + "ใช้ใน" | `item: Item \| null` (null = สร้างใหม่), `usages: { recipes, quests }`; emits `save(input)`, `delete`, `capture`, `paste`, `import-file` |
| `ModeToggle` | สวิตช์ `craft` / `gather` | `modelValue: 'craft' \| 'gather'`, `hasRecipe: boolean` (false → บังคับ `gather` + Disabled) |

### 7.3 Recipe, Quest และ Tracking

| Component | หน้าที่ | Props / Emits หลัก |
|---|---|---|
| `MaterialRow` | แถว Item + Required/Owned/Missing/Progress ใช้ใน Gathering, Quest, Dashboard, Ingredient | `item: Item`, `required: number`, `owned: number`, `missing: number`, `status: StatusRole`, `variant: 'gathering' \| 'allocated' \| 'ingredient' \| 'readonly'`, `mode?: 'craft' \| 'gather'`, `step?: number`, `pinned?: boolean`, `draggable?: boolean`; emits `adjust`, `set`, `toggle-pin`, `update:mode`, `remove` |
| `IngredientList` | รายการ `MaterialRow` แบบ `ingredient` + ปุ่มเพิ่ม + ลากจัดลำดับ | `modelValue: { itemId, qty, mode, sortOrder }[]`, `items: Item[]`, `errorItemIds?: number[]` (จาก Cycle); emits `update:modelValue` |
| `RecipeListPane` | รายการ Recipe ซ้าย | `recipes`, `selectedId`, `trackedIds: number[]`; emits `select`, `create` |
| `RecipeEditor` | ฟอร์ม Recipe ทั้ง Pane ขวา | `recipe: Recipe \| null`, `items`, `dirty: boolean`; emits `save`, `delete`, `track(qty)`, `craft` |
| `RecipePreviewTree` | ต้นไม้ขยายถึง Raw + สรุป Raw รวม | `preview: ExpandedTree` (ผลจาก Main), `runs: number`; emits `update:runs` |
| `CycleErrorBanner` | แสดงเส้นทางวน | `path: string[]` |
| `QuestCard` | การ์ด Quest ขยายได้ + Progress จัดสรร | `quest: Quest`, `tracked: TrackingTarget \| null`, `allocation?: AllocationRow[]`, `expanded: boolean`; emits `toggle`, `edit`, `track`, `consume`, `complete`, `delete` |
| `QuestEditDialog` | ฟอร์ม Quest + Requirements | `quest: Quest \| null`, `items`; emits `save(input, trackNow)` |
| `ConsumeMaterialsDialog` | ตาราง before → after + Shortfall | `title`, `lines: { item, before, delta, after }[]`, `output?: { item, delta }` (โหมด Craft), `runs?: number`; emits `confirm`, `update:runs` |
| `TargetPicker` | Side Panel เลือก/จัดลำดับ Target | `targets: TrackingTarget[]`, `quests`, `recipes`; emits `toggle(kind, id)`, `reorder(ids)`, `set-qty(id, qty)`, `toggle-pin(id)` |
| `TargetChip` | Chip Target บน Gathering Toolbar | `target`, `index` |
| `GatheringTable` | ตารางหลัก + แถวสรุป "ครบแล้ว N" + Virtual Scrolling | `rows: GatheringRow[]`, `step`, `hideComplete`, `sort`, `query`; emits `adjust`, `set`, `toggle-pin` |
| `CraftPlanSection` | Section ยุบได้ของ Intermediate | `plan: CraftPlanRow[]`, `collapsed`; emits `craft(recipeId)` |
| `OverallProgress` | Footer ตัวเลข + Bar | `owned: number`, `required: number`, `missingItems: number`, `label?: string` ("Overall Progress" หรือ "จัดสรร") |
| `TargetSummaryList` | รายการ Target บน Dashboard | `targets`, `allocations` |
| `ProfileCard` | การ์ด Profile | `profile`, `active: boolean`, `stats: { items, targets, progress }`; emits `select`, `rename`, `delete` |

### 7.4 Settings

| Component | หน้าที่ | Props / Emits หลัก |
|---|---|---|
| `SettingsNav` / `SettingsSection` | โครงหน้า Settings | `section: 'hotkeys' \| 'overlay' \| 'backup' \| 'profiles' \| 'about'` |
| `HotkeyRecorder` | บันทึกคีย์ผสมเป็น Accelerator | `modelValue: string`, `status: 'ok' \| 'failed' \| 'unset'`, `conflict?: string`; emits `update:modelValue`, `clear` |
| `OpacitySlider` | `<input type="range">` 20–100 + ตัวเลข | `modelValue: number` (0.2–1.0) |
| `BackupPanel` | ปุ่ม Export/Import + สถานะ | `lastBackup?: { at, size }`, `busy: boolean`, `dataPath: string`; emits `export`, `import` |
| `ProfileTable` | ตาราง Profile ใน Settings | `profiles`, `activeId`, `stats`; emits `rename`, `set-icon`, `activate`, `delete` |

### 7.5 Overlay และ Capture (Entry แยก)

| Component | หน้าที่ | Props / Emits หลัก |
|---|---|---|
| `OverlayPanel` | Root ของ `overlay.html`: Header, รายการ, Footer, Grip | `mode: 'view' \| 'interactive'`, `compact: boolean`, `rows`, `view: 'all' \| { targetId }`, `overall` |
| `OverlayHeader` | ชื่อ, `‹ ›`, Badge โหมด, Drag Region | `title`, `canCycle: boolean`, `mode`; emits `prev`, `next` |
| `OverlayRow` | แถว Full/Compact + ปุ่ม `−`/`+` | `row: GatheringRow \| AllocationRow`, `compact`, `interactive`, `step`, `pinned` |
| `OverlayResizeGrip` | Grip มุมขวาล่าง | emits `resize(width, height)` |
| `CaptureSelection` | Root ของ `capture.html`: ภาพพื้นหลัง, Crosshair, กรอบ, Handle, Readout, Hint | `screenshot: string` (Data URL/Blob URL), `scaleFactor: number`; emits `confirm(rect)`, `cancel` |
| `CaptureItemDialog` | Dialog ตั้งชื่อ/ผูก Item | `image: { previewUrl, width, height }`, `items`, `source: 'capture' \| 'clipboard' \| 'file'`, `attachTo?: number`; emits `save(input)`, `save-and-continue(input)`, `cancel` |

---

## 8. Visual System

### 8.1 Tailwind 4 Tokens ใน `src/index.css`

Tailwind CSS 4.3.3 ใช้การตั้งค่าแบบ CSS-first (`@import 'tailwindcss'` ใน `src/index.css` มีอยู่แล้ว) Token ทั้งหมดนิยามในบล็อก `@theme` เพื่อให้ได้ทั้ง Utility (`bg-surface-1`, `text-status-missing`) และตัวแปร CSS (`var(--color-surface-1)`) สำหรับ `overlay.html` และ `capture.html` ที่นำเข้าไฟล์เดียวกัน

```css
@import './fonts.css';
@import 'tailwindcss';

@theme {
  /* Typography (ดู 8.3) */
  --font-sans: 'Open Sans', 'Leelawadee UI', 'Segoe UI', system-ui, sans-serif;
  --font-numeric: 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif;
  --text-caption: 12px;
  --text-body: 14px;
  --text-number: 16px;
  --text-heading: 18px;
  --text-overlay-number: 18px;

  /* Surfaces (Dark เป็นค่าเริ่มต้น) */
  --color-surface-0: #0f1115; /* พื้นหน้าต่าง */
  --color-surface-1: #171a21; /* Sidebar, Title Bar, Panel */
  --color-surface-2: #1f232c; /* การ์ด, แถว, Input */
  --color-surface-3: #2a2f3a; /* Hover, Selected */
  --color-border: #2f3542;
  --color-text: #e8eaf0;
  --color-text-muted: #9aa3b2;
  --color-text-inverse: #0f1115;

  /* Accent (คง Teal จาก titleBarOverlay.symbolColor #0f766e ที่ใช้อยู่) */
  --color-accent: #0f766e;
  --color-accent-hover: #115e59;
  --color-accent-text: #5eead4;
  --color-focus: #2dd4bf;

  /* Status roles (ดู 8.2) */
  --color-status-ok: #22c55e;
  --color-status-warning: #f59e0b;
  --color-status-missing: #ef4444;
  --color-status-neutral: #6b7280;
  --color-status-ok-overlay: #4ade80;
  --color-status-warning-overlay: #fbbf24;
  --color-status-missing-overlay: #f87171;

  /* Overlay */
  --color-overlay-bg: #0b0d12;
  --color-overlay-border: #2dd4bf;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-overlay: 8px;

  /* Component sizes */
  --size-row: 40px;          /* แถวตารางใน Main window */
  --size-row-card: 72px;     /* การ์ด Item (Thumbnail 64 + Padding) */
  --size-row-overlay: 56px;  /* Overlay Full */
  --size-row-compact: 32px;  /* Overlay Compact */
  --size-hit: 32px;          /* Hit Target ต่ำสุดใน Main window */
  --size-hit-overlay: 28px;  /* Hit Target ต่ำสุดใน Overlay Interactive */
  --size-thumb: 64px;
}

:root {
  color-scheme: dark;
  font-family: var(--font-sans);
  font-size: var(--text-body);
  background: var(--color-surface-0);
  color: var(--color-text);
}
```

- Spacing ใช้มาตราส่วนเริ่มต้นของ Tailwind 4 (`--spacing: 0.25rem`) ไม่นิยามใหม่ ค่าที่ใช้ซ้ำ: Gutter 16 px (`p-4`), ช่องว่างระหว่างแถว 8 px (`gap-2`), ระหว่าง Section 24 px (`gap-6`), ระหว่างปุ่มในกลุ่ม 8 px
- `:root { font-size: 0.85rem }` ที่มีอยู่ใน `src/index.css` ต้องถูกแทนด้วย `font-size: 14px` ข้างต้น มิฉะนั้น Utility `text-sm`/`text-base` ของ Tailwind จะเล็กกว่าที่ออกแบบ (0.85 × 14 ≈ 11.9 px)
- Light Theme (หลัง Phase 5): นิยาม Token ชุดเดียวกันใต้ `:root[data-theme="light"]` และใช้ `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` แทน `prefers-color-scheme` เพราะ Theme เป็นค่าใน `app_setting.preferences.theme` ไม่ใช่ของ OS; ไม่ต้องทำใน Phase 1–4 แต่ห้ามเขียนสี Hard-code ใน Component เพื่อให้เพิ่มได้ภายหลัง
- `titleBarOverlay.color` ใน `electron/main.ts` ต้องเปลี่ยนจาก `#1f2937` เป็นค่าเดียวกับ `--color-surface-1` (`#171a21`) และ `symbolColor` เป็น `--color-text` (`#e8eaf0`) เพื่อให้ปุ่ม Windows กลมกลืนกับ Title Bar

### 8.2 Status Roles

| Role | ความหมายในรายการ Gather | เงื่อนไข | ใช้กับ | สี (Main / Overlay) |
|---|---|---|---|---|
| `ok` | ครบแล้ว | `missing = 0` และ `required > 0` | จุดสถานะ, `ProgressBar` เต็ม, ข้อความ "ครบ", ปุ่มยืนยัน Consume | `#22c55e` / `#4ade80` |
| `warning` | มีบางส่วน | `0 < owned < required` | จุดสถานะ, `ProgressBar` บางส่วน, Toast เตือน, ไฟล์รูปหาย, Hotkey ล้มเหลว | `#f59e0b` / `#fbbf24` |
| `missing` | ยังไม่มีเลย | `owned = 0` และ `required > 0` | จุดสถานะ, ตัวเลข Missing, Banner Error, ปุ่มลบ/ยืนยันทำลาย | `#ef4444` / `#f87171` |
| `neutral` | ไม่ได้ติดตาม / ไม่มีความต้องการ | `required = 0` หรือ Item ที่ไม่อยู่ใน Target | Badge หมวดหมู่, Owned ใน Item Library, Badge "VIEW" | `#6b7280` / – |

- `ProgressBar` ใช้สี Role เดียวกับแถว ความยาว = `min(owned, required) / required`
- Craft Plan ใช้เงื่อนไขเดียวกันกับ Required/Owned ของ Intermediate Item
- สีไม่เคยเป็นสัญญาณเดียว: ทุก Role มีตัวเลข (`Missing 25`) หรือข้อความ (`ครบ`) กำกับ และ `StatusBadge` มีรูปร่างจุดเท่ากันทุก Role (ไม่ใช้รูปร่างต่างกันเพื่อลดความรก; ข้อความเป็นตัวแยก)

### 8.3 Typography

ฟอนต์ที่ Bundle อยู่ใน `public/fonts/*.woff2` และประกาศใน `src/fonts.css` (54 กฎ `@font-face`) แต่ยังไม่มี `font-family` ใดถูกใช้ (Repository Audit Report)

| ฟอนต์ | น้ำหนักที่มี | Subset ที่มี | ข้อเสนอ |
|---|---|---|---|
| Open Sans | 400, 500, 700 | latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext, hebrew, vietnamese | **UI Font หลัก** (`--font-sans`) เพราะมี 3 น้ำหนักให้ใช้ Body 400 / Label 500 / Heading 700 และ Subset ครบที่สุด |
| Roboto | 400, 700 | latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext, vietnamese | **ตัวเลข** (`--font-numeric`) ใช้กับ Required/Owned/Missing, Overall Progress, Readout ของ Capture ด้วย `font-variant-numeric: tabular-nums` ให้คอลัมน์ตัวเลขตรงกัน |
| Mulish | 400, 700 | latin, latin-ext, cyrillic, cyrillic-ext, vietnamese | ไม่ใช้ |
| Poppins | 400, 700 | latin, latin-ext, devanagari | ไม่ใช้ |

- ไม่มีฟอนต์ใดมี Subset ภาษาไทย ข้อความภาษาไทยใน UI จึงตกไปที่ฟอนต์ของ Windows ตามลำดับใน `--font-sans` (`Leelawadee UI` บน Windows 10/11) ต้องตรวจสอบว่าข้อความ UI ของแอปจะเป็นภาษาไทย อังกฤษ หรือทั้งสอง ก่อนเริ่ม Phase 1 เพราะมีผลต่อการเลือก Bundle ฟอนต์ไทยเพิ่ม; เอกสารนี้ใช้ป้ายภาษาไทยเป็นตัวอย่าง
- ต้องตรวจสอบว่าไฟล์ Subset ของ Roboto และ Open Sans ที่ Bundle อยู่ยังคง OpenType Feature `tnum` ไว้ (ไฟล์จาก Google Fonts ปกติคงไว้) ถ้าไม่ ให้ใช้ Open Sans กับ `tabular-nums` ตัวเดียวและตัด Roboto
- เมื่อตัดสินใจใช้ 2 ตระกูลแล้ว กฎ `@font-face` ของ Mulish และ Poppins (16 กฎ, 16 ไฟล์) ควรถูกลบออกจาก `src/fonts.css` และ `public/fonts/` ใน Phase`modelValue: number` (ตัวเลือกจาก `preferences.stepSizes`; ขั้นที่เลือกไม่ถูกบันทึก)(Packaging Polish) เพื่อลดขนาด Package
- ขนาด: Caption 12 px, Body 14 px, ตัวเลขในตาราง 16 px/700, Heading 18 px/700, Overlay Full ตัวเลข 18 px/700, Overlay Compact ตัวเลข 14 px/700 บรรทัด (Line-height) 1.4 สำหรับ Body และ 1.0 สำหรับตัวเลขเดี่ยว
- `font-synthesis: none`, `text-rendering: optimizeLegibility` และ `-webkit-font-smoothing: antialiased` ที่มีอยู่ใน `src/index.css` คงไว้

### 8.4 ไอคอน

- ใช้ SVG Inline ผ่าน `AppIcon` โดยเก็บ Path ของไอคอนที่ต้องใช้ (ประมาณ 24 ตัว: Dashboard, Items, Recipes, Quests, Gathering, Settings, Capture, Overlay, Pin, Search, Plus, Minus, Edit, Delete, Drag, Chevron ×4, Check, Warning, Error, Info, Close, External) ใน `src/icons/index.ts` เป็น String ไม่ใช้ Icon Font และไม่โหลดจากเครือข่าย (แอปต้อง Offline)
- แหล่งไอคอนต้องเป็น License ที่อนุญาตให้ฝัง เช่น Lucide (ISC) ต้องตรวจสอบ License และเวอร์ชันตอนเลือกจริง
- ใช้ `fill="none" stroke="currentColor" stroke-width="2"` ขนาด 16 px ในแถว, 20 px ในปุ่ม, 24 px ใน Sidebar เพื่อสืบทอดสีจากข้อความ
- ไอคอนของแอป (`public/looter.ico` 128×128) ต้องสร้างใหม่ที่ ≥ 256×256 ก่อนปล่อย (Owner Decision 10) ไอคอน Profile (`game_profile.icon_path`) ให้ผู้ใช้เลือกไฟล์เอง แสดงที่ 24 px ใน `ProfileSwitcher` และ 48 px ใน `ProfileCard`

### 8.5 Thumbnail

| ที่ใช้ | ขนาดแสดง (CSS px) | แหล่งไฟล์ |
|---|---|---|
| `ItemCard`, `ItemEditDialog`, `CaptureItemDialog` (Preview Thumb) | 64 | `thumbnail_path` (64×64 PNG) |
| ตารางทุกตาราง, `IngredientList`, `QuestCard`, Dashboard | 40 | `thumbnail_path` ย่อด้วย CSS |
| Overlay Full | 32 | `thumbnail_path` |
| Overlay Compact, `ItemPicker`, `ProfileSwitcher` | 24 | `thumbnail_path` |
| Preview ต้นฉบับใน Dialog | ขนาดจริงถึง 256 | `image_path` |

- `object-fit: contain` บนพื้น `--color-surface-2` Radius `--radius-sm` เพื่อให้ไอคอนที่ไม่ใช่สี่เหลี่ยมจัตุรัสไม่ถูกตัด
- Placeholder: สี่เหลี่ยมพื้น `--color-surface-3` + ตัวอักษรแรกของชื่อ 700 สี `--color-text-muted`
- Renderer เข้าถึงไฟล์ผ่าน URL ที่ Main จัดให้ (Custom Protocol หรือ `file://` ภายใต้ `<userData>\data`) รายละเอียดอยู่ใน Architecture Proposal; Component รับเป็น `src` ที่พร้อมใช้ และต้องใส่ Cache-busting Query (`?v=updated_at`) เมื่อรูปถูกแทนที่

---

## 9. Accessibility และ Input

### 9.1 โฟกัสและลำดับ Tab

- ลำดับ Tab ของ Main window: Title Bar (ProfileSwitcher → Capture → Overlay) → Sidebar → Toolbar ของหน้าจอ → รายการ/ตาราง (1 Tab Stop ต่อรายการ, Roving Tabindex ภายใน) → Side Panel (`TargetPicker`) → Footer
- `body :focus-visible { outline: none !important }` ที่มีอยู่ใน `src/index.css` ต้องถูกลบ และแทนด้วย `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px }` การซ่อน Focus Ring ขัดกับ Requirement 4 ข้อ "รองรับ Keyboard"
- `user-select: none` บน `:root` คงไว้สำหรับ UI แต่ `input`, `textarea` และ Notes ต้องตั้ง `user-select: text`
- Dialog: โฟกัสเริ่มที่ Field แรก (ไม่ใช่ปุ่มปิด) ปิดแล้วคืนโฟกัสให้ปุ่มที่เปิด
- การเปลี่ยน Route ย้ายโฟกัสไปที่ `<h1>` ของหน้าจอใหม่ (`tabindex="-1"`) เพื่อให้ Screen Reader อ่านชื่อหน้า

### 9.2 `+`/`−` และการแก้ตัวเลขด้วย Keyboard

- `QuantityStepper` เป็น `role="group"` ที่มี `aria-label="จำนวน Iron Ore"` ปุ่ม `−`/`+` เป็น `<button>` ที่มี `aria-label="ลด 5"` / `"เพิ่ม 5"` ตาม Step ปัจจุบัน
- ช่องตัวเลขเป็น `<input type="number" inputmode="numeric" min="0">`; `↑`/`↓` ภายในช่องปรับทีละ Step (Browser Default คือ 1 จึงต้องกำหนด `step` Attribute ให้ตรง); `Enter` ยืนยัน; `Esc` คืนค่าเดิมและ Blur
- บนแถวที่โฟกัส (ไม่ได้อยู่ในช่องพิมพ์) `+`/`=` และ `−` ปรับตาม Step; `Shift` + `+`/`−` ปรับทีละ 10; `Enter` เข้าช่องตัวเลขพร้อมเลือกทั้งหมด
- ค่าต่ำกว่า 0 ถูกปฏิเสธที่ Renderer ก่อน (ปุ่ม `−` Disabled เมื่อ `owned < step` และข้อความ `aria-disabled`) และ Main ปฏิเสธซ้ำ (`CHECK (owned >= 0)`)

### 9.3 ARIA สำหรับการอัปเดตแบบ Live

- `AppShell` มี 1 `<div aria-live="polite" class="sr-only">` ประกาศหลังการปรับจำนวน: "Iron Ore 25 จาก 45 ขาด 20" และหลัง Consume/Craft: "หักวัตถุดิบของ Ancient Equipment แล้ว" ข้อความถูก Debounce 300 ms ต่อ Item เพื่อไม่ประกาศซ้ำทุก Click
- Toast ข้อผิดพลาดใช้ `role="alert"` (Assertive) Toast ปกติใช้ `role="status"`
- `ProgressBar` เป็น `role="progressbar"` พร้อม `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax` และ `aria-label` ที่มีชื่อ Item หรือ "Overall Progress"
- ตาราง Gathering เป็น `role="grid"` คอลัมน์มี `aria-sort` บน Header ที่เรียงอยู่
- Overlay มี Live Region ของตัวเองแต่ประกาศเฉพาะใน Interactive (ใน View หน้าต่างไม่โฟกัส)
- `CycleErrorBanner` และ Banner ใน Dialog ใช้ `role="alert"`

### 9.4 Hit Target และ Contrast

| บริบท | ขนาดต่ำสุด | ระยะห่างระหว่างปุ่ม |
|---|---|---|
| Main window ปุ่มไอคอน, `−`/`+` ในตาราง | 32 × 32 px (`--size-hit`) | 8 px |
| Main window Checkbox/Chip | 24 px สูง, พื้นที่คลิกขยายเป็น 32 px ด้วย Padding | 8 px |
| Overlay Interactive (Full และ Compact) | 28 × 28 px (`--size-hit-overlay`) | 8 px ระหว่าง `−` และ `+` เพื่อไม่กดผิดระหว่างเล่นเกม |
| Overlay Resize Grip | 16 × 16 px มองเห็น, พื้นที่จับ 24 × 24 px | – |
| Capture Handle | 10 × 10 px มองเห็น, พื้นที่จับ 20 × 20 px | – |

- Contrast ข้อความบนพื้น ≥ 4.5:1 (Body) และ ≥ 3:1 (ตัวเลขขนาด ≥ 18 px/700 และไอคอน) ตรวจคู่สีของ Token ใน §8.1 ก่อนใช้จริง (`#e8eaf0` บน `#0f1115` ≈ 15:1, `#9aa3b2` บน `#1f232c` ≈ 6:1, `#f59e0b` บน `#0f1115` ≈ 9:1)
- Overlay ที่ Opacity ต่ำ Contrast จะลดลงตามสัดส่วนที่ขึ้นกับฉากเกม จึงกำหนด `text-shadow` และช่วงที่อนุญาตใน §4.4
- ไม่พึ่ง Hover: ทุก Action ที่ปรากฏเมื่อ Hover (เมนู `⋯`, ปุ่มยืนยันใต้กรอบ Capture) ต้องปรากฏเมื่อโฟกัสด้วย Keyboard ด้วย

---

## 10. Responsiveness และ High-DPI

### 10.1 Main window

| รายการ | ค่า |
|---|---|
| ขนาดเริ่มต้น | 1160 × 725 px (ค่าที่ Scaffold เดิมตั้งใจใช้ใน `electron/settings/index.js` นำมาใช้ต่อ) |
| ขนาดต่ำสุด (`minWidth`/`minHeight`) | 960 × 600 px ให้ Gathering Table แสดงครบ 7 คอลัมน์โดย Sidebar ยุบ |
| Sidebar | ยุบอัตโนมัติเมื่อกว้าง < 1100 px; ผู้ใช้ยุบเองได้ทุกขนาด |
| Recipes | Pane ซ้าย 300 px คงที่; Pane ขวาต้อง ≥ 560 px; ถ้าไม่พอ (หน้าต่าง < 1100 และ Sidebar ไม่ยุบ) Sidebar ยุบก่อน |
| `TargetPicker` | 360 px ทับเนื้อหาจากขอบขวา (Overlay Panel ไม่ดันตาราง) |
| Dialog | กว้างสูงสุด 560 px, สูงสุด 85 % ของหน้าต่าง เลื่อนภายใน |
| Bounds | บันทึกลง `app_setting.window` หลังย้าย/ปรับขนาด/Maximize (Debounce 200 ms ตาม F12-R3 แทน `onWindowPositionEvent` เดิมที่ `console.log` อย่างเดียว) และ Clamp เข้าจอที่มีอยู่ตอนเปิด |
| `titleBarOverlay.height` | 40 px ให้ตรง `h-10` และ `env(titlebar-area-height)` |

ไม่มี Breakpoint แบบ Mobile เพราะเป็น Desktop เท่านั้น Utility `max-w-(--breakpoint-xl)` ที่ `src/App.vue` ใช้อยู่ให้คงไว้สำหรับจำกัดความกว้างของ Title Bar เท่านั้น ไม่ใช้กับเนื้อหา

### 10.2 Overlay

| รายการ | Full | Compact |
|---|---|---|
| ขนาดเริ่มต้น | 320 × 420 px | 280 × 240 px |
| ต่ำสุด | 220 × 160 px (ค่าเดียวทั้งสองแบบ ตาม F9-R5 และ `minWidth`/`minHeight` ใน Architecture Proposal §8.1) | 220 × 160 px |
| สูงสุด | Work Area ของจอที่หน้าต่างอยู่ (ไม่ให้ Overlay ใหญ่กว่าจอ) | เท่ากัน |
| ตำแหน่งเริ่มต้น | มุมขวาบนของจอหลัก ห่างขอบ 16 px | เท่ากัน |
| Bounds | เก็บค่าเดียวใน `app_setting.overlay.bounds` ตาม Data Model การสลับ Full/Compact ไม่เปลี่ยน Bounds (ผู้ใช้ปรับขนาดเองได้); ขนาดเริ่มต้นของแต่ละแบบใช้เมื่อ `bounds = null` หรือกดรีเซ็ต | |

### 10.3 High-DPI และหลายจอ

- Electron ให้ Renderer ทำงานเป็น DIP (CSS px) อยู่แล้ว ขนาดใน §8 และ §10 ทั้งหมดเป็น CSS px ซึ่ง Windows ขยายตาม Scale (100/125/150/175/200 %) โดยอัตโนมัติ ไม่ต้องคำนวณใน Renderer
- ภาพ Crop ต้นฉบับถูกเก็บเป็น Device Pixel (ตัดจาก Screenshot ที่ขนาดจอ × `scaleFactor`) เมื่อแสดงใน Dialog ให้กำหนด `width = naturalWidth / scaleFactorตอนถ่าย` เพื่อให้คมที่ 1:1; Thumbnail 64×64 ที่ 150–200 % จะถูกขยายโดย Browser และนุ่มลงเล็กน้อย ยอมรับใน Phase 2–4 ส่วนการเพิ่ม Thumbnail 128 px สำหรับ High-DPI ต้องตรวจสอบกับ Data Model ก่อนใส่ใน Roadmap
- `ItemThumbnail` ตั้ง `image-rendering: auto` (ไม่ใช้ `pixelated` เพราะไอคอนเกมส่วนใหญ่เป็นภาพลดทอน)
- จอหลายจอที่ Scale ต่างกัน: Capture window เปิดต่อจอด้วย Bounds และ `scaleFactor` ของจอนั้น (Architecture Proposal) Overlay ย้ายข้ามจอได้ Chromium จะปรับ DPI ของหน้าต่างเองเมื่อข้ามจอ; ขนาดใน `app_setting.overlay.bounds` เป็น DIP จึงคงที่
- Windows Text Scaling (Settings → Accessibility → Text size) มีผลเหมือน Scale ปกติใน Chromium; ไม่ต้องรองรับเพิ่ม
- Windows 10 vs 11: Windows 11 ปัดมุมหน้าต่างปกติ แต่ Transparent Frameless Window ไม่ถูกปัดมุม Overlay จึงกำหนด Radius 8 px ด้วย CSS เอง (§4.4) ให้เหมือนกันทั้งสองรุ่น ต้องตรวจสอบพฤติกรรมจริงของเงาและมุมบน Windows 11 ใน Phase 3
- ตารางทดสอบการแสดงผล (Phase 5, Compatibility Verification): Windows 10 22H2 และ Windows 11 ที่ 100 %, 125 %, 150 %, 200 %; จอคู่ที่ Scale ต่างกัน; Overlay บนเกม Borderless Windowed 1080p และ 1440p ดู Acceptance Criteria สำหรับเกณฑ์ผ่าน

---

## 11. สิ่งที่ต้องตรวจสอบก่อน Implementation

| หัวข้อ | สิ่งที่ยังไม่ยืนยัน | เอกสารที่เกี่ยวข้อง |
|---|---|---|
| ภาษาของข้อความ UI | ไทย อังกฤษ หรือสองภาษา (มีผลกับการ Bundle ฟอนต์ไทยและความกว้างของปุ่ม) | – (ต้องถามเจ้าของโปรเจกต์) |
| `tnum` ในไฟล์ฟอนต์ Subset | Roboto/Open Sans ที่ Bundle อยู่คง Feature `tabular-nums` หรือไม่ | §8.3 |
| Native Resize ของ Transparent Window | ใช้ขอบหน้าต่างแบบ Native แทน Grip ได้หรือไม่บน Electron 44 / Windows 11 | §4.5, Architecture Proposal |
| Drag-and-drop ไฟล์ใน Sandboxed Renderer | `webUtils.getPathForFile` ใน Preload ใช้ได้ภายใต้ `sandbox: true` หรือไม่ | §5.3, Architecture Proposal |
| Key ย่อยใน `app_setting.overlay` | ตัดสินแล้ว: ไม่เพิ่ม (`selectedTarget` ไม่บันทึก; `bounds` ค่าเดียว) | §4.6, §10.2, Data Model |
| Thumbnail 128 px สำหรับ High-DPI | เพิ่มขนาดที่สองหรือไม่ | §10.3, Data Model |
| มุมและเงาของ Transparent Window บน Windows 11 | พฤติกรรมจริงของ DWM กับ `transparent: true` | §10.3, Risks & Limitations |
| License และเวอร์ชันของชุดไอคอน | เลือกชุดไอคอน SVG ที่ฝังได้ | §8.4 |
