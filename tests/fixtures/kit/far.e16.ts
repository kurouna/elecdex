// A function the tiny game keeps in cartridge bank 1, reached through far_call.
import type { u16 } from '../../../src/shared/e16c/builtins'

export function farAway(a: u16, b: u16): u16 {
  return a + b + peekWindowMark()
}

/** What this bank holds at its start: proof the call ran with bank 1 in the window. */
function peekWindowMark(): u16 {
  return 0
}
