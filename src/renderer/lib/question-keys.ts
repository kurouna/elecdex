/**
 * The keyboard of a question asked over the workspace with a row of answers: quitting
 * (layout/QuitDialog.svelte), switching or resetting a layout with shells open
 * (layout/SwitchLayoutDialog.svelte), pasting several lines (widgets/terminal/PasteDialog.svelte).
 *
 * The keyboard starts on an answer, shown filled, so Enter is never a guess, and it never has to
 * reach for the mouse: ← and → move along the row, Tab goes round the question's buttons and
 * never behind it, Enter presses the answer it is on, Escape is no. A key that finds the keyboard
 * outside the question - a shell behind it still holding it - brings it to the starting answer.
 * A click on the question's text keeps the keyboard on its answer, and when the question goes the
 * keyboard goes back to where it was, the shell it was asked over.
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

/**
 * Puts the keyboard on the question's starting answer, once its buttons are in the page, and
 * answers the clean-up that gives it back: run it, as the effect's, when the question goes.
 *
 * The keyboard goes back only if it is still in the question, or nowhere: what an answer did
 * (a layout switched to, another dialog opened) may have put it somewhere of its own. Read in the
 * microtask, as the action palette does, so a popup put away by the question has given the
 * keyboard back to the shell first.
 */
export function focusStart(question: () => Question): () => void {
  let gone = false
  let box: HTMLElement | null = null
  let returnFocus: HTMLElement | null = null
  queueMicrotask(() => {
    if (gone) return
    const { box: now, start } = question()
    box = now
    const active = document.activeElement
    returnFocus = active instanceof HTMLElement && !now?.contains(active) ? active : null
    start?.focus()
  })
  return () => {
    gone = true
    const active = document.activeElement
    const stillHere = active === null || active === document.body || box?.contains(active) === true
    if (stillHere && returnFocus?.isConnected === true) returnFocus.focus()
  }
}

/** The answer each question's keyboard was last on, for a click on its text to leave it there. */
const lastAnswer = new WeakMap<HTMLElement, HTMLButtonElement>()

/**
 * The question box's `focusin`. A click on its text (the paste's preview, scrolled to read it)
 * focuses the box, which has `tabindex="-1"`: the keyboard goes back to the answer it was on, so
 * one answer is always shown as the one Enter presses. Nothing is selected there to lose: the
 * page selects no text (reset.css).
 */
export function questionFocus(event: FocusEvent, question: Question): void {
  const { box } = question
  if (box === null) return
  if (event.target instanceof HTMLButtonElement) {
    lastAnswer.set(box, event.target)
    return
  }
  if (event.target === box) (lastAnswer.get(box) ?? question.start)?.focus()
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
    return
  }
  // Space presses a button too: outside the question's it would press one behind, or type into
  // the shell, so it only brings the keyboard to the starting answer, as an arrow does.
  if (event.key === ' ' && !onButton(question, event.target)) {
    claim(event)
    question.start?.focus()
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
