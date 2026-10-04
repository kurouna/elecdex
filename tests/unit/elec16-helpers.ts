import { existsSync, readFileSync } from 'node:fs'
import { type CardFile, cardOp } from '@shared/elec16/card'
import { screenText } from '@shared/elec16/font'
import { keyCode, keyForChar, keyForKana } from '@shared/elec16/keys'
import type { LinkAnswer, LinkRequest } from '@shared/elec16/link'
import { Elec16 } from '@shared/elec16/machine'
import { MODELS, type ModelId } from '@shared/elec16/map'
import { buildRom } from '@shared/elec16/rom'
import { ANNUNCIATORS } from '@shared/elec16/state'

/**
 * The ROM (resources/elec16/rom, docs/elec16.md section 6) run in the machine as the pane
 * runs it: keys pressed one at a time, the screen read back through the font.
 */

const DIR = 'resources/elec16/rom/'
export const built = buildRom((name) =>
  existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null,
)

/** The memory card the machines of a test share, as main keeps one (cardOp), and the SOFT CARD. */
export const card: { files: readonly CardFile[]; soft: readonly CardFile[] } = {
  files: [],
  soft: [],
}

/**
 * What main's LINK answers in a test (`answer`; null, or one that gives null, leaves the
 * request out, as a slow service does), and every request it was given.
 */
export const linkService: {
  answer: ((request: LinkRequest) => LinkAnswer | null) | null
  asked: LinkRequest[]
} = { answer: null, asked: [] }

/**
 * Runs until the machine waits for a key (or stops), doing what the page and main would on
 * the way: card commands served from `card`, LINK requests answered by `linkService`, and
 * time passed while it sleeps on its timer.
 */
export function settle(m: Elec16): void {
  for (let k = 0; k < 4000; k++) {
    const r = m.run(200_000)
    const request = m.takeCardRequest()
    if (request !== null) {
      const done = cardOp(card.files, request, 0, card.soft)
      card.files = done.files
      m.answerCard(request, done.answer)
      continue
    }
    if (answerLink(m)) continue
    if (r.halted !== null) return
    if (r.sleeping !== null) {
      if (r.sleeping.timerMs === null) return
      m.advance(Math.max(1, r.sleeping.timerMs))
    }
  }
  throw new Error('the ROM never waited for a key')
}

/** A LINK request out, given to `linkService`: true when it answered it. */
function answerLink(m: Elec16): boolean {
  const asked = m.takeLinkRequest()
  if (asked === null) return false
  linkService.asked.push(asked)
  const answer = linkService.answer?.(asked) ?? null
  if (answer !== null) m.answerLink(asked.serial, answer)
  return answer !== null
}

/** Switched on: at BASIC's prompt. */
export function switchOn(model?: ModelId): Elec16 {
  const m = Elec16.boot(built.image, model)
  settle(m)
  return m
}

/** Switched on and taken to the monitor (MON), its screen cleared (CLS). */
export function boot(model?: ModelId): Elec16 {
  const m = switchOn(model)
  type(m, 'MON\n')
  press(m, keyCode('cls'))
  return m
}

export function press(m: Elec16, code: number): void {
  m.press(code)
  m.release(code)
  settle(m)
}

/** Types text as the page does: a symbol on a key's shifted face takes SHIFT first. */
export function type(m: Elec16, text: string): void {
  for (const ch of text) {
    if (ch === '\n') {
      press(m, keyCode('enter'))
      continue
    }
    const kana = keyForKana(ch)
    if (kana !== null) {
      // KANA mode for the one character, then out again.
      press(m, keyCode('kana'))
      if (kana.shift) press(m, keyCode('shift'))
      press(m, kana.code)
      press(m, keyCode('kana'))
      continue
    }
    const key = keyForChar(ch)
    if (key === null) throw new Error(`no key types ${ch}`)
    if (key.shift) press(m, keyCode('shift'))
    press(m, key.code)
  }
}

/** Where the bank starts in a snapshot: magic, version, model, registers, pc, CSRs, flags... */
const SNAPSHOT_BANK_AT = 4 + 1 + 1 + 32 + 2 + 14 + 1 + 2 + 1 + 8 + 8

/**
 * Today's snapshot (version 7) of a pocket machine - no extended RAM, video, cartridge or
 * sound - as an older version wrote it (snapshot.ts): versions 5 and 6 without the byte that
 * says there is no sound; version 4 also without the one that says there is no cartridge;
 * version 3 also without the video's; version 2 also with the bank a byte and no count of
 * extended RAM banks; version 1 also without LINK's 14 bytes.
 */
export function olderSnapshot(now: Uint8Array, version: 1 | 2 | 3 | 4 | 6): Uint8Array {
  const causeLength = now[SNAPSHOT_BANK_AT - 17] ?? 0
  const apuAt = now.length - (0x8000 + 0x1800) - causeLength - 1
  if (now[apuAt] !== 0) throw new Error('only a pocket machine')
  if (version === 6) {
    const older = new Uint8Array([...now.subarray(0, apuAt), ...now.subarray(apuAt + 1)])
    older[4] = 6
    return older
  }
  now = new Uint8Array([...now.subarray(0, apuAt), ...now.subarray(apuAt + 1)])
  const cartAt = now.length - (0x8000 + 0x1800) - causeLength - 1
  const videoAt = cartAt - 1
  const countAt = videoAt - 1
  if (now[cartAt] !== 0 || now[videoAt] !== 0 || now[countAt] !== 0) {
    throw new Error('only a pocket machine')
  }
  const rest = now.subarray(cartAt + 1)
  const parts: Record<1 | 2 | 3 | 4, number[]> = {
    4: [...now.subarray(0, cartAt), ...rest],
    3: [...now.subarray(0, videoAt), ...rest],
    2: [
      ...now.subarray(0, SNAPSHOT_BANK_AT + 1),
      ...now.subarray(SNAPSHOT_BANK_AT + 2, countAt),
      ...rest,
    ],
    1: [
      ...now.subarray(0, SNAPSHOT_BANK_AT + 1),
      ...now.subarray(SNAPSHOT_BANK_AT + 2, countAt - 14),
      ...rest,
    ],
  }
  const older = new Uint8Array(parts[version])
  older[4] = version
  return older
}

export const screen = (m: Elec16): string[] => {
  const { width, height } = MODELS[m.state.model]
  return screenText(m.state.vram, width, height).map((line) => line.trimEnd())
}

/** The screen's rows down to the cursor's: the last is the line being typed. */
export const shown = (m: Elec16): string[] => screen(m).slice(0, (m.state.lcd.cursor >> 8) + 1)

export const annunciated = (m: Elec16): string[] =>
  ANNUNCIATORS.filter((_, bit) => (m.state.lcd.annunciators & (1 << bit)) !== 0)
