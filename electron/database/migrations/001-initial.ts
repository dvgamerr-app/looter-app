import type { Migration } from './index'

const initial: Migration = {
  version: 1,
  name: 'initial',
  up(db) {
    db.exec(`
      CREATE TABLE game_profile (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        icon_path      TEXT    NULL,
        created_at     TEXT    NOT NULL,
        updated_at     TEXT    NOT NULL,
        last_opened_at TEXT    NULL
      );

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

      CREATE TABLE inventory (
        item_id    INTEGER PRIMARY KEY REFERENCES item(id) ON DELETE CASCADE,
        owned      INTEGER NOT NULL DEFAULT 0 CHECK (owned >= 0),
        updated_at TEXT    NOT NULL
      );

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

      CREATE TABLE recipe_ingredient (
        recipe_id  INTEGER NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
        item_id    INTEGER NOT NULL REFERENCES item(id) ON DELETE RESTRICT,
        qty        INTEGER NOT NULL CHECK (qty > 0),
        mode       TEXT    NOT NULL DEFAULT 'craft' CHECK (mode IN ('craft','gather')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (recipe_id, item_id)
      );
      CREATE INDEX idx_recipe_ingredient_item ON recipe_ingredient(item_id);

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

      CREATE TABLE quest_requirement (
        quest_id   INTEGER NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
        item_id    INTEGER NOT NULL REFERENCES item(id) ON DELETE RESTRICT,
        qty        INTEGER NOT NULL CHECK (qty > 0),
        mode       TEXT    NOT NULL DEFAULT 'craft' CHECK (mode IN ('craft','gather')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (quest_id, item_id)
      );
      CREATE INDEX idx_quest_requirement_item ON quest_requirement(item_id);

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

      CREATE TABLE app_setting (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)
  },
}

export default initial
