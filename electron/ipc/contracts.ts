// Single source of truth for the IPC surface (Feature Specification section 14).
// Type-only apart from the channel lists, so the renderer, the preload script and the main process can
// all import it. Never import `electron` or Node.js modules here.
import type {
  AggregationResult,
  CraftPlanRow,
  GatheringRow,
  ItemCategory,
  Mode,
  TargetAllocation,
  TrackingKind,
} from '../domain/types'

import type { RecipeExpansion } from '../domain/expand'

export type { ItemCategory, Mode, TargetAllocation, TrackingKind } from '../domain/types'
export type { RecipeExpansion, RecipeTreeNode } from '../domain/expand'

// ---------------------------------------------------------------------------------------------
// Result envelope and error codes (section 14.2)
// ---------------------------------------------------------------------------------------------

export type ErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'DUPLICATE_NAME'
  | 'DUPLICATE_RECIPE'
  | 'DUPLICATE_TARGET'
  | 'ITEM_IN_USE'
  | 'CYCLE'
  | 'INSUFFICIENT_MATERIALS'
  | 'CAPTURE_FAILED'
  | 'CLIPBOARD_EMPTY'
  | 'UNSUPPORTED_IMAGE'
  | 'HOTKEY_CONFLICT'
  | 'HOTKEY_REGISTER_FAILED'
  | 'BACKUP_INVALID'
  | 'BACKUP_TOO_NEW'
  | 'IO'
  | 'FORBIDDEN'
  | 'INTERNAL'

export interface IpcError {
  code: ErrorCode
  message: string
  details?: unknown
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError }

// ---------------------------------------------------------------------------------------------
// Settings (Data Model section 3.12)
// ---------------------------------------------------------------------------------------------

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** Electron accelerator strings; '' disables the action (F11-R6). */
export interface Hotkeys {
  toggleOverlay: string
  toggleOverlayMode: string
  startCapture: string
  importClipboard: string
  overlayNextTarget: string
  overlayPrevTarget: string
}

export type HotkeyAction = keyof Hotkeys

export interface OverlaySetting {
  /** null = default position (top right of the primary display). */
  bounds: Bounds | null
  /** 0.2 to 1.0 */
  opacity: number
  mode: 'view' | 'interactive'
  compact: boolean
  visible: boolean
}

export interface WindowSetting {
  bounds: Bounds | null
  maximized: boolean
}

export interface Preferences {
  theme: 'dark' | 'light' | 'system'
  sort: 'missing-first' | 'name' | 'category'
  hideComplete: boolean
  stepSizes: number[]
  sidebarCollapsed: boolean
  itemView: 'grid' | 'table'
}

/** 'pending' = not registered yet (the hotkeys module arrives with the Overlay in Phase 3). */
export type HotkeyStatus = 'registered' | 'failed' | 'disabled' | 'pending'

export interface SettingsState {
  hotkeys: Hotkeys
  hotkeyStatus: Record<HotkeyAction, HotkeyStatus>
  overlay: OverlaySetting
  preferences: Preferences
}

export interface SettingsUpdate {
  preferences?: Partial<Preferences>
  overlay?: Partial<OverlaySetting>
}

// ---------------------------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------------------------

export interface ProfileDto {
  id: number
  name: string
  iconUrl: string | null
  createdAt: string
  lastOpenedAt: string | null
  itemCount: number
  recipeCount: number
  questCount: number
  /** Overall progress; zero until the aggregation engine arrives in Phase 2. */
  progress: { owned: number; required: number }
}

export interface ProfileList {
  activeProfileId: number | null
  profiles: ProfileDto[]
}

export interface ProfileDeleteSummary {
  id: number
  name: string
  items: number
  recipes: number
  quests: number
  targets: number
  imageFiles: number
}

export interface ItemDto {
  id: number
  name: string
  category: ItemCategory
  notes: string | null
  pinned: boolean
  imageUrl: string | null
  thumbnailUrl: string | null
  owned: number
  hasRecipe: boolean
  updatedAt: string
}

export interface ItemUsage {
  kind: 'recipe' | 'quest' | 'recipe_output'
  id: number
  label: string
}

export interface IngredientInput {
  itemId: number
  qty: number
  mode: Mode
}

export interface RecipeDto {
  id: number
  outputItemId: number
  outputQty: number
  station: string | null
  notes: string | null
  ingredients: Array<IngredientInput & { sortOrder: number; ingredientHasRecipe: boolean }>
  trackingTargetId: number | null
  updatedAt: string
}

