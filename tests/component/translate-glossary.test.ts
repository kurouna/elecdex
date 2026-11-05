import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Glossary } from '../../src/shared/translate/glossary'
import { settle } from './support/settle.ts'

const { default: GlossaryDrawer } = await import(
  '../../src/renderer/widgets/translate/GlossaryDrawer.svelte'
)

/**
 * The glossary drawer (docs/translate.md §6.3): what it sends main. The mock clones what it is
 * given, as IPC does, so a $state proxy sent by mistake fails here (found: the terms never saved).
 */

let saved: Glossary[]

beforeEach(() => {
  vi.useFakeTimers()
  saved = []
  vi.stubGlobal('elecdex', {
    translate: {
      glossarySave: vi.fn(async (g: Glossary) => {
        saved.push(structuredClone(g))
        return null
      }),
      glossaryRemove: vi.fn(async () => undefined),
    },
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const glossary: Glossary = { id: 'g1', name: 'Terms', targetLang: 'ja', terms: [] }

describe('GlossaryDrawer', () => {
  it('saves the terms typed, whole ones only, a moment after the last edit', async () => {
    render(GlossaryDrawer, {
      props: {
        glossaries: [glossary],
        selected: 'g1',
        tgtLang: 'ja',
        text: 'the pane',
        onselect: () => {},
      },
    })
    await fireEvent.click(screen.getByRole('button', { name: '+ Term' }))
    await fireEvent.click(screen.getByRole('button', { name: '+ Term' }))
    await fireEvent.input(screen.getByLabelText('Source term 1'), { target: { value: 'pane' } })
    await fireEvent.input(screen.getByLabelText('Target term 1'), { target: { value: 'ペイン' } })
    await fireEvent.input(screen.getByLabelText('Source term 2'), { target: { value: 'half' } })
    expect(saved).toEqual([])
    vi.advanceTimersByTime(600)
    await settle()
    expect(saved.at(-1)?.terms).toEqual([{ source: 'pane', target: 'ペイン' }])
    expect(screen.getAllByText('in text')).toHaveLength(1)
  })

  it('says a glossary for another language is not used, and merges pasted terms', async () => {
    render(GlossaryDrawer, {
      props: {
        glossaries: [{ ...glossary, terms: [{ source: 'Pane', target: 'old' }] }],
        selected: 'g1',
        tgtLang: 'fr',
        text: '',
        onselect: () => {},
      },
    })
    expect(screen.getByTestId('translate-glossary-note').textContent).toContain('not used into FR')
    await fireEvent.click(screen.getByRole('button', { name: 'Paste TSV' }))
    await fireEvent.input(screen.getByLabelText('Terms to paste'), {
      target: { value: 'pane\tペイン\nwindow,ウィンドウ' },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    vi.advanceTimersByTime(600)
    await settle()
    expect(saved.at(-1)?.terms).toEqual([
      { source: 'pane', target: 'ペイン' },
      { source: 'window', target: 'ウィンドウ' },
    ])
  })
})

describe('GlossaryDrawer and edits still waiting', () => {
  it('saves an edit to its own glossary when another is chosen before the moment passes', async () => {
    const other: Glossary = { id: 'g2', name: 'Other', targetLang: null, terms: [] }
    render(GlossaryDrawer, {
      props: {
        glossaries: [glossary, other],
        selected: 'g1',
        tgtLang: 'ja',
        text: '',
        onselect: () => {},
      },
    })
    await fireEvent.click(screen.getByRole('button', { name: '+ Term' }))
    await fireEvent.input(screen.getByLabelText('Source term 1'), { target: { value: 'pane' } })
    await fireEvent.input(screen.getByLabelText('Target term 1'), { target: { value: 'ペイン' } })
    await fireEvent.change(screen.getByLabelText('Glossary'), { target: { value: 'g2' } })
    await settle()
    expect(saved.at(-1)).toMatchObject({ id: 'g1', terms: [{ source: 'pane', target: 'ペイン' }] })
  })

  it('saves an edit still waiting before making a new glossary, which is Japanese for Easy Japanese', async () => {
    render(GlossaryDrawer, {
      props: {
        glossaries: [glossary],
        selected: 'g1',
        tgtLang: 'ja(easy)',
        text: '',
        onselect: () => {},
      },
    })
    await fireEvent.input(screen.getByLabelText('Glossary name'), { target: { value: 'Renamed' } })
    await fireEvent.click(screen.getByRole('button', { name: '+ New' }))
    await settle()
    expect(saved[0]).toMatchObject({ id: 'g1', name: 'Renamed' })
    expect(saved[1]?.targetLang).toBe('ja')
  })
})
