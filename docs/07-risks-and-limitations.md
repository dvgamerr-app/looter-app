# Risks & Limitations

เอกสารนี้รวบรวมความเสี่ยง ข้อจำกัดที่ยอมรับ และเงื่อนไขที่ต้องกลับมาทบทวนการตัดสินใจของ GameLooter ตาม Requirement 3.7, 3.8, 6 และ 9 พร้อมแนวทางลดความเสี่ยงและทางเลือกสำรอง

อัปเดตล่าสุด: 2026-10-08

## เอกสารที่เกี่ยวข้อง

- [Repository Audit](01-repository-audit.md)
- [Architecture Proposal](02-architecture-proposal.md)
- [Feature Specification](03-feature-specification.md)
- [Data Model](04-data-model.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Development Roadmap](06-development-roadmap.md)
- [Acceptance Criteria](08-acceptance-criteria.md)

---

## 1. วิธีอ่านเอกสารนี้

### 1.1 มาตราส่วน

| ระดับ | Likelihood (โอกาสเกิด) | Impact (ผลกระทบ) |
|---|---|---|
| ต่ำ | คาดว่าไม่เกิดในการใช้งานปกติ หรือเกิดกับผู้ใช้ส่วนน้อยมาก | ไม่กระทบ Core Flow; มี Workaround ง่าย; ไม่มีข้อมูลสูญหาย |
| กลาง | เกิดได้กับผู้ใช้บางกลุ่มหรือบางเกม/บางเครื่อง | ฟีเจอร์หนึ่งใช้งานไม่ได้หรือต้องใช้ Workaround; ไม่มีข้อมูลสูญหายถาวร |
| สูง | คาดว่าเกิดแน่นอนหรือเกิดกับผู้ใช้จำนวนมาก | Core Requirement (Overlay, Capture, Gathering List) ใช้ไม่ได้ หรือข้อมูลผู้ใช้เสี่ยงสูญหาย/ผิดพลาด |

### 1.2 คอลัมน์ใน Risk Register

- **ID**: `R-01`, `R-02`, ... ใช้อ้างอิงใน Roadmap, Acceptance Criteria และ PR; ID ไม่ถูกนำกลับมาใช้ซ้ำ ความเสี่ยงที่ปิดแล้วให้ทำเครื่องหมายสถานะ ไม่ลบแถว (เอกสาร 06 และ 08 อ้าง ID เหล่านี้แล้ว: ใน 06 อยู่ในหัวข้อ "ความเสี่ยงที่ต้องเฝ้าระวัง" และคอลัมน์งานของ Task ที่เกี่ยวข้อง ใน 08 อยู่ในแท็ก `[ความเสี่ยง: R-xx]` ท้ายชื่อเกณฑ์)
- **Owner decision**: `ใช่` = ต้องให้เจ้าของโปรเจกต์ตัดสินใจก่อนหรือระหว่าง Phase ที่เกี่ยวข้อง; `ไม่` = ทีมพัฒนาจัดการตาม Mitigation ได้เอง
- ข้อเท็จจริงที่ยังไม่ได้ตรวจสอบกับเครื่อง/เกม/เอกสารทางการ ระบุว่า "ต้องตรวจสอบ" และต้องยืนยันก่อนใช้เป็นเหตุผลในการตัดสินใจ
- ข้อเท็จจริงด้าน Tooling อ้างอิงผลตรวจสอบวันที่ 2026-10-08 ใน [Repository Audit](01-repository-audit.md)
- ตัวเลข RAM/CPU/GPU ในเอกสารนี้เป็นเป้าหมายหรือค่าประมาณ ยังไม่ได้วัด; Task P5-01 ใน [Development Roadmap](06-development-roadmap.md) ต้องบันทึกตัวเลขจริงกลับมาที่เอกสารนี้

---

## 2. Risk Register

### 2.1 Overlay และความเข้ากันได้กับเกม (Phase 3)

