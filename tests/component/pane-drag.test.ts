import { pane, split, tabs } from '@shared/layout-ops'
import {
  LAYOUT_VERSION,
  type LayoutNode,
  type PaneNode,
  type TabsNode,
} from '@shared/schemas/layout'
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

/** A drop host drawing a tab strip: equal tabs, 26px tall, along its top. */
function tabbedHost(nodeId: string, tabIds: string[], box: Host['box']): Host {
  const h = host(nodeId, box.left, box.top, box.width, box.height)
  const strip = document.createElement('ul')
  strip.dataset.dropStrip = ''
  strip.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: box.left, y: box.top, width: box.width, height: 26 })
  const width = box.width / tabIds.length
  tabIds.forEach((id, i) => {
    const tab = document.createElement('li')
    tab.dataset.dropTab = id
    const rect = DOMRect.fromRect({ x: box.left + i * width, y: box.top, width, height: 26 })
    tab.getBoundingClientRect = () => rect
    strip.append(tab)
  })
  ;(h.el.parentElement as HTMLElement).append(strip)
  return h
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
      insertion: null,
      reorder: false,
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

/**
 * Reordering tabs: Ctrl over the group a tab is already in moves it within the
 * strip, and Ctrl over another group inserts it at the gap the pointer picks.
 *
 * The strip is laid out by hand, as the rest of the harness is: three tabs of
 * 100px over the first group, two of 100px over the second, and a lone pane
 * with no strip at all.
 */
