/**
 * The keyboard of a question asked over the workspace with a row of answers: quitting
 * (layout/QuitDialog.svelte), switching or resetting a layout with shells open
 * (layout/SwitchLayoutDialog.svelte), pasting several lines (widgets/terminal/PasteDialog.svelte).
 *
 * The keyboard starts on an answer, shown filled, so Enter is never a guess, and it never has to
 * reach for the mouse: ← and → move along the row, Tab goes round the question's buttons and
 * never behind it, Enter presses the answer it is on, Escape is no. A key that finds the keyboard
 * outside the question - a shell behind it still holding it - brings it to the starting answer.
 */
export interface Question {
  /** The dialog's box: Tab goes round the buttons inside it. */
  box: HTMLElement | null
  /** The answers left to right, as ← and → walk them. */
  row: readonly (HTMLButtonElement | null)[]
  /** Where the keyboard starts, and what Enter presses when it is on no button of the box. */
  start: HTMLButtonElement | null
  /** Escape: the answer that changes nothing. */
  cancel: () => void
}

/** Puts the keyboard on the question's starting answer, once its buttons are in the page. */
export function focusStart(question: () => Question): void {
  queueMicrotask(() => question().start?.focus())
}

/** Handles a key pressed while the question is on screen; others pass through. */
export function questionKey(event: KeyboardEvent, question: Question): void {
  if (event.ctrlKey || event.altKey || event.metaKey) return
  const step = ARROWS[event.key]
  if (step !== undefined) {
    claim(event)
    move(question, step)
    return
  }
  if (event.key === 'Tab') {
    claim(event)
    goRound(question, event.shiftKey ? -1 : 1)
    return
  }
  if (event.key === 'Escape') {
    claim(event)
    question.cancel()
    return
  }
  if (event.key === 'Enter') {
    // Enter on one of the question's buttons presses that button, the browser's own way.
    if (onButton(question, event.target)) return
    claim(event)
    question.start?.click()
  }
}

const ARROWS: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 }

function claim(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

function onButton(question: Question, target: EventTarget | null): boolean {
  return target instanceof HTMLButtonElement && question.box?.contains(target) === true
}

/** Along the row, stopping at either end; from anywhere else, to the starting answer. */
function move(question: Question, step: number): void {
  const row = question.row.filter((button) => button !== null)
  const at = row.indexOf(document.activeElement as HTMLButtonElement)
  if (at === -1) {
    question.start?.focus()
    return
  }
  row[Math.min(row.length - 1, Math.max(0, at + step))]?.focus()
}

/** Round every button of the question, the row and any beneath it, never out of it. */
function goRound(question: Question, step: number): void {
  const buttons = [...(question.box?.querySelectorAll('button') ?? [])]
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (at === -1) {
    question.start?.focus()
    return
  }
  buttons[(at + step + buttons.length) % buttons.length]?.focus()
}
