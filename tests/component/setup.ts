import '@testing-library/svelte/vitest'
import { afterEach } from 'vitest'
import { forgetGonePanes } from '../../src/renderer/lib/pane-memory.ts'

// What panes keep in memory past a remount (what was typed) would otherwise carry from one
// test into the next, a filter left typed hiding the next test's rows.
afterEach(() => forgetGonePanes(new Set()))

// jsdom 31 matches :focus-visible wherever :focus matches, so a focus given back after a click
// would count as the keyboard's and open a detail card. Chromium decides by the last input: a
// pointer makes a later focus not visible, a key makes it visible again. Modelled here, so the
// mouse paths (lib/hover-card.ts `keyboardFocused`) are tested as the app runs them.
let pointerLast = false
for (const type of ['pointerdown', 'mousedown', 'click']) {
  document.addEventListener(
    type,
    () => {
      pointerLast = true
    },
    true,
  )
}
document.addEventListener(
  'keydown',
  () => {
    pointerLast = false
  },
  true,
)
afterEach(() => {
  pointerLast = false
})
const matches = Element.prototype.matches
Element.prototype.matches = function (this: Element, selector: string): boolean {
  if (selector === ':focus-visible') return !pointerLast && matches.call(this, ':focus')
  return matches.call(this, selector)
} as typeof matches
