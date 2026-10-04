import { readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AiProviderKind } from '@shared/ai'
import { CH } from '@shared/channels'
import { assemble, ramImage } from '@shared/elec16/asm'
import { CARD_FILE_MAX, CARD_STATUS, type CardAnswer, isCardName } from '@shared/elec16/card'
import { cardNameOf, fromMachineText, toMachineText } from '@shared/elec16/charset'
import type { LinkAnswer } from '@shared/elec16/link'
import { LINK_STATUS } from '@shared/elec16/link-services'
import { CODE_AREA, CODE_AREA_END, MODEL_IDS } from '@shared/elec16/map'
import {
  ELEC16_CLOCKS,
  type Elec16Board,
  type Elec16Claim,
  type Elec16FileInfo,
  type Elec16ImportResult,
  type Elec16Unit,
  type Elec16UnitSeed,
} from '@shared/elec16-units'
import { app, BrowserWindow, dialog, type WebContents } from 'electron'
import type { ProviderAdapter } from '../ai/adapter.js'
import { appWindows } from '../app-windows.js'
import { AiLinkService } from '../elec16/link/ai.js'
import { LinkHub } from '../elec16/link/hub.js'
import { Elec16Units, findElec16Dir, type Holder, readSoftCard } from '../elec16/units.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'
import { registerTable } from './table.js'

/**
 * The ELEC-16 pane's IPC (docs/elec16.md section 8): units, which pane runs each, their
 * battery backups and memory cards, and IMPORT / EXPORT through main's own pickers, so the
 * page never names a path. No plugin API reaches it.
 *
 * LINK (docs/elec16.md section 12) is the one way out: a request the machine made, passed on
 * by the page that runs the unit, answered by a service of main's (main/elec16/link) - the AI
 * asks the providers of the AI settings through the chat pane's adapters and keys, which
 * ipc/ai.ts hands over once it is up. Nothing is asked while LINK is off.
 */

/** What the AI service needs of the AI chat's side: the keys and the adapters. */
export interface Elec16AiLinks {
  keyFor(providerId: string): string | null
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
}

/** A text listing may be larger than the card file it makes (CRLF becomes CR). */
const TEXT_MAX = 4 * CARD_FILE_MAX

const isPane = (pane: unknown): pane is string =>
  typeof pane === 'string' && pane.length > 0 && pane.length <= 64

/** A pane's own seed for a first unit: what an older pane state had. */
function seedOf(raw: unknown): Elec16UnitSeed {
  if (typeof raw !== 'object' || raw === null) return {}
  const r = raw as Record<string, unknown>
  const clock = ELEC16_CLOCKS.find((c) => c === r.clock)
  const model = MODEL_IDS.find((m) => m === r.model)
  return { ...(clock !== undefined ? { clock } : {}), ...(model !== undefined ? { model } : {}) }
}

