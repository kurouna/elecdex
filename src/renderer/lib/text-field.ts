/**
 * Whether the keyboard is in a text field: somewhere Ctrl+Shift+Arrow selects by word, so
 * the tab keys must leave it alone (issue 20) - the AI chat's prompt, a note, LOG WATCH's
 * filter, ELEC-16's CODE.
 *
 * A shell is not one. xterm.js takes its keys through a hidden textarea, and a shell in a
 * tab group goes on switching tabs with those keys; outside one they are the shell's anyway
 * (docs/decisions.md).
 */

/** The `<input>` types that hold text a caret moves through. */
const TEXT_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
])

/** xterm.js's own textarea, which is the shell's keyboard and not a text field. */
const XTERM_TEXTAREA = 'xterm-helper-textarea'

/** The element that has the keyboard, followed into open shadow roots. */
export function deepActiveElement(root: Document = document): Element | null {
  let active = root.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}

/** Whether `element` is a text field the user is typing into. */
export function isTextField(element: Element | null): boolean {
  if (element === null) return false
  const tag = element.tagName.toLowerCase()
  if (tag === 'textarea') return !element.classList.contains(XTERM_TEXTAREA)
  if (tag === 'input') {
    const type = (element.getAttribute('type') ?? '').toLowerCase()
    return TEXT_INPUT_TYPES.has(type)
  }
  return isContentEditable(element)
}

/**
 * Read from the attribute, inherited up the tree, rather than `isContentEditable`, which
 * jsdom does not have: `contenteditable="false"` inside an editable part turns it off again.
 */
function isContentEditable(element: Element): boolean {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const value = node.getAttribute('contenteditable')?.toLowerCase()
    if (value !== undefined && value !== 'inherit') return value !== 'false'
  }
  return false
}

/** Whether the keyboard is in a text field now. */
export const editingText = (): boolean => isTextField(deepActiveElement())
