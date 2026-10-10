import { net, protocol } from 'electron'
import { pathToFileURL } from 'node:url'
import { IMAGE_SCHEME, resolveDataPath } from './image-store'

// Only the files this app writes can be requested: item images, item thumbnails and profile icons.
const ALLOWED = /^images\/\d+\/(?:thumbs\/\d+|\d+|profile-icon)\.png$/

/** Must run before the app is ready (Electron requirement). */
export function registerImageScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: IMAGE_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ])
}

/** Serves `looter-img://data/<relative path>` from the data folder; call once the app is ready. */
export function registerImageHandler(): void {
  protocol.handle(IMAGE_SCHEME, (request) => {
    if (request.method !== 'GET') return new Response(null, { status: 405 })
    const url = new URL(request.url)
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    if (url.host !== 'data' || !ALLOWED.test(relative)) return new Response(null, { status: 403 })
    try {
      return net.fetch(pathToFileURL(resolveDataPath(relative)).toString()).catch(() => new Response(null, { status: 404 }))
    } catch {
      return new Response(null, { status: 404 })
    }
  })
}
