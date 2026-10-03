import { readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CH } from '@shared/channels'
import { assemble, ramImage } from '@shared/elec16/asm'
import { CARD_FILE_MAX, CARD_STATUS, type CardAnswer } from '@shared/elec16/card'
import { cardNameOf, fromMachineText, toMachineText } from '@shared/elec16/charset'
import { CODE_AREA, MODEL_IDS } from '@shared/elec16/map'
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
import { appWindows } from '../app-windows.js'
import { Elec16Units, type Holder } from '../elec16/units.js'
import { whenPageGoes } from './page-gone.js'
import { registerTable } from './table.js'

/**
 * The ELEC-16 pane's IPC (docs/elec16.md section 8): units, which pane runs each, their
 * battery backups and memory cards, and IMPORT / EXPORT through main's own pickers, so the
 * page never names a path. Nothing is fetched, and no plugin API reaches it.
 */

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

export function registerElec16Ipc(dir = path.join(app.getPath('userData'), 'elec16')): {
  dispose: () => void
} {
  const units = new Elec16Units(dir)
  const owner = {}

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
      if (units.dropPage(page.id).length > 0) changed()
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
      [CH.elec16.files]: (_event, unit: unknown): Elec16FileInfo[] => units.files(unit),
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
      [CH.elec16.export]: async (event, unit: unknown, name: unknown): Promise<boolean> => {
        const bytes = units.fileData(unit, name)
        if (bytes === null || typeof name !== 'string') return false
        const target = await pickSave(event.sender, name)
        if (target === undefined) return false
        const text = name.endsWith('.BAS')
        writeFileSync(target, text ? fromMachineText(bytes) : bytes)
        return true
      },
    },
  })

  return { dispose: unregister }
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
    return sized(cardNameOf(file, 'BIN'), ramImage(out, CODE_AREA))
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