export type QuestStatus = 'active' | 'paused' | 'completed'

export interface QuestDto {
  id: number
  name: string
  status: QuestStatus
  notes: string | null
  completedAt: string | null
  requirements: Array<IngredientInput & { sortOrder: number }>
  trackingTargetId: number | null
  updatedAt: string
}

export interface TrackingTargetDto {
  id: number
  kind: TrackingKind
  questId: number | null
  recipeId: number | null
  label: string
  targetQty: number
  priority: number
  pinned: boolean
  /** Quest targets only: paused and completed quests are kept but not counted (F4-R5). */
  questStatus: QuestStatus | null
}

export interface GatheringItemRow extends GatheringRow {
  name: string
  category: ItemCategory
  thumbnailUrl: string | null
  pinned: boolean
}

export interface GatheringCraftRow extends CraftPlanRow {
  outputName: string
  outputThumbnailUrl: string | null
  ingredientsPerRun: IngredientInput[]
}

/** AggregationResult enriched with display data by the main process (Data Model section 7.5). */
export interface GatheringResult extends Omit<AggregationResult, 'items' | 'craftPlan' | 'perTarget'> {
  items: GatheringItemRow[]
  craftPlan: GatheringCraftRow[]
  perTarget: TargetAllocation[]
}

export interface OverlayState {
  visible: boolean
  mode: 'view' | 'interactive'
  opacity: number
  compact: boolean
  bounds: Bounds | null
  scope: 'all' | number
}

export interface PendingImage {
  id: string
  source: 'capture' | 'clipboard' | 'file'
  width: number
  height: number
  previewDataUrl: string
}

export interface CaptureEvent {
  phase: 'started' | 'captured' | 'cancelled' | 'failed'
  pending?: PendingImage
  error?: IpcError
}

export interface BackupSummary {
  appVersion: string
  schemaVersion: number
  exportedAt: string
  profileCount: number
  itemCount: number
}

export interface AppInfo {
  name: string
  version: string
  electron: string
  chromium: string
  node: string
  schemaVersion: number
  dataPath: string
}

// ---------------------------------------------------------------------------------------------
// Invoke contract: channel -> [request, response]
// ---------------------------------------------------------------------------------------------

export interface InvokeContract {
  'profiles:list': [void, ProfileList]
  'profiles:create': [{ name: string }, ProfileList]
  'profiles:rename': [{ id: number; name: string }, ProfileList]
  'profiles:delete': [{ id: number }, ProfileList]
  'profiles:getDeleteSummary': [{ id: number }, ProfileDeleteSummary]
  'profiles:switch': [{ id: number }, ProfileList]
  'profiles:getActive': [void, ProfileDto | null]

  'items:list': [{ search?: string; category?: ItemCategory; pinnedOnly?: boolean } | void, ItemDto[]]
  'items:get': [{ id: number }, ItemDto]
  'items:create': [
    { name: string; category?: ItemCategory; notes?: string; pendingImageId?: string },
    ItemDto,
  ]
  'items:update': [{ id: number; name?: string; category?: ItemCategory; notes?: string | null }, ItemDto]
  'items:setPinned': [{ id: number; pinned: boolean }, ItemDto]
  'items:attachImage': [{ id: number; pendingImageId: string; replace?: boolean }, ItemDto]
  'items:removeImage': [{ id: number }, ItemDto]
  'items:getUsage': [{ id: number }, ItemUsage[]]
  'items:delete': [{ id: number }, null]

  'recipes:list': [void, RecipeDto[]]
  'recipes:get': [{ id: number }, RecipeDto]
  'recipes:create': [RecipeInput, RecipeDto]
  'recipes:update': [RecipeInput & { id: number }, RecipeDto]
  'recipes:delete': [{ id: number }, null]
  'recipes:validate': [{ id?: number; outputItemId: number; ingredients: IngredientInput[] }, { ok: true }]
  'recipes:expand': [{ id: number; quantity: number }, RecipeExpansionDto]

  'quests:list': [{ status?: QuestStatus } | void, QuestDto[]]
  'quests:get': [{ id: number }, QuestDto]
  'quests:create': [
    { name: string; notes?: string; requirements: IngredientInput[]; track?: boolean },
    QuestDto,
  ]
  'quests:update': [
    { id: number; name?: string; notes?: string | null; requirements?: IngredientInput[] },
    QuestDto,
  ]
  'quests:setStatus': [{ id: number; status: QuestStatus }, QuestDto]
  'quests:delete': [{ id: number }, null]

