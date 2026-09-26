import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  anchorOf,
  CARD_GAP,
  cardPlacement,
  HOVER_REST_MS,
  HoverRest,
  POINTER_OFFSET,
} from '../../src/renderer/lib/hover-card.js'

/**
 * Detail cards (architecture.md §7.4): where they go, when they open, and that
 * every one is drawn by the one frame.
 */

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect

/** Timers run by hand. */
function clock() {
  let now = 0
  let next = 1
  const timers = new Map<number, { at: number; fn: () => void }>()
  return {
    timers: {
      set: (fn: () => void, ms: number) => {
        const id = next++
        timers.set(id, { at: now + ms, fn })
        return id
      },
      clear: (id: unknown) => {
        timers.delete(id as number)
      },
    },
    advance(ms: number) {
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined || due[1].at > end) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
      }
      now = end
    },
  }
}

describe('cardPlacement', () => {
  const bounds = { width: 400, height: 300 }
  const card = { width: 200, height: 100 }

  it('puts the card under what it is about', () => {
    expect(cardPlacement({ x: 50, top: 40, bottom: 60 }, bounds, card)).toEqual({
      left: 50,
      top: 60 + CARD_GAP,
    })
  })

  it('puts it above where there is no room below, and never past the top', () => {
    expect(cardPlacement({ x: 50, top: 250, bottom: 270 }, bounds, card).top).toBe(
      250 - CARD_GAP - 100,
    )
    expect(cardPlacement({ x: 50, top: 50, bottom: 250 }, bounds, card).top).toBe(CARD_GAP)
  })

  it('keeps inside the pane on the left and on the right', () => {
    expect(cardPlacement({ x: 380, top: 0, bottom: 10 }, bounds, card).left).toBe(
      400 - 200 - CARD_GAP,
    )
    expect(cardPlacement({ x: -30, top: 0, bottom: 10 }, bounds, card).left).toBe(CARD_GAP)
  })
})

describe('anchorOf', () => {
  it('is in the pane’s pixels, a little right of the pointer, or at the element for the keyboard', () => {
    const pane = rect(100, 50, 400, 300)
    const row = rect(110, 80, 380, 20)
    expect(anchorOf(pane, row, 200)).toEqual({ x: 100 + POINTER_OFFSET, top: 30, bottom: 50 })
    expect(anchorOf(pane, row, null)).toEqual({ x: 10, top: 30, bottom: 50 })
  })
})

describe('HoverRest', () => {
  function rig() {
    const c = clock()
    const shown: string[] = []
    let hidden = 0
    const rest = new HoverRest<string>(() => {
      hidden += 1
    }, c.timers)
    const enter = (key: string, now = false) => rest.enter(key, () => shown.push(key), now)
    return { c, rest, shown, enter, hidden: () => hidden }
  }

  it('opens after a rest, and not for a pointer passing over', () => {
    const r = rig()
    r.enter('a')
    r.c.advance(HOVER_REST_MS - 1)
    r.rest.leave('a')
    r.enter('b')
    r.c.advance(HOVER_REST_MS - 1)
    expect(r.shown).toEqual([])
    r.c.advance(1)
    expect(r.shown).toEqual(['b'])
  })

  it('opens at once for the keyboard', () => {
    const r = rig()
    r.enter('a', true)
    expect(r.shown).toEqual(['a'])
  })

  it('opens the next at once when moving on with a card open, leave before enter', () => {
    const r = rig()
    r.enter('a')
    r.c.advance(HOVER_REST_MS)
    // The browser leaves the row before entering the next, in the same moment.
    r.rest.leave('a')
    r.enter('b')
    r.c.advance(0)
    expect(r.shown).toEqual(['a', 'b'])
    expect(r.hidden()).toBe(0)
  })

  it('closes once the moment of leaving is over', () => {
    const r = rig()
    r.enter('a', true)
    r.rest.leave('a')
    expect(r.hidden()).toBe(0)
    r.c.advance(0)
    expect(r.hidden()).toBe(1)
    // Closed, the next waits for a rest again.
    r.enter('b')
    expect(r.shown).toEqual(['a'])
  })

  it('ignores a late leave from what came before', () => {
    const r = rig()
    r.enter('a', true)
    r.enter('b', true)
    r.rest.leave('a')
    r.c.advance(10)
    expect(r.hidden()).toBe(0)
    r.rest.leave()
    r.c.advance(0)
    expect(r.hidden()).toBe(1)
  })

  it('leaves nothing running once disposed', () => {
    const r = rig()
    r.enter('a')
    r.rest.dispose()
    r.c.advance(HOVER_REST_MS * 2)
    expect(r.shown).toEqual([])
  })
})

describe('every detail card', () => {
  const root = path.join('src', 'renderer')
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name)
      return statSync(full).isDirectory() ? files(full) : full.endsWith('.svelte') ? [full] : []
    })
  const all = files(root)

  it('is drawn by HoverCard: no other component is a tooltip of its own', () => {
    const own = all.filter(
      (file) =>
        !file.endsWith(path.join('common', 'HoverCard.svelte')) &&
        readFileSync(file, 'utf8').includes('role="tooltip"'),
    )
    expect(own).toEqual([])
  })

  it('includes the six there are', () => {
    const users = all
      .filter((file) => readFileSync(file, 'utf8').includes("from '../common/HoverCard.svelte'"))
      .map((file) => path.basename(file))
      .sort()
    expect(users).toEqual([
      'AgentCard.svelte',
      'ClipCard.svelte',
      'GitCommitCard.svelte',
      'GitFileCard.svelte',
      'HintCard.svelte',
      'OrbitWidget.svelte',
    ])
  })
})
