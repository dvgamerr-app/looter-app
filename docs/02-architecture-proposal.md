# Architecture Proposal

เอกสารนี้กำหนด Technology Stack, Process Model, Typed IPC, Storage, Overlay, Capture, Hotkeys, Packaging และกฎ High-DPI ของ GameLooter พร้อมเหตุผลและข้อจำกัด เพื่อให้ Data Model, Feature Specification และ Roadmap อ้างอิงชื่อ Module และ Channel ชุดเดียวกัน

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง:

- [Repository Audit Report](01-repository-audit.md)
- [Feature Specification](03-feature-specification.md)
- [Data Model](04-data-model.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Development Roadmap](06-development-roadmap.md)
- [Risks & Limitations](07-risks-and-limitations.md)
- [Acceptance Criteria](08-acceptance-criteria.md)

หมายเหตุการอ่าน: ข้อความที่ระบุ "ต้องตรวจสอบ" คือข้อเท็จจริงหรือค่าที่ยังไม่ได้ยืนยันกับเอกสารทางการหรือการวัดจริง ตัวเลขที่ระบุว่า "เสนอ" คือเป้าหมายที่ต้องวัดตอน Implement ไม่ใช่ผลที่วัดแล้ว การอ้างอิง Requirement ใช้หมายเลขส่วนของเอกสารความต้องการ (เช่น Requirement 6)

## 1. สรุปการตัดสินใจ

| หัวข้อ | การตัดสินใจ | เหตุผลย่อ |
|---|---|---|
| Runtime | Electron 44.7.0 (Chromium 152, Node 24.21.0) | ใช้ต่อจาก Scaffold เดิม; Overlay, Capture, Hotkey, Clipboard เป็น API ในตัว |
| UI | Vue 3.5 + vue-router 4 (hash history) + Tailwind CSS 4 | Skill และโค้ดเดิมใช้ต่อได้ทันที |
| Bundler | Vite 8 + vite-plugin-electron 1.1.2 | Multi-page (`index.html`, `overlay.html`, `capture.html`) |
| ภาษา | TypeScript 5.9.x (ห้าม TS 6/7) | Contract ของ IPC และ Domain ตรวจชนิดได้ |
| Database | SQLite ผ่าน better-sqlite3 13.x ใน `dependencies` | Synchronous API เหมาะกับ Main Process; Prebuilt N-API ไม่ต้อง Rebuild |
| Process Model | Main เป็นเจ้าของ DB/ไฟล์/Hotkey/Capture/Clipboard/Overlay; Renderer เรียกผ่าน `window.api` เท่านั้น | ตาม Requirement 9 และ Owner decision 3 |
| เป้าหมาย OS | Windows 10/11 x64, NSIS installer | Owner decision 5; Electron 44 ไม่มี ia32 |
| Package manager | Bun 1.4.2; Node.js 24 LTS จำเป็นเฉพาะ `bun run typecheck` | ดูส่วนที่ 14 |
| การแจกจ่าย | NSIS ไม่ Sign ในรุ่นแรก; ออกแบบ electron-updater + GitHub Releases ไว้ใช้ภายหลัง | ยังไม่มี Certificate (Owner decision 14) |

ข้อสรุป: ไม่ Rewrite เป็น Tauri หรือ .NET ยอมรับต้นทุนของ Electron (RAM, ขนาด Installer, เวลาเริ่ม) แลกกับการไม่ต้องสร้าง Overlay/Capture/Hotkey ใหม่ในภาษาอื่น เหตุผลเต็มอยู่ในส่วนที่ 2

## 2. เปรียบเทียบ Technology Stack

### 2.1 ตารางเปรียบเทียบ (Requirement 6)

คอลัมน์ Tauri และ .NET เป็นการประเมินจากความรู้ทั่วไปของ Framework ไม่ได้สร้าง Prototype ในโปรเจกต์นี้ ข้อที่ไม่แน่ใจระบุ "ต้องตรวจสอบ" ส่วนคอลัมน์ Electron อิงการทดลองจริงในรอบเตรียม Repository (Audit และ better-sqlite3 spike)

| หัวข้อ | Electron 44 + Vue (เลือก) | Rust + Tauri 2 | C# / .NET (WPF หรือ WinUI 3) |
|---|---|---|---|
| 1. Native UI เทียบ Cross-platform | UI เป็น Web (Chromium); ไม่ใช่ Native Control แต่ควบคุม Dark Theme และ Style ได้ทั้งหมด | UI เป็น Web บน WebView2 ของระบบ; Backend เป็น Rust | Native Control; WPF โตเต็มที่, WinUI 3 ใหม่กว่า ข้อจำกัดของ Window มากกว่า (ต้องตรวจสอบสถานะล่าสุด) |
| 2. Transparent / Always-on-top / Click-through Overlay | `BrowserWindow` `transparent`, `frame: false`, `alwaysOnTop`, `setIgnoreMouseEvents(true, { forward: true })` ในตัว | Window Config รองรับ transparent/always-on-top; Click-through มี API แต่ตัวเลือกแบบ "forward" ของ Electron ไม่แน่ใจ (ต้องตรวจสอบ) | WPF: `AllowsTransparency` + P/Invoke `WS_EX_TRANSPARENT`/`WS_EX_NOACTIVATE`; WinUI 3 ต้อง Interop มากกว่า (ต้องตรวจสอบ) |
| 3. Global Shortcuts | `globalShortcut.register()` คืน `false` เมื่อชน; ในตัว | Plugin `global-shortcut` (ต้องตรวจสอบการแจ้งความขัดแย้ง) | P/Invoke `RegisterHotKey` เอง หรือไลบรารี |
| 4. Screenshot / Region Capture | `desktopCapturer` + Capture window + `nativeImage.crop` ในตัว | ต้องใช้ Crate ฝั่ง Rust (เช่น xcap, ต้องตรวจสอบ) หรือ Win32/DXGI เอง | GDI / `Windows.Graphics.Capture` / DXGI ผ่าน API ของ Windows; ควบคุมได้มากสุดแต่ต้องเขียนเอง |
| 5. Clipboard Image | `clipboard.read()` -> `ClipboardItem` (Electron 44); Format จริงของ Snipping Tool ต้องตรวจสอบ | Plugin clipboard-manager รองรับรูป (ต้องตรวจสอบ) | `Clipboard.GetImage()` (WPF) ตรงไปตรงมา |
| 6. Local Database | better-sqlite3 13 (Prebuilt N-API, ทดสอบทั้ง Dev และ Packaged ด้วย `npmRebuild: false`) | rusqlite หรือ sqlx / tauri-plugin-sql | Microsoft.Data.Sqlite / EF Core |
| 7. Image Storage + Thumbnail | `nativeImage` + ไฟล์ใน `userData`; เสิร์ฟด้วย Custom Protocol | `image` crate หรือทำฝั่ง UI | System.Drawing / ImageSharp (ต้องตรวจสอบ Library ที่เหมาะ) |
| 8. Performance / RAM | ประมาณ 150-250 MB เมื่อมี 2 Renderer (เป้าหมายใน 08, ต้องวัดจริง); เริ่มช้ากว่า Native | ต่ำกว่า Electron อย่างมีนัยเพราะใช้ WebView2 ของระบบ (ตัวเลขต้องวัดจริง) | ต่ำสุดสำหรับ WPF แบบ Framework-dependent; Self-contained ใหญ่ขึ้น |
| 9. Packaging / Installer | electron-builder NSIS; วัดจริง ~123 MB (`GameLooter-Windows-1.0.0-Setup.exe`) | NSIS/MSI; เล็กมาก (ต้องตรวจสอบ); Windows 10 อาจต้อง Bootstrap WebView2 | MSIX / ClickOnce / WiX; Framework-dependent ต้องมี Runtime |
| 10. Update Mechanism | electron-updater + GitHub Releases (`latest.yml` + blockmap สร้างอยู่แล้ว) | Plugin updater ในตัว แต่บังคับ Signature ของตัวเอง (ต้องตรวจสอบ) | MSIX/ClickOnce ในตัว หรือ Velopack (ต้องตรวจสอบ) |
| 11. Windows 10/11 | Windows 10 ขึ้นไป; ไม่พึ่ง WebView2 | Windows 10 ต้องมี WebView2 (Windows 11 มีมากับระบบ, ต้องตรวจสอบ) | .NET 8+ รองรับ Windows 10+ (เวอร์ชันขั้นต่ำของ WinUI 3 ต้องตรวจสอบ) |
| 12. High-DPI / Multi-monitor | Chromium จัดการ Per-Monitor DPI; ใช้ DIP + สัดส่วนภาพ/`scaleFactor` (ส่วนที่ 12) | WebView2 จัดการ DPI; Capture ต้องคำนวณเอง | WPF ต้องตั้ง Manifest เป็น PerMonitorV2; Capture ต้องคำนวณเอง |
| ใช้โค้ดเดิมซ้ำ | เกือบทั้งหมด (Vue, Tailwind, Vite, Window/Preload scaffold, ค่า Security) | ใช้ Vue UI ซ้ำได้; Main process ทั้งหมดเขียนใหม่เป็น Rust | ไม่ใช้ซ้ำ (UI และ Logic เขียนใหม่ทั้งหมด) |
| ต้นทุน Rewrite | ไม่มี | สูง: Backend, IPC, Capture, Overlay, Packaging ใหม่; มีภาษาที่สองในโปรเจกต์ | สูงสุด: ทุกชั้นใหม่ + Design System ใหม่ |

### 2.2 ข้อจำกัดของ Electron ที่ยอมรับ