  'tracking:list': [void, TrackingTargetDto[]]
  'tracking:add': [{ kind: TrackingKind; questId?: number; recipeId?: number; targetQty?: number }, TrackingTargetDto]
  'tracking:remove': [{ id: number }, null]
  'tracking:update': [{ id: number; targetQty: number }, TrackingTargetDto]
  'tracking:reorder': [number[], TrackingTargetDto[]]
  'tracking:setPinned': [{ id: number; pinned: boolean }, TrackingTargetDto]

  'inventory:adjust': [{ itemId: number; delta: number }, { itemId: number; owned: number }]
  'inventory:set': [{ itemId: number; owned: number }, { itemId: number; owned: number }]
  'inventory:consume': [{ questId: number; dryRun?: boolean; completeQuest?: boolean }, InventoryPlan]
  'inventory:craft': [{ recipeId: number; runs: number; dryRun?: boolean; reduceTarget?: boolean }, InventoryPlan]

  'gathering:get': [void, GatheringResult]

  'overlay:show': [void, OverlayState]
  'overlay:hide': [void, OverlayState]
  'overlay:toggle': [void, OverlayState]
  'overlay:setMode': [OverlayState['mode'], OverlayState]
  'overlay:setOpacity': [{ opacity: number }, OverlayState]
  'overlay:setCompact': [{ compact: boolean }, OverlayState]
  'overlay:resetLayout': [void, OverlayState]
  'overlay:getState': [void, OverlayState]
  'overlay:cycleScope': [{ direction: 1 | -1 }, OverlayState]
  'overlay:focusMainWindow': [void, null]
  'overlay:setBounds': [Bounds, OverlayState]

  'capture:start': [void, null]
  'capture:cancel': [void, null]
  'capture:commitSelection': [{ rect: Bounds }, PendingImage]
  'capture:fromClipboard': [void, PendingImage]
  'capture:importFile': [void, PendingImage | null]
  'capture:importPath': [{ path: string }, PendingImage]
  'capture:listPending': [void, PendingImage[]]
  'capture:discard': [{ pendingImageId: string }, null]

  'settings:get': [void, SettingsState]
  'settings:update': [SettingsUpdate, SettingsState]
  'settings:setHotkey': [{ action: HotkeyAction; accelerator: string }, SettingsState]
  'settings:resetHotkeys': [{ action?: HotkeyAction } | void, SettingsState]
  'settings:retryHotkeys': [void, SettingsState]

  'backup:pickPath': [{ mode: 'save' | 'open' }, string | null]
  'backup:export': [string, { path: string }]
  'backup:inspect': [string, BackupSummary]
  'backup:restore': [string, null]

  'app:getInfo': [void, AppInfo]
  'app:openDataFolder': [void, null]
}

export interface RecipeInput {
  outputItemId: number
  outputQty: number
  station?: string | null
  notes?: string | null
  ingredients: IngredientInput[]
}

export interface InventoryPlanRow {
  itemId: number
  /** Negative when materials are used, positive for a crafted output. */
  delta: number
  before: number
  after: number
}

/** What a consume or craft would do (dry run) or did. Nothing is written unless `ok`. */
export interface InventoryPlan {
  ok: boolean
  rows: InventoryPlanRow[]
  /** The crafted output row (craft only). */
  output: InventoryPlanRow | null
  /** Rows that would go negative; present whenever ok is false. */
  missing: Array<{ itemId: number; name: string; need: number; owned: number }>
  /** Tracking target of the quest or recipe, if any, so the dialog can offer the follow-up options. */
  target: { id: number; targetQty: number } | null
  /** Craft: the most runs the current inventory covers (0 when an ingredient is missing). */
  maxRuns: number | null
  /** Consume: the quest status, so the dialog can hide "complete the quest too". */
  questStatus: QuestStatus | null
}

export interface RecipeExpansionDto extends RecipeExpansion {
  recipeId: number
  quantity: number
  /** Same single-target algorithm as the Gathering List, using the real inventory (F3-R8). */
  net: Pick<AggregationResult, 'items' | 'craftPlan' | 'overall'>
}

// ---------------------------------------------------------------------------------------------
// Push events (main -> windows)
// ---------------------------------------------------------------------------------------------

