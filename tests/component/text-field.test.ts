import { afterEach, describe, expect, it } from 'vitest'
import { deepActiveElement, editingText, isTextField } from '../../src/renderer/lib/text-field.ts'

/**
 * Whether the keyboard is in a text field, where Ctrl+Shift+Arrow selects by word and the tab
 * keys must leave it alone (issue 20) - and a shell's hidden textarea, which is not one.
 */

afterEach(() => {
  document.body.replaceChildren()
})

function add<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  parent: Element = document.body,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  parent.append(element)
  return element
}

describe('isTextField', () => {
  it('takes inputs that hold text, and leaves buttons, boxes and sliders out', () => {
    for (const type of ['text', 'search', 'url', 'email', 'password', 'number', 'tel', 'TEXT']) {
      expect(isTextField(add('input', { type })), type).toBe(true)
    }
    // No type is a text input.
    expect(isTextField(add('input'))).toBe(true)
    for (const type of ['checkbox', 'radio', 'range', 'button', 'color', 'file']) {
      expect(isTextField(add('input', { type })), type).toBe(false)
    }
  })

  it("takes a textarea, but not xterm.js's own, which is a shell's keyboard", () => {
    expect(isTextField(add('textarea'))).toBe(true)
    expect(isTextField(add('textarea', { class: 'xterm-helper-textarea' }))).toBe(false)
  })

  it('takes what is editable, inherited, and not what is turned off inside it', () => {
    const editor = add('div', { contenteditable: 'true' })
    const line = add('span', {}, editor)
    const fixed = add('span', { contenteditable: 'false' }, editor)
    const inherits = add('span', { contenteditable: 'inherit' }, editor)
    expect(isTextField(editor)).toBe(true)
    expect(isTextField(line)).toBe(true)
    expect(isTextField(fixed)).toBe(false)
    expect(isTextField(inherits)).toBe(true)
    expect(isTextField(add('div', { contenteditable: '' }))).toBe(true)
    expect(isTextField(add('div', { contenteditable: 'plaintext-only' }))).toBe(true)
  })

  it('leaves the rest out: a pane body, a button, nothing', () => {
    expect(isTextField(add('div', { tabindex: '0' }))).toBe(false)
    expect(isTextField(add('button'))).toBe(false)
    expect(isTextField(document.body)).toBe(false)
    expect(isTextField(null)).toBe(false)
  })
})

describe('editingText', () => {
  it('follows the focus, into an open shadow root', () => {
    const input = add('input')
    input.focus()
    expect(editingText()).toBe(true)
    const pane = add('div', { tabindex: '0' })
    pane.focus()
    expect(editingText()).toBe(false)

    const host = add('div')
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('textarea')
    shadow.append(inner)
    inner.focus()
    expect(deepActiveElement()).toBe(inner)
    expect(editingText()).toBe(true)
  })

  it('is not editing in a shell', () => {
    const helper = add('textarea', { class: 'xterm-helper-textarea' })
    helper.focus()
    expect(editingText()).toBe(false)
  })
})