describe('tab reordering by drag', () => {
  let ta: PaneNode
  let tb: PaneNode
  let tc: PaneNode
  let td: PaneNode
  let te: PaneNode
  let tf: PaneNode
  let g1: TabsNode
  let g2: TabsNode

  const g1Box = { left: 0, top: 0, width: 300, height: 100 }
  const g2Box = { left: 300, top: 0, width: 200, height: 100 }
  const caretAt = (left: number) => ({ left, top: 0, width: 0, height: 26 })

  beforeEach(() => {
    // Replace the outer harness rather than adding to it.
    detach()
    document.body.replaceChildren()
    ;[ta, tb, tc, td, te, tf] = ['a', 'b', 'c', 'd', 'e', 'f'].map((w) => pane(w)) as [
      PaneNode,
      PaneNode,
      PaneNode,
      PaneNode,
      PaneNode,
      PaneNode,
    ]
    g1 = tabs([ta, tb, tc], 0)
    g2 = tabs([td, te], 0)
    layout.tree = { version: LAYOUT_VERSION, root: split('row', [g1, g2, tf]) }
    hosts = [
      tabbedHost(g1.id, [ta.id, tb.id, tc.id], g1Box),
      tabbedHost(g2.id, [td.id, te.id], g2Box),
      host(tf.id, 500, 0, 100, 100),
    ]
    handle = document.createElement('button')
    hosts[0]?.el.append(handle)
    captured = []
    handle.setPointerCapture = (id: number) => void captured.push(id)
    handle.releasePointerCapture = () => {}
    // The first tab of the first group is what every case below drags.
    detach = dragHandle(ta.id, () => 'A')(handle) as () => void
  })

  it('picks the gap under the pointer in the tab it is already in', () => {
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    expect(paneDrag.target).toEqual({
      nodeId: g1.id,
      placement: 'tab',
      preview: g1Box,
      insertion: { index: 3, caret: caretAt(300) },
      reorder: true,
    })
  })

  it('reorders the tab on release, and keeps it showing', () => {
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    release(280, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b c a) tabs(d e) f)')
    expect(layout.focusedPaneId).toBe(ta.id)
  })

  it('reorders to a gap in the middle of the strip', () => {
    press(10, 10)
    moveTo(200, 50, { ctrlKey: true })
    expect(paneDrag.target?.insertion?.index).toBe(2)
    release(200, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b a c) tabs(d e) f)')
  })

  it.each([
    ['its own gap', 20],
    ['the gap just after it, which is the same gap', 100],
  ])('shows no target over %s', (_, x) => {
    const before = shape(layout.tree.root)
    press(10, 10)
    moveTo(x, 50, { ctrlKey: true })
    expect(paneDrag.target).toBeNull()
    release(x, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe(before)
  })

  it('inserts into another group at the gap, not at its end', () => {
    press(10, 10)
    moveTo(320, 50, { ctrlKey: true })
    expect(paneDrag.target).toEqual({
      nodeId: g2.id,
      placement: 'tab',
      preview: g2Box,
      insertion: { index: 0, caret: caretAt(300) },
      reorder: false,
    })
    release(320, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b c) tabs(a d e) f)')
  })

  it('inserts at the end of another group when the pointer is past its last tab', () => {
    press(10, 10)
    moveTo(480, 50, { ctrlKey: true })
    expect(paneDrag.target?.insertion?.index).toBe(2)
    release(480, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b c) tabs(d e a) f)')
  })

  it('falls back to a plain tab drop on a pane that draws no strip', () => {
    press(10, 10)
    moveTo(550, 50, { ctrlKey: true })
    expect(paneDrag.target).toMatchObject({ nodeId: tf.id, placement: 'tab', insertion: null })
    release(550, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b c) tabs(d e) tabs(f a))')
  })

  it('still takes the tab out of its group without Ctrl', () => {
    press(10, 10)
    moveTo(280, 50)
    expect(paneDrag.target).toMatchObject({ placement: 'right', insertion: null, reorder: false })
    release(280, 50)
    expect(shape(layout.tree.root)).toBe('row(tabs(b c) a tabs(d e) f)')
  })

  it('switches between taking the tab out and reordering it on the key alone', () => {
    press(10, 10)
    moveTo(280, 50)
    expect(paneDrag.target?.reorder).toBe(false)
    key('keydown', { key: 'Control', ctrlKey: true })
    expect(paneDrag.target?.reorder).toBe(true)
    key('keyup', { key: 'Control', ctrlKey: false })
    expect(paneDrag.target?.reorder).toBe(false)
  })

  it.each([
    ['reorder', 280, true],
    ['Ctrl: reorder', 280, false],
    ['as tab', 320, true],
    ['Ctrl: as tab', 320, false],
  ])('says %s beside the pointer', (hint, x, ctrlKey) => {
    press(10, 10)
    moveTo(x, 50, { ctrlKey })
    expect(paneDrag.hint).toBe(hint)
  })

  it('offers no reorder hint over a pane the tab is not in', () => {
    press(10, 10)
    moveTo(550, 50)
    expect(paneDrag.hint).toBe('Ctrl: as tab')
  })

  it('cancels a reorder on Escape, leaving the strip as it was', () => {
    const before = shape(layout.tree.root)
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    expect(paneDrag.target?.insertion?.index).toBe(3)
    const pressed = key('keydown', { key: 'Escape' })
    expect(pressed.defaultPrevented).toBe(true)
    expect(paneDrag.source).toBeNull()
    release(280, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe(before)
  })

  it('cancels a reorder when pointer capture is lost', () => {
    const before = shape(layout.tree.root)
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    handle.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1 }))
    flushSync()
    expect(paneDrag.source).toBeNull()
    expect(shape(layout.tree.root)).toBe(before)
  })

  it('offers nothing when a whole group is dragged onto its own strip', () => {
    detach()
    const groupHandle = document.createElement('header')
    hosts[0]?.el.append(groupHandle)
    groupHandle.setPointerCapture = () => {}
    groupHandle.releasePointerCapture = () => {}
    detach = dragHandle(g1.id, () => 'G1')(groupHandle) as () => void
    const before = shape(layout.tree.root)
    groupHandle.dispatchEvent(pointer('pointerdown', 10, 10))
    document.body.dispatchEvent(pointer('pointermove', 280, 50, { ctrlKey: true }))
    flushSync()
    // A group cannot be put inside itself, at any gap in its own strip.
    expect(paneDrag.source).toBe(g1.id)
    expect(paneDrag.target).toBeNull()
    groupHandle.dispatchEvent(pointer('pointerup', 280, 50, { ctrlKey: true }))
    flushSync()
    expect(shape(layout.tree.root)).toBe(before)
  })

  it('puts a whole group into another strip as one block, at the gap picked', () => {
    detach()
    const groupHandle = document.createElement('header')
    hosts[0]?.el.append(groupHandle)
    groupHandle.setPointerCapture = () => {}
    groupHandle.releasePointerCapture = () => {}
    detach = dragHandle(g1.id, () => 'G1')(groupHandle) as () => void
    groupHandle.dispatchEvent(pointer('pointerdown', 10, 10))
    document.body.dispatchEvent(pointer('pointermove', 420, 50, { ctrlKey: true }))
    flushSync()
    expect(paneDrag.target?.insertion?.index).toBe(1)
    groupHandle.dispatchEvent(pointer('pointerup', 420, 50, { ctrlKey: true }))
    flushSync()
    expect(shape(layout.tree.root)).toBe('row(tabs(d a b c e) f)')
  })

  it('switches between a side of another group and a place in its strip', () => {
    press(10, 10)
    moveTo(320, 50)
    expect(paneDrag.target).toMatchObject({ placement: 'left', insertion: null })
    key('keydown', { key: 'Control', ctrlKey: true })
    expect(paneDrag.target).toMatchObject({ placement: 'tab', insertion: { index: 0 } })
    key('keyup', { key: 'Control', ctrlKey: false })
    expect(paneDrag.target).toMatchObject({ placement: 'left', insertion: null })
  })

  /** The second group's strip: the one this describe's drag is not already in. */
  const otherStrip = () =>
    [...document.querySelectorAll<HTMLElement>('[data-drop-strip]')][1] as HTMLElement

  it('falls back to a plain tab drop when the tabs are not in a strip', () => {
    // The marker the group answers for its tabs with, taken away.
    otherStrip().removeAttribute('data-drop-strip')
    press(10, 10)
    moveTo(320, 50, { ctrlKey: true })
    expect(paneDrag.target).toMatchObject({ placement: 'tab', insertion: null, reorder: false })
    release(320, 50, { ctrlKey: true })
    // No gap to pick, so it joins at the end, as it did before there were gaps.
    expect(shape(layout.tree.root)).toBe('row(tabs(b c) tabs(d e a) f)')
  })

  it('falls back to a plain tab drop for a strip with no tabs in it', () => {
    for (const tab of otherStrip().querySelectorAll('[data-drop-tab]')) tab.remove()
    press(10, 10)
    moveTo(320, 50, { ctrlKey: true })
    expect(paneDrag.target).toMatchObject({ placement: 'tab', insertion: null })
    release(320, 50, { ctrlKey: true })
    expect(shape(layout.tree.root)).toBe('row(tabs(b c) tabs(d e a) f)')
  })

  it('has no place to drop into over the group the tab is already in, with no strip', () => {
    // The dead zone as it was before gaps: Ctrl over its own group did nothing.
    document.querySelector<HTMLElement>('[data-drop-strip]')?.removeAttribute('data-drop-strip')
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    expect(paneDrag.target).toBeNull()
  })

  it('knows which group a pane is drawn in', () => {
    expect(layout.groupOf(ta.id)).toBe(g1.id)
    expect(layout.groupOf(td.id)).toBe(g2.id)
    // A pane outside a group, the group itself, and an id that is not there.
    expect(layout.groupOf(tf.id)).toBeNull()
    expect(layout.groupOf(g1.id)).toBeNull()
    expect(layout.groupOf('nope')).toBeNull()
  })

  it('saves the reordered layout', async () => {
    const save = window.elecdex.layout.save as ReturnType<typeof vi.fn>
    save.mockClear()
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    release(280, 50, { ctrlKey: true })
    await vi.runAllTimersAsync()
    expect(save).toHaveBeenCalledTimes(1)
    const saved = save.mock.calls[0]?.[0] as { root: LayoutNode }
    expect(shape(saved.root)).toBe('row(tabs(b c a) tabs(d e) f)')
  })

  it('settles a close still running before it reorders', () => {
    const settle = vi.spyOn(layout, 'settle')
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    release(280, 50, { ctrlKey: true })
    expect(settle).toHaveBeenCalled()
    settle.mockRestore()
  })

  it('measures the strip once per group, not on every move', () => {
    const tab = document.querySelector<HTMLElement>('[data-drop-tab]') as HTMLElement
    const measure = vi.spyOn(tab, 'getBoundingClientRect')
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    moveTo(281, 50, { ctrlKey: true })
    moveTo(282, 50, { ctrlKey: true })
    expect(measure).toHaveBeenCalledTimes(1)
    // Leaving the group and coming back measures it again: it may have moved.
    moveTo(320, 50, { ctrlKey: true })
    moveTo(282, 50, { ctrlKey: true })
    expect(measure).toHaveBeenCalledTimes(2)
  })

  it('forgets the strip it measured when the drag ends', () => {
    const tab = document.querySelector<HTMLElement>('[data-drop-tab]') as HTMLElement
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    release(280, 50, { ctrlKey: true })
    const measure = vi.spyOn(tab, 'getBoundingClientRect')
    press(10, 10)
    moveTo(280, 50, { ctrlKey: true })
    expect(measure).toHaveBeenCalled()
  })
})