export interface EventContract {
  'profile:changed': ProfileList
  'items:changed': { profileId: number; itemIds?: number[] }
  'recipes:changed': { profileId: number; recipeIds?: number[] }
  'quests:changed': { profileId: number; questIds?: number[] }
  'tracking:changed': { profileId: number }
  'inventory:changed': { profileId: number; changes: Array<{ itemId: number; owned: number }> }
  'gathering:changed': GatheringResult
  'overlay:changed': OverlayState
  'settings:changed': SettingsState
  'capture:changed': CaptureEvent
  'capture:frame': { frameUrl: string; displayBounds: Bounds; imageWidth: number; imageHeight: number }
}

export type InvokeChannel = keyof InvokeContract
export type EventChannel = keyof EventContract

/** Allow-lists used by the preload script. The exhaustiveness checks below keep them in sync with the types. */
export const INVOKE_CHANNELS = [
  'profiles:list', 'profiles:create', 'profiles:rename', 'profiles:delete', 'profiles:getDeleteSummary',
  'profiles:switch', 'profiles:getActive',
  'items:list', 'items:get', 'items:create', 'items:update', 'items:setPinned', 'items:attachImage',
  'items:removeImage', 'items:getUsage', 'items:delete',
  'recipes:list', 'recipes:get', 'recipes:create', 'recipes:update', 'recipes:delete', 'recipes:validate',
  'recipes:expand',
  'quests:list', 'quests:get', 'quests:create', 'quests:update', 'quests:setStatus', 'quests:delete',
  'tracking:list', 'tracking:add', 'tracking:remove', 'tracking:update', 'tracking:reorder',
  'tracking:setPinned',
  'inventory:adjust', 'inventory:set', 'inventory:consume', 'inventory:craft',
  'gathering:get',
  'overlay:show', 'overlay:hide', 'overlay:toggle', 'overlay:setMode', 'overlay:setOpacity',
  'overlay:setCompact', 'overlay:resetLayout', 'overlay:getState', 'overlay:cycleScope',
  'overlay:focusMainWindow', 'overlay:setBounds',
  'capture:start', 'capture:cancel', 'capture:commitSelection', 'capture:fromClipboard',
  'capture:importFile', 'capture:importPath', 'capture:listPending', 'capture:discard',
  'settings:get', 'settings:update', 'settings:setHotkey', 'settings:resetHotkeys', 'settings:retryHotkeys',
  'backup:pickPath', 'backup:export', 'backup:inspect', 'backup:restore',
  'app:getInfo', 'app:openDataFolder',
] as const satisfies readonly InvokeChannel[]

export const EVENT_CHANNELS = [
  'profile:changed', 'items:changed', 'recipes:changed', 'quests:changed', 'tracking:changed',
  'inventory:changed', 'gathering:changed', 'overlay:changed', 'settings:changed', 'capture:changed',
  'capture:frame',
] as const satisfies readonly EventChannel[]

type MissingInvoke = Exclude<InvokeChannel, (typeof INVOKE_CHANNELS)[number]>
type MissingEvent = Exclude<EventChannel, (typeof EVENT_CHANNELS)[number]>
export const channelListsAreComplete: [MissingInvoke, MissingEvent] extends [never, never] ? true : never = true

// ---------------------------------------------------------------------------------------------
// window.api shape, derived from the contract: 'profiles:list' -> api.profiles.list()
// ---------------------------------------------------------------------------------------------

type Domain<C extends string> = C extends `${infer D}:${string}` ? D : never
type Action<C extends string> = C extends `${string}:${infer A}` ? A : never

type Invoker<C extends InvokeChannel> = InvokeContract[C][0] extends void
  ? () => Promise<IpcResult<InvokeContract[C][1]>>
  : [void] extends [InvokeContract[C][0]]
    ? (request?: Exclude<InvokeContract[C][0], void>) => Promise<IpcResult<InvokeContract[C][1]>>
    : (request: InvokeContract[C][0]) => Promise<IpcResult<InvokeContract[C][1]>>

export type Api = {
  [D in Domain<InvokeChannel>]: {
    [C in Extract<InvokeChannel, `${D}:${string}`> as Action<C>]: Invoker<C>
  }
} & {
  /** Subscribes to a push event; returns the unsubscribe function. */
  on<E extends EventChannel>(event: E, listener: (payload: EventContract[E]) => void): () => void
}
