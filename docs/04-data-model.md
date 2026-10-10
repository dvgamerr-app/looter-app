# Data Model

เอกสารนี้กำหนด SQLite Schema, ความสัมพันธ์ระหว่าง Entities, กลยุทธ์ Migration, การจัดเก็บไฟล์ภาพ, รูปแบบ Backup/Export และ Algorithm การคำนวณ Materials ของ GameLooter เพื่อใช้เป็นข้อกำหนดกลางสำหรับ Phase 1 และ Phase 2

อัปเดตล่าสุด: 2026-10-08

เอกสารที่เกี่ยวข้อง

- [Repository Audit Report](01-repository-audit.md)
- [Architecture Proposal](02-architecture-proposal.md)
- [Feature Specification](03-feature-specification.md)
- [UI/UX Design Plan](05-ui-ux-design-plan.md)
- [Development Roadmap](06-development-roadmap.md)
- [Risks & Limitations](07-risks-and-limitations.md)
- [Acceptance Criteria](08-acceptance-criteria.md)
- [sqlite.dbml](sqlite.dbml) (Schema เดียวกันในรูปแบบ DBML)

## 1. หลักการ

| หลักการ | รายละเอียด |
|---|---|
| SQLite เป็น Primary Storage | ใช้ `better-sqlite3` 13 (ทดสอบแล้วกับ `better-sqlite3@13.0.3` บน Electron 44.7.0 โดยไม่ต้อง Rebuild ตาม Audit 2.6) ผ่าน Synchronous API ใน Main Process เท่านั้น Renderer เข้าถึงข้อมูลผ่าน Typed IPC (`window.api.*`) เท่านั้น ไม่มีการเปิดไฟล์ Database จาก Renderer |
| ไฟล์เดียวต่อเครื่อง | Database หนึ่งไฟล์ `<userData>\data\gamelooter.sqlite` เก็บทุก Game Profile การแยกข้อมูลของแต่ละเกมทำด้วย `profile_id` ในทุกตารางหลัก (Requirement 3.1) |
| WAL | เปิด `PRAGMA journal_mode = WAL` ตอนเปิด Connection เพื่อให้การเขียนไม่บล็อกการอ่านและลดโอกาสไฟล์เสียหายเมื่อปิดแอปกะทันหัน ใช้ `PRAGMA synchronous = FULL` (ค่าเริ่มต้น) เพราะข้อมูลมีขนาดเล็กและความถูกต้องสำคัญกว่าความเร็ว |
| Foreign Keys | เปิด `PRAGMA foreign_keys = ON` ทุกครั้งที่เปิด Connection (SQLite ปิดเป็นค่าเริ่มต้น และ PRAGMA นี้เปลี่ยนค่าภายใน Transaction ไม่ได้) กฎ CASCADE/RESTRICT ทั้งหมดอยู่ใน DDL |
| Transactions | ทุกการเขียนที่แตะมากกว่าหนึ่งแถวหรือมากกว่าหนึ่งตาราง (บันทึก Recipe พร้อม Ingredients, Reorder Priority, Consume, Craft, ลบ Profile, Migration แต่ละตัว) ทำภายใน `db.transaction()` ของ better-sqlite3 ซึ่ง Rollback อัตโนมัติเมื่อเกิด Exception |
| รูปภาพเป็นไฟล์ | ภาพ Item เก็บเป็นไฟล์ PNG ใต้ `<userData>\data\images\` Database เก็บเฉพาะ Path แบบ Relative (ส่วนที่ 5) ไม่เก็บ BLOB เพื่อให้ Database เล็ก, Backup เร็ว และ Renderer โหลดภาพแบบ Cache ได้ |
| Item ID เดียวต่อชื่อต่อ Profile | `item` มี `UNIQUE (profile_id, name COLLATE NOCASE)` Items ที่ชื่อซ้ำกันภายในเกมเดียวกันจึงใช้ `item.id` เดียวกันเสมอ (Requirement 5) Recipe, Quest, Inventory และ Overlay อ้างถึง `item.id` ไม่ใช่ชื่อ |
| ไม่เก็บค่าที่คำนวณได้ | Required, Missing, Progress และ Craft plan คำนวณใหม่จากข้อมูลปัจจุบันทุกครั้งใน Main Process (ส่วนที่ 7) ไม่มีคอลัมน์ Cache ตาม Requirement 5 ข้อ "ไม่เก็บค่าซ้ำโดยไม่จำเป็น" |
| Versioned Migrations | Schema Version เก็บใน `PRAGMA user_version` และเปลี่ยนด้วย Migration Modules ที่เรียงลำดับ (ส่วนที่ 4) |
| Domain Logic แยกจาก Electron | Algorithm การคำนวณ Materials และ Cycle Detection อยู่ใน `electron/domain/*.ts` โดยไม่ import Electron หรือ better-sqlite3 รับข้อมูลเป็น Plain Objects จาก Repositories ใน `electron/database/` |

ค่า Timestamp ทุกคอลัมน์ (`created_at`, `updated_at`, `last_opened_at`, `completed_at`) เป็น TEXT รูปแบบ ISO-8601 UTC ที่ได้จาก `new Date().toISOString()` เช่น `2026-10-08T09:30:00.000Z` Repository เป็นผู้กำหนดค่า ไม่ใช้ DEFAULT ของ Database เพื่อให้ค่าเวลามาจากแหล่งเดียวกันและทดสอบได้

Legacy JSON ใต้ `%APPDATA%\looter-app\Database\*.json` และไฟล์ `data/*.csv` ไม่ถูก Migrate เพราะไม่เคยเก็บข้อมูลผู้ใช้จริง (Audit 2.4, Feature Specification F12-R14)

## 2. ER Overview และรายการ Entities

```
                          +--------------+
                          | game_profile |
                          +------+-------+
                                 | 1
        +------------------------+----------------------+--------------------+
        | N                      | N                    | N                  | N
  +-----+----+             +-----+----+            +----+----+     +--------+--------+
  |   item   |             |  recipe  |            |  quest  |     | tracking_target |
  +-+--+--+--+             +-----+----+            +----+----+     +----+-------+----+
    |  |  |   output_item_id     | 1                    | 1             |       |
    |  |  +<---------------------+ (UNIQUE, CASCADE)    |         quest_id   recipe_id
    |  |                         | N                    | N        (UNIQUE,  (UNIQUE,
    |  |                +--------+----------+   +-------+-----------+  CASCADE) CASCADE)
    |  |                | recipe_ingredient |   | quest_requirement |     |       |
    |  |                +--------+----------+   +-------+-----------+     v       v
    |  |                         | item_id                | item_id    quest    recipe
    |  +<------------------------+ (RESTRICT)             | (RESTRICT)
    |  +<-----------------------------------------------+
    | 1
  +-+---------+
  | inventory |  (1:1 กับ item, PK = item_id, CASCADE)
  +-----------+

  +-------------+
  | app_setting |  (key / JSON value, ไม่มีความสัมพันธ์กับตารางอื่น)
  +-------------+

  PRAGMA user_version = Schema Version (ไม่มีตาราง)
```

| Entity | ตาราง | ความสัมพันธ์ | หน้าที่ |
|---|---|---|---|
| GameProfile | `game_profile` | 1:N กับ `item`, `recipe`, `quest`, `tracking_target` | หนึ่งแถวต่อหนึ่งเกม ข้อมูลทั้งหมดของเกมผูกกับแถวนี้ |
| Item | `item` | N:1 กับ `game_profile`; 1:1 กับ `inventory`; 1:0..1 กับ `recipe` (ในฐานะ Output); 1:N กับ `recipe_ingredient` และ `quest_requirement` (ในฐานะวัตถุดิบ) | ตัวตนเดียวของ Item ภายใน Profile พร้อมหมวดหมู่, ภาพ และ Thumbnail |
| Inventory | `inventory` | 1:1 กับ `item` | จำนวนที่ผู้ใช้มีจริง (Manual Tracking ตาม Requirement 3.6) แยกจากนิยาม Item |
| Recipe | `recipe` | N:1 กับ `game_profile`; 1:1 กับ `item` ผ่าน `output_item_id`; 1:N กับ `recipe_ingredient` | สูตร Craft หนึ่งสูตรต่อ Output Item หนึ่งชิ้น |
| RecipeIngredient | `recipe_ingredient` | N:1 กับ `recipe` และ `item` | วัตถุดิบของ Recipe พร้อมจำนวนต่อการ Craft หนึ่งครั้งและ `mode` |
| Quest | `quest` | N:1 กับ `game_profile`; 1:N กับ `quest_requirement` | Quest พร้อมสถานะ |
| QuestRequirement | `quest_requirement` | N:1 กับ `quest` และ `item` | Items ที่ Quest ต้องการพร้อมจำนวนและ `mode` |
| TrackingTarget | `tracking_target` | N:1 กับ `game_profile`; 0..1:1 กับ `quest` หรือ `recipe` | "Active Tracking Targets" ที่ถูกเลือกเข้าคำนวณ Gathering List พร้อม Priority และ Pin |
| AppSetting | `app_setting` | ไม่มี | ค่า Settings ทั้งหมดเป็น JSON ต่อ Key |

## 3. นิยามตาราง (DDL)

DDL ทั้งหมดในส่วนนี้คือเนื้อหาของ Migration `001-initial` (ส่วนที่ 4) ลำดับการสร้างตารางต้องเป็นไปตามนี้ เพราะตารางลูกอ้างถึงตารางแม่ที่ต้องมีอยู่ก่อน ค่า Boolean เก็บเป็น INTEGER 0/1 ตามธรรมเนียม SQLite

### 3.1 `game_profile`

```sql
CREATE TABLE game_profile (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  icon_path      TEXT    NULL,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  last_opened_at TEXT    NULL
);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัส Profile ไม่ถูกนำกลับมาใช้ซ้ำหลังลบ (AUTOINCREMENT) เพราะ `app_setting.active_profile_id` และชื่อโฟลเดอร์ภาพอ้างถึงค่านี้ |
| `name` | TEXT | NOT NULL, UNIQUE COLLATE NOCASE | ชื่อเกม ไม่ซ้ำโดยไม่สนตัวพิมพ์เล็กใหญ่ (ASCII) Repository ตัดช่องว่างหัวท้ายก่อนบันทึก |
| `icon_path` | TEXT | NULL | Path สัมพัทธ์ของไอคอนเกม (รูปแบบเดียวกับภาพ Item ส่วนที่ 5) NULL = ไม่มีไอคอน |
| `created_at` | TEXT | NOT NULL | เวลาสร้าง ISO-8601 UTC |
| `updated_at` | TEXT | NOT NULL | เวลาแก้ไขล่าสุด (เปลี่ยนชื่อ/ไอคอน) |
| `last_opened_at` | TEXT | NULL | เวลาที่ถูกเลือกเป็น Active Profile ล่าสุด ใช้เรียง Profile Cards บน Game Dashboard |

### 3.2 `item`

```sql
CREATE TABLE item (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id     INTEGER NOT NULL REFERENCES game_profile(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  category       TEXT    NOT NULL DEFAULT 'material'
                 CHECK (category IN ('material','equipment','consumable','quest','other')),
  image_path     TEXT    NULL,
  thumbnail_path TEXT    NULL,
  notes          TEXT    NULL,
  pinned         INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  UNIQUE (profile_id, name COLLATE NOCASE)
);
```

Index `item(profile_id, name)` ที่ Roadmap/Acceptance Criteria อ้างถึงได้มาจาก UNIQUE Constraint โดยอัตโนมัติ (`sqlite_autoindex_item_1` บน `(profile_id, name COLLATE NOCASE)`) ตรวจสอบด้วย `EXPLAIN QUERY PLAN` บน SQLite 3.53 แล้วว่า `WHERE profile_id = ? ORDER BY name COLLATE NOCASE` และ `WHERE profile_id = ? AND name = ? COLLATE NOCASE` ใช้ Index นี้แบบ Covering ส่วน `ORDER BY pinned DESC, name COLLATE NOCASE` ของ Query 11.1 ใช้ Index เดียวกันกรอง `profile_id` แล้วเรียงแถวที่เหลือ (หลักร้อยแถวต่อ Profile) ด้วย Temp B-tree ซึ่งยอมรับได้ จึงไม่สร้าง Index ซ้ำอีกตัว

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Item ID หนึ่งเดียวต่อ Item ภายใน Profile ชื่อไฟล์ภาพใช้ค่านี้ |
| `profile_id` | INTEGER | NOT NULL, FK → `game_profile.id` ON DELETE CASCADE | Profile เจ้าของ |
| `name` | TEXT | NOT NULL, UNIQUE ร่วมกับ `profile_id` แบบ NOCASE | ชื่อ Item ที่แสดงผล "Iron Ore" กับ "iron ore" ถือเป็น Item เดียวกัน |
| `category` | TEXT | NOT NULL, DEFAULT `'material'`, CHECK ใน 5 ค่า | หมวดหมู่ตาม Requirement 3.1: `material`, `equipment`, `consumable`, `quest`, `other` |
| `image_path` | TEXT | NULL | Path สัมพัทธ์ของภาพต้นฉบับ เช่น `images/1/5.png` NULL = ไม่มีภาพ |
| `thumbnail_path` | TEXT | NULL | Path สัมพัทธ์ของ Thumbnail 64×64 เช่น `images/1/thumbs/5.png` ต้องเป็น NULL พร้อมกับ `image_path` หรือมีค่าพร้อมกัน |
| `notes` | TEXT | NULL | บันทึกอิสระของผู้ใช้ เช่น แหล่งดรอป |
| `pinned` | INTEGER | NOT NULL, DEFAULT 0 | 1 = Pin ให้แสดงใน Overlay เสมอ (Requirement 3.7) |
| `created_at` / `updated_at` | TEXT | NOT NULL | เวลา ISO-8601 UTC; `updated_at` เปลี่ยนเมื่อแก้ชื่อ หมวดหมู่ ภาพ โน้ต หรือ Pin และใช้เป็น Cache-busting ของภาพใน Renderer |

### 3.3 `inventory`

```sql
CREATE TABLE inventory (
  item_id    INTEGER PRIMARY KEY REFERENCES item(id) ON DELETE CASCADE,
  owned      INTEGER NOT NULL DEFAULT 0 CHECK (owned >= 0),
  updated_at TEXT    NOT NULL
);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `item_id` | INTEGER | PRIMARY KEY, FK → `item.id` ON DELETE CASCADE | 1:1 กับ Item แถวถูกสร้างพร้อม Item (`owned = 0`) หรือแบบ Lazy ตอนปรับจำนวนครั้งแรกด้วย `INSERT ... ON CONFLICT` การอ่านใช้ `LEFT JOIN` + `COALESCE(owned, 0)` เสมอ |
| `owned` | INTEGER | NOT NULL, DEFAULT 0, CHECK ≥ 0 | จำนวนที่มีจริง CHECK เป็นด่านสุดท้ายที่กันค่าติดลบ (Requirement 3.6) |
| `updated_at` | TEXT | NOT NULL | เวลาปรับจำนวนล่าสุด |

### 3.4 `recipe`

```sql
CREATE TABLE recipe (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id     INTEGER NOT NULL REFERENCES game_profile(id) ON DELETE CASCADE,
  output_item_id INTEGER NOT NULL REFERENCES item(id) ON DELETE CASCADE,
  output_qty     INTEGER NOT NULL DEFAULT 1 CHECK (output_qty > 0),
  station        TEXT    NULL,
  notes          TEXT    NULL,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  UNIQUE (output_item_id)
);
CREATE INDEX idx_recipe_profile ON recipe(profile_id);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัส Recipe |
| `profile_id` | INTEGER | NOT NULL, FK → `game_profile.id` ON DELETE CASCADE | Profile เจ้าของ ต้องเท่ากับ `item.profile_id` ของ `output_item_id` (Repository ตรวจ ส่วนที่ 10) |
| `output_item_id` | INTEGER | NOT NULL, UNIQUE, FK → `item.id` ON DELETE CASCADE | Item ที่ Recipe นี้สร้าง หนึ่ง Item มีได้หนึ่ง Recipe เพื่อให้ Nested Expansion ไม่กำกวม (Recipe Variants เป็น Migration ในอนาคต ส่วนที่ 4.5) |
| `output_qty` | INTEGER | NOT NULL, DEFAULT 1, CHECK > 0 | จำนวน Output ต่อการ Craft หนึ่งครั้ง เช่น Iron Ore ×3 → Iron Ingot ×2 |
| `station` | TEXT | NULL | ชื่อ Crafting Station (ข้อความอิสระ) |
| `notes` | TEXT | NULL | บันทึก |
| `created_at` / `updated_at` | TEXT | NOT NULL | `updated_at` เปลี่ยนเมื่อแก้ Output, Station, Notes หรือรายการ Ingredients |

### 3.5 `recipe_ingredient`

```sql
CREATE TABLE recipe_ingredient (
  recipe_id  INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES item(id) ON DELETE RESTRICT,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  mode       TEXT    NOT NULL DEFAULT 'craft' CHECK (mode IN ('craft','gather')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (recipe_id, item_id)
);
CREATE INDEX idx_recipe_ingredient_item ON recipe_ingredient(item_id);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `recipe_id` | INTEGER | NOT NULL, FK → `recipe.id` ON DELETE CASCADE, ส่วนของ PK | Recipe เจ้าของ |
| `item_id` | INTEGER | NOT NULL, FK → `item.id` ON DELETE RESTRICT, ส่วนของ PK | วัตถุดิบ หนึ่ง Item ปรากฏใน Recipe เดียวได้ครั้งเดียว ห้ามเท่ากับ `recipe.output_item_id` (ตรวจด้วย Cycle Detection ส่วนที่ 8) |
| `qty` | INTEGER | NOT NULL, CHECK > 0 | จำนวนต่อการ Craft หนึ่งครั้ง |
| `mode` | TEXT | NOT NULL, DEFAULT `'craft'`, CHECK `craft`/`gather` | `craft` = ขยายผ่าน Recipe ของวัตถุดิบถ้ามี (ไม่มีก็ทำตัวเหมือน `gather`), `gather` = นับเป็นวัตถุดิบดิบเสมอแม้มี Recipe (Requirement 10 ข้อ 11) |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | ลำดับแสดงผลที่ผู้ใช้จัด |

### 3.6 `quest`

```sql
CREATE TABLE quest (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id   INTEGER NOT NULL REFERENCES game_profile(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','paused','completed')),
  notes        TEXT    NULL,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  completed_at TEXT    NULL
);
CREATE INDEX idx_quest_profile_status ON quest(profile_id, status);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัส Quest |
| `profile_id` | INTEGER | NOT NULL, FK → `game_profile.id` ON DELETE CASCADE | Profile เจ้าของ |
| `name` | TEXT | NOT NULL | ชื่อ Quest ซ้ำกันได้ (เกมหลายเกมมี Quest ชื่อเดียวกันหลายขั้น) |
| `status` | TEXT | NOT NULL, DEFAULT `'active'`, CHECK 3 ค่า | `active` = กำลังทำ, `paused` = พักไว้, `completed` = เสร็จแล้ว การเปลี่ยนเป็น `completed` ไม่แตะ `inventory` (Requirement 10 ข้อ 13) |
| `notes` | TEXT | NULL | บันทึก เช่น ชื่อ NPC |
| `created_at` / `updated_at` | TEXT | NOT NULL | เวลา |
| `completed_at` | TEXT | NULL | เวลาที่เปลี่ยนเป็น `completed`; ถูกล้างเป็น NULL เมื่อกลับไป `active`/`paused` |

### 3.7 `quest_requirement`

```sql
CREATE TABLE quest_requirement (
  quest_id   INTEGER NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES item(id) ON DELETE RESTRICT,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  mode       TEXT    NOT NULL DEFAULT 'craft' CHECK (mode IN ('craft','gather')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (quest_id, item_id)
);
CREATE INDEX idx_quest_requirement_item ON quest_requirement(item_id);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `quest_id` | INTEGER | NOT NULL, FK → `quest.id` ON DELETE CASCADE, ส่วนของ PK | Quest เจ้าของ |
| `item_id` | INTEGER | NOT NULL, FK → `item.id` ON DELETE RESTRICT, ส่วนของ PK | Item ที่ต้องส่ง หนึ่ง Item ต่อ Quest หนึ่งแถว |
| `qty` | INTEGER | NOT NULL, CHECK > 0 | จำนวนที่ Quest ต้องการ |
| `mode` | TEXT | NOT NULL, DEFAULT `'craft'`, CHECK | ความหมายเดียวกับ `recipe_ingredient.mode` |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | ลำดับแสดงผล |

### 3.8 `tracking_target`

```sql
CREATE TABLE tracking_target (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES game_profile(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL CHECK (kind IN ('quest','recipe')),
  quest_id   INTEGER NULL REFERENCES quest(id) ON DELETE CASCADE,
  recipe_id  INTEGER NULL REFERENCES recipe(id) ON DELETE CASCADE,
  target_qty INTEGER NOT NULL DEFAULT 1 CHECK (target_qty > 0),
  priority   INTEGER NOT NULL,
  pinned     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  UNIQUE (quest_id),
  UNIQUE (recipe_id),
  CHECK ((kind = 'quest'  AND quest_id  IS NOT NULL AND recipe_id IS NULL)
      OR (kind = 'recipe' AND recipe_id IS NOT NULL AND quest_id  IS NULL))
);
CREATE INDEX idx_tracking_target_profile_priority ON tracking_target(profile_id, priority);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัส Target ใช้ใน `window.api.tracking.reorder(ids)` |
| `profile_id` | INTEGER | NOT NULL, FK → `game_profile.id` ON DELETE CASCADE | Profile เจ้าของ (ซ้ำกับ Profile ของ Quest/Recipe เพื่อให้ Query ตาม Profile ใช้ Index เดียว) |
| `kind` | TEXT | NOT NULL, CHECK `quest`/`recipe` | ชนิด Target |
| `quest_id` | INTEGER | NULL, FK → `quest.id` ON DELETE CASCADE, UNIQUE | Quest ที่ติดตาม (เมื่อ `kind = 'quest'`) UNIQUE อนุญาต NULL หลายแถว (SQLite ถือว่า NULL ต่างกัน) จึงมี Recipe Targets หลายแถวได้ |
| `recipe_id` | INTEGER | NULL, FK → `recipe.id` ON DELETE CASCADE, UNIQUE | Recipe ที่ติดตาม (เมื่อ `kind = 'recipe'`) |
| `target_qty` | INTEGER | NOT NULL, DEFAULT 1, CHECK > 0 | จำนวน Output Item ที่ต้องการสำหรับ Recipe Target (Requirement 3.3 "กำหนดจำนวน Item ปลายทาง") ไม่ใช้กับ Quest |
| `priority` | INTEGER | NOT NULL | ลำดับการจัดสรร ค่าน้อย = ได้รับการจัดสรรก่อน Repository กำหนดใหม่เป็น 1..n ทุกครั้งที่ Reorder; ถ้าค่าเท่ากัน (ไม่ควรเกิด) เรียงด้วย `id` |
| `pinned` | INTEGER | NOT NULL, DEFAULT 0 | 1 = Pin Target ใน Overlay (Hotkey next/previous pinned target) |
| `created_at` | TEXT | NOT NULL | เวลาเพิ่มเข้า Tracking |

CHECK ประกอบรับรองว่าแถวหนึ่งชี้ไปที่ Quest หรือ Recipe อย่างใดอย่างหนึ่งเท่านั้น ตรวจแล้วว่า SQLite ปฏิเสธแถวที่มีทั้ง `quest_id` และ `recipe_id`

### 3.9 `app_setting`

```sql
CREATE TABLE app_setting (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

| คอลัมน์ | ชนิด | ข้อกำหนด | ความหมาย |
|---|---|---|---|
| `key` | TEXT | PRIMARY KEY | ชื่อ Setting (ส่วนที่ 3.12) |
| `value` | TEXT | NOT NULL | JSON ที่ `JSON.stringify` แล้ว Repository ตรวจรูปร่างตอนอ่านและใช้ค่าเริ่มต้นเมื่อไม่ผ่าน |
| `updated_at` | TEXT | NOT NULL | เวลาบันทึกล่าสุด |

### 3.10 สรุป Indexes

| Index | ตาราง (คอลัมน์) | ใช้โดย |
|---|---|---|
| `sqlite_autoindex_item_1` (จาก UNIQUE) | `item(profile_id, name COLLATE NOCASE)` | รายการ Item ต่อ Profile, ค้นหาชื่อ, ตรวจชื่อซ้ำตอน Capture → "ผูกกับ Item ที่มีอยู่" |
| `idx_recipe_profile` | `recipe(profile_id)` | โหลด Recipes ทั้งหมดของ Profile สำหรับ Aggregation และหน้า Recipes |
| `idx_quest_profile_status` | `quest(profile_id, status)` | รายการ Quest ตามสถานะ |
| `idx_tracking_target_profile_priority` | `tracking_target(profile_id, priority)` | อ่าน Targets เรียงตาม Priority |
| `idx_recipe_ingredient_item` | `recipe_ingredient(item_id)` | หาว่า Item ถูกใช้ใน Recipe ใด (ข้อความ Error ของ RESTRICT, Cycle Detection ย้อนกลับ) |
| `idx_quest_requirement_item` | `quest_requirement(item_id)` | หาว่า Item ถูกใช้ใน Quest ใด |

UNIQUE อื่น (`game_profile.name`, `recipe.output_item_id`, `tracking_target.quest_id`, `tracking_target.recipe_id`) และ PRIMARY KEY ประกอบสร้าง Index อัตโนมัติอยู่แล้ว

### 3.11 กฎการลบ

| การลบ | ผล |
|---|---|
| ลบ `game_profile` | CASCADE ทุกอย่าง: `item` → `inventory`; `recipe` → `recipe_ingredient`; `quest` → `quest_requirement`; `tracking_target` จากนั้น Main ลบโฟลเดอร์ `images/<profile_id>/` และถ้า `active_profile_id` ชี้ Profile นี้ให้ตั้งเป็น `null` ทดสอบกับ SQLite 3.53 แล้วว่า CASCADE จาก Profile ไม่ชน RESTRICT ของ `recipe_ingredient`/`quest_requirement` ด้วยลำดับตารางของ 001-initial อย่างไรก็ตาม Repository ลบตารางลูกเองตามลำดับ (`tracking_target` → `quest_requirement` → `recipe_ingredient` → `quest` → `recipe` → `item` → `game_profile`) ภายใน Transaction เดียว เพื่อไม่พึ่งพาลำดับภายในของ SQLite |
| ลบ `item` ที่ถูกอ้างโดย `recipe_ingredient` หรือ `quest_requirement` | ถูกปฏิเสธ (RESTRICT, `FOREIGN KEY constraint failed`) Repository ตรวจล่วงหน้าด้วย Query ในส่วนที่ 11.3 (`items:getUsage`) แล้วคืน Error `ITEM_IN_USE` พร้อมรายชื่อ Recipe/Quest ที่ใช้ เพื่อให้ UI อธิบายว่าต้องเอาออกจากที่ใดก่อน (Feature Specification F2-R12) |
| ลบ `item` ที่มีแค่ `inventory` และ/หรือเป็น Output ของ `recipe` | CASCADE: แถว `inventory` หาย, `recipe` ที่มี Output เป็น Item นี้หาย พร้อม `recipe_ingredient` และ `tracking_target` ของ Recipe นั้น จากนั้นลบไฟล์ภาพและ Thumbnail |
| ลบ `recipe` | CASCADE `recipe_ingredient` และ `tracking_target` ของ Recipe; Items ที่เคยเป็น Ingredient ไม่ถูกแตะ หาก Output Item ยังถูกใช้เป็น Ingredient ที่อื่นด้วย `mode = 'craft'` การคำนวณจะถือเป็นวัตถุดิบดิบแทน |
| ลบ `quest` | CASCADE `quest_requirement` และ `tracking_target` ของ Quest |
| ลบ `tracking_target` | ลบเฉพาะแถว Target; Quest/Recipe คงอยู่ Repository จัด `priority` ใหม่เป็น 1..n |

### 3.12 Keys ของ `app_setting` และรูปร่าง JSON

| Key | รูปร่าง (TypeScript) | ค่าเริ่มต้น |
|---|---|---|
| `active_profile_id` | `number \| null` | `null` (Game Dashboard ให้เลือกหรือสร้าง Profile) |
| `hotkeys` | `Hotkeys` | ตาม Feature Specification F11-R1 |
| `overlay` | `OverlaySetting` | `bounds: null`, `opacity: 0.9`, `mode: 'view'`, `compact: false`, `visible: false` |
| `window` | `WindowSetting` | `bounds: null`, `maximized: false` |
| `preferences` | `Preferences` | `theme: 'dark'`, `sort: 'missing-first'`, `hideComplete: false`, `stepSizes: [1, 5, 10]`, `sidebarCollapsed: false`, `itemView: 'grid'` (ตาม Feature Specification F11-R8) |

```ts
// electron/ipc/contracts.ts (ส่วน Settings)
export interface Bounds { x: number; y: number; width: number; height: number }

export interface Hotkeys {     // Accelerator string ของ Electron; '' = ปิดการใช้งานรายการนั้น (Feature Specification F11-R6)
  toggleOverlay: string        // 'CommandOrControl+Shift+O'
  toggleOverlayMode: string    // 'CommandOrControl+Shift+M'
  startCapture: string         // 'CommandOrControl+Shift+X'
  importClipboard: string      // 'CommandOrControl+Shift+V'
  overlayNextTarget: string    // 'CommandOrControl+Shift+]'
  overlayPrevTarget: string    // 'CommandOrControl+Shift+['
}

export interface OverlaySetting {
  bounds: Bounds | null        // null = ใช้ตำแหน่งเริ่มต้น (มุมขวาบนของ Display หลัก)
  opacity: number              // 0.2 ถึง 1.0
  mode: 'view' | 'interactive'
  compact: boolean
  visible: boolean             // สถานะล่าสุด ใช้ตัดสินว่าจะเปิด Overlay อัตโนมัติตอนเริ่มแอปหรือไม่
}

export interface WindowSetting {
  bounds: Bounds | null        // Main Window
  maximized: boolean
}

export interface Preferences {
  theme: 'dark' | 'light' | 'system'   // Dark Mode เป็นค่าเริ่มต้น (Requirement 4); light/system สงวนไว้ ยังไม่มีตัวเลือกใน UI
  sort: 'missing-first' | 'name' | 'category'   // ลำดับเริ่มต้นของ Gathering List
  hideComplete: boolean
  stepSizes: number[]          // ปุ่มปรับจำนวนหลายหน่วย เช่น [1, 5, 10] (ขั้นที่เลือกอยู่เป็นสถานะของหน้าจอ ไม่บันทึก)
  sidebarCollapsed: boolean    // UI/UX Design Plan 2.1
  itemView: 'grid' | 'table'   // UI/UX Design Plan 3.2
}
```

กฎการอ่าน: Repository `parse` ค่าแล้วตรวจด้วย Type Guard ที่เขียนเอง (ไม่เพิ่ม Dependency) ค่าที่ขาดหรือผิดชนิดถูกแทนด้วยค่าเริ่มต้นทีละ Field; `bounds` ที่อ่านได้ต้องถูกตรวจกับ `screen.getAllDisplays()` ก่อนใช้ เพราะไฟล์ Backup อาจมาจากเครื่องที่มีจอต่างกัน หาก `bounds` อยู่นอกทุก Display ให้ถือเป็น `null`

การเขียน: `INSERT INTO app_setting(key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`

## 4. กลยุทธ์ Migration

### 4.1 Schema Version

- เก็บใน `PRAGMA user_version` (จำนวนเต็มในส่วนหัวไฟล์ SQLite) Database ใหม่มีค่า 0
- Migration แต่ละตัวมีหมายเลข `NNN` ต่อเนื่องเริ่มที่ 001 ค่า `user_version` หลังใช้ Migration ตัวหนึ่งเท่ากับหมายเลขของตัวนั้น
- ตรวจแล้วว่า `PRAGMA user_version = N` อยู่ภายใต้ Transaction: Rollback คืนค่าเดิม ดังนั้นการเปลี่ยน Schema และการเพิ่ม Version อยู่ใน Transaction เดียวกันได้

### 4.2 โครงไฟล์

```
electron/database/
  index.ts                 เปิด Connection, ตั้ง PRAGMA, ปิด, backup()
  migrate.ts               Runner
  migrations/
    index.ts               รายการ Migration เรียงตามหมายเลข
    001-initial.ts         Schema เวอร์ชัน 1 (DDL ในส่วนที่ 3)
  repositories/            Query ต่อ Entity (ส่วนที่ 11)
electron/domain/
  aggregation.ts           Algorithm ส่วนที่ 7 (ไม่มี import ของ Electron/better-sqlite3)
  cycle.ts                 Cycle Detection ส่วนที่ 8
```

ชื่อไฟล์นอกเหนือจาก `electron/database/migrations/NNN-name.ts` และ `electron/domain/*.ts` ให้ยึดตาม Architecture Proposal หากกำหนดต่างจากนี้

```ts
// electron/database/migrations/index.ts
import type { Database } from 'better-sqlite3'
import initial from './001-initial'

export interface Migration {
  version: number            // = NNN
  name: string               // = ส่วน name ของชื่อไฟล์
  rebuildsTables?: boolean   // true เมื่อ Migration สร้างตารางใหม่แทนตารางเดิม (ต้องปิด foreign_keys รอบนอก Transaction)
  up(db: Database): void     // Synchronous; ห้ามเรียก BEGIN/COMMIT เอง
}

export const migrations: Migration[] = [initial]
```

```ts
// electron/database/migrations/001-initial.ts
import type { Migration } from './index'

const initial: Migration = {
  version: 1,
  name: 'initial',
  up(db) {
    db.exec(`
      CREATE TABLE game_profile ( ... );
      CREATE TABLE item ( ... );
      CREATE TABLE inventory ( ... );
      CREATE TABLE recipe ( ... );
      CREATE INDEX idx_recipe_profile ON recipe(profile_id);
      CREATE TABLE recipe_ingredient ( ... );
      CREATE INDEX idx_recipe_ingredient_item ON recipe_ingredient(item_id);
      CREATE TABLE quest ( ... );
      CREATE INDEX idx_quest_profile_status ON quest(profile_id, status);
      CREATE TABLE quest_requirement ( ... );
      CREATE INDEX idx_quest_requirement_item ON quest_requirement(item_id);
      CREATE TABLE tracking_target ( ... );
      CREATE INDEX idx_tracking_target_profile_priority ON tracking_target(profile_id, priority);
      CREATE TABLE app_setting ( ... );
    `)
  },
}

export default initial
```

`( ... )` คือ DDL เต็มจากส่วนที่ 3 ตามลำดับเดิม ไม่มีการ Seed ข้อมูล: ค่าเริ่มต้นของ `app_setting` มาจาก Type Guard ตอนอ่าน

### 4.3 พฤติกรรมของ Runner

ลำดับตอนเปิดแอป (Main Process, ก่อนสร้าง Window ใด):

1. สร้างโฟลเดอร์ `<userData>\data\` ถ้ายังไม่มี เปิด `gamelooter.sqlite` ด้วย `new Database(path)` (สร้างไฟล์ใหม่ถ้าไม่มี)
2. `db.pragma('journal_mode = WAL')`, `db.pragma('foreign_keys = ON')`
3. `db.pragma('quick_check')` ต้องคืน `ok` มิฉะนั้นหยุดและแสดง Dialog ตาม Feature Specification F12-R9: "กู้คืนจาก Backup" (ส่วนที่ 6.3) หรือ "เริ่มใหม่" (เปลี่ยนชื่อไฟล์เสียเป็น `gamelooter.sqlite.corrupt-<timestamp>` พร้อมไฟล์ `-wal`/`-shm` ของมัน แล้วสร้างไฟล์ใหม่) ไม่ลบไฟล์เสียทิ้งโดยอัตโนมัติ
4. เรียก `migrate(db, migrations)`:
   - อ่าน `current = PRAGMA user_version`, `latest = migrations.at(-1).version`
   - ถ้า `current > latest`: ไฟล์มาจากแอปเวอร์ชันใหม่กว่า ปฏิเสธการเปิดพร้อมข้อความ "ต้องอัปเดตแอป" (ไม่มี Downgrade Migration)
   - ตรวจว่ารายการ Migration เป็นหมายเลขต่อเนื่อง 1..latest มิฉะนั้นถือเป็น Bug ของแอปและหยุด
   - `pending = migrations.filter(m => m.version > current)`; ถ้าว่าง จบ
   - สำรองก่อนเปลี่ยน: `await db.backup('<userData>\backups\gamelooter-v<current>-<timestamp>.sqlite')` (Online Backup API ของ better-sqlite3 ให้ Snapshot ที่สอดคล้องแม้อยู่ใน WAL) เก็บไว้ 5 ไฟล์ล่าสุด ไฟล์เก่ากว่านั้นลบทิ้ง ข้ามขั้นนี้เมื่อ `current = 0` (ไฟล์ว่าง) โฟลเดอร์ `backups\` อยู่นอก `data\` โดยเจตนา เพื่อไม่ให้ถูกรวมใน ZIP ของส่วนที่ 6 และไม่ถูกย้ายตอน Restore
   - สำหรับ `m` ใน `pending` ตามลำดับ:
     - ถ้า `m.rebuildsTables`: `db.pragma('foreign_keys = OFF')` (ต้องทำนอก Transaction ตรวจแล้วว่าภายใน Transaction คำสั่งนี้ไม่มีผล)
     - ใน `db.transaction(() => { ... })()`: เรียก `m.up(db)`; ถ้า `m.rebuildsTables` ให้ตรวจว่า `db.pragma('foreign_key_check')` คืนรายการว่าง (ไม่ว่างให้ `throw`); จากนั้น `db.pragma('user_version = ' + m.version)`
     - `finally`: `db.pragma('foreign_keys = ON')`
5. บันทึก Log `migrated from v<current> to v<latest>` อ่าน `app_setting` เข้า Settings Store ผ่าน Type Guard (ส่วนที่ 3.12) ตรวจว่า `active_profile_id` ยังชี้ Profile ที่มีอยู่ (ไม่มีก็ตั้ง `null`, Invariant 17) แล้วค่อยลงทะเบียน IPC Handlers และสร้าง Window (ลำดับเดียวกับ Feature Specification F12-R6)

การจัดการความล้มเหลว:

- Exception ใน `m.up` ทำให้ better-sqlite3 Rollback Transaction นั้นทั้งหมด `user_version` คงค่าก่อนหน้า Migrations ที่สำเร็จก่อนหน้านี้คงอยู่ (แต่ละตัวมี Transaction ของตัวเอง) ไฟล์จึงอยู่ในสถานะที่สอดคล้องกับ Version ใดเวอร์ชันหนึ่งเสมอ
- Runner หยุดทันที ไม่รัน Migration ถัดไป ไม่เปิด Window ปกติ แสดง `dialog.showErrorBox` ระบุหมายเลข Migration, ข้อความ Error และ Path ของ Backup พร้อมปุ่มเปิดโฟลเดอร์ `backups\` แล้ว `app.quit()`
- การเปิดครั้งถัดไป Runner อ่าน `user_version` แล้วลองต่อจากจุดที่ค้าง ผู้ใช้กู้คืนด้วย Restore (ส่วนที่ 6) ได้ถ้าต้องการกลับไปเวอร์ชันก่อน

### 4.4 กฎการเขียน Migration

- Migration ที่ใช้แล้ว (Commit แล้ว) ห้ามแก้ไข การแก้ Schema ทำด้วย Migration ใหม่เสมอ
- ใช้ `ALTER TABLE ... ADD COLUMN` และ `CREATE INDEX` ได้โดยตรง ไม่ต้องตั้ง `rebuildsTables`
- การเปลี่ยน Constraint, ลบคอลัมน์ที่มี Constraint, หรือเปลี่ยน FK ต้องใช้ขั้นตอน "สร้างตารางใหม่" ของ SQLite (https://www.sqlite.org/lang_altertable.html#otheralter) และตั้ง `rebuildsTables: true`: สร้าง `<table>_new` → `INSERT INTO <table>_new SELECT ...` → `DROP TABLE <table>` → `ALTER TABLE <table>_new RENAME TO <table>` → สร้าง Index ใหม่ → `PRAGMA foreign_key_check` ต้องว่าง
- ห้ามอ่านค่าจาก Settings หรือ Electron ใน Migration; Migration รับเฉพาะ `db`
- ทุก Migration ต้องรันผ่านได้ทั้งกับไฟล์ว่าง (จาก 0) และไฟล์ที่มีข้อมูล (จาก Version ก่อนหน้า)

### 4.5 ตัวอย่างการเปลี่ยนแปลงในอนาคต: Recipe Variants

หากต้องให้ Item หนึ่งมีได้หลาย Recipe (เช่น Iron Ingot จาก Iron Ore หรือจาก Scrap Metal) ต้องยกเลิก `UNIQUE (output_item_id)` ซึ่ง SQLite ลบ Constraint ตรงไม่ได้ จึงเป็น Migration `002-recipe-variants.ts` แบบ `rebuildsTables: true`:

```sql
CREATE TABLE recipe_new (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id     INTEGER NOT NULL REFERENCES game_profile(id) ON DELETE CASCADE,
  output_item_id INTEGER NOT NULL REFERENCES item(id) ON DELETE CASCADE,
  output_qty     INTEGER NOT NULL DEFAULT 1 CHECK (output_qty > 0),
  variant_name   TEXT    NOT NULL DEFAULT '',
  is_preferred   INTEGER NOT NULL DEFAULT 1,
  station        TEXT    NULL,
  notes          TEXT    NULL,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  UNIQUE (output_item_id, variant_name)
);
INSERT INTO recipe_new (id, profile_id, output_item_id, output_qty, station, notes, created_at, updated_at)
  SELECT id, profile_id, output_item_id, output_qty, station, notes, created_at, updated_at FROM recipe;
DROP TABLE recipe;
ALTER TABLE recipe_new RENAME TO recipe;
CREATE INDEX idx_recipe_profile ON recipe(profile_id);
CREATE UNIQUE INDEX idx_recipe_preferred ON recipe(output_item_id) WHERE is_preferred = 1;
```

`recipe_ingredient.recipe_id` และ `tracking_target.recipe_id` ยังอ้าง `recipe` โดยชื่อ หลัง RENAME จึงชี้ตารางใหม่ `PRAGMA foreign_key_check` ยืนยันว่าทุก `recipe_id` ยังมีแถวแม่ Algorithm ส่วนที่ 7 จะต้องเพิ่มกฎเลือก Recipe ที่ `is_preferred = 1` ต่อ Output Item ในขั้นนั้น ตัวอย่างนี้ใช้แสดงวิธีการเท่านั้น ไม่อยู่ในขอบเขต Phase 1–2

## 5. การจัดเก็บไฟล์

### 5.1 โครงสร้างโฟลเดอร์

`app.getPath('userData')` = `%APPDATA%\looter-app` (ชื่อ Package ไม่เปลี่ยน)

```
%APPDATA%\looter-app\
  data\
    gamelooter.sqlite
    gamelooter.sqlite-wal          (มีขณะเปิดอยู่)
    gamelooter.sqlite-shm          (มีขณะเปิดอยู่)
    images\
      <profile_id>\
        <item_id>.png              ภาพต้นฉบับที่ Crop แล้ว (PNG)
        thumbs\
          <item_id>.png            Thumbnail 64×64 PNG
  backups\
    gamelooter-v<schemaVersion>-<timestamp>.sqlite   สำรองก่อน Migration (เก็บ 5 ไฟล์ล่าสุด)
    pre-restore-<timestamp>\                         data\ เดิมที่ถูกย้ายออกตอน Restore (เก็บ 1 ชุดล่าสุด)
  export-tmp-<timestamp>\                            ชั่วคราวระหว่าง Export (Snapshot จาก db.backup()) ถูกลบเมื่อเสร็จหรือล้มเหลว
  restore-tmp-<timestamp>\                           ชั่วคราวระหว่าง Restore ถูกลบเมื่อเสร็จหรือล้มเหลว
  Database\*.json                                    Legacy จาก Scaffold ไม่ถูกอ่านและไม่ถูกลบ
```

`<timestamp>` คือ ISO-8601 UTC ที่แทน `:` และ `.` ด้วย `-` เพื่อให้เป็นชื่อไฟล์บน Windows ได้ เช่น `2026-10-08T09-30-00-000Z`

### 5.2 กฎ Path

- Database เก็บ Path สัมพัทธ์กับ `<userData>\data` โดยใช้ `/` เป็นตัวคั่นเสมอ: `images/<profile_id>/<item_id>.png` และ `images/<profile_id>/thumbs/<item_id>.png` (`icon_path` ของ Profile ใช้ `images/<profile_id>/profile-icon.png`) เหตุผล: ค่าเดียวกันใช้ได้ทั้งใน ZIP (ซึ่งใช้ `/`) และบน Windows (`path.join` รับ `/` ได้)
- การแปลงเป็น Path จริงทำใน Main เท่านั้น: `resolved = path.resolve(dataDir, relPath)` และต้องขึ้นต้นด้วย `dataDir + path.sep` มิฉะนั้นปฏิเสธ (กัน `..` หรือ Path สัมบูรณ์ที่มาจากไฟล์ Backup ที่ถูกแก้)
- Renderer ไม่เคยได้รับ Path สัมบูรณ์ Main ส่ง URL สำหรับโหลดภาพตามกลไกที่ Architecture Proposal กำหนด โดยต่อท้าย `?v=<updated_at>` ของ Item เพื่อกัน Cache เมื่อแทนที่ภาพด้วยชื่อไฟล์เดิม
- ชื่อไฟล์ผูกกับ `item.id` ไม่ใช่ชื่อ Item การเปลี่ยนชื่อ Item จึงไม่ต้องย้ายไฟล์
- `image_path` และ `thumbnail_path` เป็น NULL คู่กันหรือมีค่าคู่กันเสมอ (Invariant ส่วนที่ 10)

### 5.3 การบันทึกภาพและสร้าง Thumbnail

ทุกแหล่งภาพ (Capture → Crop, Paste จาก Clipboard, Import ไฟล์) มาถึงขั้นเดียวกันเป็น `NativeImage`:

1. ถ้าภาพว่าง (`isEmpty()`) ปฏิเสธด้วย Error `UNSUPPORTED_IMAGE`
2. ภาพต้นฉบับ: `image.toPNG()` เขียนลง `images/<profile_id>/<item_id>.png.tmp` แล้ว `fs.renameSync` ทับชื่อจริง (Atomic บน Volume เดียวกัน ไม่เหลือไฟล์ครึ่งเดียวเมื่อแอปปิดกลางคัน)
3. Thumbnail 64×64: คำนวณ `scale = min(1, 64 / max(width, height))` แล้ว `image.resize({ width: round(width × scale), height: round(height × scale), quality: 'good' })` เพื่อให้ด้านยาวสุดเท่ากับ 64 px โดยรักษาสัดส่วน (ภาพที่เล็กกว่า 64 px ทั้งสองด้านไม่ถูกขยาย) จากนั้น Pad ให้เป็น 64×64 พอดีด้วยพื้นหลังโปร่งใส: `toBitmap()` (BGRA) → คัดลอกแถวพิกเซลลง Buffer ขนาด 64×64×4 Byte ที่เป็นศูนย์ทั้งหมดโดยจัดกึ่งกลาง → `nativeImage.createFromBitmap(buffer, { width: 64, height: 64 })` → `toPNG()` เขียนลง `images/<profile_id>/thumbs/<item_id>.png` ด้วยวิธี `.tmp` + rename เดียวกัน ไฟล์ Thumbnail จึงเป็น 64×64 เสมอโดยไม่ตัดขอบภาพและไม่บิดสัดส่วน (คำตอบของข้อ "Pad เป็น 64×64 พอดีหรือไม่" ใน Feature Specification F2-R8) Renderer และ Overlay แสดงได้ทันทีโดยไม่ต้องคำนวณสัดส่วน ภาพต้นฉบับยังเก็บเต็มกรอบที่ผู้ใช้เลือก
4. อัปเดต `item` ด้วย `image_path`, `thumbnail_path`, `updated_at` ใน Statement เดียว
5. ถ้าขั้น 4 ล้มเหลว ลบไฟล์ที่เพิ่งเขียน; ถ้าขั้น 2–3 ล้มเหลว Database ไม่ถูกแตะ (Error `IO` ตาม Feature Specification F2-R8)

สำหรับ Flow "Capture → Item ใหม่": สร้างแถว `item` (ยังไม่มีภาพ) ก่อนเพื่อได้ `item.id` แล้วจึงทำขั้น 1–4 หากขั้นหลังล้มเหลว Item ยังอยู่โดยไม่มีภาพ ผู้ใช้ทำซ้ำได้จาก Item Library สำหรับ "ผูกภาพกับ Item ที่มีอยู่" ทำขั้น 1–4 ทับไฟล์เดิม

Import ไฟล์: `nativeImage.createFromPath()` รองรับ PNG และ JPEG แน่นอน รูปแบบอื่น (BMP/GIF/ICO) ขึ้นกับความสามารถของ Chromium ใน Electron 44 (ต้องตรวจสอบตอน Implement ตาม Feature Specification 14.3) ภาพถูกแปลงเป็น PNG เสมอ ไฟล์ที่อ่านไม่ได้คืน `UNSUPPORTED_IMAGE` ขนาดไฟล์นำเข้าสูงสุดยังไม่ถูกกำหนดในเอกสารชุดนี้ (ต้องตรวจสอบ)

### 5.4 การลบไฟล์และ Orphan Cleanup

หลักการ: Database เป็นแหล่งความจริง การลบไฟล์ทำหลัง Transaction Commit แล้วเท่านั้น และความล้มเหลวในการลบไฟล์ไม่ทำให้ Operation ของ Database ล้มเหลว (บันทึก Log และปล่อยให้ Cleanup เก็บกวาด)

| เหตุการณ์ | การกระทำกับไฟล์ |
|---|---|
| ลบ Item | ลบ `<item_id>.png` และ `thumbs/<item_id>.png` ของ Item นั้น |
| ลบภาพออกจาก Item (คง Item) | ตั้ง `image_path`/`thumbnail_path` เป็น NULL แล้วลบสองไฟล์ |
| ลบ Profile | `fs.rmSync('images/<profile_id>', { recursive: true, force: true })` |
| แทนที่ภาพ | เขียนทับชื่อเดิมด้วย `.tmp` + rename ไม่มีไฟล์เก่าเหลือ |
| Cleanup ด้วยมือ (Settings → "ล้างไฟล์ภาพที่ไม่ถูกใช้") | เดินโฟลเดอร์ `images\` ทั้งหมด เทียบกับ `SELECT image_path, thumbnail_path FROM item` และ `icon_path` จาก `game_profile`; ไฟล์ที่ไม่ถูกอ้างถูกลบ, Path ในฐานข้อมูลที่ไฟล์หายถูกตั้งเป็น NULL (ทั้งคู่ของ Item นั้น) แล้วรายงานจำนวนให้ผู้ใช้ |
| ระหว่าง Restore | รัน Cleanup แบบเดียวกันกับชุดข้อมูลที่แตกออกมา ก่อนสลับโฟลเดอร์ (ส่วนที่ 6.3 ขั้น 3) เพราะไฟล์ Backup อาจไม่ครบ (Feature Specification F11-R14) |

Cleanup ไม่รันอัตโนมัติตอนเปิดแอป เพื่อไม่เพิ่มเวลาเริ่มต้นและไม่ลบไฟล์ขณะมี Operation อื่นค้าง ปุ่ม Cleanup ด้วยมือใน Settings เป็นงาน Phase 5 (Development Roadmap P5-04) ส่วน Cleanup ระหว่าง Restore เป็นส่วนหนึ่งของ Backup/Restore ใน Phase 5 (P5-03)

## 6. Backup / Export / Import

### 6.1 รูปแบบไฟล์

Backup และ Export เป็นสิ่งเดียวกัน: ไฟล์ ZIP ของ `data\` ทั้งหมด (ทุก Profile) ชื่อเริ่มต้น `gamelooter-backup-<YYYYMMDD-HHmm>.zip` (ค่าเสนอตาม Feature Specification F11-R10) ใช้ `fflate` (Pure JS, ต้องตรวจสอบ Version ตอน Implement) ใน Main Process ด้วย API แบบ Async เพื่อไม่บล็อก Event Loop

```
gamelooter-backup-20261008-0930.zip
  manifest.json
  gamelooter.sqlite                 Snapshot จาก db.backup() (ไม่ใช่การ Copy ไฟล์ตรง)
  images/<profile_id>/<item_id>.png
  images/<profile_id>/thumbs/<item_id>.png
  images/<profile_id>/profile-icon.png   (ถ้ามี)
```

ไม่รวม `-wal`/`-shm`, `backups\`, `restore-tmp-*` และ Legacy `Database\*.json` ไฟล์ PNG ใส่ด้วย `level: 0` (บีบอัดซ้ำไม่ได้ประโยชน์) ไฟล์ SQLite และ manifest ใช้ `level: 6`

`manifest.json`:

```json
{
  "format": "gamelooter-backup",
  "formatVersion": 1,
  "appVersion": "1.0.0",
  "schemaVersion": 1,
  "exportedAt": "2026-10-08T09:30:00.000Z",
  "profiles": [
    { "id": 1, "name": "V-Rising", "items": 7 }
  ]
}
```

| Field | ความหมาย |
|---|---|
| `format` | ค่าคงที่ `gamelooter-backup` ใช้ปฏิเสธ ZIP ที่ไม่ใช่ของแอป |
| `formatVersion` | เวอร์ชันของ Layout ภายใน ZIP (เพิ่มเมื่อเปลี่ยนชื่อไฟล์/โฟลเดอร์ใน ZIP) ปัจจุบัน 1 |
| `appVersion` | `app.getVersion()` ตอน Export ใช้แสดงผลเท่านั้น |
| `schemaVersion` | `PRAGMA user_version` ของ `gamelooter.sqlite` ใน ZIP ใช้ตัดสินความเข้ากันได้ |
| `exportedAt` | เวลา Export ISO-8601 UTC |
| `profiles` | Optional: สรุปเพื่อแสดงใน Dialog ก่อน Restore (`id`, `name`, จำนวน Items) ไม่ใช้ตัดสินใจเชิงข้อมูล ขาดได้ |

Field ที่บังคับคือ `format`, `formatVersion`, `appVersion`, `schemaVersion`, `exportedAt` ขาดตัวใดหรือชนิดผิด ถือว่า `BACKUP_INVALID` (Feature Specification F11-R12)

### 6.2 ขั้นตอน Export

1. ผู้ใช้เลือก Path ปลายทางผ่าน `dialog.showSaveDialog` (`window.api.backup.export(path)`)
2. `db.pragma('wal_checkpoint(PASSIVE)')` แล้ว `await db.backup('<userData>\export-tmp-<timestamp>\gamelooter.sqlite')` เพื่อได้ Snapshot ที่สอดคล้องโดยไม่ปิด Connection (Export ทำได้ขณะแอปเปิดและมีข้อมูลเปลี่ยนแปลงอยู่)
3. อ่านรายชื่อไฟล์ภาพที่ถูกอ้างในฐานข้อมูล (เฉพาะที่ไฟล์มีอยู่จริง) สร้าง `manifest.json`
4. สร้าง ZIP เขียนลง `<path>.tmp` แล้ว rename เป็น `<path>`
5. ลบโฟลเดอร์ชั่วคราว รายงานขนาดไฟล์และจำนวน Profile/Item

### 6.3 ขั้นตอน Import / Restore

Restore แทนที่ข้อมูลทั้งหมด (ไม่ Merge) ขั้นตอนต่อไปนี้คือรายละเอียดระดับข้อมูลของ Feature Specification F11-R11 ถึง F11-R14 (ตัวเลขในวงเล็บคือหมายเลขขั้นของ F11-R11)

1. (2) เปิด ZIP อ่านเฉพาะ `manifest.json` ก่อน ตรวจ: `format` ตรง, `formatVersion = 1`, มี `appVersion`/`schemaVersion`/`exportedAt` ครบ, `schemaVersion` เป็นจำนวนเต็ม ≥ 1, มี Entry `gamelooter.sqlite`, ไม่มี Entry ที่ Path ขึ้นต้นด้วย `/`, มี `..` หรือ Drive Letter มิฉะนั้นปฏิเสธด้วย `BACKUP_INVALID`; ถ้า `schemaVersion > latest` ปฏิเสธด้วย `BACKUP_TOO_NEW` ("ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อน")
2. (3)(4) แสดงสรุปจาก Manifest (`appVersion`, `schemaVersion`, `exportedAt`, `profiles` ถ้ามี) และตำแหน่งที่ข้อมูลปัจจุบันจะถูกสำรอง (`backups\pre-restore-<timestamp>\`) ผู้ใช้ยืนยัน
3. (6) แตกทั้งหมดลง `<userData>\restore-tmp-<timestamp>\` (ชื่อไฟล์ถูก Normalize ให้เป็น Path สัมพัทธ์ใต้โฟลเดอร์นี้เท่านั้น) เปิดไฟล์ SQLite ที่แตกออกมาด้วย Connection แยก: `PRAGMA integrity_check` ต้อง `ok` (ไม่ผ่าน → `BACKUP_INVALID`), `PRAGMA user_version` ต้องเท่ากับ `manifest.schemaVersion`, ตั้ง `foreign_keys = ON` แล้ว `PRAGMA foreign_key_check` ต้องว่าง จากนั้นรัน Runner ส่วนที่ 4 จนถึง `latest` (ข้ามการสำรองก่อน Migrate เพราะ ZIP ต้นทางคือ Backup) รัน Orphan Cleanup (ส่วนที่ 5.4) กับชุดข้อมูลที่แตกออกมา (ไฟล์ภาพที่ขาดทำให้ Path เป็น NULL ไม่ทำให้ Restore ล้มเหลว ตาม F11-R14) แล้วปิด Connection (ทำให้ WAL ถูก Checkpoint และไม่มี `-wal`/`-shm` ค้าง)
4. (7) ปิด Connection หลักของแอป, ปิด Overlay/Capture Windows, หยุด Push Events และยกเลิก Hotkeys
5. (5)(7) สลับแบบ Atomic ด้วย rename สองครั้ง: `data\` → `backups\pre-restore-<timestamp>\` (นี่คือ Backup อัตโนมัติของข้อมูลปัจจุบันตามขั้น (5) ของ F11-R11 ทำด้วย rename จึงไม่ต้องคัดลอกไฟล์) แล้ว `restore-tmp-<timestamp>\` → `data\` ถ้าครั้งที่สองล้มเหลว rename ครั้งแรกกลับและคืน `IO` พร้อมตำแหน่ง `backups\pre-restore-<timestamp>\` (F11-R13; ข้อมูลเดิมไม่หาย)
6. (8) ลบ `backups\pre-restore-*` ที่เก่ากว่าชุดล่าสุด แล้ว `app.relaunch()` ตามด้วย `app.exit()` การเปิดครั้งใหม่ผ่านลำดับปกติของส่วนที่ 4.3 ซึ่งตรวจ `active_profile_id` ว่ายังมี Profile นั้นอยู่ (ไม่มีก็ตั้ง `null`, Invariant 17) และตรวจ `bounds` ใน Settings กับจอปัจจุบัน (ส่วนที่ 3.12) ก่อนสร้าง Window Main Window เริ่มที่ Game Dashboard

หากขั้น 1–3 ล้มเหลว ลบ `restore-tmp-<timestamp>\` และไม่แตะข้อมูลปัจจุบันเลย

### 6.4 กฎความเข้ากันได้

| กรณี | ผล |
|---|---|
| `schemaVersion` < เวอร์ชันล่าสุดของแอป | รับได้ Migrate ไปข้างหน้าในขั้น 3 |
| `schemaVersion` = เวอร์ชันล่าสุด | รับได้ ไม่ต้อง Migrate |
| `schemaVersion` > เวอร์ชันล่าสุด | ปฏิเสธด้วย `BACKUP_TOO_NEW` ไม่มี Downgrade |
| `formatVersion` ≠ 1 | ปฏิเสธด้วย `BACKUP_INVALID` (แอปเวอร์ชันถัดไปที่เปลี่ยน Layout ต้องเพิ่ม Reader ของ Format เก่าเอง) |
| Manifest ขาด Field บังคับ, ไม่มี `gamelooter.sqlite`, `integrity_check` ไม่ผ่าน, ไม่ใช่ ZIP | ปฏิเสธด้วย `BACKUP_INVALID` (Feature Specification F11-R12) |
| `appVersion` ต่างกัน | ไม่มีผล แสดงผลเท่านั้น |
| ไฟล์ภาพใน ZIP ไม่ครบ | รับได้ Cleanup ตั้ง Path ที่หายเป็น NULL (Item แสดง Placeholder) |

การ Export/Import เฉพาะบาง Profile (ต้อง Remap `id` ทุกตาราง) ไม่อยู่ใน Phase 5 และเป็นงานในอนาคต

## 7. การคำนวณ Materials

Algorithm นี้คือข้อกำหนดกลางของ Requirement 3.5 ใช้โดย Gathering List, Quest Tracker (per-quest allocated progress), Game Dashboard (Overall Progress) และ Overlay Main Process คำนวณใหม่หลังทุก Mutation ที่เกี่ยวข้อง (Inventory, Recipe, Quest, Tracking Targets, สลับ Profile) ด้วย Debounce 16 ms แล้ว Push ผ่าน `gathering:changed` ไปยัง Main Window และ Overlay พร้อมกัน

### 7.1 นิยาม

| คำ | นิยาม |
|---|---|
| Target | แถว `tracking_target` ของ Active Profile เรียงตาม `priority` น้อยไปมาก Target ชนิด `quest` ถูกนำเข้าคำนวณเฉพาะเมื่อ `quest.status = 'active'` (แถว Target คงอยู่และคงลำดับ Priority เมื่อ Quest ถูก `paused`/`completed` และกลับมานับเมื่อ Quest กลับเป็น `active` ตาม Feature Specification F4-R5) |
| Requirements ของ Target | Quest: แถว `quest_requirement` (`item_id`, `qty`, `mode`) Recipe: Ingredients ของ Recipe คูณ `runs = ceil(target_qty / output_qty)` จำนวน Output Item ที่ผู้ใช้มีอยู่แล้วไม่ถูกหัก เพราะ `target_qty` คือจำนวนที่ต้องการสร้าง "เพิ่ม" |
| การ Resolve ระดับ Gather | การ Resolve ของ Item ที่ไม่ขยายผ่าน Recipe ได้แก่ Item ที่ไม่มี Recipe, Item ที่ `mode = 'gather'`, หรือ Item ที่ถูก Guard วงจรหยุดไว้ Item นี้เรียกว่า "Gather Item" (วัตถุดิบที่ต้องออกไปเก็บ) |
| การ Resolve ระดับ Craft | การ Resolve ของ Item ที่ `mode = 'craft'` และมี Recipe Item นี้เรียกว่า "Intermediate" และปรากฏในส่วน Craft plan ไม่ใช่ Gathering List |
| `available` | Pool ที่ใช้ร่วมกันทุก Target เริ่มจาก `inventory.owned` ถูกหักทีละ Target ตาม Priority และถูกเพิ่มด้วย Surplus ที่วางแผน Craft เกินความต้องการ |
| `take` | ส่วนที่ `available` รองรับได้ของความต้องการหนึ่งครั้ง = `min(available[item], need)` |
| `remaining` | `need − take` ส่วนที่ยังไม่มี ต้อง Craft (Intermediate) หรือเก็บ (Gather Item) |
| Required (ต่อ Gather Item) | Σ `need` ของทุกการ Resolve ระดับ Gather ของ Item นั้น (= Σ(`take` + `remaining`)) คือจำนวนรวมที่ Targets ทั้งหมดต้องการในระดับวัตถุดิบ หลังหัก Intermediate ที่มีอยู่แล้วออกจากความต้องการชั้นบน |
| Owned | `inventory.owned` ของ Item (ค่าเต็ม ไม่ใช่ส่วนที่ถูกจัดสรร) |
| Missing | `max(0, Required − Owned)` |
| Overall Progress | `Σ min(Owned, Required) / Σ Required` รวมเฉพาะ Gather Items แสดงเป็น "x / y" |
| Craft plan | ต่อ Intermediate: `runs` ที่ต้อง Craft (รวมจากทุก Target), Required = Σ `need` ระดับ Craft ของ Item นั้น, Owned = `inventory.owned` แสดงเฉพาะ Intermediate ที่ `runs > 0`; Intermediate ที่มีครบแล้ว (`remaining = 0` ทุกครั้งที่ถูก Resolve) ไม่ปรากฏ เพราะไม่มีอะไรต้อง Craft |
| Allocation (จัดสรร) | `allocation[target][item]` = ผลรวม `take` ของ Target นั้นต่อ Item แสดงใน Quest Tracker/Recipes เป็น "จัดสรร (allocated) a / need" ต่อ Requirement โดยตรงของ Target ไม่ใช่ Inventory ของ Target เอง |
| `demandLeaf` | Σ `remaining` ของ Gather Item ใช้ภายในและสำหรับ Acceptance Test เมื่อไม่มี Nested Recipe ค่านี้เท่ากับ Missing เสมอ |

### 7.2 Pseudocode

```
available  := copy of owned per item          // pool กลาง หักตามลำดับ priority
demandLeaf := {}                              // item -> จำนวนที่ต้องเก็บเพิ่ม
craftPlan  := {}                              // recipe -> runs ที่ต้อง craft
allocation := {}                              // target -> item -> จำนวนที่จัดสรรให้
gatherRequired := {}                          // item -> Required ระดับ gather (สำหรับแสดงผล)
craftRequired  := {}                          // item -> Required ระดับ craft (สำหรับ Craft plan)

for target in targets (priority asc):
  requirements := quest ? quest_requirement rows : ingredients of recipe × runs,
                  where runs = ceil(target_qty / recipe.output_qty)
  for (item, qty, mode) in requirements:
    resolve(target, item, qty, mode, path = [])

resolve(target, item, need, mode, path):
  take := min(available[item], need)          // หักของที่มีอยู่แล้วครั้งเดียว
  available[item] -= take
  allocation[target][item] += take
  remaining := need - take
  recipe := recipeFor(item)
  if mode == 'craft' and recipe exists and item not in path:
    craftRequired[item] += need               // Intermediate
    if remaining == 0: return
    runs := ceil(remaining / recipe.output_qty)
    craftPlan[recipe] += runs
    surplus := runs * recipe.output_qty - remaining
    available[item] += surplus                // ของที่จะ craft เกินใช้กับ target ถัดไปได้
    for (ing, ingQty, ingMode) in recipe.ingredients:
      resolve(target, ing, ingQty * runs, ingMode, path + [item])
  else:
    gatherRequired[item] += need              // Gather Item (= take + remaining)
    demandLeaf[item] += remaining             // วัตถุดิบที่ต้องเก็บ
    allocation[target][item] += 0             // ให้ key มีอยู่ แสดงเป็น missing ของ target นี้

output:
  gathering rows : for item in gatherRequired:
                     Required = gatherRequired[item], Owned = owned[item],
                     Missing  = max(0, Required - Owned)
  overall        : Σ min(Owned, Required) / Σ Required over gathering rows
  craft plan     : for item in craftRequired where craftPlan[recipeFor(item)] > 0:
                     runs = craftPlan[recipeFor(item)], Required = craftRequired[item], Owned = owned[item]
  per target     : allocation[target] เทียบกับ requirements โดยตรงของ target
```

`craftRequired`/`gatherRequired` สะสมก่อน `return` เพื่อให้ Required ที่แสดงผลรวม `take` ด้วย (ตามนิยาม 7.1) ส่วน `available`, `craftPlan`, `demandLeaf` และ `allocation` เป็นอัลกอริทึมมาตรฐานของโครงการ

### 7.3 คำอธิบายเป็นคำพูด

1. เริ่มจากสำเนาของ Inventory เป็น Pool กลาง เพราะทุก Target ใช้ Inventory เดียวกัน (Requirement 10 ข้อ 12) ของชิ้นเดียวจึงถูกนับให้ Target ได้เพียงครั้งเดียว
2. เดิน Target ตาม Priority Target ที่อยู่ก่อนได้หักของจาก Pool ก่อน นี่คือความหมายของ "จัดสรร (allocated)" ที่ UI ต้องแสดงให้ชัดว่าไม่ใช่ของที่ Target นั้นถือจริง การเปลี่ยนลำดับเปลี่ยนเฉพาะตัวเลขต่อ Target ไม่เปลี่ยน Required/Owned/Missing รวม
3. สำหรับความต้องการแต่ละรายการ หักของที่มีอยู่ก่อน (`take`) เหลือเท่าไรจึงพิจารณาว่าจะ Craft หรือเก็บ นี่คือกฎ "หัก Intermediate ที่มีอยู่แล้วก่อน" ของ Requirement 10 ข้อ 11 และป้องกัน Double Counting: Item ที่มีอยู่แล้วไม่ถูกขยายลงไปเป็นวัตถุดิบ
4. ถ้ารายการนั้น `mode = 'craft'` และ Item มี Recipe ให้คำนวณจำนวนครั้งที่ต้อง Craft จาก `remaining` (ไม่ใช่จาก `need`) ปัดขึ้นตาม `output_qty` ส่วนที่ Craft เกินกลับเข้า Pool เพื่อให้ Target ถัดไปใช้ได้โดยไม่สั่ง Craft ซ้ำ จากนั้นกระจายวัตถุดิบของ Recipe คูณ `runs` ลงไป Resolve ต่อแบบ Recursive ถ้า `remaining = 0` (มี Intermediate ครบแล้ว) ไม่ต้อง Craft ไม่ขยายลงวัตถุดิบ และ Item นั้นไม่ปรากฏใน Craft plan
5. ถ้ารายการนั้น `mode = 'gather'` หรือ Item ไม่มี Recipe หรือ Item อยู่ใน `path` แล้ว (Guard วงจร) ให้ถือเป็นวัตถุดิบ: `need` ทั้งก้อนนับเข้า Required และ `remaining` นับเข้า `demandLeaf`
6. ผลลัพธ์สำหรับ Gathering List ใช้ Required/Owned/Missing ตามนิยาม 7.1 ไม่ใช่ `demandLeaf` โดยตรง เพื่อให้ตัวอย่างใน Requirement 3.5 (Owned = จำนวนเต็มที่มี) ตรงทุกค่า Intermediate แยกไปส่วน Craft plan ไม่ปนกับวัตถุดิบ

กรณีขอบ: Item เดียวกันอาจถูก Resolve ระดับ Gather ใน Target หนึ่ง (`mode = 'gather'`) และระดับ Craft ในอีก Target หนึ่ง (`mode = 'craft'`) Item นั้นจะปรากฏทั้งใน Gathering List และ Craft plan และ `demandLeaf` อาจน้อยกว่า Missing เพราะ Surplus จาก Craft ถูกหักใน Pool การแสดงผลใช้ Missing = `max(0, Required − Owned)` เสมอ (ค่าที่ไม่ต่ำกว่าความจริง)

ความซับซ้อน O(targets × ingredients × depth) ข้อมูลระดับหลายร้อยแถวคำนวณเสร็จในหลัก Millisecond จึงทำแบบ Synchronous ใน Main Process ได้

### 7.4 ตัวอย่างที่คำนวณด้วยมือ

#### (a) ตัวอย่างจาก Requirement 3.5

ข้อมูล: Quest A (Iron Ore ×10, Wood ×5), Quest B (Iron Ore ×15, Leather ×8), Craft C = Recipe Target ที่ `output_qty = 1`, `target_qty = 1` → `runs = ceil(1/1) = 1` ให้ Ingredients Iron Ore ×20, Wood ×10 Priority: A = 1, B = 2, C = 3 ทุกรายการ `mode = 'craft'` แต่ไม่มี Item ใดมี Recipe (ยกเว้น C เอง) Inventory: Iron Ore 20, Wood 5, Leather 3

เริ่ม `available = {Iron Ore: 20, Wood: 5, Leather: 3}`

| ลำดับ | Target | Item | need | take | available หลังหัก | remaining | ผล |
|---|---|---|---:|---:|---:|---:|---|
| 1 | A | Iron Ore | 10 | min(20, 10) = 10 | 10 | 0 | Gather; Required += 10 |
| 2 | A | Wood | 5 | min(5, 5) = 5 | 0 | 0 | Gather; Required += 5 |
| 3 | B | Iron Ore | 15 | min(10, 15) = 10 | 0 | 5 | Gather; Required += 15, demandLeaf += 5 |
| 4 | B | Leather | 8 | min(3, 8) = 3 | 0 | 5 | Gather; Required += 8, demandLeaf += 5 |
| 5 | C | Iron Ore | 20 | min(0, 20) = 0 | 0 | 20 | Gather; Required += 20, demandLeaf += 20 |
| 6 | C | Wood | 10 | min(0, 10) = 0 | 0 | 10 | Gather; Required += 10, demandLeaf += 10 |

Gathering List:

| Item | Required | Owned | Missing | ตรวจทาน |
|---|---:|---:|---:|---|
| Iron Ore | 10 + 15 + 20 = 45 | 20 | max(0, 45 − 20) = 25 | demandLeaf = 0 + 5 + 20 = 25 |
| Wood | 5 + 10 = 15 | 5 | 15 − 5 = 10 | demandLeaf = 0 + 10 = 10 |
| Leather | 8 | 3 | 8 − 3 = 5 | demandLeaf = 5 |

Overall Progress = (min(20, 45) + min(5, 15) + min(3, 8)) / (45 + 15 + 8) = (20 + 5 + 3) / 68 = 28 / 68 ตรงกับ Requirement 3.5 และตัวอย่าง Overlay ใน 3.7 ทุกค่า

Per-target allocation:

| Target | Item | need | allocated | สถานะ |
|---|---|---:|---:|---|
| A | Iron Ore | 10 | 10 | ครบ |
| A | Wood | 5 | 5 | ครบ → A = 15 / 15 |
| B | Iron Ore | 15 | 10 | ขาด 5 |
| B | Leather | 8 | 3 | ขาด 5 → B = 13 / 23 |
| C | Iron Ore | 20 | 0 | ขาด 20 |
| C | Wood | 10 | 0 | ขาด 10 → C = 0 / 30 |

Craft plan ว่าง เพราะไม่มี Intermediate (Recipe C เป็น Target ไม่ใช่ Ingredient)

#### (b) Nested Recipe

ข้อมูล: Recipe Iron Sword (`output_qty = 1`) ต้องใช้ Iron Ingot ×5 (`mode = 'craft'`) และ Wood ×2 (`mode = 'craft'`) Recipe Iron Ingot (`output_qty = 2`) ต้องใช้ Iron Ore ×3 Target เดียว: Recipe Iron Sword, `target_qty = 1` → `runs = ceil(1/1) = 1` Inventory: Iron Ingot 3, Iron Ore 4, Wood 0

Requirements ของ Target = Iron Ingot ×5, Wood ×2 `available = {Iron Ingot: 3, Iron Ore: 4, Wood: 0}`

1. `resolve(Iron Ingot, need 5, craft, path [])`
   - `take = min(3, 5) = 3` → `available[Iron Ingot] = 0`, `allocation[Iron Ingot] = 3`, `remaining = 2`
   - `mode = 'craft'`, มี Recipe, ไม่อยู่ใน path → Intermediate: `craftRequired[Iron Ingot] = 5`
   - `runs = ceil(2 / 2) = 1`, `craftPlan[Iron Ingot] = 1`
   - `surplus = 1 × 2 − 2 = 0` → `available[Iron Ingot] = 0`
   - กระจาย Ingredient: Iron Ore `3 × 1 = 3`
   - `resolve(Iron Ore, need 3, craft, path [Iron Ingot])`: `take = min(4, 3) = 3` → `available[Iron Ore] = 1`, `allocation[Iron Ore] = 3`, `remaining = 0` Iron Ore ไม่มี Recipe → Gather: `gatherRequired[Iron Ore] = 3`, `demandLeaf[Iron Ore] = 0`
2. `resolve(Wood, need 2, craft, path [])`: `take = min(0, 2) = 0`, `remaining = 2` ไม่มี Recipe → Gather: `gatherRequired[Wood] = 2`, `demandLeaf[Wood] = 2`

ผลลัพธ์:

| ส่วน | Item | Required | Owned | Missing / runs |
|---|---|---:|---:|---|
| Gathering List | Iron Ore | 3 | 4 | Missing = max(0, 3 − 4) = 0 |
| Gathering List | Wood | 2 | 0 | Missing = 2 |
| Craft plan | Iron Ingot | 5 | 3 | runs = 1 (ได้ 2 ชิ้น ครบ 5 พอดี) |

Overall Progress = (min(4, 3) + min(0, 2)) / (3 + 2) = (3 + 0) / 5 = 3 / 5 Allocation ของ Target: Iron Ingot 3 / 5, Wood 0 / 2 (ระดับ Requirement โดยตรง) และ Iron Ore 3 / 3 ในมุมมองขยาย

สังเกตว่า Iron Ore ไม่ถูกคิดเป็น 5 × 3 / 2 = 7.5 → 9 ชิ้น (ไม่หัก Ingot ที่มี) แต่เป็น 3 ชิ้นสำหรับ 1 Run เท่านั้น นี่คือ "ความต้องการสุทธิ" ตาม Requirement 3.5

Variant เพื่อแสดง Surplus: ถ้ามี Iron Ingot 2 ชิ้น (อื่นเท่าเดิม) → `take = 2`, `remaining = 3`, `runs = ceil(3/2) = 2`, `surplus = 2 × 2 − 3 = 1` → `available[Iron Ingot] = 1`; Iron Ore need = `3 × 2 = 6`, `take = min(4, 6) = 4`, `remaining = 2` ผล: Iron Ore Required 6 / Owned 4 / Missing 2, Wood 2 / 0 / 2, Craft plan Iron Ingot runs = 2 (Required 5, Owned 2), Overall = (4 + 0) / (6 + 2) = 4 / 8 Ingot ส่วนเกิน 1 ชิ้นจะถูก Target ถัดไปที่ต้องการ Iron Ingot ใช้ได้โดยไม่สั่ง Craft เพิ่ม

Variant เมื่อมี Intermediate ครบ: ถ้ามี Iron Ingot 5 ชิ้น (อื่นเท่าเดิม) → `take = min(5, 5) = 5`, `remaining = 0` → ไม่ Craft, ไม่ขยายลง Iron Ore ผล: Gathering List มีเพียง Wood 2 / 0 / 2, Iron Ore ไม่ปรากฏ, Craft plan ว่าง, Overall = min(0, 2) / 2 = 0 / 2 Allocation: Iron Ingot 5 / 5, Wood 0 / 2

#### (c) การจัดสรรเมื่อสอง Quest ใช้ Iron Ore ร่วมกัน

ข้อมูล: Quest A ต้องการ Iron Ore ×10, Quest B ต้องการ Iron Ore ×15, Inventory Iron Ore 20 Priority A = 1, B = 2

| ลำดับ | Target | need | take | available หลังหัก | remaining |
|---|---|---:|---:|---:|---:|
| 1 | A | 10 | min(20, 10) = 10 | 10 | 0 |
| 2 | B | 15 | min(10, 15) = 10 | 0 | 5 |

Gathering List: Iron Ore Required = 10 + 15 = 25, Owned 20, Missing = 5 (Overall 20 / 25) Allocation: A ได้ 10 / 10 (ครบ), B ได้ 10 / 15 (ขาด 5) UI แสดง "จัดสรร 10 / 15" ที่ B ไม่ใช่ "มี 10"

สลับ Priority เป็น B = 1, A = 2:

| ลำดับ | Target | need | take | available หลังหัก | remaining |
|---|---|---:|---:|---:|---:|
| 1 | B | 15 | min(20, 15) = 15 | 5 | 0 |
| 2 | A | 10 | min(5, 10) = 5 | 0 | 5 |

Allocation เปลี่ยนเป็น B 15 / 15 (ครบ), A 5 / 10 (ขาด 5) แต่ Gathering List ไม่เปลี่ยน: Required 25, Owned 20, Missing 5 ของที่ต้องออกไปเก็บเท่าเดิม เปลี่ยนเพียงว่า Quest ใดถูกนับว่าพร้อมส่งก่อน

#### (d) Gather-mode Override

ข้อมูล: Quest "Blacksmith Order" ต้องการ Iron Ingot ×4 Iron Ingot มี Recipe (Iron Ore ×3 → Iron Ingot ×2) Inventory: Iron Ingot 1, Iron Ore 10

กรณี `mode = 'gather'` (ผู้ใช้ตั้งว่าจะซื้อ/ดรอป Ingot ไม่ Craft):

- `resolve(Iron Ingot, need 4, gather)`: `take = min(1, 4) = 1`, `remaining = 3` แม้มี Recipe แต่ `mode = 'gather'` → Gather: `gatherRequired = 4`, `demandLeaf = 3`
- Gathering List: Iron Ingot Required 4 / Owned 1 / Missing 3 Iron Ore ไม่ปรากฏ Craft plan ว่าง Overall 1 / 4

กรณี `mode = 'craft'` (ค่าเริ่มต้น):

- `take = 1`, `remaining = 3` → Intermediate: `craftRequired = 4`, `runs = ceil(3/2) = 2`, `surplus = 2 × 2 − 3 = 1` → `available[Iron Ingot] = 1`
- `resolve(Iron Ore, need 3 × 2 = 6, craft)`: `take = min(10, 6) = 6`, `available[Iron Ore] = 4`, `remaining = 0` → Gather: Required 6, demandLeaf 0
- Gathering List: Iron Ore Required 6 / Owned 10 / Missing 0 Craft plan: Iron Ingot runs = 2 (Required 4, Owned 1) Overall 6 / 6 (วัตถุดิบครบ รอ Craft)

`mode` จึงเป็นตัวเลือกต่อรายการว่าจะให้ระบบวางแผน Craft ให้ หรือให้นับเป็นของที่ต้องหามาเอง โดยไม่ต้องลบ Recipe

#### (e) Nested Recipe ชุดเดียวกับ Fixture B ใน Acceptance Criteria

ข้อมูล: Recipe R1 = Iron Sword (`output_qty = 1`) ← Iron Ingot ×4 (`mode = 'craft'`), Wood ×2 (`mode = 'gather'`); Recipe R2 = Iron Ingot (`output_qty = 2`) ← Iron Ore ×3 (`mode = 'craft'` แต่ไม่มี Recipe จึงเหมือน `gather`), Coal ×1 (`mode = 'gather'`) Target เดียว: R1, `target_qty = 1` → `runs = 1` Inventory: Iron Ingot 1, Iron Ore 2, Coal 0, Wood 0 `available = {Iron Ingot: 1, Iron Ore: 2, Coal: 0, Wood: 0}`

1. `resolve(Iron Ingot, need 4, craft)`: `take = min(1, 4) = 1` → `available[Iron Ingot] = 0`, `remaining = 3`; Intermediate: `craftRequired[Iron Ingot] = 4`; `runs = ceil(3 / 2) = 2`, `craftPlan[R2] = 2`; `surplus = 2 × 2 − 3 = 1` → `available[Iron Ingot] = 1`
2. กระจาย R2 × 2 runs: `resolve(Iron Ore, need 6)`: `take = min(2, 6) = 2`, `remaining = 4` → Gather: `gatherRequired[Iron Ore] = 6`; `resolve(Coal, need 2)`: `take = 0`, `remaining = 2` → Gather: `gatherRequired[Coal] = 2`
3. `resolve(Wood, need 2, gather)`: `take = 0`, `remaining = 2` → Gather: `gatherRequired[Wood] = 2`

| ส่วน | Item | Required | Owned | Missing / runs |
|---|---|---:|---:|---|
| Gathering List | Iron Ore | 6 | 2 | 4 |
| Gathering List | Coal | 2 | 0 | 2 |
| Gathering List | Wood | 2 | 0 | 2 |
| Craft plan | Iron Ingot (R2) | 4 | 1 | runs = 2 (ได้ 4 ชิ้น) |

Overall Progress = (2 + 0 + 0) / (6 + 2 + 2) = 2 / 10 Recipe ของ Target (R1) ไม่ปรากฏใน Craft plan เพราะ Craft plan มีเฉพาะ Intermediate (Feature Specification F6-R6)

ตัวแปรที่ Acceptance Criteria ใช้:

| ตัวแปร | การเปลี่ยน | ผลลัพธ์ |
|---|---|---|
| B-gather | `mode` ของ Iron Ingot ใน R1 เป็น `gather` | Iron Ingot 4 / 1 / 3, Wood 2 / 0 / 2; Craft plan ว่าง; Overall 1 / 6 |
| B-owned | Inventory Iron Ingot = 4 | Wood 2 / 0 / 2 เท่านั้น; Craft plan ว่าง; Overall 0 / 2 |
| B-direct | เพิ่ม Ingredient Iron Ore ×1 (`gather`, `sort_order` 3) ใน R1 | Iron Ore 7 / 2 / 5, Coal 2 / 0 / 2, Wood 2 / 0 / 2; Overall 2 / 11 (Owned 2 ถูกหักครั้งเดียวตอนขยาย Iron Ingot) |
| B-surplus | เพิ่ม Quest ต้องการ Iron Ingot ×1 (`craft`) เป็น Target `priority` 2 | Gathering List และ `runs` ของ R2 เท่าเดิม (R2 ยัง 2 runs) เพราะ Surplus 1 ชิ้นถูกจัดสรรให้ Quest (allocation Iron Ingot 1 / 1); Craft plan Required เป็น 5 |

### 7.5 รูปร่างข้อมูลเข้า/ออกของ `electron/domain/aggregation.ts`

```ts
export type Mode = 'craft' | 'gather'

export interface AggregationRequirement { itemId: number; qty: number; mode: Mode }

export interface AggregationTarget {
  id: number                       // tracking_target.id
  kind: 'quest' | 'recipe'
  priority: number
  questId?: number
  recipeId?: number
  targetQty: number                // 1 สำหรับ quest
  requirements: AggregationRequirement[]   // quest: quest_requirement; recipe: ingredients (ยังไม่คูณ runs)
}

export interface AggregationRecipe {
  id: number
  outputItemId: number
  outputQty: number
  ingredients: AggregationRequirement[]
}

export interface AggregationInput {
  targets: AggregationTarget[]                 // เรียง priority แล้ว
  recipesByOutputItem: Map<number, AggregationRecipe>
  owned: Map<number, number>                   // item_id -> inventory.owned (ไม่มีแถว = 0)
}

export interface GatheringRow { itemId: number; required: number; owned: number; missing: number }
export interface CraftPlanRow { recipeId: number; outputItemId: number; runs: number; required: number; owned: number }   // เฉพาะ runs > 0
export interface TargetAllocation {
  targetId: number
  rows: Array<{ itemId: number; need: number; allocated: number; missing: number }>   // requirement โดยตรงของ target; missing = need − allocated
  leafRows: Array<{ itemId: number; allocated: number }>                              // วัตถุดิบที่ถูกจัดสรรให้ target นี้ (มุมมองขยาย)
}

export interface AggregationResult {
  items: GatheringRow[]            // Gather Items ยังไม่เรียง; UI เรียงตาม preferences.sort
  craftPlan: CraftPlanRow[]
  perTarget: TargetAllocation[]
  overall: { owned: number; required: number }   // Σ min(owned, required), Σ required
  warnings: Array<{ code: 'CYCLE_GUARD'; path: number[] }>
}

export function aggregate(input: AggregationInput): AggregationResult
```

ชื่อ Field ของผลลัพธ์ตรงกับ Payload ของ `gathering.get()` และ `gathering:changed` ใน Feature Specification (`items`, `craftPlan`, `perTarget`, `overall`) ชื่อ Item, Thumbnail, Category, `pinned` และ `ingredientsPerRun` ของ Craft plan สำหรับแสดงผลถูกเติมโดย Repository Layer หลังคำนวณ (Join กับ `item` และ `recipe_ingredient`) ไม่ใช่หน้าที่ของ Domain Module

## 8. Cycle Detection

### 8.1 ตอนบันทึก (`electron/domain/cycle.ts`)

กราฟที่ตรวจคือ "Item → Items ที่ Recipe ของมันใช้" โดยใช้ `recipe_ingredient` ทุกแถวของ Profile โดยไม่สน `mode` (ผู้ใช้เปลี่ยน `mode` ภายหลังได้ โครงสร้าง Recipe จึงต้องเป็น DAG เสมอ) การบันทึก Recipe ของ Output Item `O` พร้อมรายการ Ingredients ใหม่ `I₁..Iₙ` ทำดังนี้ก่อนเขียนลง Database:

```
function findCycle(outputItemId O, ingredients, recipesByOutputItem):
  for I in ingredients:
    if I == O: return [O, I]                       // ใช้ตัวเองเป็นวัตถุดิบ
    path := dfs(I, [O, I])
    if path: return path
  return null

dfs(item, path, visited = new Set()):
  recipe := recipesByOutputItem.get(item)          // Recipe ที่มีอยู่ในฐานข้อมูล (ไม่รวมที่กำลังบันทึก)
  if not recipe: return null
  for ing in recipe.ingredients:
    if ing == O: return path + [O]                 // ย้อนกลับมาถึง Output = วงจร
    if ing in visited: continue
    visited.add(ing)
    found := dfs(ing, path + [ing], visited)
    if found: return found
  return null
```

`visited` ทำให้แต่ละ Item ถูกสำรวจครั้งเดียว ความซับซ้อน O(จำนวน Ingredient ทั้ง Profile) ตรวจทั้งตอนสร้างและแก้ไข Recipe รวมถึงตอนเปลี่ยน Output Item ของ Recipe เดิม เพราะ Recipe ที่มีอยู่แล้วอาจใช้ Output ใหม่นี้เป็น Ingredient

เมื่อพบวงจร Handler ของ `recipes:create` / `recipes:update` ปฏิเสธทั้ง Transaction (ไม่เขียนอะไร) ส่วน `recipes:validate` (ตรวจร่างระหว่างแก้ไข) คืนผลเดียวกันโดยไม่แตะฐานข้อมูล:

```ts
interface RecipeCycleError {
  code: 'CYCLE'                          // รหัส Error ตาม Feature Specification F3-R6
  message: string                        // "Iron Ingot → Iron Ore → Iron Ingot"
  details: {
    path: string[]                       // ชื่อ Item ตามลำดับ เริ่มและจบที่ Output Item
    itemIds: number[]                    // item.id ตามลำดับเดียวกัน สำหรับลิงก์ไปแก้ไข
  }
}
```

UI หน้า Recipes แสดง `details.path` เป็นลูกโซ่ชื่อ Item ทั้งเส้น เพื่อให้ผู้ใช้เห็นว่าต้องตัดลิงก์ใด

### 8.2 Guard ขณะคำนวณ

`resolve()` ในส่วนที่ 7 ตรวจ `item not in path` ก่อนขยาย ถ้าพบ Item ซ้ำใน `path` (เกิดได้เฉพาะเมื่อข้อมูลถูกแก้นอกแอป หรือ Bug ของ Migration) จะถือรายการนั้นเป็น Gather Item และเพิ่ม `warnings` รหัส `CYCLE_GUARD` พร้อม `path` Main บันทึก Log และ UI แสดงคำเตือนบน Gathering List แต่ไม่หยุดการคำนวณ Guard นี้เป็นด่านป้องกัน ไม่ใช่กลไกหลัก

## 9. Transactions ของ Consume และ Craft

ทั้งสอง Action ทำใน `db.transaction()` เดียว ตรวจจำนวนทั้งหมดก่อนเขียน และไม่เขียนบางส่วนเมื่อมี Item ใดไม่พอ (Requirement 10 ข้อ 13) การกด Complete Quest หรือเอา Target ออกไม่เรียก Action เหล่านี้

### 9.1 Consume Materials (Quest)

หักเฉพาะ Requirements โดยตรงของ Quest ตามที่บันทึกไว้ (ไม่ขยาย Nested: ถ้า Requirement เป็น Iron Ingot ผู้ใช้ต้องมี Ingot จริง ซึ่งได้จาก Craft ในส่วน 9.2 ก่อน)

```sql
BEGIN;
-- 1) อ่านความต้องการเทียบกับที่มี
SELECT qr.item_id, qr.qty, COALESCE(inv.owned, 0) AS owned, i.name
FROM quest_requirement qr
JOIN item i ON i.id = qr.item_id
LEFT JOIN inventory inv ON inv.item_id = qr.item_id
WHERE qr.quest_id = :questId AND i.profile_id = :profileId;
-- ใน TypeScript: ถ้ามีแถวใด owned < qty → throw INSUFFICIENT_MATERIALS { details: { items: [{ itemId, name, need: qty, owned }] } } → Rollback (Feature Specification F8-R5)

-- 2) หักทีละ Item (บันทึกตอนที่ 1 รับรองว่าไม่ติดลบ; CHECK (owned >= 0) เป็นด่านสุดท้าย)
UPDATE inventory
SET owned = owned - :qty, updated_at = :now
WHERE item_id = :itemId AND owned >= :qty;
-- ใน TypeScript: ถ้า changes() !== 1 → throw → Rollback

-- 3) ไม่แตะ quest.status โดยค่าเริ่มต้นของ Handler; เมื่อ Dialog ส่ง completeQuest = true (ตัวเลือก "ตั้งสถานะ Quest เป็น Completed ด้วย" ค่าเริ่มต้นเปิดใน UI ตาม Feature Specification F8-R7) จะ UPDATE quest (status, completed_at) ใน Transaction เดียวกันนี้
COMMIT;
```

Pseudocode TypeScript:

```ts
const consumeQuest = db.transaction((profileId: number, questId: number, now: string) => {
  const rows = selectQuestRequirementsWithOwned.all({ questId, profileId })
  if (rows.length === 0) throw new DomainError('VALIDATION', { reason: 'quest has no requirements' })
  const shortages = rows
    .filter(r => r.owned < r.qty)
    .map(r => ({ itemId: r.item_id, name: r.name, need: r.qty, owned: r.owned }))
  if (shortages.length) throw new DomainError('INSUFFICIENT_MATERIALS', { items: shortages })
  for (const r of rows) {
    const { changes } = decrementOwned.run({ itemId: r.item_id, qty: r.qty, now })
    if (changes !== 1) throw new DomainError('IO', { itemId: r.item_id })   // ไม่ควรเกิด: ตรวจแล้วใน Transaction เดียวกัน; Rollback ทั้งหมด
  }
})
```

### 9.2 Craft (Recipe)

รับ `runs` จากผู้ใช้ (ค่าเริ่มต้น = `runs` ใน Craft plan หรือ 1) หัก Ingredients × `runs` และเพิ่ม Output × `output_qty` ใน Transaction เดียวกัน

```sql
BEGIN;
-- 1) ตรวจ
SELECT ri.item_id, ri.qty * :runs AS need, COALESCE(inv.owned, 0) AS owned, i.name
FROM recipe_ingredient ri
JOIN recipe r ON r.id = ri.recipe_id
JOIN item i ON i.id = ri.item_id
LEFT JOIN inventory inv ON inv.item_id = ri.item_id
WHERE ri.recipe_id = :recipeId AND r.profile_id = :profileId;
-- ถ้ามี owned < need → INSUFFICIENT_MATERIALS (details.items) → Rollback

-- 2) หักวัตถุดิบ
UPDATE inventory SET owned = owned - :need, updated_at = :now
WHERE item_id = :itemId AND owned >= :need;    -- changes() ต้องเป็น 1

-- 3) เพิ่ม Output (สร้างแถว inventory ถ้ายังไม่มี)
INSERT INTO inventory (item_id, owned, updated_at)
SELECT r.output_item_id, r.output_qty * :runs, :now FROM recipe r WHERE r.id = :recipeId
ON CONFLICT(item_id) DO UPDATE SET owned = owned + excluded.owned, updated_at = excluded.updated_at;
COMMIT;
```

`runs` ต้องเป็นจำนวนเต็ม ≥ 1 (ตรวจใน Handler มิฉะนั้น `VALIDATION`) Recipe ที่ไม่มี Ingredient Craft ได้ (ข้อ 1–2 ไม่มีแถว บวกเฉพาะ Output ตาม Feature Specification 9.5) Output ที่เกินค่าสูงสุดของ `owned` คืน `VALIDATION` (F7-R1) หลัง Commit Main ส่ง `inventory:changed` ที่รวมทุก Item ที่เปลี่ยน คำนวณ Gathering ใหม่และ Push `gathering:changed`; ไม่แตะ `tracking_target` ยกเว้นเมื่อ Handler รับ `reduceTarget = true` (ตัวเลือก "ลด `target_qty` ตามจำนวนที่ Craft" ค่าเริ่มต้นเปิดเมื่อ Recipe เป็น Target ตาม F8-R11) ซึ่งลด `target_qty` ลง `output_qty × runs` และลบ Target เมื่อเหลือ ≤ 0 ใน Transaction เดียวกัน

### 9.3 การปรับจำนวนด้วย +/−

`window.api.inventory.adjust({ itemId, delta })` และ `set({ itemId, owned })` เป็น Statement เดียว ไม่ต้อง Transaction ยาว แต่ `adjust` ต้อง Clamp ที่ 0 และที่ค่าสูงสุด ไม่ใช่โยน Error เพื่อให้ปุ่ม `−` ที่ 0 ไม่สร้าง Dialog (Feature Specification F7-R2):

```sql
INSERT INTO inventory (item_id, owned, updated_at)
SELECT i.id, MIN(:max, MAX(0, :delta)), :now FROM item i WHERE i.id = :itemId AND i.profile_id = :profileId
ON CONFLICT(item_id) DO UPDATE SET owned = MIN(:max, MAX(0, owned + :delta)), updated_at = excluded.updated_at;
```

`:max` คือค่าสูงสุดของ `owned` (999,999 เป็นค่าเสนอใน Feature Specification F7-R1) `changes() = 0` หมายความว่า Item ไม่อยู่ใน Active Profile → Error `NOT_FOUND` ส่วน `set` ตรวจว่า `owned` เป็นจำนวนเต็มในช่วง 0..`:max` ก่อน (ไม่ผ่าน → `VALIDATION` ตาม F7-R3) แล้ว Upsert ด้วยค่านั้นตรง ๆ ทั้งสองคำสั่งตามด้วย `inventory:changed` และการคำนวณ Gathering ใหม่

## 10. กฎความถูกต้องของข้อมูลและ Invariants

บังคับโดย Database (D) หรือ Repository ใน Main Process (R):

| # | Invariant | บังคับโดย |
|---|---|---|
| 1 | ทุก Connection เปิด `foreign_keys = ON` และ WAL; ไม่มี Code Path ที่เปิดไฟล์โดยไม่ผ่าน `electron/database/index.ts` | R |
| 2 | ทุกแถวลูกมีแถวแม่ (FK ทั้งหมดตามส่วนที่ 3) | D |
| 3 | `inventory.owned >= 0` | D (CHECK) + R (Clamp/ตรวจก่อน) |
| 4 | ชื่อ Item ไม่ซ้ำภายใน Profile แบบ NOCASE; Repository `trim()` และยุบช่องว่างซ้อนก่อนบันทึก; ชื่อว่างถูกปฏิเสธ | D (UNIQUE) + R |
| 5 | ชื่อ Profile ไม่ซ้ำแบบ NOCASE และไม่ว่าง | D + R |
| 6 | `recipe.profile_id = item.profile_id` ของ `output_item_id`; `recipe_ingredient.item_id` และ `quest_requirement.item_id` อยู่ใน Profile เดียวกับ Recipe/Quest; `tracking_target.profile_id` เท่ากับ Profile ของ Quest/Recipe ที่ชี้ (SQLite ไม่มี FK ข้ามตารางแบบมีเงื่อนไข ทุก Query เขียนจึงมี `AND profile_id = :activeProfileId`) | R |
| 7 | หนึ่ง Output Item มีหนึ่ง Recipe | D (UNIQUE) |
| 8 | `recipe_ingredient.item_id ≠ recipe.output_item_id` และกราฟ Recipe ของ Profile เป็น DAG | R (ส่วนที่ 8) |
| 9 | Item หนึ่งปรากฏใน Recipe/Quest เดียวครั้งเดียว (รวมจำนวนถ้าผู้ใช้เพิ่มซ้ำ) | D (PK ประกอบ) + R |
| 10 | `tracking_target` ชี้ Quest หรือ Recipe อย่างเดียว; Quest/Recipe หนึ่งมี Target ได้หนึ่งแถว | D (CHECK + UNIQUE) |
| 11 | `priority` ของ Targets ใน Profile เป็น 1..n ไม่ซ้ำ หลังทุกการเพิ่ม/ลบ/Reorder (Repository เขียนใหม่ทั้งชุดใน Transaction) | R |
| 12 | `qty`, `output_qty`, `target_qty` เป็นจำนวนเต็ม > 0 | D (CHECK) + R (ตรวจ `Number.isInteger`) |
| 13 | `quest.completed_at` มีค่าก็ต่อเมื่อ `status = 'completed'` | R |
| 14 | `image_path`/`thumbnail_path` เป็น NULL คู่กันหรือมีค่าคู่กัน และตรงรูปแบบ `images/<profile_id>/...` ของ Profile เดียวกัน | R |
| 15 | ไม่มี Path สัมบูรณ์หรือ `..` ในคอลัมน์ Path ใด; Main ปฏิเสธการ Resolve นอก `<userData>\data` | R |
| 16 | `app_setting.value` เป็น JSON ที่ `JSON.parse` ได้; ค่าที่ผิดรูปร่างถูกแทนด้วยค่าเริ่มต้นตอนอ่าน ไม่ทำให้แอปเปิดไม่ได้ | R |
| 17 | `active_profile_id` ชี้ Profile ที่มีอยู่ หรือเป็น `null`; ตรวจตอนเปิดแอป หลังลบ Profile และหลัง Restore | R |
| 18 | Timestamp ทุกคอลัมน์เป็น ISO-8601 UTC ที่ `Date.parse` ได้ | R |
| 19 | การเขียนหลายแถว/หลายตารางอยู่ใน Transaction เดียวเสมอ; ไม่มี Partial Write ที่มองเห็นได้ | R |
| 20 | Required/Missing/Progress/Craft plan ไม่ถูกเก็บลงฐานข้อมูล | R (ไม่มีคอลัมน์รองรับ) |
| 21 | ไฟล์ภาพถูกลบหลัง Commit เท่านั้น; ไฟล์กำพร้าไม่ทำให้ข้อมูลผิด | R |
| 22 | `PRAGMA user_version` เท่ากับหมายเลข Migration ล่าสุดที่สำเร็จ; Migration ที่ใช้แล้วไม่ถูกแก้ | R (Runner) |

## 11. Query Patterns ที่ Repositories ต้องมี

ทุก Query ใช้ Prepared Statement ของ better-sqlite3 (`db.prepare()` ครั้งเดียวตอนสร้าง Repository แล้ว `run/get/all` ซ้ำ) และผูกค่าด้วย Named Parameters `:name` ทุก Query ของข้อมูลเกมมี `profile_id = :profileId` เพื่อรักษา Invariant 6

### 11.1 รายการ Items พร้อม Owned (Item Library, ตัวเลือกใน Recipes/Quests)

```sql
SELECT i.id, i.name, i.category, i.image_path, i.thumbnail_path, i.notes, i.pinned, i.updated_at,
       COALESCE(inv.owned, 0) AS owned,
       EXISTS (SELECT 1 FROM recipe r WHERE r.output_item_id = i.id) AS has_recipe
FROM item i
LEFT JOIN inventory inv ON inv.item_id = i.id
WHERE i.profile_id = :profileId
  AND (:category IS NULL OR i.category = :category)
  AND (:pinnedOnly = 0 OR i.pinned = 1)
  AND (:search = '' OR i.name LIKE '%' || :search || '%' ESCAPE '\')
ORDER BY i.pinned DESC, i.name COLLATE NOCASE;
```

Item ที่ Pin อยู่บนสุด แล้วเรียงตามชื่อ (Feature Specification F2-R4) `LIKE` ใน SQLite ไม่สนตัวพิมพ์สำหรับ ASCII อยู่แล้ว Repository Escape `%`, `_`, `\` ในคำค้นก่อนผูกค่า การค้นหาชื่อแบบตรงตัว (Capture → "ผูกกับ Item ที่มีอยู่") ใช้ `WHERE profile_id = :profileId AND name = :name COLLATE NOCASE` ซึ่งใช้ Autoindex ของ UNIQUE

### 11.2 ข้อมูลเข้าของ Aggregation (4 Statements ต่อการคำนวณหนึ่งครั้ง)

```sql
-- Targets เรียง priority (Quest เฉพาะ active)
SELECT tt.id, tt.kind, tt.quest_id, tt.recipe_id, tt.target_qty, tt.priority, tt.pinned
FROM tracking_target tt
LEFT JOIN quest q ON q.id = tt.quest_id
WHERE tt.profile_id = :profileId
  AND (tt.kind = 'recipe' OR q.status = 'active')
ORDER BY tt.priority, tt.id;

-- Requirements ของ Quests ที่ถูกติดตาม
SELECT qr.quest_id, qr.item_id, qr.qty, qr.mode
FROM quest_requirement qr
JOIN tracking_target tt ON tt.quest_id = qr.quest_id
WHERE tt.profile_id = :profileId
ORDER BY qr.quest_id, qr.sort_order;

-- Recipes ทั้งหมดของ Profile พร้อม Ingredients (ใช้ทั้งเป็น Target และสำหรับ Nested Expansion)
SELECT r.id, r.output_item_id, r.output_qty, ri.item_id, ri.qty, ri.mode
FROM recipe r
LEFT JOIN recipe_ingredient ri ON ri.recipe_id = r.id
WHERE r.profile_id = :profileId
ORDER BY r.id, ri.sort_order;

-- Inventory ของ Profile
SELECT inv.item_id, inv.owned
FROM inventory inv
JOIN item i ON i.id = inv.item_id
WHERE i.profile_id = :profileId AND inv.owned > 0;
```

Repository ประกอบผลเป็น `AggregationInput` (ส่วนที่ 7.5) แล้วเรียก `aggregate()` จากนั้น Join ชื่อ/Thumbnail/Category จาก Query 11.1 (หรือ Cache ของมัน) ก่อน Push

### 11.3 ตรวจการใช้งานก่อนลบ Item (ข้อความ Error ของ RESTRICT)

```sql
SELECT 'recipe' AS kind, r.id AS id, oi.name AS label
FROM recipe_ingredient ri
JOIN recipe r ON r.id = ri.recipe_id
JOIN item oi ON oi.id = r.output_item_id
WHERE ri.item_id = :itemId
UNION ALL
SELECT 'quest' AS kind, q.id AS id, q.name AS label
FROM quest_requirement qr
JOIN quest q ON q.id = qr.quest_id
WHERE qr.item_id = :itemId
UNION ALL
SELECT 'recipe_output' AS kind, r.id AS id, oi.name AS label
FROM recipe r
JOIN item oi ON oi.id = r.output_item_id
WHERE r.output_item_id = :itemId
ORDER BY kind, label COLLATE NOCASE;
```

Query นี้คือผลของ `items:getUsage` แถว `kind = 'recipe'`/`'quest'` ทำให้ลบไม่ได้: Handler `items:delete` คืน `ITEM_IN_USE { details: { usages: [{ kind, id, label }] } }` โดยไม่พยายาม DELETE ส่วนแถว `kind = 'recipe_output'` ไม่ขวางการลบ แต่ UI ใช้เตือนว่า Recipe นั้น (พร้อม Ingredients และ Tracking Target ของมัน) จะถูกลบด้วยแบบ CASCADE ผลลัพธ์ว่าง → ลบได้ทันที (CASCADE ไปยัง `inventory`) สองส่วนแรกใช้ `idx_recipe_ingredient_item` และ `idx_quest_requirement_item` ส่วนที่สามใช้ UNIQUE Index ของ `recipe.output_item_id`

### 11.4 Recipe พร้อม Ingredients (หน้า Recipes, Nested Preview)

```sql
SELECT r.id, r.output_item_id, r.output_qty, r.station, r.notes, r.updated_at,
       ri.item_id, ri.qty, ri.mode, ri.sort_order,
       EXISTS (SELECT 1 FROM recipe r2 WHERE r2.output_item_id = ri.item_id) AS ingredient_has_recipe
FROM recipe r
LEFT JOIN recipe_ingredient ri ON ri.recipe_id = r.id
WHERE r.profile_id = :profileId AND (:recipeId IS NULL OR r.id = :recipeId)
ORDER BY r.id, ri.sort_order;
```

Nested Preview ในหน้า Recipes ใช้ `aggregate()` กับ Input ที่มี Target เดียว (Recipe นั้น, `target_qty` ที่ผู้ใช้พิมพ์) และ `owned` จริง เพื่อให้ตัวเลข Preview ตรงกับ Gathering List

บันทึก Recipe (สร้าง/แก้) ใน Transaction เดียว: ตรวจวงจร (ส่วนที่ 8) → `INSERT`/`UPDATE recipe` → `DELETE FROM recipe_ingredient WHERE recipe_id = :recipeId` → `INSERT` รายการใหม่ทั้งชุด → `updated_at`

### 11.5 Quest พร้อม Requirements

```sql
SELECT q.id, q.name, q.status, q.notes, q.completed_at, q.updated_at,
       qr.item_id, qr.qty, qr.mode, qr.sort_order,
       tt.id AS tracking_target_id
FROM quest q
LEFT JOIN quest_requirement qr ON qr.quest_id = q.id
LEFT JOIN tracking_target tt ON tt.quest_id = q.id
WHERE q.profile_id = :profileId AND (:status IS NULL OR q.status = :status)
ORDER BY q.status, q.updated_at DESC, qr.sort_order;
```

ตัวเลข "จัดสรร" ต่อ Quest มาจาก `AggregationResult.perTarget` ของการคำนวณล่าสุด ไม่ Query แยก

### 11.6 Tracking Targets

```sql
-- เพิ่ม (priority ต่อท้าย)
INSERT INTO tracking_target (profile_id, kind, quest_id, recipe_id, target_qty, priority, pinned, created_at)
VALUES (:profileId, :kind, :questId, :recipeId, :targetQty,
        (SELECT COALESCE(MAX(priority), 0) + 1 FROM tracking_target WHERE profile_id = :profileId),
        0, :now);

-- Reorder: ภายใน Transaction, ids คือลำดับใหม่ทั้งชุดของ Profile
UPDATE tracking_target SET priority = :position WHERE id = :id AND profile_id = :profileId;
-- Repository ตรวจว่า ids ครบและตรงกับแถวใน Profile ก่อนเริ่ม มิฉะนั้น VALIDATION (Feature Specification F5-R5); changes() ต้องเป็น 1 ทุกครั้ง

-- ลบแล้วจัด priority ใหม่ (Transaction เดียว)
DELETE FROM tracking_target WHERE id = :id AND profile_id = :profileId;
-- ตามด้วย UPDATE ... SET priority = :position สำหรับแถวที่เหลือเรียงตาม priority เดิม
```

### 11.7 Game Profile

```sql
-- รายการสำหรับ Game Dashboard
SELECT p.id, p.name, p.icon_path, p.last_opened_at,
       (SELECT COUNT(*) FROM item i WHERE i.profile_id = p.id) AS item_count,
       (SELECT COUNT(*) FROM quest q WHERE q.profile_id = p.id AND q.status = 'active') AS active_quest_count
FROM game_profile p
ORDER BY p.last_opened_at DESC NULLS LAST, p.name COLLATE NOCASE;

-- สลับ Profile (Transaction เดียว)
UPDATE game_profile SET last_opened_at = :now WHERE id = :profileId;
INSERT INTO app_setting (key, value, updated_at) VALUES ('active_profile_id', :json, :now)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
```

Overall Progress ของแต่ละ Profile Card ที่ไม่ใช่ Active Profile ต้องคำนวณด้วย `aggregate()` ต่อ Profile; ทำเฉพาะตอนเปิด Dashboard และ Cache ใน Main จนกว่าข้อมูลของ Profile นั้นเปลี่ยน

การลบ Profile ทำตามลำดับในส่วนที่ 3.11 ภายใน Transaction เดียว แล้วลบโฟลเดอร์ภาพและตั้ง `active_profile_id = null` ถ้าจำเป็น

### 11.8 Settings

```sql
SELECT key, value FROM app_setting WHERE key IN ('active_profile_id','hotkeys','overlay','window','preferences');
```

อ่านครั้งเดียวตอนเปิดแอปเข้า Settings Store ใน Main (In-memory) ทุกการเปลี่ยนเขียนด้วย Upsert ในส่วนที่ 3.12 ทันที (Auto-save ตาม Requirement 5) และ Push `settings:changed` ให้ Windows ที่เกี่ยวข้อง
