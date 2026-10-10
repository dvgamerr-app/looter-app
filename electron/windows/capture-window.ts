import { BrowserWindow, screen, type Display, type NativeImage } from 'electron'
import path from 'node:path'
import { grabDisplayUnderCursor, isBlackFrame } from '../capture/screen-capture'
import type { PendingStore } from '../images/pending-store'
import { broadcast } from '../ipc/broadcast'
import type { Bounds, PendingImage } from '../ipc/contracts'
import { AppError } from '../ipc/errors'
import { trustSender } from '../ipc/register'
import type { OverlayController } from './overlay-window'

const MIN_SELECTION_PX = 8

export interface CaptureDeps {
  pending: PendingStore
  overlay: OverlayController
  getActiveProfileId: () => number | null
  getMainWindow: () => BrowserWindow | null
  distDir: string
  devServerUrl?: string
}

interface Session {
  window: BrowserWindow
  image: NativeImage
  display: Display
  profileId: number
}

/**
 * Region capture (F10): freeze the screen under the cursor, let the user drag a rectangle in a fullscreen
 * window, crop it at the real resolution and hand the result over as a pending image. One capture at a
 * time; the window lives only for the duration of the selection (F10-R3, F10-R15).
 */
export function createCaptureController(deps: CaptureDeps) {
  const { pending, overlay, getActiveProfileId, getMainWindow, distDir, devServerUrl } = deps
  let session: Session | null = null
  // True from the moment a capture is requested until its window exists, so a second request in that gap is ignored.
  let starting = false

  const raiseMainWindow = (): void => {
    const main = getMainWindow()
    if (!main) return
    if (main.isMinimized()) main.restore()
    main.show()
    main.focus()
  }

  function finish(): void {
    const current = session
    session = null
    if (current && !current.window.isDestroyed()) current.window.destroy()
    overlay.resume()
  }

  function fail(error: AppError): void {
    finish()
    broadcast('capture:changed', { phase: 'failed', error: error.toJSON() })
    raiseMainWindow()
  }

  return {
    isActive: (): boolean => session !== null,

    /** Starts a capture; a second request while one is running is ignored (F10-R15). */
    async start(): Promise<void> {
      if (session || starting) return
      const profileId = getActiveProfileId()
      if (profileId === null) throw new AppError('NOT_FOUND', 'ยังไม่มี Game Profile ที่ใช้งานอยู่')

      starting = true
      // The overlay hides first so it does not end up in the screenshot.
      overlay.suspend()
      let frame
      try {
        // A short pause lets the compositor repaint without the overlay before the grab.
        await new Promise((resolve) => setTimeout(resolve, 80))
        frame = await grabDisplayUnderCursor()
      } catch (error) {
        starting = false
        overlay.resume()
        return fail(error instanceof AppError ? error : new AppError('CAPTURE_FAILED', 'จับภาพหน้าจอไม่ได้', { reason: 'unknown' }))
      }
      if (isBlackFrame(frame.image)) {
        starting = false
        overlay.resume()
        return fail(
          new AppError('CAPTURE_FAILED', 'จับภาพหน้าจอไม่ได้ เกมอาจอยู่ในโหมด Fullscreen Exclusive ลองเปลี่ยนเกมเป็น Borderless Windowed หรือใช้ Snipping Tool', { reason: 'black' }),
        )
      }

      const { display, image } = frame
      const window = new BrowserWindow({
        ...display.bounds,
        frame: false,
        show: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        hasShadow: false,
        backgroundColor: '#000000',
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      })
      trustSender(window.webContents)
      session = { window, image, display, profileId }
      starting = false
      window.setAlwaysOnTop(true, 'screen-saver')
      window.on('closed', () => {
        // Closed by the user (for example Alt+F4) without choosing a region.
        if (session?.window === window) {
          session = null
          overlay.resume()
          broadcast('capture:changed', { phase: 'cancelled' })
        }
      })

      // The frame goes to this window alone, never to a broadcast (Feature Specification 14.1).
      window.webContents.once('did-fail-load', () => {
        if (session?.window === window) fail(new AppError('CAPTURE_FAILED', 'เปิดหน้าต่างจับภาพไม่สำเร็จ', { reason: 'load' }))
      })
      window.webContents.once('did-finish-load', () => {
        // On a display with a different scale than the primary one Windows can size the new window wrongly.
        window.setBounds(display.bounds)
        const size = image.getSize()
        window.webContents.send('capture:frame', {
          frameUrl: image.toDataURL(),
          displayBounds: display.bounds,
          imageWidth: size.width,
          imageHeight: size.height,
        })
        window.show()
        window.focus()
      })
      broadcast('capture:changed', { phase: 'started' })
      if (devServerUrl) void window.loadURL(new URL('capture.html', devServerUrl).toString())
      else void window.loadFile(path.join(distDir, 'capture.html'))
    },

    cancel(): void {
      if (!session) return
      finish()
      broadcast('capture:changed', { phase: 'cancelled' })
    },

    /**
     * Crops the chosen rectangle. `rect` is in the capture window's CSS pixels; it is multiplied by the
     * display's scale so the crop matches what the user saw, also on a 150% screen (F10-R4).
     */
    commit(rect: Bounds): PendingImage {
      if (!session) throw new AppError('CAPTURE_FAILED', 'ไม่มีการจับภาพที่กำลังทำอยู่')
      const { image, display, profileId } = session
      const size = image.getSize()
      const scale = size.width / display.bounds.width
      const x = Math.max(0, Math.min(size.width - 1, Math.round(rect.x * scale)))
      const y = Math.max(0, Math.min(size.height - 1, Math.round(rect.y * scale)))
      const width = Math.min(size.width - x, Math.round(rect.width * scale))
      const height = Math.min(size.height - y, Math.round(rect.height * scale))
      if (width < MIN_SELECTION_PX || height < MIN_SELECTION_PX) {
        throw new AppError('VALIDATION', `บริเวณที่เลือกเล็กเกินไป ต้องไม่ต่ำกว่า ${MIN_SELECTION_PX} × ${MIN_SELECTION_PX} px`)
      }
      const added = pending.add(profileId, 'capture', image.crop({ x, y, width, height }))
      finish()
      broadcast('capture:changed', { phase: 'captured', pending: added })
      raiseMainWindow()
      return added
    },

    /** Display bounds that are still connected; used to cancel when the screen disappears. */
    stillConnected: (): boolean => (session ? screen.getAllDisplays().some((display) => display.id === session!.display.id) : true),
  }
}

export type CaptureController = ReturnType<typeof createCaptureController>
