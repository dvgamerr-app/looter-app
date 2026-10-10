import { readonly, ref } from 'vue'

const message = ref('')

/** Text for the polite live region in the title bar (UI/UX Design Plan section 9.3). */
export const liveMessage = readonly(message)

export function announce(text: string): void {
  // Clearing first makes screen readers repeat an identical message.
  message.value = ''
  queueMicrotask(() => {
    message.value = text
  })
}