| ID | Area | Description | Likelihood | Impact | Mitigation | Fallback / Alternative | Owner decision |
|---|---|---|---|---|---|---|---|
| R-01 | Overlay / Display mode | เกมที่ใช้ Fullscreen Exclusive จะไม่แสดงหน้าต่างระดับ OS ทับ (Overlay มองไม่เห็นแม้ `alwaysOnTop`) การไม่ใช้ Injection ทำให้แก้ไม่ได้ในระดับแอป | สูง | สูง | ระบุ Borderless Windowed เป็นเป้าหมายหลัก (Requirement 3.7); แสดงข้อความแนะนำใน Settings และ First-run ว่าให้สลับเกมเป็น Borderless Windowed; ตรวจผลกับเกมตัวอย่างอย่างน้อย 2 เกม (ต้องตรวจสอบ) | ใช้ Gathering List ในหน้าต่างหลักบนจอที่สอง หรือ Alt+Tab; **ไม่ทำ** DLL/Graphics API Hook | ไม่ (ยอมรับข้อจำกัด ดูหัวข้อ 3) |
| R-02 | Overlay / Anti-cheat | Anti-cheat หรือ Anti-overlay Policy ของบางเกมอาจห้ามหรือตีความว่าหน้าต่างทับหน้าจอเป็นพฤติกรรมน่าสงสัย (เช่น Kernel-level Anti-cheat); GameLooter เป็น Process แยก ไม่ Inject ไม่อ่าน Memory แต่ไม่มีหลักประกันว่าทุกระบบจะยอมรับ (นโยบายแต่ละเกม ต้องตรวจสอบ) | กลาง | สูง | ไม่มี Injection, ไม่อ่าน Memory/Process ของเกม, ไม่หลบเลี่ยง Anti-cheat (Requirement 9); เอกสารผู้ใช้ระบุชัดว่าผู้ใช้ต้องตรวจนโยบายของเกมเอง; ไม่ระบุรายชื่อเกมที่ "รองรับ" โดยไม่มีหลักฐาน | ปิด Overlay แล้วใช้หน้าต่างหลักบนจอที่สองแทน | ใช่ (ยืนยันถ้อยคำ Disclaimer ก่อน Release) |
| R-03 | Overlay / Z-order | เกมอาจดึงสถานะ Topmost กลับ ทำให้ Overlay จมหลังเกมหลัง Alt+Tab, เปลี่ยน Resolution หรือ Focus เปลี่ยน | กลาง | กลาง | `setAlwaysOnTop(true, 'screen-saver')`; เรียกซ้ำเมื่อ `blur` และตาม Interval สั้นๆ ขณะ Overlay แสดงอยู่ (หยุดเมื่อซ่อน); ผู้ใช้ซ่อน/แสดง Overlay ใหม่ด้วย Hotkey `overlay:toggle` เพื่อ Re-assert Topmost | แสดงคำแนะนำใน Settings ให้สลับเกมเป็น Borderless Windowed | ไม่ |
| R-04 | Overlay / Input | Overlay แย่ง Focus หรือกลืน Input ของเกม: โหมด Interactive รับ Mouse/Keyboard ทำให้เกมเสีย Focus; โหมด View ใช้ `setIgnoreMouseEvents(true, { forward: true })` ซึ่งต้องตรวจสอบพฤติกรรมบน Windows 10/11 กับเกมจริง (ต้องตรวจสอบ) | กลาง | กลาง | View เป็นโหมดเริ่มต้น (`overlay.mode` ค่าเริ่มต้น `view`) และ Click-through; Interactive ใช้เมื่อผู้ใช้สลับเองด้วย Hotkey หรือเลือกใน Settings และกลับ View ด้วย `Esc` หรือ Hotkey เดิม; ไม่ `focus()` หน้าต่าง Overlay ตอนแสดง (ใช้ `showInactive()`); แสดงโหมดปัจจุบันบน Overlay ชัดเจน | ข้อเสนอเสริม (ยังไม่เป็น Feature ที่ผูกมัด และไม่อยู่ใน Feature Specification/UI/UX Design Plan): Hotkey ปรับจำนวนโดยไม่ต้องเข้า Interactive | ใช่ (ว่าจะเพิ่ม Hotkey ปรับจำนวนหรือไม่) |
| R-05 | Overlay / Hotkeys | Global Hotkey ชนกับ Key Binding ของเกมหรือโปรแกรมอื่น; `globalShortcut.register()` คืน `false` เมื่อ Accelerator ถูกใช้แล้ว; Hotkey บางตัวอาจถูกเกมดักก่อน (ต้องตรวจสอบ) | สูง | กลาง | ค่าเริ่มต้นใช้ `CommandOrControl+Shift+...` ตาม Feature Specification; แสดงสถานะ Register ต่อ Action ใน Settings; แก้ Hotkey ได้และลงทะเบียนใหม่ทันที; แอปต้องไม่ล้มเมื่อ Register ไม่สำเร็จ | ปุ่มบนหน้าต่างหลักและปุ่มบน Overlay (โหมด Interactive) ทำงานเดียวกับ Hotkey | ไม่ |
| R-06 | Performance / Memory, CPU | Electron ใช้ Renderer แยกต่อหน้าต่าง (Main + Overlay + Capture) ทำให้ RAM ประมาณ 150-250 MB เมื่อมีสองหน้าต่าง (ประมาณการ ต้องวัดจริง); CPU/Battery เพิ่มขณะเล่นเกมและอาจแย่งทรัพยากรเกม | กลาง | กลาง | Lazy-create Overlay/Capture window; Destroy Capture window หลังใช้; `backgroundThrottling` เปิด; ไม่มี Animation ใน Overlay; Throttle `gathering:changed` push; ซ่อน Overlay แล้วหยุด Interval ทั้งหมด; วัดตัวเลขใน P5-01 | ตัวเลือก Compact Mode / ปิดการแสดงรูปใน Overlay; ถ้าเกินเป้าหมายมาก ให้ประเมินทางเลือกตามหัวข้อ 5 | ใช่ (ถ้าตัวเลขเกินเกณฑ์ที่ตกลง) |
| R-07 | Performance / GPU | หน้าต่าง `transparent: true` บน Windows อาจใช้ Compositing เพิ่มหรือจำกัด Hardware acceleration บางส่วน และอาจกิน GPU ขณะเกมใช้ GPU เต็มที่ (ต้องตรวจสอบกับเครื่อง/ไดรเวอร์จริง) | กลาง | กลาง | ลดพื้นที่หน้าต่าง Overlay (Compact Mode); ไม่ใช้ Blur/Shadow/CSS Animation; ไม่ Redraw เมื่อข้อมูลไม่เปลี่ยน; วัด GPU usage ใน Task Manager ระหว่างเกมจริงใน Phase 5 | ข้อเสนอเสริม (ยังไม่เป็น Feature ที่ผูกมัด และไม่อยู่ใน Feature Specification/UI/UX Design Plan): โหมด "Opaque Overlay" (พื้นหลังทึบ ไม่ใช้ `transparent`) เป็นโหมดประหยัด จะพิจารณาเฉพาะเมื่อวัด GPU ใน P5-01 แล้วเกินเกณฑ์ | ไม่ |