| ข้อจำกัด | ระดับ | การรับมือ |
|---|---|---|
| RAM: Chromium หนึ่ง Renderer ต่อ Window บวก GPU/Utility Process; ประมาณ 150-250 MB เมื่อมี Main window + Overlay (ต้องวัดจริงด้วย `app.getAppMetrics()`) | ปานกลาง | สร้าง Overlay/Capture แบบ Lazy; ทำลาย Capture window หลังใช้; Overlay ไม่มี Animation; Throttle Push |
| ขนาด Installer ~123 MB (วัดจริง) | ต่ำถึงปานกลาง | ตัด Prebuilds ที่ไม่ใช่ win32-x64 และ `deps/src` ของ better-sqlite3; ตัด Locale (`electronLanguages`, ต้องตรวจสอบ) |
| เวลาเริ่มช้ากว่า Native (Chromium Startup) | ต่ำ | แสดง Main window เมื่อ `ready-to-show`; Overlay สร้างตอนเปิดครั้งแรก; เป้าหมายเสนอ <= 3 วินาทีถึง Dashboard (ต้องวัดจริง) |
| ต้อง Upgrade Electron สม่ำเสมอเพราะ Chromium Security Patch (นโยบายจำนวน Major ที่ได้รับการดูแลต้องตรวจสอบ) | ปานกลาง (ระยะยาว) | ใส่การตรวจ Electron ใน Release Checklist (Phase 5) |
| ไม่ใช่ Native Look | ต่ำ | แอปใช้ Dark Theme ของตัวเองอยู่แล้ว |
| Breaking Change ระหว่าง Major (ตัวอย่างจริง: Electron 44 เปลี่ยน `clipboard` เป็น Promise/ClipboardItem และ Preload แบบ Sandbox `require` ได้เฉพาะ `electron`) | ปานกลาง | ออกแบบตาม API ใหม่ตั้งแต่ต้น; ไม่ใช้ API ที่ถูกถอด |
| Native Module: ทุกโมดูลเพิ่มเงื่อนไข Rebuild (เครื่อง Dev ไม่มี Python/VS Build Tools) | ต่ำ (ใช้ better-sqlite3 ตัวเดียวที่มี Prebuilt) | ห้ามเพิ่ม Native Module โดยไม่ตรวจเงื่อนไขนี้ |

### 2.3 เหตุผลที่อยู่กับ Electron

1. Requirement 6 กำหนดว่า "อย่าเลือก Technology Stack ใหม่โดยไม่ตรวจสอบโครงสร้างและข้อจำกัดของโปรเจกต์เดิมก่อน" และ Owner decision 6 สั่งให้ใช้ Electron + Vue ต่อ
2. ความต้องการแกนหลัก 4 อย่าง (Overlay แบบ Transparent/Click-through, Region Capture, Global Hotkeys, Clipboard Image) มี API ใน Electron ครบ ไม่ต้องเขียน Win32 Interop หรือหา Crate เพิ่ม
3. ภาษาเดียว (TypeScript) ตลอด Main, Preload, Renderer ทำให้ `electron/ipc/contracts.ts` ใช้ร่วมกันได้ และ Domain Logic (`electron/domain/*.ts`) ทดสอบได้ภายหลังโดยไม่มี Electron
4. ความเสี่ยงหลักของผลิตภัณฑ์อยู่ที่ความเข้ากันได้กับเกม (Fullscreen Exclusive, Anti-cheat) ซึ่งไม่ต่างกันในทุก Stack เพราะ Overlay ทุกแบบเป็น Window ของ Process แยกที่ไม่ Inject เข้าเกม การเปลี่ยน Stack จึงไม่ลดความเสี่ยงนี้
5. จุดที่ Tauri/.NET ดีกว่าจริง (RAM, ขนาด) เป็นต้นทุนที่ยอมรับได้สำหรับแอป Desktop ที่เปิดคู่กับเกม ถ้าวัดจริงใน Phase 3/5 แล้วเกินงบ (ส่วนที่ 13) ให้ปรับ Overlay (ลดงาน, ทำลาย Window ตอนซ่อน) ก่อนพิจารณา Rewrite
6. ทางถอย: ชั้น Domain และ Repository เป็น TypeScript บริสุทธิ์ และข้อมูลเป็นไฟล์ SQLite มาตรฐาน ผู้ใช้จึงย้าย Stack ได้ภายหลังโดยไม่สูญเสียข้อมูล

## 3. Process Model และ Security Baseline

### 3.1 โครงสร้าง Process

```
+----------------------------------------------------------------------+
|                        Main Process (Node 24)                         |
|  app lifecycle | single-instance lock | protocol looter-img           |
|  database (better-sqlite3) | repositories | domain (aggregation,cycle)|
|  image store | pending images | backup/ZIP | settings | updater      |
|  hotkeys (globalShortcut) | capture (desktopCapturer) | clipboard     |
|  window manager: main / overlay / capture | IPC registry + validate   |
+---------+-----------------------+-----------------------+------------+
          | ipcMain.handle        | webContents.send      |
          | (invoke, typed)       | (push events)         |
          v                       v                       v
   +-------------+         +-------------+         +----------------+
   | Preload     |         | Preload     |         | Preload        |
   | (sandboxed) |         | (sandboxed) |         | (sandboxed)    |
   +------+------+         +------+------+         +-------+--------+
          v                       v                        v
   +-------------+         +--------------+        +----------------+
   | Main window |         | Overlay      |        | Capture window |
   | index.html  |         | overlay.html |        | capture.html   |
   | Vue Router  |         | Vue (เล็ก)   |        | 1 ต่อ display  |
   | (ถาวร)      |         | (Lazy, ซ่อนได้)|      | (ทำลายหลังใช้) |
   +-------------+         +--------------+        +----------------+
```

| ส่วน | หน้าที่ | อายุ |
|---|---|---|
| Main Process | เจ้าของข้อมูลและทรัพยากรระบบทั้งหมด ตัดสินใจทุกอย่างที่มีผลข้างเคียง | ตลอดแอป |
| Preload (`electron/preload.ts`) | สร้าง `window.api` จาก Contract เท่านั้น ไม่มี Logic | ต่อ Window |
| Main window | Dashboard, Library, Recipes, Quests, Gathering, Settings (Vue Router) | ตลอดแอป |
| Overlay window | แสดง/แก้จำนวนจากผล `gathering:changed` | สร้างครั้งแรกที่เปิด คงอยู่แบบซ่อน (ส่วนที่ 8.6) |
| Capture window | แสดง Screenshot ให้ลากเลือกบริเวณ | สร้างเมื่อกด Hotkey ทำลายทันทีหลังเสร็จหรือยกเลิก |

กฎ: มี Instance เดียว (`app.requestSingleInstanceLock()`; Instance ที่สองส่ง `second-instance` ให้ Instance แรกนำ Main window ขึ้น) เพื่อไม่ให้สอง Process เปิดไฟล์ SQLite เดียวกันและแย่งลงทะเบียน Hotkey

### 3.2 Security Baseline

| มาตรการ | ค่า / การใช้งาน | สถานะ |
|---|---|---|
| `contextIsolation` | `true` ทุก Window | ทำแล้วใน `electron/main.ts` |
| `nodeIntegration` | `false` ทุก Window (รวม `nodeIntegrationInWorker`, `nodeIntegrationInSubFrames`) | ทำแล้วสำหรับ Main window; ต้องคงค่าเดียวกันกับ Window ใหม่ |
| `sandbox` | `true` ทุก Window; Preload `require` ได้เฉพาะ `electron` (Electron 44) | ทำแล้วสำหรับ Main window |
| Raw `ipcRenderer` | ห้ามเปิดให้ Renderer แทนที่ `window.ipcRenderer` ด้วย `window.api` แบบ Typed | Phase 1 |
| IPC Validation | Handler ทุกตัวตรวจ Input ใน Main (ส่วนที่ 5.4) และตรวจ Sender (ส่วนที่ 5.5) | Phase 1 |
| CSP | ดูส่วนที่ 3.3 | Phase 1 (P1-08) |
| Navigation | `webContents.setWindowOpenHandler(() => ({ action: 'deny' }))`; ดัก `will-navigate` ปฏิเสธ URL นอก Origin ของแอป; ลิงก์ภายนอกเปิดด้วย `shell.openExternal` เฉพาะ `https:` ที่ผ่านรายการอนุญาต | Phase 1 |
| Permission | `session.setPermissionRequestHandler` ปฏิเสธทุกคำขอ ยกเว้น `display-capture` ของ Electron 44 ที่มาจากหน้าต่างของแอปเอง (Main/Capture window) ซึ่งอนุญาตตั้งแต่ Phase 4 เฉพาะเมื่อพบว่า `desktopCapturer` ต้องใช้ (ต้องตรวจสอบ; Capture ทำใน Main ด้วย `desktopCapturer` ไม่ใช้ `getDisplayMedia`) ตรงกับ Roadmap P4-02 และ Risks R-09 | Phase 1 |
| Remote content | ไม่โหลด Script/Resource จากอินเทอร์เน็ต; แอปทำงาน Offline (Requirement 9) | หลักการ |
| Electron Fuses | ปิด `RunAsNode`, `EnableNodeCliInspectArguments`; เปิด `OnlyLoadAppFromAsar`; electron-builder มีออปชันตั้ง Fuses (ชื่อและเวอร์ชันที่รองรับต้องตรวจสอบ) | Phase 5 |
| Path ไฟล์ | Renderer ไม่เคยได้ Path สัมบูรณ์; Main ตรวจ Path ทุกครั้งตาม [Data Model](04-data-model.md) ส่วน 5.2 | Phase 1-2 |

### 3.3 แผน CSP

ใช้ `<meta http-equiv="Content-Security-Policy">` ใน `index.html`, `overlay.html`, `capture.html` (ค่า Production) และแยกค่า Dev ตามที่ Roadmap P1-08 กำหนด

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data: looter-img:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'none';
form-action 'none';
```

ข้อสังเกต:

- Dev ต้องเพิ่ม `ws:` ใน `connect-src` และ `'unsafe-inline'` ใน `style-src` สำหรับ Vite HMR; ใส่ผ่าน `transformIndexHtml` เฉพาะโหมด `serve` เพื่อไม่ให้หลุดไป Production
- Production Build ใช้ CSS เป็นไฟล์ (Tailwind 4 ผ่าน `@tailwindcss/vite`) จึงไม่ต้อง Inline Style; ผลของ `:style` binding ของ Vue ผ่าน CSSOM ซึ่ง CSP ไม่บล็อก (ต้องตรวจสอบกับ Build จริง)
- เมื่อโหลดหน้าจาก `file://` การจับคู่ `'self'` กับ Origin ของ `file:` ต้องตรวจสอบกับ Electron 44 ทางเลือกสำรองคือลงทะเบียน Scheme `app://` สำหรับ Renderer ด้วยกลไกเดียวกับ `looter-img` แต่ยังไม่ทำจนกว่าทดสอบแล้วพบปัญหา
- `data:` ใน `img-src` มีไว้ให้ Preview ขนาดย่อของ Pending image (`capture:changed`) เท่านั้น

## 4. Module Layout

### 4.1 โครงสร้างที่เสนอ

