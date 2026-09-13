import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutNode } from '@shared/schemas/layout'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { dragHandle, paneDrag } = await import('../../src/renderer/layout/pane-drag.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The drag gesture, driven by synthetic pointer and key events.
 *
 * jsdom has no layout, no hit testing and no pointer capture, so the DOM is a
 * set of drop hosts with fixed boxes, `elementFromPoint` picks a host by those
 * boxes, and capture is recorded rather than performed. The layout store is the
 * real one, so a drop really runs moveNode.
 */

interface Host {
  el: HTMLElement
  box: { left: number; top: number; width: number; height: number }
}

let hosts: Host[] = []
let handle: HTMLElement
let detach: () => void
let captured: number[]

const a = pane('a')
const b = pane('b')
const c = pane('c')

function host(nodeId: string, left: number, top: number, width: number, height: number): Host {
  const el = document.createElement('section')
  el.dataset.dropNode = nodeId
  const inner = document.createElement('div')
  el.append(inner)
  document.body.append(el)
  const box = { left, top, width, height }
  el.getBoundingClientRect = () => DOMRect.fromRect({ x: left, y: top, width, height })
  return { el: inner, box }
}

const pointer = (type: string, x: number, y: number, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    ...init,
  })

function press(x: number, y: number, init: PointerEventInit = {}): void {
  handle.dispatchEvent(pointer('pointerdown', x, y, init))
}
function moveTo(x: number, y: number, init: PointerEventInit = {}): void {
  // With capture the events go to the handle; without it, to what is under the pointer.
  const target = captured.length > 0 ? handle : document.body
  target.dispatchEvent(pointer('pointermove', x, y, init))
  flushSync()
}
function release(x: number, y: number, init: PointerEventInit = {}): void {
  handle.dispatchEvent(pointer('pointerup', x, y, init))
  flushSync()
}
function key(type: 'keydown' | 'keyup', init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init })
  document.body.dispatchEvent(event)
  flushSync()
  return event
}

const shape = (node: LayoutNode): string => {
  if (node.kind === 'pane') return node.widget
  const inner = node.children.map(shape).join(' ')
  return node.kind === 'tabs' ? `tabs(${inner})` : `${node.direction}(${inner})`
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async () => {}) } })
  layout.tree = {
    version: LAYOUT_VERSION,
    root: split(
      'row',
      [a, b, c].map((p) => ({ ...p })),
    ),
  }
  // Panes side by side, 100px wide each; the handle is a's title.
  hosts = [host(a.id, 0, 0, 100, 100), host(b.id, 100, 0, 100, 100), host(c.id, 200, 0, 100, 100)]
  document.elementFromPoint = (x: number, y: number) =>
    hosts.find(
      (h) =>
        x >= h.box.left &&
        x < h.box.left + h.box.width &&
        y >= h.box.top &&
        y < h.box.top + h.box.height,
    )?.el ?? null
  handle = document.createElement('header')
  hosts[0]?.el.append(handle)
  captured = []
  handle.setPointerCapture = (id: number) => void captured.push(id)
  handle.releasePointerCapture = () => {}
  detach = dragHandle(a.id, () => 'A')(handle) as () => void
})

