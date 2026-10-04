/**
 * PLAY-320's pad (docs/elec16-play.md section 6): the twelve buttons as bits - what is held
 * now (PAD at F810), and what went down or up since a program last cleared it (PADHIT at
 * F812), which holds interrupt line 6 up while it is not zero. Only a model with `pad` has it;
 * on every other the registers read 0 and ignore writes, as they always have.
 *
 * Not in a snapshot, as the keys are not: a machine comes back with every button up.
 */

export const PAD_REG = {
  held: 0xf810,
  hit: 0xf812,
} as const

/** The buttons, by their bit. */
export const PAD_BUTTONS = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'x',
  'y',
  'l',
  'r',
  'start',
  'select',
] as const
export type PadButton = (typeof PAD_BUTTONS)[number]

export const PAD_ALL = (1 << PAD_BUTTONS.length) - 1

/** A button's bit. */
export const padBit = (button: PadButton): number => 1 << PAD_BUTTONS.indexOf(button)

export interface PadState {
  held: number
  hit: number
}

export const createPadState = (): PadState => ({ held: 0, hit: 0 })

/** The buttons held now are `held`: each that went down or up is marked in PADHIT. */
export function setPad(p: PadState, held: number): void {
  const now = held & PAD_ALL
  p.hit |= now ^ p.held
  p.held = now
}

export function padRead(p: PadState, a: number): number {
  if (a === PAD_REG.held) return p.held
  if (a === PAD_REG.hit) return p.hit
  return 0
}

/** PADHIT: the bits written as 1 are cleared. */
export function padWrite(p: PadState, a: number, value: number): void {
  if (a === PAD_REG.hit) p.hit &= ~value & PAD_ALL
}