```
electron/
  main.ts                   Bootstrap เท่านั้น: lock, ready, init ตามลำดับ, quit
  preload.ts                สร้าง window.api จาก contracts (ไม่มี Logic)
  app/
    lifecycle.ts            single-instance, before-quit (ปิด DB), second-instance
    paths.ts                data dir, images dir, backups dir, resolveDataPath()
    logger.ts               เขียนไฟล์ใน app.getPath('logs')
  windows/
    main-window.ts          สร้างและคืนค่า bounds ของ Main window
    overlay-window.ts       สร้าง / โหมด / Topmost / Bounds ของ Overlay
    capture-window.ts       สร้าง / ทำลาย Capture window ต่อ display
    window-registry.ts      ทะเบียน webContents id -> role (main | overlay | capture)
  ipc/
    contracts.ts            ชนิด Request/Response/Event + ตารางชื่อ Channel (ใช้ร่วม Main/Preload/Renderer)
    register.ts             ผูก handler ทั้งหมด ตรวจ Role ต่อ Channel
    validate.ts             Type guard ของ Input (เขียนเอง ไม่เพิ่ม Dependency)
    errors.ts               AppError + รหัส Error
    broadcast.ts            ส่ง push event, รวม/Throttle gathering:changed
    handlers/               profiles.ts items.ts recipes.ts quests.ts tracking.ts inventory.ts
                            gathering.ts overlay.ts capture.ts settings.ts backup.ts app.ts
  database/
    index.ts                เปิด Connection + PRAGMA + backup()
    migrate.ts              Runner
    migrations/index.ts     รายการ Migration
    migrations/001-initial.ts
    repositories/           Query ต่อ Entity (profile, item, inventory, recipe, quest, tracking, setting)
  domain/                   ไม่ import 'electron' หรือ 'better-sqlite3'
    aggregation.ts          Algorithm ตาม Data Model ส่วน 7
    cycle.ts                Cycle Detection ส่วน 8
    quantities.ts           กฎปัดค่า (ไม่ติดลบ, ค่าสูงสุด)
  gathering/
    service.ts              อ่านข้อมูล -> domain.aggregate -> เติมข้อมูลแสดงผล -> push
  images/
    image-store.ts          เขียน PNG + Thumbnail 64x64 (tmp + rename)
    pending-store.ts        Pending image ในหน่วยความจำ (TTL)
    image-protocol.ts       Scheme looter-img
  capture/
    screen-capture.ts       desktopCapturer + คำนวณ Crop
    clipboard-image.ts      clipboard.read() (Electron 44)
  hotkeys/
    hotkey-manager.ts       register / unregister / สถานะ
  settings/
    settings-service.ts     อ่าน/เขียน app_setting + ค่าเริ่มต้น
  backup/
    backup-service.ts       export / inspect / restore (fflate)
  updater/
    index.ts                electron-updater (Phase 5)
src/
  main.ts                   createApp + router
  router.ts                 hash history
  api.ts                    ห่อ window.api (unwrap IpcResult -> throw ApiError)
  stores/*.ts               Composable ที่รับ push event
  views/*.vue               Dashboard, ItemLibrary, Recipes, QuestTracker, Gathering, Settings
  components/*.vue          ใช้ร่วม (ชื่อตาม 05-ui-ux-design-plan.md ส่วน 7)
  overlay/                  Entry ของ overlay.html
  capture/                  Entry ของ capture.html
index.html  overlay.html  capture.html
```

ชื่อ Module ที่ Roadmap อ้าง (เช่น `electron/windows/overlay-window.ts`, `electron/gathering/service.ts`, `electron/ipc/handlers/capture.ts`, `electron/updater/index.ts`) ตรงกับตารางนี้

### 4.2 สิ่งที่แทนที่สิ่งใดในโค้ดปัจจุบัน

| ของเดิม | ปัญหา | ของใหม่ |
|---|---|---|
| `electron/database/index.js` (JSON "tables") | บั๊กหลายจุด (Repository Audit) | `electron/database/*` (SQLite) ลบไฟล์เดิมพร้อม `jsonpath-plus`, `yaml` |
| `electron/settings/index.js` | Persistence ถูก Comment ออก; `config` ไม่มีนิยาม | `electron/settings/settings-service.ts` + `app_setting` |
| `electron/helper.js` (`debounce`) | JavaScript ไม่มีชนิด | ย้ายเป็นฟังก์ชันเล็กใน `electron/ipc/broadcast.ts` (TypeScript) |
| `electron/preload.ts` (generic `ipcRenderer`) | เปิดทุก Channel | `window.api` แบบ Typed จาก `contracts.ts` |
| `electron/main.ts` (สร้าง Window ในไฟล์เดียว) | ผสม Lifecycle กับ Window | `main.ts` เป็น Bootstrap; โค้ดสร้าง Window และค่า Security เดิมย้ายไป `windows/main-window.ts` |
| `src/components/MaterialList.vue` (Placeholder) | ไม่ใช่โค้ดผลิตภัณฑ์ | `src/views/*` และ `src/components/*` |
| `src/vite-env.d.ts` (`Window.ipcRenderer`) | ชนิดของ Bridge เดิม | ประกาศ `Window.api` จาก `contracts.ts` |
| `src/index.css`, `src/fonts.css` | `--system-titleBar-height` ไม่นิยาม; ไม่ตั้ง `font-family` | คงไฟล์ ปรับให้นิยามตัวแปรและตั้งฟอนต์ |

Vite ตั้งเป็น Multi-page: ระบุ `index.html`, `overlay.html`, `capture.html` เป็น Input (ชื่อออปชันใน Vite 8/Rolldown คือ `build.rollupOptions` หรือ `build.rolldownOptions` ต้องตรวจสอบ) vite-plugin-electron สร้าง Entry ของ Main/Preload ตามเดิม Dev โหลด `${VITE_DEV_SERVER_URL}overlay.html` Production ใช้ `loadFile` ของไฟล์ใน `dist/`

## 5. Typed IPC

### 5.1 รูปร่างของ Contract

`electron/ipc/contracts.ts` เป็นไฟล์เดียวที่ Main, Preload และ Renderer import (ส่วนใหญ่เป็น Type; ตารางชื่อ Channel เป็นค่าคงที่เล็ก ๆ ที่ Bundle เข้า Preload ได้โดยไม่ต้อง `require` โมดูลอื่น)

```ts
// electron/ipc/contracts.ts (ร่าง)
export type ErrorCode =
  | 'VALIDATION' | 'NOT_FOUND' | 'DUPLICATE_NAME' | 'DUPLICATE_RECIPE' | 'DUPLICATE_TARGET'
  | 'ITEM_IN_USE' | 'CYCLE' | 'INSUFFICIENT_MATERIALS' | 'CAPTURE_FAILED' | 'CLIPBOARD_EMPTY'
  | 'UNSUPPORTED_IMAGE' | 'HOTKEY_CONFLICT' | 'HOTKEY_REGISTER_FAILED'
  | 'BACKUP_INVALID' | 'BACKUP_TOO_NEW' | 'IO'
  | 'FORBIDDEN' | 'INTERNAL'            // ระบุใน Feature Specification 14.2

export interface IpcError { code: ErrorCode; message: string; details?: unknown }
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError }

// ตารางชื่อ Channel: domain -> method -> channel
export const channels = {
  profiles: { list: 'profiles:list', create: 'profiles:create' /* ... */ },
  inventory: { adjust: 'inventory:adjust', set: 'inventory:set' /* ... */ },
} as const

// Request/Response ต่อ Channel (Main และ Preload ใช้ตรวจชนิด)
export interface InvokeMap {
  'inventory:adjust': { in: { itemId: number; delta: number }; out: { itemId: number; owned: number } }
  'profiles:list':    { in: void; out: ProfileSummary[] }
  // ...
}
export interface EventMap {
  'gathering:changed': GatheringResult
  'profile:changed':   { activeProfileId: number | null; profiles: ProfileSummary[] }
  // ...
}
```

ฝั่ง Main ลงทะเบียนผ่านฟังก์ชันเดียวที่บังคับชนิด Input/Output ตรวจ Sender และห่อ Error เป็น `IpcResult`:

```ts
// electron/ipc/register.ts (ร่าง)
function handle<K extends keyof InvokeMap>(
  channel: K,
  roles: WindowRole[],
  parse: (raw: unknown) => InvokeMap[K]['in'],
  run: (input: InvokeMap[K]['in']) => InvokeMap[K]['out'] | Promise<InvokeMap[K]['out']>,
) {
  ipcMain.handle(channel, async (event, raw) => {
    if (!isAllowedSender(event, roles)) return fail('FORBIDDEN', 'sender not allowed')
    try { return { ok: true, data: await run(parse(raw)) } }
    catch (e) { return toIpcError(e) }   // AppError -> code เดิม; อื่น ๆ -> INTERNAL + log
  })
}
```

ฝั่ง Preload สร้าง API จากตาราง `channels` ด้วย `ipcRenderer.invoke` แล้ว `contextBridge.exposeInMainWorld('api', api)` ส่วน `window.api.on(channel, cb)` รับเฉพาะชื่อที่อยู่ใน `EventMap` ห่อ Callback ไม่ให้ `event` object ของ Electron รั่วไปยัง Renderer และคืนฟังก์ชันยกเลิกการสมัคร

### 5.2 รายการ Channel ตาม Domain

รายการเป็นชุดเดียวกับ [Feature Specification](03-feature-specification.md) ส่วน 14.1 (ถ้าต่างกันให้ยึดเอกสารนั้น) คอลัมน์ Role คือ Window ที่อนุญาตให้เรียก (M = Main window, O = Overlay, C = Capture window)

| Domain | Channels (`<domain>:<action>`) | Role |
|---|---|---|
| `profiles` | `list`, `create`, `rename`, `delete`, `getDeleteSummary`, `switch`, `getActive` | M (O: `getActive`) |
| `items` | `list`, `get`, `create`, `update`, `setPinned`, `attachImage`, `removeImage`, `getUsage`, `delete` | M (O: `setPinned`) |
| `recipes` | `list`, `get`, `create`, `update`, `delete`, `validate`, `expand` | M |
| `quests` | `list`, `get`, `create`, `update`, `setStatus`, `delete` | M |
| `tracking` | `list`, `add`, `remove`, `update`, `reorder`, `setPinned` | M (O: `setPinned`) |
| `inventory` | `adjust`, `set`, `consume`, `craft` | M (O: `adjust`, `set`) |
| `gathering` | `get` | M, O |
| `overlay` | `show`, `hide`, `toggle`, `setMode`, `setOpacity`, `setCompact`, `resetLayout`, `getState`, `cycleScope`, `focusMainWindow`, `setBounds`* | M, O |
| `capture` | `start`, `cancel`, `commitSelection`, `fromClipboard`, `importFile`, `importPath`*, `listPending`, `discard` | M (C: `commitSelection`, `cancel`) |
| `settings` | `get`, `update`, `setHotkey`, `resetHotkeys`, `retryHotkeys` | M (O: `get`) |
| `backup` | `pickPath`, `export`, `inspect`, `restore` | M |
| `app` | `getInfo`, `openDataFolder` | M |

