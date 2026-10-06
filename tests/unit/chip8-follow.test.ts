import { describe, expect, it } from 'vitest'
import { chip8Follow } from '../../src/renderer/widgets/chip8/follow'

/**
 * A mounted CHIP-8 pane whose state changes under it: a saved layout switched to has a pane of
 * the same id, so the widget is not mounted again - only its state changes, and the machine
 * must follow it rather than go on with the last layout's program.
 */
describe("a CHIP-8 pane's state changed from outside", () => {
  it('starts the program the pane now names, when it is not the one this pane started', () => {
    expect(chip8Follow('run', 'diag/6-keypad', 'diag/3-corax+', 'running')).toEqual({
      kind: 'start',
      program: 'diag/6-keypad',
    })
    // A pane that has run nothing yet (it opened on the library) starts it too.
    expect(chip8Follow('run', 'diag/6-keypad', null, 'empty')).toEqual({
      kind: 'start',
      program: 'diag/6-keypad',
    })
  })

  it('is not its own LOAD: the program it started itself, its bytes still on the way', () => {
    expect(chip8Follow('run', 'diag/3-corax+', 'diag/3-corax+', 'empty')).toBeNull()
    expect(chip8Follow('run', 'diag/3-corax+', 'diag/3-corax+', 'paused')).toBeNull()
  })

  it('pauses a machine left running behind the library, which BACK never does', () => {
    expect(chip8Follow('library', 'diag/3-corax+', 'diag/3-corax+', 'running')).toEqual({
      kind: 'pause',
    })
    expect(chip8Follow('library', 'diag/3-corax+', 'diag/3-corax+', 'paused')).toBeNull()
    expect(chip8Follow('library', null, null, 'empty')).toBeNull()
  })

  it('leaves a run view with no program to the library it falls back to', () => {
    expect(chip8Follow('run', null, 'diag/3-corax+', 'running')).toBeNull()
  })
})
