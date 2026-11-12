import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import type { Component } from 'svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { finishAnimations, stubMatchMedia } from './support/dom.ts'
import { settle } from './support/settle.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { default: QuitDialog } = await import('../../src/renderer/layout/QuitDialog.svelte')
const { default: SwitchLayoutDialog } = await import(
  '../../src/renderer/layout/SwitchLayoutDialog.svelte'
)
const { default: PasteDialog } = await import(
  '../../src/renderer/widgets/terminal/PasteDialog.svelte'
)

/**
 * The keyboard of every question asked over the workspace with a row of answers
 * (lib/question-keys.ts): it starts on an answer, ← and → move along the row, Tab goes round the
 * question's buttons and never behind it, Enter presses the answer it is on, Escape is no. Found
 * by hand: the quit question could only be answered yes with the mouse. Found in review: the
 * keyboard was left on nothing when the question went, so the shell it was asked over took no
 * keys until clicked.
 */

interface QuestionCase {
  name: string
  component: Component
  ask: () => Promise<boolean>
  answerNo: () => void
  dialog: string
  /** The row, left to right. */
  no: string
  yes: string
  /** Where the keyboard starts, which Enter answers when it is on no button. */
  start: 'no' | 'yes'
  /** Every button of the question, in the order Tab takes them. */
  tabs: string[]
}

const CASES: QuestionCase[] = [
  {
    name: 'quit',
    component: QuitDialog,
    ask: () => ui.askQuit(),
    answerNo: () => ui.answerQuit(false),
    dialog: 'quit-dialog',
    no: 'quit-no',
    yes: 'quit-yes',
    start: 'no',
    tabs: ['quit-no', 'quit-yes'],
  },
  {
    name: 'layout switch',
    component: SwitchLayoutDialog,
    ask: () => ui.askLayoutSwitch({ name: 'one', shells: 2 }),
    answerNo: () => ui.answerLayoutSwitch(false),
    dialog: 'switch-layout-dialog',
    no: 'switch-layout-cancel',
    yes: 'switch-layout-go',
    start: 'yes',
    tabs: ['switch-layout-cancel', 'switch-layout-go', 'switch-layout-always'],
  },
  {
    name: 'paste',
    component: PasteDialog,
    ask: () => ui.askPaste({ lines: 2, preview: 'a\nb', more: 0 }),
    answerNo: () => ui.answerPaste(false),
    dialog: 'paste-dialog',
    no: 'paste-cancel',
    yes: 'paste-go',
    start: 'yes',
    tabs: ['paste-cancel', 'paste-go', 'paste-always'],
  },
]

beforeEach(() => {
  stubMatchMedia()
  finishAnimations()
})

afterEach(async () => {
  for (const question of CASES) question.answerNo()
  cleanup()
  for (const stray of document.querySelectorAll('[data-testid=behind]')) stray.remove()
  await settle()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.restoreAllMocks()
})

/** Asks the question and waits for the keyboard to reach its starting answer. */
async function open(question: QuestionCase): Promise<{ asked: Promise<boolean> }> {
  render(question.component)
  const asked = question.ask()
  await tick()
  await Promise.resolve()
  return { asked }
}

const focused = (): string | null =>
  (document.activeElement as HTMLElement | null)?.dataset.testid ?? null

const press = (key: string, init: KeyboardEventInit = {}): Promise<boolean> =>
  fireEvent.keyDown(document.activeElement ?? window, { key, ...init })

/** A field of the workspace behind the question: the shell's, where the keyboard was. */
function behindField(): HTMLTextAreaElement {
  const field = document.createElement('textarea')
  field.dataset.testid = 'behind'
  document.body.append(field)
  field.focus()
  return field
}

/** Lets the question's going run its clean-up. */
async function gone(): Promise<void> {
  await tick()
  await Promise.resolve()
}