### 2.2 Capture, Display และ Clipboard (Phase 4)

| ID | Area | Description | Likelihood | Impact | Mitigation | Fallback / Alternative | Owner decision |
|---|---|---|---|---|---|---|---|
| R-08 | Capture / desktopCapturer | `desktopCapturer` อาจคืน Frame ดำสำหรับ Protected Content หรือเกม Fullscreen Exclusive | สูง | กลาง | ตรวจจับ Frame ดำ (ทุก Pixel เป็นดำหรือแทบดำ) แล้วแสดงข้อความแนะนำทันที; เสนอ Workaround ตามลำดับ: สลับเป็น Borderless Windowed, ใช้ Win+Shift+S แล้ว "Paste from clipboard", หรือ "Import image file" (Requirement 10 ข้อ 10) | Clipboard Fallback เป็นเส้นทางที่ระบุไว้ ไม่ใช่ Bug | ไม่ |
| R-09 | Capture / Permission | Electron 44 รายงานคำขอ Screen Capture เป็น Permission `display-capture` ใน `session.setPermissionRequestHandler`; ถ้าไม่อนุญาตอย่างชัดเจน Capture จะล้มเหลว; นอกจากนี้ Windows Privacy Settings ของ Screen Capture อาจบล็อกแอป (ต้องตรวจสอบพฤติกรรมจริงบน Windows 10/11) | กลาง | กลาง | อนุญาต `display-capture` เฉพาะหน้าต่างของแอปเอง (Main/Capture window) และปฏิเสธที่เหลือ; จัดการ Error แล้วแสดงข้อความพร้อมวิธีตรวจ Windows Settings; ทดสอบ Manual บน Windows 10 และ 11 | Clipboard Fallback และ Import image file | ไม่ |
| R-10 | Capture / High-DPI | Crop Rectangle ที่ผู้ใช้ลากเป็น CSS Pixel ไม่ตรงกับ Pixel จริงเมื่อ Display Scale เป็น 125%, 150%, 200% ทำให้ภาพเพี้ยนหรือเลื่อน | สูง (ถ้าไม่จัดการ) | กลาง | ตั้ง `thumbnailSize` = ขนาดจอ x `scaleFactor`; แปลงพิกัดด้วย `display.scaleFactor` ก่อน `nativeImage.crop()`; ตรวจที่ 100%, 125%, 150%, 200% ตาม Acceptance Criteria | แสดง Preview ก่อนบันทึกและให้ Crop ใหม่ | ไม่ |
| R-11 | Capture / Multi-monitor | จอหลายใบที่ DPI ต่างกัน หรือ Origin ติดลบ (จอรองซ้าย/บน) ทำให้พิกัด Capture Window และ Overlay เพี้ยนหรืออยู่นอกจอ; ถอดจอแล้ว Bounds ที่บันทึกไว้ใช้ไม่ได้ | กลาง | กลาง | Capture จอที่เคอร์เซอร์อยู่ (`getCursorScreenPoint` + `getDisplayNearestPoint`); เปิด Capture Window ตาม `display.bounds`; ตรวจ Bounds ที่บันทึกไว้กับ `screen.getAllDisplays()` ตอนเปิด หากอยู่นอกจอให้ย้ายกลับจอหลัก; ฟัง Event `display-added`/`display-removed`/`display-metrics-changed` | ปุ่ม "รีเซ็ตตำแหน่ง Overlay" ใน Settings | ไม่ |
| R-12 | Clipboard | Electron 44 เปลี่ยน `clipboard` เป็น W3C Clipboard API (Promise/`ClipboardItem`; ถอด `readImage`/`availableFormats`) โค้ดตัวอย่างเก่าใช้ไม่ได้; ภาพที่ Paste อาจไม่ใช่ `image/png` (เช่น `image/bmp`, `image/jpeg`) | กลาง | กลาง | เขียนกับ API ใหม่เท่านั้น: หา Item ที่ `types` มี `image/*` (ให้ `image/png` ก่อน) แล้ว `getType()`; แปลงเป็น PNG ด้วย `nativeImage` ก่อนบันทึก; แจ้งผู้ใช้เมื่อ Clipboard ไม่มีภาพ | "Import image file" | ไม่ |

### 2.3 ข้อมูลและ Storage (Phase 1, 2, 5)

