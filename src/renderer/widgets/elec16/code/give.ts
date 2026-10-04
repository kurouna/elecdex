import { CODE_START } from '@shared/e16c/code-area'
import { ANNUNCIATORS } from '@shared/elec16/state'

/**
 * What the pane types on the machine for CODE's RUN ▸ and LOAD ▸ and FILES' LOAD ▸ (docs/
 * elec16.md sections 6 and 7). The machine is brought to a prompt first: switched on, out of a
 * pause, and a program running stopped with BRK - even one asleep at an INPUT or waiting for
 * a key, which would otherwise take what is typed as its own keys. When it cannot be brought
 * there, or there is no machine to take the code, the reason is said, never nothing. Pure of
 * the page: the runner is what is given.
 */

export interface CodeTaker {
  readonly off: boolean
  readonly asleep: boolean
  readonly status: string
  readonly annunciators: number
  brk(): void
  whenAsleep(ms: number): Promise<boolean>
  loadCode(at: number, bytes: Uint8Array): boolean
  /** Types the text on the machine's keys, as PASTE does. */
  typeText(text: string): void
  /**
   * PLAY-320, which has no prompt to type at (docs/elec16-play.md): calls the program at an
   * address itself, to come back to the start screen. Absent on the pocket models.
   */
  callCode?: ((at: number) => void) | undefined
}

/** How long a machine is given to come back to its prompt. */
export const PROMPT_WAIT_MS = 3000

const lit = (t: CodeTaker, name: (typeof ANNUNCIATORS)[number]): boolean =>
  (t.annunciators & (1 << ANNUNCIATORS.indexOf(name))) !== 0

const NO_PROMPT = `The machine did not come back to its prompt within ${PROMPT_WAIT_MS / 1000} seconds; nothing was typed.`
const NO_MACHINE = 'There is no machine running in this pane (MOVE HERE takes the unit).'

/** The machine at a prompt, BASIC's or the monitor's; false when it did not get there. */
async function toPrompt(t: CodeTaker): Promise<boolean> {
  if (t.off || !t.asleep || t.status === 'paused' || lit(t, 'BUSY')) t.brk()
  return t.whenAsleep(PROMPT_WAIT_MS)
}

/** CODE's program written at the code area, and run (RUN) or listed (LOAD): null, or why not. */
export async function giveCode(
  t: CodeTaker,
  image: Uint8Array,
  how: 'run' | 'load',
): Promise<string | null> {
  if (!(await toPrompt(t))) return NO_PROMPT
  if (!t.loadCode(CODE_START, image)) return NO_MACHINE
  if (t.callCode !== undefined) {
    // No monitor to list it: LOAD only puts it there, for CORE to show.
    if (how === 'run') t.callCode(CODE_START)
    return null
  }
  const monitor = lit(t, 'MON')
  if (how === 'run') t.typeText(monitor ? 'G 7000\n' : 'CALL 28672\n')
  else t.typeText(monitor ? 'U 7000\n' : 'MON\nU 7000\n')
  return null
}

/** A line typed at BASIC's prompt (FILES' LOAD ▸), out of the monitor first: null, or why not. */
export async function typeAtBasic(t: CodeTaker, line: string): Promise<string | null> {
  if (!(await toPrompt(t))) return NO_PROMPT
  t.typeText(`${lit(t, 'MON') ? 'Q\n' : ''}${line}\n`)
  return null
}
