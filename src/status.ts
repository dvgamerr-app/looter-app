export type StatusRole = 'ok' | 'warning' | 'missing' | 'neutral'

/** Status roles of UI/UX Design Plan section 8.2. The colour is never the only signal: numbers or text accompany it. */
export function statusOf(required: number, owned: number): StatusRole {
  if (required <= 0) return 'neutral'
  if (owned >= required) return 'ok'
  return owned > 0 ? 'warning' : 'missing'
}

export const statusText: Record<StatusRole, string> = {
  ok: 'text-status-ok',
  warning: 'text-status-warning',
  missing: 'text-status-missing',
  neutral: 'text-text-muted',
}

export const statusFill: Record<StatusRole, string> = {
  ok: 'bg-status-ok',
  warning: 'bg-status-warning',
  missing: 'bg-status-missing',
  neutral: 'bg-status-neutral',
}

/** Lighter status colours for the dark overlay panel (UI/UX Design Plan 8.2). */
export const statusTextOverlay: Record<StatusRole, string> = {
  ok: 'text-status-ok-overlay',
  warning: 'text-status-warning-overlay',
  missing: 'text-status-missing-overlay',
  neutral: 'text-text-muted',
}