| ID | Area | Description | Likelihood | Impact | Mitigation | Fallback / Alternative | Owner decision |
|---|---|---|---|---|---|---|---|
| R-13 | Native module / better-sqlite3 | ปัจจุบันใช้ได้: `better-sqlite3@13.0.3` เป็น N-API (ไม่ต้อง Rebuild, ไม่ต้องใช้ Python/VS Build Tools) แต่ต้องตั้ง `npmRebuild: false` ใน electron-builder (ไม่เช่นนั้น Build ล้มเพราะไม่มี Python); Module ถูก Unpack ไปที่ `app.asar.unpacked` พร้อม Prebuilds ทุก Platform ทำให้ Installer ใหญ่ขึ้น (Package ~27 MB unpacked); ถ้าเวอร์ชันถัดไปเปลี่ยนวิธีแจก Binary หรือมี Native Module ตัวที่สอง จะต้องใช้ Python + VS Build Tools | ต่ำ | กลาง | ตรึงเวอร์ชัน, ใส่ใน `dependencies`; Smoke Test ใน Packaged App ทุก Release (เปิด DB, WAL, Foreign Keys); ตัด Prebuilds ที่ไม่ใช่ win32-x64 และ `deps`/`src` ผ่าน `files` Globs (Phase 5); ห้ามเพิ่ม Native Module ตัวอื่นโดยไม่ผ่านการตัดสินใจ | `node:sqlite` ที่มากับ Node 24 ใน Electron 44 (API ยัง Experimental และยังไม่ตรวจสอบกับ Electron; ต้องตรวจสอบ) | ไม่ |
| R-14 | Data / SQLite integrity | ไฟล์ SQLite เสียหายจากไฟฟ้าดับ, Process ถูก Kill, Disk เต็ม, Antivirus ล็อกไฟล์ หรือผู้ใช้คัดลอกเฉพาะ `.sqlite` โดยไม่มี `-wal`/`-shm` | ต่ำ | สูง | WAL + `foreign_keys = ON` + Transaction ทุกการเขียนหลายแถว; ใช้ `db.backup()` สำหรับ Backup/Export (ไม่คัดลอกไฟล์ตรงๆ); ปิด DB อย่างถูกต้องใน `before-quit`; `PRAGMA integrity_check` หลัง Crash ผิดปกติ (ต้นทุนเวลา ต้องตรวจสอบ); Backup อัตโนมัติก่อน Migration | Restore จาก Backup ล่าสุด; ถ้าเปิด DB ไม่ได้ ให้แสดงหน้าจอกู้คืนและไม่สร้างฐานข้อมูลใหม่ทับ | ใช่ (นโยบาย Backup อัตโนมัติ: จำนวนชุดที่เก็บ) |
| R-15 | Data / Migration | Migration ล้มกลางทาง หรือแอปเวอร์ชันเก่ากว่า `user_version` ในไฟล์ (Downgrade) ทำให้แอปเปิดไม่ได้หรือ Schema ผิดรูป | ต่ำ | สูง | Migration เป็นโมดูลเรียงลำดับ รันใน Transaction เดียวต่อเวอร์ชัน แล้วปรับ `user_version`; Backup ก่อน Migrate; ปฏิเสธเปิดไฟล์ที่ `user_version` สูงกว่าที่แอปรู้จัก พร้อมข้อความชัดเจน (ไม่เขียนทับ); ทดสอบ Migration กับสำเนาข้อมูลจริงเสมอ | Restore จาก Backup ก่อน Migration | ไม่ |
| R-16 | Data / Export-Import | ไฟล์ Export มี `schemaVersion` ต่างจากแอป, ZIP เสียหาย/ไม่สมบูรณ์, หรือ Import ถูกขัดจังหวะกลางคันจนข้อมูลปัจจุบันถูกทับ; Path ของภาพใน ZIP อาจเป็นช่องทาง Path Traversal | ต่ำ | สูง | Validate `manifest.json` (`appVersion`, `schemaVersion`, `exportedAt`) ก่อนแตกไฟล์; แตกไปโฟลเดอร์ชั่วคราว, รัน Migration, ตรวจความถูกต้อง แล้วค่อย Swap แบบ Atomic; Backup ข้อมูลปัจจุบันก่อน Swap; ปฏิเสธ Entry ที่ Path ออกนอกโฟลเดอร์ปลายทาง; เวอร์ชัน `fflate` ต้องตรวจสอบตอน Implement | ปฏิเสธ Import และคงข้อมูลเดิมไว้ทั้งหมด | ไม่ |
| R-17 | Data / Privacy | ข้อมูลทั้งหมดอยู่ในเครื่อง (`%APPDATA%\looter-app`) ไม่เข้ารหัส ผู้ใช้ที่แชร์เครื่องหรือส่งไฟล์ Export ให้ผู้อื่นจะเปิดเผยข้อมูล (ภาพ Capture อาจมี HUD หรือชื่อผู้เล่นติดมา) | ต่ำ | ต่ำ | ไม่ส่งข้อมูลออกนอกเครื่อง, ไม่มี Telemetry, ไม่มี Network Request ใน Phase 1-4; เตือนในหน้า Export ว่าภาพอาจมีข้อมูลจากหน้าจอเกม; แนะนำ Crop เฉพาะ Icon | ตัวเลือกเข้ารหัส Export (ไม่อยู่ในแผน) | ใช่ (ถ้าต้องการเข้ารหัส Backup) |
| R-18 | Data / Accuracy | ผู้ใช้กรอกจำนวนใน Inventory เอง จึงคลาดเคลื่อนจากของจริงในเกมหลังเล่นนาน (Manual Inventory Drift); ไม่มีการตรวจจับอัตโนมัติ (ตั้งใจ ตาม Requirement 3.6) | สูง | กลาง | ทำให้ปรับจำนวนได้เร็วที่สุด (+/-, +5, +10, พิมพ์ค่า, ปรับจาก Overlay); แสดง `updated_at` ของ Inventory แต่ละ Item; ผู้ใช้ตั้งจำนวนทีละรายการด้วย `inventory:set` ได้ตรงกับคลังจริงในเกม (ข้อเสนอเสริม ยังไม่เป็น Feature ที่ผูกมัด: ฟังก์ชันตั้ง/รีเซ็ตจำนวนหลายรายการพร้อมกัน ไม่อยู่ใน Feature Specification) | Gathering List แสดงค่า Owned เป็น "ตามที่ผู้ใช้บันทึก" ชัดเจน | ไม่ |
| R-19 | Domain / Aggregation | ความถูกต้องของการคำนวณ: Double Counting, Surplus จาก `output_qty`, Priority Allocation, Cycle ใน Nested Recipes ผิดพลาดแล้วผู้ใช้เก็บของผิดจำนวน | กลาง | สูง | Pure Function ใน `electron/domain/*.ts` (ไม่มี Electron import) ตาม Algorithm ใน [Data Model](04-data-model.md); Cycle Detection ตอนบันทึก + Visited-set ตอน Expand; Acceptance Criteria มีตัวอย่างตัวเลข (45/20/25, 15/5/10, 8/3/5; 28/68) ให้ตรวจ Manual | ตรวจด้วยตารางตัวอย่างทุกครั้งที่แก้ Algorithm; ผู้ใช้เลือก `gather` เพื่อปิดการ Expand ได้ | ไม่ |

