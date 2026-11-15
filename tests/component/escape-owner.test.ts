import { describe, expect, it } from 'vitest'

/** Who has Escape: the workspace and a popup leave it to a widget that marks itself (lib/escape-owner.ts). */
describe('escapeOwned', async () => {
  const { escapeOwned } = await import('../../src/renderer/lib/escape-owner.ts')

  it('owns a key pressed inside a marked element, or anywhere while one is marked "anywhere"', () => {
    const element = (attrs: string) => {
      const div = document.createElement('div')
      div.innerHTML = `<section ${attrs}><input></section><p><input></p>`
      document.body.append(div)
      return div
    }
    const keyOn = (target: Element) => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      Object.defineProperty(event, 'target', { value: target })
      return event
    }
    const own = element('data-owns-escape')
    expect(escapeOwned(keyOn(own.querySelector('section input') as Element))).toBe(true)
    expect(escapeOwned(keyOn(own.querySelector('p input') as Element))).toBe(false)
    const menu = element('data-owns-escape="anywhere"')
    expect(escapeOwned(keyOn(own.querySelector('p input') as Element))).toBe(true)
    menu.remove()
    own.remove()
  })
})
