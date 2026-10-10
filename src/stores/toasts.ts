import { readonly, ref } from 'vue'

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error'
  message: string
}

const AUTO_DISMISS_MS = 5000

const toasts = ref<Toast[]>([])
let nextId = 1

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

/** Shows a toast. Errors stay until dismissed; other kinds disappear on their own (UI/UX Design Plan 2.4). */
function push(kind: Toast['kind'], message: string): void {
  const id = nextId++
  toasts.value = [...toasts.value, { id, kind, message }]
  if (kind !== 'error') setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
}

export function useToasts() {
  return {
    toasts: readonly(toasts),
    dismiss,
    info: (message: string) => push('info', message),
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
  }
}