### 2.4 Tooling, Dependencies และ Release

| ID | Area | Description | Likelihood | Impact | Mitigation | Fallback / Alternative | Owner decision |
|---|---|---|---|---|---|---|---|
| R-20 | Tooling / vue-tsc และ Node.js | `vue-tsc` ต้องรันบน Node.js: ภายใต้ Bun จะลดรูปเป็น `tsc` ธรรมดาและข้ามไฟล์ `.vue` อย่างเงียบๆ; เครื่องพัฒนาปัจจุบันไม่มี Node.js ทำให้ `bun run typecheck` ล้มพร้อมข้อความ `command not found: node` (`typecheck:main` ผ่านบน Bun) | สูง | กลาง | ติดตั้ง Node.js 24 LTS (ตาม `engines.node >=20.19.0`) บนเครื่อง Dev/CI ที่ต้อง Type-check `.vue`; ระบุไว้ใน README, คู่มือ Repository และ PR Description ว่ารัน `typecheck:renderer` ที่เครื่องใด; ห้ามรายงานว่า Type-check `.vue` ผ่านถ้าไม่ได้รันภายใต้ Node | รัน `typecheck:renderer` ใน CI เท่านั้น (ยังไม่พบ Workflow ใน Repository; ต้องตรวจสอบ) | ใช่ (ติดตั้ง Node 24 บนเครื่อง Dev หรือพึ่ง CI) |
| R-21 | Tooling / Vite 8 และ Tailwind 4 | Vite 8 (Rolldown), Tailwind CSS 4 (CSS-first), `vite-plugin-electron` 1.x และ `@vitejs/plugin-vue` 6 ยังใหม่ อาจมี Breaking Change/Bug ใน Minor Release; Plugin บางตัวอาจตามไม่ทัน | กลาง | กลาง | ตรึงเวอร์ชันผ่าน `bun.lock` และ `--frozen-lockfile`; อัปเกรดทีละกลุ่มพร้อม Build + Smoke Test; อ่าน Changelog ก่อนอัปเดต; ไม่บังคับ Major ใหม่ถ้ามีปัญหา Compatibility (Requirement 10 ข้อ 3) | ย้อนกลับไปเวอร์ชันก่อนหน้าตาม `bun.lock` ของ Commit ที่ผ่าน; `vite-plugin-electron` 1.1.2 รองรับ Vite 7 ด้วย | ไม่ |
| R-22 | Electron / Release cadence และ Audit | Electron ออก Major บ่อย (รอบปัจจุบันและช่วง Support ต้องตรวจสอบ) และเวอร์ชันเก่าหมด Support เร็ว ต้องอัปเกรดสม่ำเสมอ; `bun audit` ยังเหลือ 3 Advisories (build-time เท่านั้น): `braces@3.0.3` (high), `sprintf-js@1.1.3` (moderate), `tmp@0.2.6` (high, เส้นทาง Linux-only) ไม่ ship ในแอป | สูง (Cadence) / ต่ำ (Advisories) | กลาง | รัน `bun audit` ก่อนทุก Release และบันทึก Advisories ที่เหลือใน Release notes; ตั้งรอบตรวจ Electron Release ทุก Phase; อ่าน Breaking Changes ก่อนอัปเกรดทุกครั้ง (โดยเฉพาะ `clipboard`, `desktopCapturer`, Permission) | ค้างเวอร์ชันแล้วบันทึกเหตุผลถ้า Major ใหม่ทำให้ Overlay/Capture พัง | ไม่ |
| R-23 | Packaging / Icon | `public/looter.ico` ขนาด 128x128 แต่ electron-builder ต้องการอย่างน้อย 256x256 สำหรับ `win.icon` จึงใช้ไอคอน Electron เริ่มต้นใน Installer และ exe | สูง | ต่ำ | สร้างไอคอน ICO ขนาด 256x256 ขึ้นไป (พร้อมขนาดเล็กหลายระดับ) ก่อน Release (Phase 5) | Release ภายในโดยใช้ไอคอนเริ่มต้นได้ แต่ไม่แนะนำสำหรับ Release สาธารณะ | ใช่ (ต้องมีงานออกแบบไอคอน) |
| R-24 | Distribution / Code signing | ไม่มี Code Signing Certificate: Installer (~123 MB) จะขึ้น Windows SmartScreen / "Unknown publisher" และ Antivirus บางตัวอาจตั้งธง; ผู้ใช้อาจไม่กล้าติดตั้ง | สูง | กลาง | เขียนวิธีผ่าน SmartScreen ในเอกสาร/Release notes; เผยแพร่ Checksum (SHA-256) ของ Installer; ตัดสินใจเรื่อง Certificate ใน Phase 5 (ไม่สมมติว่ามี) | ประเมินบริการ Signing ราคาถูกหรือโปรแกรมสำหรับ OSS (ต้องตรวจสอบเงื่อนไข) | ใช่ (งบ/การซื้อ Certificate) |
| R-25 | Distribution / GitHub Releases | การเผยแพร่และ Auto-update ผ่าน GitHub Releases ต้องมีสิทธิ์ Repository (สร้าง Release, Token ใน Actions), Release Workflow และไฟล์ `latest.yml` ที่ถูกต้อง; ยังไม่ได้ตรวจสิทธิ์/Visibility ของ Repository (ต้องตรวจสอบ) | กลาง | กลาง | ตรวจสิทธิ์และ Visibility ก่อน Phase 5; ใช้ Token แบบ Scope น้อยที่สุดใน CI; ทดสอบด้วย Pre-release ก่อน | แจก Installer ด้วยมือ (Manual Download) | ใช่ |
| R-26 | Distribution / Auto-update | Auto-update ผ่าน `electron-updater` ไม่อยู่ใน Phase 1; ถ้าเพิ่มภายหลังโดยไม่มี Code Signing อาจมีปัญหาการตรวจลายเซ็นและความเสี่ยงด้าน Supply Chain; การ Update ต้องไม่ทำลายข้อมูล (Migration) | กลาง | กลาง | ออกแบบ Update Flow ไว้ใน [Architecture Proposal](02-architecture-proposal.md) แต่ไม่ Implement จนกว่าจะแก้ R-24 และ R-25; Backup ก่อน Migrate เสมอ (R-15) | ปุ่ม "ตรวจหาเวอร์ชันใหม่" ที่เปิดหน้า Releases ในเบราว์เซอร์ | ใช่ |