* ช่องที่เพิ่มเข้า Feature Specification 14.1 พร้อมกับเอกสารนี้ (ทั้งสองเอกสารตรงกันแล้ว):

- `overlay:setBounds` (`{ x, y, width, height }`) สำหรับ Grip ปรับขนาดและลากย้าย Overlay ซึ่ง [UI/UX Design Plan](05-ui-ux-design-plan.md) อ้างว่าอยู่ในเอกสารนี้ Main บีบค่าให้ไม่ต่ำกว่า 220x160 และอยู่ในจอที่มีอยู่จริง แล้วบันทึกแบบ Debounce 200 ms
- `capture:importPath` (`{ path }`) สำหรับ Drag-and-drop ไฟล์ ใช้ `webUtils.getPathForFile(file)` เฉพาะใน Preload (เอกสาร Electron แนะนำให้เรียกจาก Preload และเปิดผ่าน `contextBridge`; การใช้ได้ภายใต้ Sandbox ไม่ได้ระบุ ต้องตรวจสอบ) ถ้าใช้ไม่ได้ให้ตัด Drag-and-drop เหลือปุ่ม Import ที่เปิด `dialog.showOpenDialog`

### 5.3 Push events

ส่งจาก Main ด้วย `webContents.send(channel, payload)` ไปยังทุก Window ที่ลงทะเบียนใน `window-registry.ts` และยังไม่ถูกทำลาย

| Event | เมื่อใด | Payload |
|---|---|---|
| `profile:changed` | สร้าง / เปลี่ยนชื่อ / ลบ / สลับ Profile | `{ activeProfileId, profiles }` |
| `items:changed` | Item หรือภาพเปลี่ยน | `{ profileId, itemIds? }` |
| `recipes:changed` | Recipe เปลี่ยน | `{ profileId, recipeIds? }` |
| `quests:changed` | Quest หรือสถานะเปลี่ยน | `{ profileId, questIds? }` |
| `tracking:changed` | Target เปลี่ยน | `{ profileId }` |
| `inventory:changed` | `owned` เปลี่ยน | `{ profileId, changes[] }` |
| `gathering:changed` | ผลรวมคำนวณใหม่ | ผลลัพธ์ชุดเต็มของ `gathering:get` |
| `overlay:changed` | สถานะ Overlay เปลี่ยน | สถานะเดียวกับ `overlay:getState` |
| `settings:changed` | ค่าตั้งค่าหรือสถานะ Hotkey เปลี่ยน | ค่าเดียวกับ `settings:get` |
| `capture:changed` | ขั้นตอน Capture / Clipboard / Import เปลี่ยน | `{ phase, pending?, error? }` |
| `capture:frame`* | ส่งเฉพาะ Capture window ที่เพิ่งสร้าง (ไม่ Broadcast) | `{ frameUrl, displayBounds, imageWidth, imageHeight }` |

* `capture:frame` เป็น Event เฉพาะ Window ที่ระบุใน Feature Specification 14.1

กฎการส่ง:

- หลังทุกการเขียนที่กระทบผลรวม Main เรียก `gatheringService.schedule()` ซึ่งรวมคำขอภายใน 16 ms (`setTimeout` เดียว) คำนวณครั้งเดียวแล้วส่ง `gathering:changed` ไป Main window และ Overlay (แหล่งความจริงเดียว)
- ถ้า Overlay ซ่อนอยู่ ไม่ส่ง `gathering:changed` ไป Overlay แต่เก็บผลล่าสุดไว้ส่งครั้งเดียวตอนแสดง (Feature Specification F9-R14)
- Renderer แสดงผลจาก Payload ล่าสุดเท่านั้น ไม่คำนวณผลรวมเอง

### 5.4 การตรวจ Input

- Handler ทุกตัวมีฟังก์ชัน `parse` ใน `validate.ts` ที่รับ `unknown` และคืนชนิดที่ถูกต้องหรือโยน `AppError('VALIDATION')` พร้อมชื่อ Field ที่ผิด ตรวจ: ชนิด, จำนวนเต็ม, ช่วงค่า, ความยาวสตริง (ค่าเสนอใน Feature Specification: ชื่อ 1-100 หลัง `trim`, `notes` <= 2,000), ขนาด Array, ค่า Enum
- `id` ที่รับจาก Renderer ต้องถูกกรองด้วย `profile_id` ของ Active Profile ใน Repository (F1-R11) ไม่เชื่อ `profileId` ที่ Renderer ส่งมา
- SQL ใช้ Prepared Statement ที่มี Parameter เสมอ ไม่ต่อสตริง
- ห้ามรับ Path ไฟล์จาก Renderer ยกเว้น `capture:importPath` (ตรวจนามสกุลและอ่านผ่าน `nativeImage` เท่านั้น); `backup:*` ใช้ Path จาก `dialog` ที่ Main เปิดเอง
- ไม่เพิ่ม Library Validation (เช่น zod) ในรอบแรกเพื่อลด Dependency ประเมินใหม่เมื่อ Contract ซับซ้อนขึ้น (ต้องตรวจสอบ)

### 5.5 การตรวจ Sender

ก่อนรัน Handler ตรวจว่า `event.sender.id` อยู่ใน `window-registry`, Role ของมันอยู่ในรายการของ Channel นั้น และ `event.senderFrame` เป็น Main frame ของ Origin ที่แอปเสิร์ฟเอง (Dev: `VITE_DEV_SERVER_URL`; Production: `file://` ของ `dist/`) ไม่ผ่านให้คืน `FORBIDDEN` ผลคือถ้า Renderer ใด ๆ ถูกโจมตี ก็เรียกได้เฉพาะ Channel ของ Role นั้น (Overlay เรียก `backup:*` หรือ `capture:start` ไม่ได้)

### 5.6 การจัดการ Error

| ชั้น | พฤติกรรม |
|---|---|
| Domain / Repository | โยน `AppError(code, message, details?)` ตามรหัสใน Feature Specification 14.2 (`ITEM_IN_USE` พร้อม `details.usages`, `CYCLE` พร้อม `details.path`, `INSUFFICIENT_MATERIALS` พร้อม `details.items`) |
| SQLite Constraint | แปลง Unique Violation -> `DUPLICATE_NAME` / `DUPLICATE_RECIPE` / `DUPLICATE_TARGET`; Foreign Key RESTRICT จากการลบ -> `ITEM_IN_USE` (รหัส Error ของ better-sqlite3 ต้องตรวจสอบตอน Implement) |
| ไฟล์ | `fs` ล้มเหลว -> `IO` (ไม่แตะ DB ถ้าเขียนไฟล์ก่อน Commit ตาม Data Model ส่วน 5.3) |
| ไม่คาดคิด | บันทึก Stack ใน Log แล้วคืน `INTERNAL` พร้อมข้อความทั่วไป ไม่ส่ง Stack ไป Renderer |
| Renderer | `src/api.ts` แปลง `ok: false` เป็น `ApiError` ที่ Component จับแสดงใต้ช่องกรอกหรือ Toast ตาม [UI/UX Design Plan](05-ui-ux-design-plan.md) |
| Process | `uncaughtException` / `unhandledRejection` บันทึก Log; ไม่ปิดแอปโดยไม่แจ้ง |

หมายเหตุ: รหัส Error ทั้งหมดรวม `FORBIDDEN` และ `INTERNAL` ตรงกับ Feature Specification 14.2 และใช้ `ITEM_IN_USE` ทุกเอกสาร

## 6. Storage ด้วย better-sqlite3

รายละเอียด Schema, Migration และ Backup เชิงข้อมูลอยู่ใน [Data Model](04-data-model.md) ส่วนนี้กำหนดเฉพาะการใช้งานเชิงสถาปัตยกรรม

### 6.1 ข้อเท็จจริงที่ตรวจแล้ว (spike บน Electron 44.7.0 + electron-builder 26.17.0 + Bun)

- `better-sqlite3@13.0.3` เป็น N-API (`node-addon-api ^8`) ไม่มี install script มี Prebuilt อยู่ในแพ็กเกจ npm (`prebuilds/win32-x64` และแพลตฟอร์มอื่น; แพ็กเกจประมาณ 27 MB เมื่อแตก) ทำให้โหลดใน Electron 44 ได้โดยไม่ต้อง Rebuild (`process.versions.napi = 10`)
- ทดสอบแล้ว: SQLite 3.53.4, `journal_mode = WAL`, `foreign_keys = ON` บังคับใช้จริง (`FOREIGN KEY constraint failed`), `db.transaction()`, `ON DELETE CASCADE`
- Packaged: ต้องตั้ง `"npmRebuild": false` (ค่าเริ่มต้นทำให้ @electron/rebuild -> node-gyp ล้มเพราะไม่มี Python) electron-builder Unpack โมดูลไป `resources/app.asar.unpacked/node_modules/better-sqlite3/` เองและแอปที่ Package แล้วเปิด DB ได้
- ต้องอยู่ใน `dependencies` (vite-plugin-electron Externalize เฉพาะ `dependencies` ใน Production Build)
- ทางสำรอง: `node:sqlite` ใน Node 24 (API ยังเป็น Experimental และไม่ได้ทดสอบใน Electron) ใช้ได้ถ้า better-sqlite3 เป็นปัญหาในอนาคต

### 6.2 การเปิด Connection

```ts
// electron/database/index.ts (ร่าง)
import Database from 'better-sqlite3'

export function openDatabase(file: string) {
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')       // ต้องตั้งต่อ Connection ทุกครั้ง
  // synchronous คงค่าเริ่มต้น FULL ตาม Data Model ส่วนที่ 1 (ข้อมูลเล็ก ความถูกต้องสำคัญกว่าความเร็ว)
  db.pragma('busy_timeout = 3000')     // เสนอ: มี Connection เดียว แต่กันกรณี Backup/Restore
  return db
}
```

