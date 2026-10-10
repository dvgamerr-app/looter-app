/** ISO-8601 UTC timestamp stored in every `*_at` column. */
export const nowIso = (): string => new Date().toISOString()

/** Timestamp that is safe inside a Windows file name, e.g. `20261010-103045`. */
export function fileStamp(date: Date = new Date()): string {
  const pad = (value: number, size = 2) => String(value).padStart(size, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}