afterEach(() => {
  detach()
  // End anything a failing test left running, so the next one starts clean.
  release(0, 0)
  paneDrag.end(false)
  document.body.replaceChildren()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('pane drag gesture', () => {
  it('stays a click until the pointer travels past the threshold', () => {
    press(10, 10)
    moveTo(14, 12)
    expect(paneDrag.source).toBeNull()
    expect(captured).toEqual([])
    moveTo(20, 10)
    expect(paneDrag.source).toBe(a.id)
    expect(paneDrag.label).toBe('A')
    expect(captured).toEqual([1])
  })

  it('previews the nearest side of the pane under the pointer, as a plain box', () => {
    press(10, 10)
    moveTo(190, 50)
    expect(paneDrag.target).toEqual({
      nodeId: b.id,
      placement: 'right',
      preview: { left: 150, top: 0, width: 50, height: 100 },
    })
  })

  it('drops beside the pane on release, and focuses what moved', () => {
    press(10, 10)
    moveTo(290, 50)
    release(290, 50)
    expect(shape(layout.tree.root)).toBe('row(b c a)')
    expect(layout.focusedPaneId).toBe(a.id)
    expect(paneDrag.source).toBeNull()
  })

  it('adds as a tab while Ctrl or Cmd is held, switching on the key alone', () => {
    press(10, 10)
    moveTo(150, 50)
    expect(paneDrag.target?.placement).not.toBe('tab')
    key('keydown', { key: 'Control', ctrlKey: true })
    expect(paneDrag.target?.placement).toBe('tab')
    key('keyup', { key: 'Control', ctrlKey: false })
    expect(paneDrag.target?.placement).not.toBe('tab')
    moveTo(151, 50, { metaKey: true })
    expect(paneDrag.target?.placement).toBe('tab')
    release(151, 50, { metaKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b a) c)')
  })

  it('shows no target over the pane being dragged, and dropping there changes nothing', () => {
    const before = shape(layout.tree.root)
    press(10, 10)
    moveTo(50, 50)
    expect(paneDrag.source).toBe(a.id)
    expect(paneDrag.target).toBeNull()
    release(50, 50)
    expect(shape(layout.tree.root)).toBe(before)
  })

  it('shows no target outside every pane', () => {
    press(10, 10)
    moveTo(500, 500)
    expect(paneDrag.target).toBeNull()
  })

  it('Escape cancels without moving, and takes the key from the terminal', () => {
    const before = shape(layout.tree.root)
    press(10, 10)
    moveTo(290, 50)
    const pressed = key('keydown', { key: 'Escape' })
    expect(pressed.defaultPrevented).toBe(true)
    expect(paneDrag.source).toBeNull()
    release(290, 50)
    expect(shape(layout.tree.root)).toBe(before)
  })

  it('leaves Escape alone before a drag has started', () => {
    press(10, 10)
    const pressed = key('keydown', { key: 'Escape' })
    expect(pressed.defaultPrevented).toBe(false)
  })

  it('cancels when pointer capture is lost', () => {
    press(10, 10)
    moveTo(290, 50)
    handle.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1 }))
    flushSync()
    expect(paneDrag.source).toBeNull()
    expect(shape(layout.tree.root)).toBe('row(a b c)')
  })

  it('ends a press released outside the window instead of dragging on a later move', () => {
    press(10, 10)
    // The release happened elsewhere: the next move arrives with no button held.
    moveTo(290, 50, { buttons: 0 })
    expect(paneDrag.source).toBeNull()
    moveTo(295, 50)
    expect(paneDrag.source).toBeNull()
  })

  it('swallows the click that follows a drop, but not a later one', () => {
    const clicks = vi.fn()
    handle.addEventListener('click', clicks)
    press(10, 10)
    moveTo(290, 50)
    release(290, 50)
    handle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).not.toHaveBeenCalled()
    vi.runAllTimers()
    handle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  it('does not swallow a plain click', () => {
    const clicks = vi.fn()
    handle.addEventListener('click', clicks)
    press(10, 10)
    release(10, 10)
    handle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  it('ignores other buttons and a second pointer', () => {
    press(10, 10, { button: 2 })
    moveTo(290, 50)
    expect(paneDrag.source).toBeNull()
    press(10, 10, { isPrimary: false })
    moveTo(290, 50)
    expect(paneDrag.source).toBeNull()
  })

  it('stops listening once the gesture ends', () => {
    press(10, 10)
    moveTo(290, 50)
    release(290, 50)
    const after = shape(layout.tree.root)
    // Moves and keys after the release must not start or steer anything.
    moveTo(10, 50)
    key('keydown', { key: 'Control', ctrlKey: true })
    expect(paneDrag.source).toBeNull()
    expect(shape(layout.tree.root)).toBe(after)
  })

  it.each([
    ['a drop', true, () => release(290, 50)],
    ['Escape', true, () => key('keydown', { key: 'Escape' })],
    ['capture loss', true, () => handle.dispatchEvent(new PointerEvent('lostpointercapture'))],
    ['a plain click', false, () => release(10, 10)],
  ])('removes every window listener it added, after %s', (_, dragFirst, end) => {
    const added = new Map<string, number>()
    const count = (type: string, by: number) => added.set(type, (added.get(type) ?? 0) + by)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    press(10, 10)
    if (dragFirst) moveTo(290, 50)
    end()
    for (const call of add.mock.calls) count(String(call[0]), 1)
    for (const call of remove.mock.calls) count(String(call[0]), -1)
    add.mockRestore()
    remove.mockRestore()
    // The click guard removes itself on a timer.
    added.delete('click')
    for (const [type, balance] of added) expect(balance, type).toBe(0)
  })

  it('removes its listener when detached', () => {
    detach()
    press(10, 10)
    moveTo(290, 50)
    expect(paneDrag.source).toBeNull()
    detach = () => {}
  })
})