| หัวข้อ | การออกแบบ |
|---|---|
| Connection | หนึ่ง Connection ต่อแอปใน Main Process (Single-instance lock รับประกันว่าไม่มี Process อื่นเขียน) ไม่เปิด DB จาก Renderer หรือ Worker |
| Synchronous API | ข้อมูลระดับร้อยแถว Query หนึ่งครั้งเป็นระดับมิลลิวินาที; ห้าม Query หนักในบรรทัดเดียวกับ Event Hotkey; ถ้าวัดแล้วเกินงบ (ส่วนที่ 13) จึงพิจารณา Worker |
| Prepared Statement | สร้างครั้งเดียวต่อ Repository (Lazy) แล้วนำกลับมาใช้ |
| Transaction | ทุก Operation ที่เขียนมากกว่าหนึ่งแถวห่อด้วย `db.transaction(fn)` (ใช้ `.immediate()` สำหรับ Consume/Craft เพื่อล็อกการเขียนตั้งแต่ต้น); Handler = หนึ่ง Transaction = หนึ่ง Push ชุดหลัง Commit |
| Foreign Keys | `foreign_keys = ON` ทุกครั้งที่เปิด; Runner ปิดชั่วคราวนอก Transaction เฉพาะ Migration ที่ `rebuildsTables` ตาม Data Model |
| WAL | ไฟล์ `-wal`/`-shm` อยู่ข้าง DB; ตอนปิดแอป `db.pragma('wal_checkpoint(TRUNCATE)')` แล้ว `db.close()` ใน `before-quit` |
| Migration | `PRAGMA user_version` + ไฟล์ `electron/database/migrations/NNN-name.ts` แต่ละตัวอยู่ใน Transaction เดียวกับการเพิ่ม Version; ก่อน Migrate ถ้ามีการเปลี่ยน Version ให้สำรอง `await db.backup('<userData>\backups\gamelooter-v<N>-<timestamp>.sqlite')` เก็บ 5 ไฟล์ล่าสุด (Data Model ส่วน 4.3) |
| ความเสียหายของไฟล์ | `PRAGMA quick_check` ทุกครั้งที่เปิดแอป (Feature Specification F12-R6); `PRAGMA integrity_check` เฉพาะตอน Restore/Import; ไม่ผ่านหรือเปิดไม่ได้ -> Dialog แจ้งพร้อมตำแหน่ง `backups\` และทางเลือกกู้คืน/เริ่มใหม่ (F12-R9) |
| `db.backup()` | ใช้ SQLite Online Backup API (คืน Promise) สำหรับ Snapshot ที่สอดคล้องขณะแอปทำงาน ใช้ทั้ง Pre-migration และ Export |

### 6.3 โครงไฟล์ (ตาม Data Model ส่วน 5.1)

```
%APPDATA%\looter-app\                 (app.getPath('userData'))
  data\
    gamelooter.sqlite  (+ -wal, -shm ขณะเปิด)
    images\<profile_id>\<item_id>.png
    images\<profile_id>\thumbs\<item_id>.png     64x64
  backups\                            สำรองก่อน Migration (5 ไฟล์) และ pre-restore-<timestamp>\
  logs\ (หรือ app.getPath('logs'))    Log ไฟล์
```

### 6.4 Export / Import ZIP

- ไลบรารี: `fflate` (Pure JS, เล็ก) เวอร์ชันต้องตรวจสอบตอน Implement
- Export: `db.backup()` ไปไฟล์ชั่วคราว -> สร้าง `manifest.json` (`appVersion`, `schemaVersion`, `exportedAt`) -> เขียน ZIP แบบ Streaming (`Zip` ของ fflate) ไปยัง `<path>.tmp` แล้ว rename ไฟล์ SQLite บีบอัด (Deflate) ส่วน PNG เก็บแบบ Store (level 0) เพราะบีบอัดมาแล้ว อ่านไฟล์ทีละไฟล์เพื่อไม่ถือทั้งชุดในหน่วยความจำ (รายละเอียดขั้นตอนอยู่ใน Data Model ส่วน 6.2)
- Import/Restore: อ่าน `manifest.json` ก่อน -> ตรวจ Entry (ไม่มี `..`/Path สัมบูรณ์) -> แตกลงโฟลเดอร์ชั่วคราว -> `integrity_check` + `foreign_key_check` + Migrate -> ปิด Connection -> สลับโฟลเดอร์ด้วย rename -> `app.relaunch()` (Data Model ส่วน 6.3)
- ทุก Operation ที่ล้มเหลวต้องไม่แตะข้อมูลปัจจุบัน

## 7. Image Pipeline

### 7.1 เส้นทางของภาพ

```
 file (dialog / drag) --+
 clipboard (Win+Shift+S)+--> NativeImage --> Pending image (หน่วยความจำ Main, TTL)
 capture (crop) --------+                          |
                                                   | items:create(pendingImageId) / items:attachImage
                                                   v
              เขียน <item_id>.png (tmp + rename)  +  thumbs/<item_id>.png 64x64 (pad โปร่งใส)
                                                   v
                       UPDATE item SET image_path, thumbnail_path, updated_at
                                                   v
              Renderer โหลดผ่าน looter-img://data/images/... ?v=<updated_at>
```

- ทุกแหล่งภาพให้ผลเหมือนกัน: Pending image อยู่ในหน่วยความจำของ Main (`id`, PNG Buffer, กว้าง x สูง, `source`, `profileId`, เวลาสร้าง) ไม่เขียนดิสก์จนกว่าผู้ใช้ยืนยัน (Feature Specification F10-R5)
- ข้อจำกัด Pending (ค่าเสนอ ต้องวัดจริง): หมดอายุ 10 นาที (Feature Specification 14.3), จำกัดจำนวนและขนาดรวม (เช่น 5 ภาพ / 64 MB) เกินแล้วทิ้งตัวเก่าสุด; ล้างทั้งหมดเมื่อสลับ Profile
- ขั้นตอนเขียนไฟล์ + Thumbnail 64x64 (Pad ด้วยพื้นหลังโปร่งใส) ตาม [Data Model](04-data-model.md) ส่วน 5.3 ไม่ซ้ำที่นี่
- Thumbnail 64 px อาจเบลอบน High-DPI; ตัวเลือกคือเพิ่ม Thumbnail 128 px (เป็นคำถามเปิดใน UI/UX Design Plan; ต้องตัดสินก่อน Phase 2)

### 7.2 Custom Protocol `looter-img://` (ข้อเสนอ)

เหตุผล: หน้า Renderer โหลดจาก `file://` (Production) หรือ `http://localhost` (Dev) การอ้างไฟล์ใน `userData` ตรง ๆ ด้วย `file://` ต้องผ่อน CSP/Origin และเปิดให้ Renderer เห็น Path จริง Custom Scheme ทำให้ Main ตรวจ Path ทุกคำขอและ CSP ระบุได้แคบ (`img-src looter-img:`)

รูปแบบ URL: `looter-img://data/<relative path ใต้ data>?v=<updated_at>` เช่น `looter-img://data/images/3/12.png?v=2026-10-08T09%3A30%3A00.000Z` และ `looter-img://data/images/3/thumbs/12.png?v=...` (Item DTO มี `imageUrl` / `thumbnailUrl` ที่ Main ประกอบให้แล้ว ตาม Feature Specification 1.3 ข้อ 9)

```ts
// electron/images/image-protocol.ts (ร่าง)
import { protocol, net } from 'electron'
import { pathToFileURL } from 'node:url'

// ต้องเรียกก่อน app 'ready' และเรียกได้ครั้งเดียว (ตามเอกสาร Electron)
protocol.registerSchemesAsPrivileged([
  { scheme: 'looter-img', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

const ALLOWED = /^images\/\d+\/(?:thumbs\/\d+|\d+|profile-icon)\.png$/

app.whenReady().then(() => {            // protocol.handle เรียกได้หลัง ready เท่านั้น
  protocol.handle('looter-img', (request) => {
    if (request.method !== 'GET') return new Response(null, { status: 405 })
    const url = new URL(request.url)
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    if (url.host !== 'data' || !ALLOWED.test(rel)) return new Response(null, { status: 403 })
    const abs = resolveDataPath(rel)    // path.resolve + ตรวจขึ้นต้นด้วย dataDir + sep
    return net.fetch(pathToFileURL(abs).toString())
  })
})
```

ข้อกำหนด:

- ไม่ใช้ `bypassCSP`; อนุญาตเฉพาะ `GET` และเฉพาะรูปแบบชื่อไฟล์ตาม Regex (ปฏิเสธ `..`, Path สัมบูรณ์, นามสกุลอื่น) ไฟล์ไม่พบ -> `404` และ Renderer แสดง Placeholder (Acceptance Criteria ใน 08)
- Cache: ใส่ `?v=<updated_at>` เพื่อให้เปลี่ยน URL เมื่อภาพเปลี่ยน; ตอบ `Cache-Control` ระยะยาวได้ (การตั้ง Header บนผลของ `net.fetch` ต้องตรวจสอบ)
- Capture frame: ภาพ Screenshot เต็มจอ (ขนาดหลายสิบ MB เมื่อเป็น Bitmap) ไม่ส่งผ่าน IPC แบบ Structured Clone แต่ Main เก็บ PNG/JPEG ของเฟรมในหน่วยความจำและเสิร์ฟผ่าน `looter-img://capture/<token>` (Handler อีกสาขาที่อ่านจาก `Map<token, Buffer>`, token สุ่ม, ลบเมื่อปิด Capture window) ทางเลือกคือส่ง `Uint8Array` ผ่าน `capture:frame` ซึ่งง่ายกว่าแต่คัดลอกข้อมูลหนึ่งรอบ (เลือกตอน Implement จากการวัด)
- ทางเลือกที่ไม่เลือก: `file://` ตรง (เปิด Path), Data URL (ไม่แคชต่อภาพ, หนัก), IPC ส่ง Base64 ทุกครั้ง (ไม่ขยายตามจำนวน Item)

## 8. Overlay

### 8.1 การสร้าง Window

```ts
// electron/windows/overlay-window.ts (ร่าง)
const win = new BrowserWindow({
  ...bounds,                      // จาก app_setting.overlay (ตรวจกับ screen.getAllDisplays แล้ว)
  minWidth: 220, minHeight: 160,
  transparent: true,
  backgroundColor: '#00000000',
  frame: false,
  hasShadow: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: true,
  fullscreenable: false,
  maximizable: false,
  show: false,                    // แสดงด้วย showInactive() เพื่อไม่แย่ง Focus จากเกม
  webPreferences: { preload, contextIsolation: true, sandbox: true, nodeIntegration: false },
})
win.setAlwaysOnTop(true, 'screen-saver')   // ระดับสูงสุดของ Z-order ที่ Electron เปิดให้บน Windows
win.setOpacity(opacity)                    // 0.2-1.0
```

