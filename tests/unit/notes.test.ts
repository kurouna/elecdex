import { emptyNotes, NOTE_LIMITS, NotesFileSchema, noteTitle, sortNotes } from '@shared/notes'
import { describe, expect, it } from 'vitest'

/**
 * How a note names itself, and what notes.json accepts.
 *
 * There is no title field: the first line is the title, which is what makes a
 * note something you can start typing into. The rules for deriving it are worth
 * pinning down, because they decide what the switcher shows for every note.
 */

describe('noteTitle', () => {
  it('is the first line', () => {
    expect(noteTitle('release steps\n- bump the version')).toBe('release steps')
  })

  it('skips blank lines and markup at the front', () => {
    expect(noteTitle('\n\n# heading\nbody')).toBe('heading')
    expect(noteTitle('- first item')).toBe('first item')
  })

  it('says so when there is nothing to name it with', () => {
    expect(noteTitle('')).toBe('untitled')
    expect(noteTitle('\n\n   \n')).toBe('untitled')
  })

  it('cuts a very long first line to something a switcher can show', () => {
    expect(noteTitle('x'.repeat(500))).toHaveLength(NOTE_LIMITS.title)
  })
})

describe('sortNotes', () => {
  it('puts the most recently written first', () => {
    const note = (id: string, updatedAt: number) => ({
      id,
      body: '',
      createdAt: 0,
      updatedAt,
      rev: 1,
    })
    expect(sortNotes([note('a', 1), note('b', 3), note('c', 2)]).map((n) => n.id)).toEqual([
      'b',
      'c',
      'a',
    ])
  })
})

describe('notes.json', () => {
  it('reads an empty file as an empty set of notes', () => {
    expect(NotesFileSchema.parse({})).toEqual(emptyNotes())
  })

  it('refuses a body beyond the limit rather than writing it', () => {
    const tooBig = {
      notes: [{ id: 'a', body: 'x'.repeat(NOTE_LIMITS.body + 1), createdAt: 0, updatedAt: 0 }],
    }
    expect(NotesFileSchema.safeParse(tooBig).success).toBe(false)
  })

  it('fills in the revision a hand-written file leaves out', () => {
    const parsed = NotesFileSchema.parse({
      notes: [{ id: 'a', body: 'hello', createdAt: 0, updatedAt: 0 }],
    })
    expect(parsed.notes[0]?.rev).toBe(0)
  })
})