export function registerElec16Ipc(
  settings: SettingsHandle,
  aiLinks: () => Elec16AiLinks | null,
  dir = path.join(app.getPath('userData'), 'elec16'),
): {
  dispose: () => void
} {
  const units = new Elec16Units(
    dir,
    Date.now,
    readSoftCard(findElec16Dir(path.dirname(fileURLToPath(import.meta.url)))),
  )
  const owner = {}
  const hub = new LinkHub({
    services: [
      new AiLinkService({
        providers: () => settings.current().ai.providers,
        provider: () => settings.current().elec16.link.ai.provider,
        keyFor: (id) => aiLinks()?.keyFor(id) ?? null,
        adapter: (kind) => {
          const links = aiLinks()
          if (links === null) return Promise.reject(new Error('the AI is not ready yet'))
          return links.adapter(kind)
        },
        today: () => new Date().toLocaleDateString('sv-SE'),
      }),
    ],
    enabled: () => settings.current().elec16.link.on,
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
  })

  const boardFor = (page: WebContents, seed?: Elec16UnitSeed): Elec16Board => ({
    units: units.list(seed),
    held: [...units.holders()].map(([unit, h]) => ({
      unit,
      pane: h.page === page.id ? h.pane : null,
    })),
  })
  const changed = (): void => {
    for (const win of appWindows()) {
      const page = win.webContents
      if (!page.isDestroyed()) page.send(CH.elec16.changed, boardFor(page))
    }
  }
  const filesChanged = (unit: string): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(CH.elec16.filesChanged, unit)
    }
  }
  /** The page's holder for a pane; its going frees what it held. */
  const holderOf = (page: WebContents, pane: string): Holder => {
    whenPageGoes(page, owner, () => {
      const freed = units.dropPage(page.id)
      for (const unit of freed) hub.dropUnit(unit)
      if (freed.length > 0) changed()
    })
    return { page: page.id, pane }
  }
  const askBack = (from: Holder): void => {
    const page = appWindows()
      .map((w) => w.webContents)
      .find((c) => !c.isDestroyed() && c.id === from.page)
    for (const [unit, h] of units.holders()) {
      if (h.page === from.page && h.pane === from.pane) page?.send(CH.elec16.giveBack, unit)
    }
  }

  const unregister = registerTable({
    handle: {
      [CH.elec16.board]: (event, seed: unknown): Elec16Board =>
        boardFor(event.sender, seedOf(seed)),
      [CH.elec16.create]: (_event, seed: unknown): Elec16Unit => {
        const unit = units.create(seedOf(seed))
        changed()
        return unit
      },
      [CH.elec16.update]: (_event, unit: unknown, change: unknown): Elec16Unit | null => {
        const done = units.update(unit, change)
        if (done !== null) changed()
        return done
      },
      [CH.elec16.remove]: (_event, unit: unknown): boolean => {
        const done = units.remove(unit)
        if (done) changed()
        return done
      },
      [CH.elec16.claim]: (event, unit: unknown, pane: unknown): Elec16Claim => {
        if (!isPane(pane)) return { ok: false }
        const claim = units.claim(unit, holderOf(event.sender, pane))
        if (claim.ok) changed()
        return claim
      },
      [CH.elec16.moveHere]: async (event, unit: unknown, pane: unknown): Promise<Elec16Claim> => {
        if (!isPane(pane)) return { ok: false }
        const claim = await units.moveHere(unit, holderOf(event.sender, pane), askBack)
        changed()
        return claim
      },
      [CH.elec16.release]: (event, unit: unknown, pane: unknown, snapshot: unknown): boolean => {
        if (!isPane(pane)) return false
        const done = units.release(unit, { page: event.sender.id, pane }, snapshot)
        if (done && typeof unit === 'string') hub.dropUnit(unit)
        if (done) changed()
        return done
      },
      [CH.elec16.save]: (event, unit: unknown, pane: unknown, snapshot: unknown): boolean =>
        isPane(pane) && units.save(unit, { page: event.sender.id, pane }, snapshot),
      [CH.elec16.card]: (event, unit: unknown, pane: unknown, request: unknown): CardAnswer => {
        if (!isPane(pane)) return { status: CARD_STATUS.noCard }
        const answer = units.card(unit, { page: event.sender.id, pane }, request)
        const writes =
          typeof request === 'object' &&
          request !== null &&
          'op' in request &&
          request.op !== 'read'
        if (answer.status === CARD_STATUS.ok && writes && typeof unit === 'string')
          filesChanged(unit)
        return answer
      },
      [CH.elec16.link]: async (
        event,
        unit: unknown,
        pane: unknown,
        request: unknown,
      ): Promise<LinkAnswer> => {
        if (
          !isPane(pane) ||
          typeof unit !== 'string' ||
          !units.holds(unit, { page: event.sender.id, pane })
        ) {
          return { status: LINK_STATUS.failed, note: 'this pane does not run that unit' }
        }
        return hub.ask(unit, request)
      },
      [CH.elec16.files]: (_event, unit: unknown): Elec16FileInfo[] => units.files(unit),
      [CH.elec16.soft]: (): Elec16FileInfo[] => units.softFiles(),
      [CH.elec16.import]: async (event, unit: unknown): Promise<Elec16ImportResult | null> => {
        if (units.unit(unit) === null || typeof unit !== 'string') return null
        const file = await pickOpen(event.sender)
        if (file === undefined) return null
        const made = importFile(file)
        if ('problem' in made) return { ok: false, problem: made.problem }
        const status = units.addFile(unit, made.name, made.bytes)
        if (status !== CARD_STATUS.ok) return { ok: false, problem: cardProblem(status) }
        filesChanged(unit)
        return { ok: true, name: made.name }
      },
      [CH.elec16.readFile]: (_event, unit: unknown, name: unknown): Uint8Array | null =>
        typeof name === 'string' && isCardName(name) ? units.fileData(unit, name) : null,
      [CH.elec16.writeFile]: (_event, unit: unknown, name: unknown, bytes: unknown): number => {
        // CODE writes only its own kinds of file, and no bigger than a card file may be.
        if (typeof unit !== 'string' || typeof name !== 'string') return CARD_STATUS.badName
        if (!isCardName(name) || !/\.(TS|BIN)$/.test(name)) return CARD_STATUS.badName
        if (!(bytes instanceof Uint8Array) || bytes.length > CARD_FILE_MAX) return CARD_STATUS.full
        const status = units.addFile(unit, name, bytes)
        if (status === CARD_STATUS.ok) filesChanged(unit)
        return status
      },
      [CH.elec16.export]: async (event, unit: unknown, name: unknown): Promise<boolean> => {
        const bytes = units.fileData(unit, name)
        if (bytes === null || typeof name !== 'string') return false
        const target = await pickSave(event.sender, name)
        if (target === undefined) return false
        const text = name.endsWith('.BAS') || name.endsWith('.TS')
        writeFileSync(target, text ? fromMachineText(bytes) : bytes)
        return true
      },
    },
    on: {
      [CH.elec16.linkDrop]: (event, unit: unknown, pane: unknown, serial: unknown) => {
        if (!isPane(pane) || typeof unit !== 'string') return
        if (units.holds(unit, { page: event.sender.id, pane })) hub.drop(unit, serial)
      },
    },
  })

  return {
    dispose: () => {
      hub.dispose()
      unregister()
    },
  }
}