การปรับขนาดแบบ Native ของ Window ที่ `transparent` + `frame: false` บน Windows 11 ใช้ได้หรือไม่ ต้องตรวจสอบ (UI/UX Design Plan บันทึกเป็นคำถามเปิด) แผนสำรองคือ Grip ในหน้า (16x16 px) ส่งขนาดผ่าน `overlay:setBounds`

### 8.2 โหมด View และ Interactive

| โหมด | การตั้งค่าของ Window | พฤติกรรม |
|---|---|---|
| View (ค่าเริ่มต้น) | `win.setIgnoreMouseEvents(true, { forward: true })` + `win.setFocusable(false)` | คลิกทะลุไปที่เกม; ไม่แย่ง Focus; `forward: true` ทำให้ Renderer ยังได้ Mouse Move บน Windows (ใช้แสดง Hint เบา ๆ ถ้าต้องการ) |
| Interactive | `win.setIgnoreMouseEvents(false)`; ปุ่ม +/- ใช้ได้; ลาก/ปรับขนาดได้ | `setFocusable(true)` เมื่อต้องพิมพ์ตัวเลข; ปุ่ม +/- ควรทำงานโดยไม่ดึง Focus ถ้าเป็นไปได้ (ต้องตรวจสอบพฤติกรรมของ Window ที่ไม่ Focusable กับการคลิกบน Windows) |

สลับโหมดด้วย Hotkey (View คลิกไม่ได้จึงสลับด้วยปุ่มไม่ได้) และด้วยปุ่มใน Interactive; สถานะโหมดเก็บใน `app_setting.overlay.mode` และส่ง `overlay:changed` ทุกครั้ง

### 8.3 Opacity, Compact, Bounds

- Opacity: `win.setOpacity()` ครอบทั้ง Window (ค่าตั้งใน Settings 0.2-1.0, เริ่มต้น 0.9) ถูกกว่า CSS Opacity ที่ต้อง Composite ใหม่ทั้งเลเยอร์ (ต้องตรวจสอบว่า `setOpacity` ทำงานคงที่กับ Transparent Window ใน Electron 44)
- Compact: Renderer สลับ Layout (ซ่อนรายละเอียด) โดยไม่เปลี่ยน Bounds (เก็บ `overlay.bounds` ค่าเดียวตาม Data Model; ขนาดเริ่มต้นของ Full/Compact ใช้เมื่อ `bounds = null` หรือรีเซ็ต ตาม UI/UX Design Plan 10.2)
- Bounds: ฟัง `move` และ `resize` บันทึกด้วย Debounce 200 ms ลง `app_setting.overlay.bounds` (ค่าเสนอ); ตอนเริ่ม/จอเปลี่ยน ตรวจกับ `screen.getAllDisplays()` ถ้านอกทุกจอใช้ตำแหน่งเริ่มต้น (มุมขวาบนของจอหลัก)

### 8.4 การรักษา Topmost

เกมแบบ Borderless Windowed อาจยก Z-order ของตัวเองกลับ

- เรียก `win.setAlwaysOnTop(true, 'screen-saver')` และ `win.moveTop()` ซ้ำเป็นช่วง ๆ ขณะ Overlay แสดงอยู่: เสนอ 2,000 ms (ต้องตรวจสอบกับเกมจริง; ช่วงสั้นกินพลังงานเพิ่มเล็กน้อย)
- เรียกซ้ำเมื่อ `blur` ของ Main window, เมื่อ Display เปลี่ยน (`display-metrics-changed`) และหลัง Resume จาก Sleep (`powerMonitor` `resume`)
- หยุด Interval ทันทีที่ซ่อน Overlay (Roadmap P3-09)

### 8.5 งบประสิทธิภาพของ Overlay

| รายการ | กฎ |
|---|---|
| Animation / Transition | ไม่มี (Feature Specification F9-R11) |
| Timer ใน Renderer | ไม่มีที่ทำงานต่อเนื่อง; ไม่ Poll ทุกอย่างรับจาก Push |
| ข้อมูล | รับเฉพาะ `gathering:changed` และ `inventory:changed`; ไม่เรียก `list` ของตารางอื่น |
| ภาพ | Thumbnail เท่านั้น |
| DOM | แสดงเฉพาะแถวของ Scope ที่เลือก (เสนอสูงสุด ~50 แถว ต้องวัด) |
| Throttle | ซ่อนอยู่ไม่ส่ง; แสดงอยู่ส่งไม่เกินครั้งต่อ 16 ms |
| `backgroundThrottling` | คงค่าเริ่มต้น (`true`) |
| GPU | Transparent Window ต้อง Composite; ถ้าวัดแล้วพบ GPU สูงบนเครื่องเก่า พิจารณา Compact เป็นค่าเริ่มต้นหรือลด Opacity Layer (ต้องวัด) |

### 8.6 วงจรชีวิต

สร้างตอน `overlay:show` ครั้งแรก (Lazy) -> `ready-to-show` -> `showInactive()` ซ่อนด้วย `hide()` (ไม่ทำลาย) เพื่อให้สลับด้วย Hotkey ได้ทันที ราคาคือ RAM ของ Renderer หนึ่งตัวยังคงอยู่ ตัวเลือกประหยัด RAM คือทำลาย Window เมื่อซ่อนนานเกินเวลาที่ตั้ง (เสนอ 10 นาที ต้องวัดเวลาสร้างใหม่ก่อนตัดสิน)

### 8.7 ความเข้ากันกับเกมและ Anti-cheat

| สถานการณ์ | พฤติกรรม | จุดยืน |
|---|---|---|
| Borderless Windowed | Overlay แสดงทับได้ตามปกติ | เป้าหมายหลัก (Owner decision 9) |
| Fullscreen Exclusive | Window ปกติของ OS ไม่ถูกแสดงทับเกม | ข้อจำกัดที่บันทึกไว้ วิธีแก้ที่แนะนำ: ตั้งเกมเป็น Borderless Windowed |
| Anti-cheat | ระบบบางชนิดอาจตรวจ/บล็อก Window แบบ Topmost หรือการจับภาพหน้าจอ | แอปเป็น Process แยก ไม่ Inject DLL ไม่ Hook DirectX/Vulkan ไม่อ่านหน่วยความจำเกม ไม่หลบเลี่ยงระบบป้องกัน ผู้ใช้ต้องตรวจนโยบายของเกมเอง รายละเอียดอยู่ใน [Risks & Limitations](07-risks-and-limitations.md) |

ไม่ใช้เทคนิค Injection หรือ Hook ใด ๆ ทั้งใน Phase นี้และต่อไป

## 9. Capture Pipeline

### 9.1 ลำดับงาน

```
Hotkey Ctrl+Shift+X (หรือปุ่มใน Item Library)
  1. display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  2. ซ่อน Overlay และ Main window ชั่วคราว (ไม่ให้ติดในภาพ) แล้วรอ 1-2 เฟรม (เสนอ ~100 ms ต้องวัด)
  3. desktopCapturer.getSources({ types: ['screen'], thumbnailSize })  -> เลือก source ที่ display_id ตรง
  4. ตรวจเฟรมว่าไม่ดำ -> ถ้าดำ/ล้มเหลว: ส่ง capture:changed phase 'failed' + คำแนะนำ Fallback
  5. แสดง Overlay/Main ที่ซ่อนไว้กลับ (หรือหลังปิด Capture window)
  6. สร้าง Capture window (frameless, บน bounds ของ display) แสดงเฟรม
  7. ผู้ใช้ลากเลือกบริเวณ -> capture:commitSelection({ rect }) (หน่วย CSS px)
  8. Main แปลง rect เป็น Pixel ของภาพ -> nativeImage.crop -> Pending image
  9. ทำลาย Capture window -> capture:changed phase 'captured' -> Main window แสดง Dialog ตั้งชื่อ Item
```

### 9.2 `desktopCapturer` และคำนวณ DPI

```ts
// electron/capture/screen-capture.ts (ร่าง)
const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
const size = {
  width: Math.round(display.size.width * display.scaleFactor),    // display.size หน่วย DIP
  height: Math.round(display.size.height * display.scaleFactor),
}
const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size })
const source = sources.find((s) => s.display_id === String(display.id))
const frame: NativeImage | undefined = source?.thumbnail   // ถ้า undefined -> CAPTURE_FAILED

// หลังผู้ใช้เลือก rect (CSS px ภายใน Capture window ที่ครอบ display.bounds)
const sx = frame.getSize().width / display.bounds.width           // ใช้สัดส่วนจริงของภาพ ไม่ใช้ scaleFactor ตรง ๆ
const sy = frame.getSize().height / display.bounds.height
const crop = {
  x: clamp(Math.round(rect.x * sx), 0, w - 1),
  y: clamp(Math.round(rect.y * sy), 0, h - 1),
  width: clamp(Math.round(rect.width * sx), 1, w),
  height: clamp(Math.round(rect.height * sy), 1, h),
}
const image = frame.crop(crop)
```

หลักคิด: ขนาดภาพจริงที่ได้อาจไม่เท่ากับ `size × scaleFactor` พอดี (Fractional scaling เช่น 125%/150% ปัดเศษ) จึงคำนวณจากสัดส่วนภาพต่อ DIP ของ display เอง และบีบค่าไม่ให้เกินขอบ (การจับคู่ `display_id` กับ `display.id` และขีดจำกัดของ `thumbnailSize` ต้องตรวจสอบกับ Electron 44 บนเครื่องหลายจอ)

### 9.3 การจัดการความล้มเหลว

| กรณี | การตรวจ | ผล |
|---|---|---|
| `getSources` โยน Error หรือคืนรายการว่าง | `try/catch` + ตรวจความยาว | `CAPTURE_FAILED` |
| ไม่พบ source ของ display | `find` คืน `undefined` | `CAPTURE_FAILED` (ลองใช้ source แรกเมื่อมีจอเดียว) |
| เฟรมดำ (Fullscreen Exclusive, เนื้อหาที่ป้องกัน) | สุ่มจุดบนกริด (เช่น 32x18) ถ้า Luminance ทุกจุดต่ำกว่าเกณฑ์ | `CAPTURE_FAILED`; เกณฑ์ต้องตรวจสอบกับภาพจริงจากเกม (Feature Specification 14.3) |
| เกินเวลา | Timeout (เสนอ 3 วินาที) | `CAPTURE_FAILED` |
| ผู้ใช้กด Esc | Capture window ส่ง `capture:cancel` | ทำลาย Window, `capture:changed` phase `cancelled` |
| บริเวณเล็กเกิน (< 8x8 px, ค่าเสนอ) | ตรวจใน Main | ไม่สร้าง Pending image |