describe.each(CASES)('the $name question', (question) => {
  const start = question.start === 'no' ? question.no : question.yes

  it('starts the keyboard on its starting answer', async () => {
    const { asked } = await open(question)
    expect(focused()).toBe(start)
    question.answerNo()
    expect(await asked).toBe(false)
  })

  it('moves along the row with ← and →, stopping at either end', async () => {
    const { asked } = await open(question)
    await press('ArrowRight')
    expect(focused()).toBe(question.yes)
    await press('ArrowRight')
    expect(focused()).toBe(question.yes)
    await press('ArrowLeft')
    expect(focused()).toBe(question.no)
    await press('ArrowLeft')
    expect(focused()).toBe(question.no)
    // The arrows only move: nothing is answered until Enter or a click.
    expect(ui.dialogOpen).toBe(true)
    screen.getByTestId(question.no).click()
    expect(await asked).toBe(false)
  })

  it('answers yes by → and the button it is on', async () => {
    const { asked } = await open(question)
    await press('ArrowLeft')
    await press('ArrowRight')
    const yes = screen.getByTestId(question.yes)
    expect(document.activeElement).toBe(yes)
    // Enter on a button is the browser's to turn into a click: not taken from it.
    expect(await press('Enter')).toBe(true)
    yes.click()
    expect(await asked).toBe(true)
  })

  it('goes round its own buttons with Tab, never behind the question', async () => {
    const { asked } = await open(question)
    screen.getByTestId(question.tabs[0] ?? '').focus()
    for (const id of [...question.tabs.slice(1), question.tabs[0]]) {
      expect(await press('Tab')).toBe(false)
      expect(focused()).toBe(id)
    }
    await press('Tab', { shiftKey: true })
    expect(focused()).toBe(question.tabs.at(-1))
    await press('Escape')
    expect(await asked).toBe(false)
  })

  it('takes Enter on no button as the starting answer, and Escape as no', async () => {
    const { asked } = await open(question)
    // The keyboard left behind, on a button of the workspace: Enter must not press that.
    const behind = document.createElement('button')
    behind.dataset.testid = 'behind'
    const pressedBehind = vi.fn()
    behind.addEventListener('click', pressedBehind)
    document.body.append(behind)
    behind.focus()
    expect(await press('Enter')).toBe(false)
    expect(pressedBehind).not.toHaveBeenCalled()
    expect(await asked).toBe(question.start === 'yes')
    const again = question.ask()
    await tick()
    await press('Escape')
    expect(await again).toBe(false)
  })

  it('brings a keyboard left outside back to the starting answer with an arrow, Tab or Space', async () => {
    const { asked } = await open(question)
    for (const key of ['ArrowLeft', 'ArrowRight', 'Tab', ' ']) {
      ;(document.activeElement as HTMLElement | null)?.blur()
      expect(await press(key)).toBe(false)
      expect(focused()).toBe(start)
    }
    question.answerNo()
    expect(await asked).toBe(false)
  })

  it('leaves keys with Ctrl or Alt to the workspace', async () => {
    const { asked } = await open(question)
    expect(await press('ArrowRight', { ctrlKey: true })).toBe(true)
    expect(await press('Tab', { altKey: true })).toBe(true)
    expect(focused()).toBe(start)
    question.answerNo()
    expect(await asked).toBe(false)
  })

  it('gives the keyboard back to where it was asked over, however it is answered', async () => {
    const shell = behindField()
    render(question.component)
    const answers: [string, () => unknown][] = [
      ['Escape', () => press('Escape')],
      ['no', () => screen.getByTestId(question.no).click()],
      ['yes', () => screen.getByTestId(question.yes).click()],
    ]
    for (const [name, answer] of answers) {
      shell.focus()
      const asked = question.ask()
      await gone()
      expect(focused(), name).toBe(start)
      await answer()
      await asked
      await gone()
      expect(document.activeElement, name).toBe(shell)
    }
  })

  it('leaves the keyboard where an answer put it, and on no question that went before it came', async () => {
    const shell = behindField()
    const { asked } = await open(question)
    const elsewhere = document.createElement('button')
    elsewhere.dataset.testid = 'behind'
    document.body.append(elsewhere)
    // A layout switched to focuses its own pane: the question going must not take that back.
    screen.getByTestId(question.yes).click()
    elsewhere.focus()
    await asked
    await gone()
    expect(document.activeElement).toBe(elsewhere)
    // Answered before its keyboard came (another dialog opening at once): nothing is moved.
    shell.focus()
    const again = question.ask()
    question.answerNo()
    expect(await again).toBe(false)
    await gone()
    expect(document.activeElement).toBe(shell)
  })

  it('keeps the keyboard on its answer when the question itself is clicked', async () => {
    const { asked } = await open(question)
    const dialog = screen.getByTestId(question.dialog)
    // A click on its text (the paste's preview) focuses the box, which has tabindex -1.
    dialog.focus()
    expect(focused()).toBe(start)
    const other = question.start === 'no' ? question.yes : question.no
    screen.getByTestId(other).focus()
    dialog.focus()
    expect(focused()).toBe(other)
    // Space on an answer is the browser's to press, as Enter is.
    expect(await press(' ')).toBe(true)
    question.answerNo()
    expect(await asked).toBe(false)
  })
})
