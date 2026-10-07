import { describe, expect, it } from 'vitest'
import { panelPress } from '../../src/renderer/widgets/emu/panel'

/**
 * The PANEL button of the emulators' panes (CHIP-8, ELEC-16). The panel shows when it is
 * wanted and has room, or when it was opened by hand without room (`forced`). A press opens
 * what is shut and shuts what is open - in one press, whatever the room: a panel shut by hand
 * in a narrow pane once took two (the first only wanted it, still without room to show).
 */
describe('a press on PANEL', () => {
  it('opens a shut panel at once: wanted, and shown even without room', () => {
    expect(panelPress(false)).toEqual({ panel: true, forced: true })
  })

  it('shuts an open panel: no longer wanted, nor forced', () => {
    expect(panelPress(true)).toEqual({ panel: false, forced: false })
  })
})
