import { app, net } from 'electron'
import type { UpdateInfo } from '../ipc/contracts'
import { AppError } from '../ipc/errors'

const RELEASES_PAGE = 'https://github.com/dvgamerr-app/looter-app/releases'
const LATEST_API = 'https://api.github.com/repos/dvgamerr-app/looter-app/releases/latest'

/** Compares dotted numeric versions ("1.2.10" > "1.2.9"); a leading "v" and any suffix after "-" are ignored. */
export function isNewer(candidate: string, current: string): boolean {
  const parse = (version: string): number[] => version.replace(/^v/, '').split('-')[0]!.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const a = parse(candidate)
  const b = parse(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0)
    if (difference !== 0) return difference > 0
  }
  return false
}

/**
 * Asks GitHub for the latest release and compares it with the running version. It only reports: the user
 * downloads the installer from the release page, because installers are not signed yet (F11-R15).
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const current = app.getVersion()
  let response: Response
  try {
    response = await net.fetch(LATEST_API, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': `GameLooter/${current}` } })
  } catch (error) {
    throw new AppError('IO', 'เชื่อมต่อ GitHub ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', { reason: (error as Error).message })
  }
  // 404 means no release has been published yet.
  if (response.status === 404) return { current, latest: null, updateAvailable: false, url: RELEASES_PAGE }
  if (!response.ok) throw new AppError('IO', `GitHub ตอบกลับสถานะ ${response.status}`)
  const body = (await response.json()) as { tag_name?: unknown; html_url?: unknown }
  const latest = typeof body.tag_name === 'string' ? body.tag_name.replace(/^v/, '') : null
  return {
    current,
    latest,
    updateAvailable: latest !== null && isNewer(latest, current),
    url: typeof body.html_url === 'string' && body.html_url.startsWith('https://github.com/') ? body.html_url : RELEASES_PAGE,
  }
}