### 2.5 กระบวนการและขอบเขตงาน

| ID | Area | Description | Likelihood | Impact | Mitigation | Fallback / Alternative | Owner decision |
|---|---|---|---|---|---|---|---|
| R-27 | Scope creep | ข้อเสนอเพิ่มเติม (OCR, ตรวจจับ Inventory, Cloud Sync, macOS/Linux, Auto-update ใน Phase 1, หลาย Recipe ต่อ Item) ทำให้งานบวมและเสี่ยงกับ Core (Overlay, Capture, Gathering List) | กลาง | กลาง | ยึด [Development Roadmap](06-development-roadmap.md) เป็นหลัก; ฟีเจอร์นอกแผนต้องผ่านการตัดสินใจของเจ้าของ (ดูหัวข้อ 5); ไม่เริ่ม Implementation ใหม่จนกว่าจะได้รับคำสั่ง | เก็บเป็น Backlog หลัง Phase 5 | ใช่ |
| R-28 | Quality / No automated tests | ตามข้อกำหนดไม่เขียน Test Script เว้นแต่ได้รับคำสั่ง จึงไม่มี Regression Safety Net อัตโนมัติ ความผิดพลาดในการคำนวณ (R-19), Migration (R-15) และ UI ถอยหลังอาจไม่ถูกจับ | กลาง | กลาง | ตรวจ Build (`bun x vite build`, `bun run build`), `bun run lint`, `typecheck:main` และ `typecheck:renderer` (บน Node) ทุกการเปลี่ยนแปลง; ทำ Manual Checklist ตาม [Acceptance Criteria](08-acceptance-criteria.md) ทุก Phase; แยก Domain Logic เป็น Pure Function เพื่อเพิ่ม Test ภายหลังได้ | เมื่อเจ้าของสั่ง ให้เพิ่ม Unit Test เฉพาะ `electron/domain/*` และ Migration ก่อน | ใช่ (ถ้าต้องการให้เพิ่ม Test เฉพาะส่วน Domain/Migration) |

---

## 3. ข้อจำกัดที่ยอมรับ (Accepted Limitations)

ข้อจำกัดต่อไปนี้เป็นการตัดสินใจโดยเจตนา ไม่ใช่ Defect และไม่ถือเป็นงานค้างในช่วง Phase 1-5

