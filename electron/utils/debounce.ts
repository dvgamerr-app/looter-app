export interface Debounced<A extends unknown[]> {
  (...args: A): void
  /** Runs a pending call immediately (used on before-quit so the last bounds are not lost). */
  flush(): void
  cancel(): void
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, delay = 200): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: A | null = null

  const debounced = ((...args: A) => {
    pending = args
    clearTimeout(timer)
    timer = setTimeout(debounced.flush, delay)
  }) as Debounced<A>

  debounced.flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (pending) {
      const args = pending
      pending = null
      fn(...args)
    }
  }

  debounced.cancel = () => {
    clearTimeout(timer)
    timer = undefined
    pending = null
  }

  return debounced
}
