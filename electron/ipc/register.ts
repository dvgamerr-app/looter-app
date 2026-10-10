import { ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron'
import { INVOKE_CHANNELS, type InvokeChannel, type InvokeContract, type IpcResult } from './contracts'
import { AppError, mapDatabaseError } from './errors'

const trustedSenders = new Set<number>()
const registered = new Set<InvokeChannel>()

/** Only windows created by the app may call a handler (error code FORBIDDEN, section 14.2). */
export function trustSender(contents: WebContents): void {
  trustedSenders.add(contents.id)
  contents.once('destroyed', () => trustedSenders.delete(contents.id))
}

function toIpcError(error: unknown, channel: string): Extract<IpcResult<never>, { ok: false }> {
  if (error instanceof AppError) return { ok: false, error: error.toJSON() }
  const mapped = mapDatabaseError(error)
  if (mapped.code === 'INTERNAL' || mapped.code === 'IO') console.error(`[ipc] ${channel} failed`, error)
  return { ok: false, error: mapped.toJSON() }
}

/**
 * Registers a typed invoke handler. Errors thrown by the handler are normalised into the result
 * envelope, so the renderer never sees a rejected promise for an expected failure.
 */
export function handle<C extends InvokeChannel>(
  channel: C,
  handler: (request: InvokeContract[C][0], event: IpcMainInvokeEvent) => InvokeContract[C][1] | Promise<InvokeContract[C][1]>,
): void {
  registered.add(channel)
  ipcMain.handle(channel, async (event, request): Promise<IpcResult<InvokeContract[C][1]>> => {
    if (!trustedSenders.has(event.sender.id)) {
      return { ok: false, error: new AppError('FORBIDDEN', 'หน้าต่างนี้ไม่มีสิทธิ์เรียกคำสั่งนี้').toJSON() }
    }
    try {
      return { ok: true, data: await handler(request, event) }
    } catch (error) {
      return toIpcError(error, channel)
    }
  })
}

/** Channels declared in contracts.ts whose feature has not been built yet answer with a clear error. */
export function registerUnimplementedChannels(): void {
  for (const channel of INVOKE_CHANNELS) {
    if (registered.has(channel)) continue
    handle(channel, () => {
      throw new AppError('INTERNAL', 'คำสั่งนี้ยังไม่รองรับในเวอร์ชันนี้', { channel })
    })
  }
}