| # | ข้อจำกัด | เหตุผล | ทางเลือกที่ผู้ใช้มี | เกี่ยวข้องกับ |
|---|---|---|---|---|
| L-01 | ไม่อ่าน Memory, Process หรือ Internal API ของเกม ผู้ใช้ต้องบันทึกจำนวน Inventory เอง | ต้องใช้ได้กับหลายเกม ไม่ขึ้นกับโครงสร้างภายใน และไม่เสี่ยงกับ Anti-cheat (Requirement 3.6, 9) | ปรับจำนวนผ่าน +/-, พิมพ์ค่า หรือปรับจาก Overlay | R-02, R-18 |
| L-02 | ไม่มี OCR และไม่ตรวจจับ Item อัตโนมัติ; Screenshot ใช้จำภาพ Item เท่านั้น | Requirement 3.2, 9; ลดความซับซ้อนและความเสี่ยงด้านความถูกต้อง | Capture, Paste หรือ Import ภาพแล้วตั้งชื่อเอง | R-27 |
| L-03 | ไม่มี Injection/Hook เข้าเกม และไม่หลบเลี่ยง Anti-cheat | Requirement 9; ปลอดภัยต่อบัญชีผู้เล่นมากกว่า | ใช้ Overlay เป็น Process แยก; ตรวจนโยบายของเกมเอง | R-01, R-02 |
| L-04 | Overlay ไม่รองรับเกม Fullscreen Exclusive | หน้าต่างระดับ OS ถูกซ่อนโดย Exclusive Mode; แก้ได้เฉพาะด้วย Hook ซึ่งขัดกับ L-03 | สลับเกมเป็น Borderless Windowed หรือดู Gathering List ในหน้าต่างหลัก/จอที่สอง | R-01 |
| L-05 | Capture ตรงจากเกม Fullscreen Exclusive/Protected Content อาจได้ภาพดำ | ข้อจำกัดของ OS/Driver ที่แอปแก้ไม่ได้ | Win+Shift+S แล้ว Paste from clipboard, หรือ Import image file | R-08 |
| L-06 | ไม่มี Cloud Sync, Account หรือการทำงานข้ามเครื่องอัตโนมัติ | ทำงาน Offline เป็นหลัก (Requirement 5); ลดความเสี่ยงด้านความเป็นส่วนตัว | Export/Import เป็นไฟล์ ZIP เพื่อย้ายเครื่อง | R-17 |
| L-07 | รองรับเฉพาะ Windows 10/11 x64; ไม่มี macOS, Linux, ia32, ARM | Requirement 10 ข้อ 5; Electron 44 ถอด Windows ia32 | - | R-22 |
| L-08 | หนึ่ง Item มีได้หนึ่ง Recipe (`UNIQUE (output_item_id)`) | ทำให้ Nested Expansion ไม่กำกวม; Recipe Variants เป็น Migration ในอนาคต | ใช้ Item แยกชื่อกัน | R-27 |
| L-09 | แอปไม่ได้เซ็นลายเซ็นดิจิทัล ผู้ใช้จะเห็นคำเตือน SmartScreen | ยังไม่มี Certificate | ดูวิธีติดตั้งใน Release notes | R-24 |
| L-10 | ขนาด Installer ประมาณ 123 MB และ RAM สูงกว่า Native App | ลักษณะของ Electron (Chromium + Node ในตัว); เหตุผลที่ยังเลือก Electron อยู่ใน [Architecture Proposal](02-architecture-proposal.md) | - | R-06, R-07 |
| L-11 | Inventory เป็นค่าที่ผู้ใช้บันทึก อาจไม่ตรงกับเกม | L-01 | ปรับจำนวนใหม่เมื่อเปิดคลังในเกม | R-18 |
| L-12 | Per-target Progress เป็นจำนวนที่ "จัดสรร (allocated)" ไม่ใช่ Inventory จริงของ Quest | Requirement 10 ข้อ 12 | เปลี่ยนลำดับ Priority ของ Targets | R-19 |

---

## 4. วิธีสื่อสารข้อจำกัดให้ผู้ใช้

| ช่องทาง | ข้อความ/พฤติกรรม | ครอบคลุม |
|---|---|---|
| First-run / Settings > Overlay | ข้อความสั้น: "Overlay ใช้ได้กับเกมแบบ Borderless Windowed; ถ้าเกมเป็น Fullscreen Exclusive จะมองไม่เห็น Overlay" พร้อมลิงก์ไปคำแนะนำ | R-01, L-04 |
| Settings > Overlay (Disclaimer) | "GameLooter ไม่ Inject และไม่อ่านข้อมูลเกม แต่บางเกมอาจห้ามโปรแกรมที่แสดงทับหน้าจอ โปรดตรวจนโยบายของเกมก่อนใช้" (ถ้อยคำสุดท้ายต้องผ่านเจ้าของ) | R-02, L-01, L-03 |
| Toast/Banner ตอน Capture ล้มเหลวหรือได้ Frame ดำ | บอกสาเหตุที่เป็นไปได้และ 3 ทางเลือก: Borderless Windowed, Win+Shift+S + Paste from clipboard, Import image file; มีปุ่มลัดไปแต่ละทาง | R-08, R-09, L-05 |
| Settings > Hotkeys | แสดงสถานะ Register ต่อ Hotkey ("ใช้งานได้" / "ชนกับโปรแกรมอื่น") พร้อมปุ่มแก้ | R-05 |
| ตัวบอกโหมดบน Overlay | ป้ายโหมด View หรือ Interactive ที่เห็นชัดที่ส่วนหัวของ Overlay | R-04 |
| Gathering List / Overlay | ป้าย "จัดสรร (allocated)" ในความคืบหน้ารายเป้าหมาย; ข้อความ "ตามที่คุณบันทึก" ใกล้ค่า Owned | L-11, L-12, R-18 |
| หน้า Export / Import | คำเตือนว่าภาพอาจมีข้อมูลจากหน้าจอ; ข้อความชัดเจนเมื่อ `schemaVersion` ไม่รองรับ; ยืนยันก่อนทับข้อมูล | R-16, R-17 |
| ข้อความเมื่อเปิดฐานข้อมูลล้มเหลว | อธิบายตำแหน่งไฟล์และทางเลือกกู้คืนจาก Backup; ไม่สร้างฐานข้อมูลใหม่ทับเงียบๆ | R-14, R-15 |
| Settings > About | เวอร์ชันแอป, Electron, `schemaVersion`; ลิงก์ Release notes และข้อมูลเรื่อง SmartScreen | R-24, L-09 |
| README และ Release notes | ส่วน "ข้อจำกัดที่ทราบ" สรุป L-01 ถึง L-12, วิธีผ่าน SmartScreen, Checksum, Advisories ที่เหลือจาก `bun audit` | R-22, R-24 |
| เอกสารสำหรับผู้พัฒนา (README และคู่มือ Repository) | ต้องมี Node.js 24 สำหรับ `bun run typecheck`; `npmRebuild: false`; `trustedDependencies` | R-13, R-20 |