ทุกกรณีล้มเหลวต้องแจ้งผู้ใช้พร้อมทางเลือก Fallback: กด Win+Shift+S แล้ว `Ctrl+Shift+V` (หรือปุ่ม "Paste from clipboard"), หรือ Import ไฟล์ภาพ

### 9.4 Capture window

- หนึ่ง Window ต่อ display ที่ใช้ (Phase 4 รองรับเฉพาะ display ใต้ cursor; การเปิดทุก display ต้องตรวจสอบความจำเป็นหลัง Phase 4)
- ตัวเลือก: `x/y/width/height` = `display.bounds`, `frame: false`, `alwaysOnTop` (`'screen-saver'`), `skipTaskbar: true`, `resizable: false`, `movable: false`, `fullscreenable: false`, `show: false` แล้ว `show()` เมื่อรูปโหลดเสร็จ; ไม่ใช้โหมด `fullscreen` ของ Electron เพื่อเลี่ยงการเปลี่ยนโหมดแสดงผลของจอ
- การแสดง Window ทับเกม Borderless อาจทำให้บางเกมสูญเสีย Focus หรือย่อหน้าต่าง (ต้องตรวจสอบกับเกมจริง); เพราะเฟรมถูกจับก่อนแล้ว เกมไม่จำเป็นต้องกลับมาทำงานระหว่างเลือก
- ทำลาย Window ทันทีที่เสร็จหรือยกเลิก (ปล่อย RAM)

### 9.5 Clipboard (Electron 44)

`clipboard` ใช้ได้เฉพาะ Main Process และเป็น W3C Clipboard API ใน Electron 44 (`readImage`, `writeImage`, `readBuffer`, `availableFormats` ถูกถอด) ขั้นตอนอ่านภาพที่ผู้ใช้ตัดด้วย Win+Shift+S:

```ts
// electron/capture/clipboard-image.ts (ร่าง)
import { clipboard, nativeImage } from 'electron'

export async function readClipboardImage() {
  const items = await clipboard.read()               // Promise<ClipboardItem[]>
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'))
    if (!type) continue
    const blob = await item.getType(type)            // Blob
    const image = nativeImage.createFromBuffer(Buffer.from(await blob.arrayBuffer()))
    if (!image.isEmpty()) return image
  }
  throw new AppError('CLIPBOARD_EMPTY', 'ไม่มีภาพใน Clipboard')
}
```

หมายเหตุ: MIME Type ที่ Snipping Tool วางจริง (เช่น `image/png`) และการที่ `clipboard.read()` ต้องการสิทธิ์/User activation ใน Main ต้องตรวจสอบตอน Implement; ไม่มีการ Poll Clipboard ทำเฉพาะเมื่อผู้ใช้กด Hotkey `Ctrl+Shift+V` หรือปุ่ม

### 9.6 Import ไฟล์

`dialog.showOpenDialog` (เปิดจาก Main) -> `nativeImage.createFromPath()` -> Pending image รูปแบบที่อ่านได้นอกจาก PNG/JPEG ขึ้นกับ Chromium ใน Electron 44 (ต้องตรวจสอบ) ภาพว่าง -> `UNSUPPORTED_IMAGE` ขนาดไฟล์สูงสุดยังไม่กำหนด (ต้องตรวจสอบ)

## 10. Global Hotkeys

`electron/hotkeys/hotkey-manager.ts` ใช้ `globalShortcut` ของ Electron ค่าเริ่มต้นตาม Feature Specification F11 (ตั้งค่าได้ใน Settings)

| การกระทำ | ค่าเริ่มต้น |
|---|---|
| Toggle overlay visible | `CommandOrControl+Shift+O` |
| Toggle overlay mode (View / Interactive) | `CommandOrControl+Shift+M` |
| Start region capture | `CommandOrControl+Shift+X` |
| Import image from clipboard | `CommandOrControl+Shift+V` |
| Overlay: next target | `CommandOrControl+Shift+]` |
| Overlay: previous target | `CommandOrControl+Shift+[` |

กฎการทำงาน:

1. ลงทะเบียนหลัง `app.whenReady()` และหลังอ่าน `app_setting.hotkeys`; ทุกตัวผ่าน `globalShortcut.register(accelerator, handler)` ถ้าคืน `false` (ถูกโปรแกรมอื่นหรือเกมใช้) ให้บันทึกสถานะ "ลงทะเบียนไม่สำเร็จ" และส่ง `settings:changed` ให้ Settings แสดงเตือน (คืน `HOTKEY_REGISTER_FAILED` เมื่อผู้ใช้เป็นผู้ตั้งค่า)
2. เปลี่ยนค่า: ตรวจรูปแบบ (ต้องมี Modifier อย่างน้อยหนึ่งตัว), ตรวจซ้ำกับการกระทำอื่น (`HOTKEY_CONFLICT`), `register` ค่าใหม่ก่อน สำเร็จแล้วจึง `unregister` ค่าเก่า ล้มเหลวคงค่าเดิม
3. `settings:retryHotkeys` ลงทะเบียนรายการที่ล้มเหลวอีกครั้ง
4. `app.on('will-quit')` เรียก `globalShortcut.unregisterAll()`
5. Handler เบา: ส่งต่อไปที่ Service (ไม่ Query หนัก) และกันการกดค้าง (Debounce เสนอ 150 ms)
6. Hotkey ถูก Consume โดย OS ตามกลไกของ `RegisterHotKey` ที่ Electron ใช้ ปุ่มนั้นจึงไม่ถึงเกม (ต้องตรวจสอบพฤติกรรมกับเกมที่ใช้ Raw Input) ผู้ใช้ควรเลือกชุดปุ่มที่เกมไม่ใช้
7. Accelerator ที่ OS สงวน (เช่น กลุ่ม `Super`) จะลงทะเบียนไม่สำเร็จและต้องแสดงเหตุผลให้ผู้ใช้

## 11. Packaging และการแจกจ่าย

### 11.1 ค่า electron-builder ที่เสนอ

```json5
// electron-builder.json5 (ส่วนที่ต้องเปลี่ยนเมื่อเพิ่ม better-sqlite3)
{
  npmRebuild: false,                       // ไม่มี Python/VS Build Tools; better-sqlite3 13 มี Prebuilt
  asar: true,
  // better-sqlite3 ถูก Unpack อัตโนมัติ; ตัดของที่ไม่ใช้เพื่อลดขนาด (Pattern ต้องตรวจกับ Layout จริงของแพ็กเกจ)
  files: [
    '!**/node_modules/better-sqlite3/{deps,src}/**',
    '!**/node_modules/better-sqlite3/prebuilds/{darwin,linux}*/**',
    '!**/node_modules/better-sqlite3/prebuilds/win32-arm64*/**',
  ],
  win: { target: [{ target: 'nsis', arch: ['x64'] }], icon: 'build/looter.ico' },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true },   // เสนอ
}
```

| หัวข้อ | การตัดสินใจ / ข้อกำหนด |
|---|---|
| `npmRebuild` | `false` ทันทีที่เพิ่ม better-sqlite3 (ยืนยันแล้วใน spike) |
| ตัดไฟล์ | ยกเว้น Prebuilds ที่ไม่ใช่ `win32-x64` และ `deps/`, `src/` ผ่าน `files` glob; ตรวจขนาด Installer ก่อน/หลังและตรวจว่าแอปที่ Package แล้วเปิด DB ได้ |
| Icon | `win.icon` ต้องเป็น `.ico` ที่มีขนาด >= 256x256 (ปัจจุบัน `public/looter.ico` 128x128 ทำให้ electron-builder ใช้ไอคอนเริ่มต้นของ Electron); เตรียมไฟล์ .ico หลายขนาด (16/32/48/256) |
| Target | NSIS x64 เท่านั้น (Windows 10/11); Electron 44 ถอด Windows ia32 แล้ว |
| App ID | ตั้ง `app.setAppUserModelId(appId)` ให้ตรงกับ `appId` ของ electron-builder เพื่อการจัดกลุ่ม Taskbar |
| ข้อมูลผู้ใช้ | `userData` = `%APPDATA%\looter-app` คงไว้ (ชื่อ Package); ตัวถอนการติดตั้งไม่ลบข้อมูลผู้ใช้โดยค่าเริ่มต้น (ต้องตรวจสอบค่า `deleteAppDataOnUninstall`) |
| Locale | พิจารณา `electronLanguages` ลดขนาด (ต้องตรวจสอบ) |
| Fuses | ตั้งตามส่วนที่ 3.2 (Phase 5) |
| Code signing | ยังไม่มี Certificate; Installer ไม่ Sign จะเจอ SmartScreen "Windows protected your PC" ต้องบันทึกใน README/Release Notes ว่าผู้ใช้กด "More info -> Run anyway" ทางเลือกในอนาคต: Certificate OV/EV หรือบริการ Sign แบบ Cloud (ต้องตรวจสอบราคาและเงื่อนไข) การตัดสินใจทำใน Phase 5 |
| Windows 10/11 | ต้องทดสอบบนทั้งสองรุ่นก่อนปล่อย (Phase 5); เวอร์ชัน Windows 10 ขั้นต่ำของ Electron 44 ต้องตรวจสอบกับเอกสารทางการ |

### 11.2 แผน Auto-update (ยังไม่ทำใน Phase 1)

| หัวข้อ | แผน |
|---|---|
| ไลบรารี | `electron-updater` (เวอร์ชันต้องตรวจสอบ) เป็น `dependencies` |
| Source | GitHub Releases (`publish: { provider: 'github', owner, repo }`; repo ใน README คือ `dvgamerr-app/looter-app` สิทธิ์เขียนต้องตรวจสอบ) |
| ไฟล์ที่ต้องมี | `GameLooter-Windows-<version>-Setup.exe`, `latest.yml`, `.blockmap` (electron-builder สร้างให้อยู่แล้ว) |
| ลำดับ | รุ่นแรก: ปุ่ม "Check for updates" แบบ Manual เท่านั้น, `autoDownload = false`, ถามผู้ใช้ก่อนดาวน์โหลดและก่อนติดตั้ง |
| ความปลอดภัย | การตรวจลายเซ็นของ electron-updater บน Windows ผูกกับ Code Signing (`publisherName`); พฤติกรรมเมื่อ Installer ไม่ Sign ต้องตรวจสอบก่อนเปิดใช้ |
| Release process | GitHub Actions เมื่อ tag `v*`: `bun install --frozen-lockfile` -> `bun run build` -> อัปโหลดเป็น Draft Release (ต้องมี `contents: write`, ต้องตรวจสอบ) ตาม Roadmap P5-07 |
| ความเข้ากันกับข้อมูล | ก่อนอัปเดตไม่ต้องทำอะไรกับข้อมูล; Migration ทำเองตอนเปิดแอปเวอร์ชันใหม่พร้อมสำรองอัตโนมัติ (ส่วนที่ 6.2) |
| ปิดได้ | มีตัวเลือกปิดการตรวจอัปเดต (แอปทำงาน Offline เป็นหลัก) |

