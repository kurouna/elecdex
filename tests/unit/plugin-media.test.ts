import { isPluginKey, keyFate, keyLabels, PLUGIN_KEY_CODES, usLabel } from '@shared/plugin-keys'
import { contextTimeFor, midiToHz, readKeymap, readNote, readNotes } from '@shared/plugin-sound'
import {
  grantFor,
  isCovered,
  NO_PERMISSIONS,
  PermissionsSchema,
  parseDescriptor,
  readBlocks,
  WorkerMessageSchema,
} from '@shared/plugins'
import { describe, expect, it } from 'vitest'

/**
 * Plugin API version 2 (docs/plugins.md section 13): the keys a focused plugin pane is
 * given, the notes it may play, its canvas blocks, and what the user agrees to.
 */

const press = (code: string, change: Partial<Parameters<typeof keyFate>[0]> = {}) =>
  keyFate({
    code,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    isComposing: false,
    repeat: false,
    ...change,
  })

describe('keys for a plugin', () => {
  it('gives letters, digits and the named keys, never a chord the app may own', () => {
    expect(press('KeyA')).toBe('deliver')
    expect(press('Semicolon')).toBe('deliver')
    expect(press('Escape')).toBe('deliver')
    expect(press('ArrowUp')).toBe('deliver')
    expect(press('KeyA', { ctrlKey: true })).toBe('pass')
    expect(press('KeyA', { altKey: true })).toBe('pass')
    expect(press('KeyA', { metaKey: true })).toBe('pass')
    // Function keys are the app's shortcuts; Tab moves the keyboard out of the pane.
    expect(press('F5')).toBe('pass')
    expect(press('Tab')).toBe('pass')
    // An IME composing is typing, not a key.
    expect(press('KeyA', { isComposing: true })).toBe('pass')
  })

  it('takes a held key repeating from the page, but gives it once', () => {
    expect(press('KeyA', { repeat: true })).toBe('swallow')
  })

  it('names each key by what this keyboard prints, or by a US keyboard', () => {
    const azerty = new Map([
      ['KeyQ', 'a'],
      ['KeyA', 'q'],
      ['Semicolon', 'm'],
    ])
    const labels = keyLabels(azerty)
    expect(labels.KeyQ).toBe('A')
    expect(labels.KeyA).toBe('Q')
    expect(labels.Semicolon).toBe('M')
    expect(labels.KeyZ).toBe('Z')
    expect(labels.Space).toBe('SPACE')
    expect(keyLabels(null).Quote).toBe("'")
    expect(usLabel('Digit7')).toBe('7')
    expect(Object.keys(labels)).toEqual([...PLUGIN_KEY_CODES])
    expect(isPluginKey('KeyA')).toBe(true)
    expect(isPluginKey('ControlLeft')).toBe(false)
  })
})