async function pickOpen(page: WebContents): Promise<string | undefined> {
  const owner = BrowserWindow.fromWebContents(page)
  const options: Electron.OpenDialogOptions = {
    title: 'Import to the ELEC-16 card',
    properties: ['openFile'],
    buttonLabel: 'Import',
    filters: [
      { name: 'ELEC-16 files', extensions: ['bas', 'txt', 'bin', 'dat', 'asm', 's'] },
      { name: 'All files', extensions: ['*'] },
    ],
  }
  const picked = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options)
  return picked.canceled ? undefined : picked.filePaths[0]
}

async function pickSave(page: WebContents, name: string): Promise<string | undefined> {
  const owner = BrowserWindow.fromWebContents(page)
  const pcName = name.endsWith('.BAS')
    ? `${name.slice(0, -4).toLowerCase()}.bas`
    : name.toLowerCase()
  const options: Electron.SaveDialogOptions = {
    title: 'Export from the ELEC-16 card',
    defaultPath: pcName,
  }
  const picked = owner
    ? await dialog.showSaveDialog(owner, options)
    : await dialog.showSaveDialog(options)
  return picked.canceled ? undefined : picked.filePath
}

/**
 * A picked file as a card file: a listing (.bas, .txt) in the machine's character set, an
 * assembly source (.asm, .s) assembled for the code area as a .BIN, anything else as it is.
 * Its size is checked before it is read.
 */
export function importFile(
  file: string,
): { name: string; bytes: Uint8Array } | { problem: string } {
  const ext = path.extname(file).slice(1).toLowerCase()
  const text = ext === 'bas' || ext === 'txt'
  const source = ext === 'asm' || ext === 's'
  try {
    const size = statSync(file).size
    if (size > (text || source ? TEXT_MAX : CARD_FILE_MAX)) return { problem: tooBig(size) }
    const raw = readFileSync(file)
    if (text) {
      const made = toMachineText(raw.toString('utf8'))
      if ('problem' in made) return made
      return sized(cardNameOf(file, 'BAS'), made.bytes)
    }
    if (source) return assembled(file, raw.toString('utf8'))
    return sized(cardNameOf(file), new Uint8Array(raw))
  } catch {
    return { problem: 'That file could not be read.' }
  }
}

function assembled(
  file: string,
  text: string,
): { name: string; bytes: Uint8Array } | { problem: string } {
  const out = assemble(`.org 0x${CODE_AREA.toString(16)}\n${text}`)
  const first = out.errors[0]
  if (first !== undefined) return { problem: `Line ${first.line - 1}: ${first.message}` }
  try {
    const image = ramImage(out, CODE_AREA)
    // LOAD reads a .BIN only into the code area: what lies past it would be dropped unsaid.
    if (image.length > CODE_AREA_END - CODE_AREA) {
      return {
        problem: `It ends at ${(CODE_AREA + image.length).toString(16).toUpperCase()}: the code area is ${CODE_AREA.toString(16).toUpperCase()}–${(CODE_AREA_END - 1).toString(16).toUpperCase()}.`,
      }
    }
    return sized(cardNameOf(file, 'BIN'), image)
  } catch {
    return {
      problem: `It is not all in RAM from ${CODE_AREA.toString(16).toUpperCase()}, where a .BIN loads.`,
    }
  }
}

const sized = (name: string, bytes: Uint8Array) =>
  bytes.length > CARD_FILE_MAX ? { problem: tooBig(bytes.length) } : { name, bytes }

const tooBig = (size: number): string =>
  `That is ${size.toLocaleString('en-US')} bytes: a card file is at most ${CARD_FILE_MAX.toLocaleString('en-US')}.`

function cardProblem(status: number): string {
  if (status === CARD_STATUS.full) return 'The card is full.'
  return 'The card did not take it.'
}