หลักการเขียนข้อความ: บอกสิ่งที่เกิดขึ้น สาเหตุที่เป็นไปได้ และสิ่งที่ผู้ใช้ทำต่อได้ภายในไม่เกินสามขั้นตอน; ไม่กล่าวอ้างว่า "ปลอดภัยกับทุกเกม" หรือ "รองรับทุกเกม"

---

## 5. เงื่อนไขที่ต้องทบทวนการตัดสินใจ (Triggers to Revisit)

| Trigger | สิ่งที่ต้องทบทวน | ความเสี่ยงที่เกี่ยวข้อง |
|---|---|---|
| RAM รวมของ Main + Overlay เกินเกณฑ์ที่เจ้าของกำหนด (ค่าตั้งต้นประมาณ 250 MB ต้องยืนยัน) หรือ CPU Idle ของ Overlay สูงเกินคาดเมื่อวัดใน P5-01 | ลดฟีเจอร์ Overlay, ใช้ Opaque Overlay หรือประเมินทางเลือกอื่น (เช่น Tauri/WebView2 หรือ C#/.NET เฉพาะ Overlay) แล้วบันทึกใน [Architecture Proposal](02-architecture-proposal.md) | R-06, R-07 |
| ผู้ทดสอบส่วนใหญ่เล่นเกมแบบ Fullscreen Exclusive หรือมีรายงานว่า Overlay ถูกบล็อกโดย Anti-cheat ของเกมยอดนิยม | ตัดสินใจว่าจะเพิ่มคำแนะนำ ทำ Companion Window บนจอที่สอง หรือยอมรับข้อจำกัดต่อ (ไม่ใช้ Injection) | R-01, R-02 |
| `globalShortcut.register()` ล้มเหลวบ่อยในเกมเป้าหมาย | เปลี่ยน Hotkey เริ่มต้น หรือเพิ่มวิธีควบคุมอื่น (ข้อเสนอเสริม เช่น Tray icon ซึ่งยังไม่อยู่ในแผน, ปุ่มบน Overlay) | R-05 |
| `better-sqlite3` ออกเวอร์ชันที่ไม่มี Prebuild สำหรับ Electron ที่ใช้, ต้องเพิ่ม Native Module อื่น, หรือ `node:sqlite` เสถียรและตรวจสอบกับ Electron แล้ว | ประเมินย้ายไป `node:sqlite` หรือเตรียม Python/VS Build Tools ใน CI | R-13 |
| พบไฟล์ DB เสียหายจริง หรือ Migration ล้มในการทดสอบ | เพิ่มความถี่ Backup อัตโนมัติ, เพิ่ม `integrity_check` ตอนเริ่ม | R-14, R-15 |
| Electron Major ใหม่เปลี่ยน API ที่เราใช้ (`desktopCapturer`, `clipboard`, Permission, `setAlwaysOnTop`) หรือ Electron ที่ใช้หมด Support | วางแผนอัปเกรดเฉพาะกิจและทดสอบ Overlay/Capture ใหม่ | R-12, R-22 |
| `bun audit` พบ Advisory ที่ ship ใน Runtime หรือ Severity สูงเพิ่มจากที่รู้จัก | อัปเดตหรือเปลี่ยน Dependency ก่อน Release | R-22 |
| มีผู้ใช้จริงนอกทีม หรือเตรียม Release สาธารณะ | ตัดสินใจเรื่อง Code Signing, ไอคอน 256 px, สิทธิ์ GitHub Releases และ Auto-update | R-23, R-24, R-25, R-26 |
| มีรายงานว่าตัวเลข Missing/Allocated ผิดในสถานการณ์จริง | ทบทวน Aggregation และพิจารณาเพิ่ม Unit Test เฉพาะ `electron/domain/*` (ต้องให้เจ้าของสั่ง) | R-19, R-28 |
| เจ้าของต้องการ Cloud Sync, macOS/Linux, OCR หรือ Recipe หลายแบบต่อ Item | เปิดเป็นโครงการ/Phase ใหม่พร้อมประเมินความเสี่ยงใหม่ ไม่แทรกใน Phase 1-5 | R-27, L-02, L-06, L-07, L-08 |
| ก่อนเริ่ม Phase 3 และ Phase 4 | ทดสอบ Prototype Overlay และ Capture บนเครื่องและเกมจริง (Windows 10/11, DPI 100-200%, 2 จอ) เพื่อยืนยันหรือปรับ R-01 ถึง R-11 | R-01 ถึง R-11 |

---

## 6. รายการที่ต้องตรวจสอบ (ยังไม่ยืนยัน)

- พฤติกรรม `setIgnoreMouseEvents(true, { forward: true })` และการไม่แย่ง Focus ของ `showInactive()` กับเกมจริงบน Windows 10/11 (R-04)
- ผลของหน้าต่าง `transparent` ต่อการใช้ GPU ขณะเกมทำงาน (R-07)
- พฤติกรรมของ Permission `display-capture` และ Windows Privacy Settings กับ `desktopCapturer` ใน Electron 44 (R-09)
- ต้นทุนเวลาของ `PRAGMA integrity_check` ตอนเริ่มแอป (R-14)
- เวอร์ชันของ `fflate` ที่จะใช้ (R-16)
- รอบ Release ปัจจุบันของ Electron และกำหนด Support ของแต่ละ Major (R-22)
- สิทธิ์/Visibility ของ Repository สำหรับ GitHub Releases และการมี CI Workflow (R-20, R-25)
- สถานะ `node:sqlite` ภายใน Electron 44 (R-13)
- นโยบายของเกมเป้าหมายต่อโปรแกรมที่แสดงทับหน้าจอ (R-02)