describe('notes for the synthesiser', () => {
  const origin = 1_000_000
  const now = 5000

  it('holds every field to its range, and brings the time to the page clock', () => {
    expect(
      readNote({ voice: 'piano', pitch: 200, level: 3, pan: -9, at: origin + 6000 }, origin, now),
    ).toEqual({
      voice: 'piano',
      pitch: 127,
      at: 6000,
      length: null,
      level: 1,
      pan: -1,
    })
    expect(readNote({ voice: 'kick' }, origin, now)).toMatchObject({
      pitch: 60,
      at: null,
      level: 0.8,
    })
    expect(readNote({ voice: 'lead', length: 1e9 }, origin, now)?.length).toBe(30_000)
  })

  it('drops what is not a note, and a note too far ahead', () => {
    expect(readNote({ voice: 'theremin' }, origin, now)).toBeNull()
    expect(readNote('piano', origin, now)).toBeNull()
    expect(readNote({ voice: 'piano', at: origin + now + 11 * 60_000 }, origin, now)).toBeNull()
  })

  it('reads a call in the order the notes are heard, at once first', () => {
    const notes = readNotes(
      [
        { voice: 'hat', at: origin + 9000 },
        { voice: 'kick' },
        { voice: 'snare', at: origin + 7000 },
        7,
      ],
      origin,
      now,
    )
    expect(notes.map((n) => n.voice)).toEqual(['kick', 'snare', 'hat'])
  })

  it('keeps a key map to plugin keys, played at once', () => {
    const map = readKeymap(
      {
        KeyA: { voice: 'epiano', pitch: 60, at: origin + 9000 },
        ControlLeft: { voice: 'piano' },
        KeyB: 'x',
      },
      origin,
      now,
    )
    expect([...map.keys()]).toEqual(['KeyA'])
    expect(map.get('KeyA')?.at).toBeNull()
    expect(map.get('KeyA')?.hold).toBe(false)
    const held = readKeymap({ KeyA: { voice: 'lead', hold: true } }, origin, now)
    expect(held.get('KeyA')?.hold).toBe(true)
    expect(readKeymap(null, origin, now).size).toBe(0)
  })

  it('schedules on the output clock when it has one, and never in the past', () => {
    expect(midiToHz(69)).toBe(440)
    const stamp = { contextTime: 10, performanceTime: 4000 }
    const clock = { currentTime: 10.05, now: 4050, latency: 0.02, stamp }
    expect(contextTimeFor(4500, clock)).toBeCloseTo(10.5)
    expect(contextTimeFor(3000, clock)).toBeCloseTo(10.052)
    expect(contextTimeFor(null, clock)).toBeCloseTo(10.052)
    // Before the output has said where it is, its reported latency stands in.
    expect(contextTimeFor(4550, { ...clock, stamp: null })).toBeCloseTo(10.53)
  })
})

describe('the descriptor and the grant', () => {
  const base = { apiVersion: 2, id: 'game', title: 'game', hasService: false }

  it('asks for keys and sound only from apiVersion 2 on', () => {
    expect(parseDescriptor({ ...base, permissions: { keys: true, sound: true } }).ok).toBe(true)
    expect(parseDescriptor({ ...base, apiVersion: 1, permissions: { keys: true } }).ok).toBe(false)
    expect(parseDescriptor({ ...base, apiVersion: 1, permissions: { sound: true } }).ok).toBe(false)
    expect(parseDescriptor({ ...base, apiVersion: 1 }).ok).toBe(true)
  })

  it('covers keys and sound only when they were agreed to', () => {
    const asks = PermissionsSchema.parse({ keys: true, sound: true })
    expect(isCovered(asks, NO_PERMISSIONS)).toBe(false)
    expect(isCovered(asks, { ...NO_PERMISSIONS, keys: true })).toBe(false)
    expect(isCovered(asks, grantFor(asks))).toBe(true)
  })
})

describe('canvas blocks', () => {
  it('are drawn by id, at most four to a pane and never two of one id', () => {
    const canvas = (id: string, height?: number) => ({
      t: 'canvas',
      id,
      ...(height ? { height } : {}),
    })
    const { blocks, problems } = readBlocks([
      canvas('a'),
      canvas('a'),
      canvas('b', 120),
      canvas('c'),
      canvas('d'),
      canvas('e'),
      canvas('Bad Id'),
      canvas('f', 10),
    ])
    expect(blocks.map((b) => (b.t === 'canvas' ? b.id : ''))).toEqual(['a', 'b', 'c', 'd'])
    expect(problems.join(' ')).toMatch(/already in the pane/)
    expect(problems.join(' ')).toMatch(/at most 4 canvas blocks/)
  })

  it('come with notes and key maps the host checks', () => {
    expect(WorkerMessageSchema.safeParse({ t: 'sound', pane: 'p', notes: [{}] }).success).toBe(true)
    expect(
      WorkerMessageSchema.safeParse({ t: 'sound', pane: 'p', notes: new Array(4097).fill({}) })
        .success,
    ).toBe(false)
    expect(WorkerMessageSchema.safeParse({ t: 'keymap', pane: 'p', map: null }).success).toBe(true)
    const many = Object.fromEntries(Array.from({ length: 129 }, (_, i) => [`k${i}`, {}]))
    expect(WorkerMessageSchema.safeParse({ t: 'keymap', pane: 'p', map: many }).success).toBe(false)
    expect(WorkerMessageSchema.safeParse({ t: 'sound-stop', pane: 'p' }).success).toBe(true)
  })
})