## 12. High-DPI และ Multi-monitor

กฎที่ใช้ทั้งโค้ด Main และ Renderer:

1. หน่วยพิกัดของ `BrowserWindow`, `screen` และ Bounds ที่บันทึกใน `app_setting` เป็น DIP (device-independent pixel) เสมอ Chromium จัดการ Per-Monitor DPI ให้ Renderer (CSS px = DIP)
2. การคำนวณที่ต้องใช้ Pixel จริง (Capture, Crop) ใช้สัดส่วน `ขนาดภาพจริง / display.bounds` (ส่วนที่ 9.2) ไม่ใช้ `scaleFactor` ตรง ๆ และไม่คูณซ้ำกับค่า `scaleFactor` ของจอที่ผู้ใช้ย้ายหน้าต่างไปภายหลัง
3. Capture เลือก display จากตำแหน่ง cursor (`screen.getDisplayNearestPoint`) และ `thumbnailSize` = ขนาด display (DIP) x `scaleFactor` เพื่อไม่ให้ภาพเบลอ
4. Capture window ตั้ง `x/y/width/height` เท่ากับ `display.bounds` ของจอนั้น (ไม่ใช้ `workArea` เพราะต้องครอบ Taskbar ด้วย); แสดงภาพที่ 1 CSS px ต่อ 1 DIP โดยใช้ภาพขนาด Pixel จริง (ตั้ง `width/height` ของ `<img>` เป็นขนาด DIP) ตามที่ UI/UX Design Plan กำหนด
5. Bounds ที่บันทึกไว้ (Main window, Overlay) ต้องถูกตรวจกับ `screen.getAllDisplays()` ทุกครั้งที่ใช้ ถ้านอกทุกจอ (ถอดจอ, เปลี่ยนความละเอียด, Restore จากเครื่องอื่น) ให้ใช้ตำแหน่งเริ่มต้น และใช้ `getNormalBounds()` ของ Main window ตอนบันทึกเพื่อไม่ให้บันทึกค่าตอน Maximize
6. ฟัง `screen` Events (`display-added`, `display-removed`, `display-metrics-changed`) เพื่อจัด Overlay ให้อยู่ในจอที่เหลือ และ Re-assert Topmost
7. การลาก Overlay ข้ามจอที่ Scale ต่างกันอาจมีอาการขนาดกระโดด (ปัญหาที่พบได้กับ Window ใน Chromium; ต้องตรวจสอบกับ Electron 44 และถ้าเกิด ให้ตั้ง Bounds ซ้ำหลัง `moved`)
8. ตัวอย่างที่ต้องทดสอบก่อนปล่อย (Phase 5): 100%/125%/150%/200% บนจอเดียว, สองจอ Scale ต่างกัน, จอหลักไม่ใช่จอซ้ายสุด (พิกัดติดลบ), ถอดจอขณะ Overlay เปิดอยู่

## 13. งบประสิทธิภาพและหน่วยความจำ

ตัวเลขทั้งหมดเป็นเป้าหมายเสนอ ต้องวัดจริงและปรับในเอกสารนี้หลังแต่ละ Phase (วัดด้วย `app.getAppMetrics()` และ Task Manager)

| ตัวชี้วัด | เป้าหมายเสนอ | หมายเหตุ |
|---|---|---|
| RAM รวมทุก Process (Main window เปิดเดียว) | <= 200 MB | Acceptance Criteria 08 ใช้ช่วง 150-250 MB เมื่อมี Overlay |
| RAM รวม (Main + Overlay) | 150-250 MB | ตาม AC-PERF-04 (Phase 3) |
| CPU เมื่อ Idle (Overlay เปิด, ไม่มีการกระทำ) | ใกล้ 0% | ไม่มี Timer/Animation ใน Renderer |
| เวลาเริ่มจนเห็น Dashboard | <= 3 วินาที | วัดบน SSD, เครื่อง Dev |
| ปรับจำนวน (`inventory:adjust`) ถึงหน้าจออัปเดต | <= 50 ms | รวม Aggregation + Push |
| Aggregation | <= 16 ms ที่ข้อมูลระดับร้อย Item / สิบ Targets | Domain บริสุทธิ์ ทดสอบด้วยข้อมูลสังเคราะห์ภายหลัง |
| Hotkey เปิด/ปิด Overlay | <= 100 ms | Window คงอยู่แบบซ่อน |
| Hotkey Capture ถึงเห็น Capture window | <= 500 ms | ขึ้นกับ `desktopCapturer` และขนาดจอ |
| ไม่มี Memory เพิ่มต่อเนื่อง | กด +/- ซ้ำ 200 ครั้งแล้ว RAM ไม่เพิ่มต่อเนื่อง | AC-PERF-04 |

มาตรการ: สร้าง Window แบบ Lazy; ทำลาย Capture window หลังใช้ และล้างเฟรมใน Main; Pending image มีเพดานและ TTL; Push ถูกรวมและ Throttle; ไม่มี Polling (ยกเว้น Interval Topmost ขณะ Overlay แสดง); เลื่อนโหลด Thumbnail ตามที่เห็น (Lazy) ใน Item Library ที่มี Item จำนวนมาก; ไม่ปิด Hardware Acceleration โดยค่าเริ่มต้น (การปิดจะกระทบ Transparent Window ต้องตรวจสอบก่อนเสนอเป็นตัวเลือก)

## 14. ข้อกำหนดด้าน Tooling

| หัวข้อ | ข้อกำหนด |
|---|---|
| Package manager | Bun 1.4.2 (`packageManager: bun@1.4.2`, `engines: { bun: ">=1.4.2", node: ">=20.19.0" }`) |
| Lockfile | `bun.lock` ต้องตรงกับ `package.json`; ตรวจด้วย `bun install --frozen-lockfile` |
| Lifecycle scripts | `trustedDependencies: ["electron"]` เท่านั้น (Bun's default trusted list รัน `electron-winstaller` install script ที่ต้องมี `node` และล้ม); better-sqlite3 v13 ไม่มี script จึงไม่ต้องเพิ่ม |
| Electron binary | Electron 42+ ไม่ดาวน์โหลดไบนารีใน `postinstall`; ดาวน์โหลดเมื่อรัน `bun x electron` ครั้งแรก |
| Node.js | ไม่มีในเครื่อง Dev ปัจจุบัน; ต้องใช้ Node.js 24 LTS สำหรับ `bun run typecheck` เท่านั้น (`vue-tsc` ผ่าน Bun จะตกเป็น `tsc` ธรรมดาและข้ามไฟล์ `.vue` เงียบ ๆ) ตัวเลือก: ติดตั้ง Node 24 บนเครื่อง Dev หรือรัน Type-check ใน CI |
| Type-check | `typecheck:main` (`tsc --noEmit -p tsconfig.node.json`) ใช้ได้ภายใต้ Bun; `typecheck:renderer` (`vue-tsc`) ต้องมี Node |
| TypeScript | 5.9.x เท่านั้น; ห้าม TS 6/7 (typescript-eslint ยังไม่รองรับ) |
| Lint | ESLint 10 flat config (`bun run lint`) |
| ลำดับตรวจสอบก่อนส่งงาน | `bun install --frozen-lockfile` -> `bun run lint` -> `bun run typecheck` (ต้องมี Node) -> `bun x vite build` -> `bun run build` (เมื่อแตะ Packaging) -> `bun audit` -> `git diff --check` |
| Tests | ไม่เขียนหรือแก้ Test Scripts จนกว่าจะได้รับคำสั่ง (Requirement 9); ออกแบบ `electron/domain/*.ts` ให้ไม่ import Electron/better-sqlite3 เพื่อทดสอบได้ภายหลัง |
| Native Module | ห้ามเพิ่มโดยไม่ตรวจว่ามี Prebuilt สำหรับ Electron 44 (ABI 149) หรือ N-API; เครื่อง Dev ไม่มี Python/VS Build Tools |
| Audit | `bun audit` คงเหลือ 3 Advisory แบบ Transitive ที่เป็น Build-time (`braces`, `sprintf-js`, `tmp`) ไม่ถูกบรรจุในแอป; ตรวจซ้ำก่อนทุก Release |

## 15. ข้อควรตรวจสอบก่อน Implement

| รายการ | อ้างอิง |
|---|---|
| ค่า CSP ที่ใช้งานได้จริงกับ `file://` และ Vite 8 Production Build | ส่วนที่ 3.3 |
| `webUtils.getPathForFile` ใช้ได้ใน Preload แบบ Sandbox หรือไม่ | ส่วนที่ 5.2 |
| ชื่อออปชัน Multi-page ของ Vite 8 (`rollupOptions` / `rolldownOptions`) | ส่วนที่ 4.2 |
| การปรับขนาด Native ของ Transparent + Frameless Window บน Windows 11 | ส่วนที่ 8.1 |
| การคลิกปุ่มใน Window ที่ไม่ Focusable โดยไม่ดึง Focus จากเกม | ส่วนที่ 8.2 |
| ช่วงเวลา Re-assert Topmost ที่เหมาะสมกับเกมจริง | ส่วนที่ 8.4 |
| ข้อจำกัด `thumbnailSize` / การจับคู่ `display_id` บนหลายจอ และเกณฑ์ตรวจเฟรมดำ | ส่วนที่ 9.2, 9.3 |
| MIME Type ที่ Snipping Tool วางใน Clipboard และเงื่อนไขของ `clipboard.read()` | ส่วนที่ 9.5 |
| อาการของ Overlay เมื่อลากข้ามจอที่ Scale ต่างกัน | ส่วนที่ 12 |
| เวอร์ชัน `fflate` และ `electron-updater`; พฤติกรรม updater กับ Installer ที่ไม่ Sign | ส่วนที่ 6.4, 11.2 |
| Pattern `files` ที่ตัด Prebuilds ตรงกับ Layout จริงของ better-sqlite3 และ Fuses ใน electron-builder 26.17 | ส่วนที่ 11.1 |
| ระดับ RAM/CPU จริงของ Overlay แบบ Transparent บนเครื่องเก่า | ส่วนที่ 13 |
| รหัส Error ของ better-sqlite3 สำหรับ Constraint | ส่วนที่ 5.6 |
