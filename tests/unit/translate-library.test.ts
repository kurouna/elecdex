import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HISTORY_WRITE_MS, TranslateLibrary } from '../../src/main/translate/library'
import { detectLanguage } from '../../src/shared/translate/detect'
import {
  containsTerm,
  glossaryApplies,
  mergeTerms,
  parseTermLines,
  readGlossaries,
  selectTerms,
} from '../../src/shared/translate/glossary'
import {
  continuesDraft,
  entrySource,
  entryTarget,
  type HistoryEntry,
  historyRow,
  recordEntry,
} from '../../src/shared/translate/history'

/** Phase 3's pure parts and main's files (docs/translate.md §6.3, §6.5, §7). */

describe('detectLanguage', () => {
  it('is certain where the script decides', () => {
    expect(detectLanguage('これは日本語の文章です。カタカナも入っています。')).toBe('ja')
    expect(detectLanguage('이것은 한국어 문장입니다. 테스트를 위해서 충분히 길게 씁니다.')).toBe(
      'ko',
    )
    expect(detectLanguage('นี่คือประโยคภาษาไทยที่ยาวพอสมควรสำหรับการทดสอบ')).toBe('th')
  })

  it('is certain of Latin text with clearly more of one language’s common words', () => {
    expect(
      detectLanguage('The metrics collector now runs in its own process, and it is fast.'),
    ).toBe('en')
    expect(
      detectLanguage(
        'Le collecteur est dans un processus à part et il est rapide pour les panneaux.',
      ),
    ).toBe('fr')
    expect(
      detectLanguage('Der Sammler ist jetzt in einem eigenen Prozess und das ist nicht langsam.'),
    ).toBe('de')
  })

  it('is not certain of Han alone, Cyrillic, short text, or Latin text without a clear lead', () => {
    expect(detectLanguage('这是一个用简体中文写的句子，足够长了吧对吧对吧')).toBeNull()
    expect(detectLanguage('Это предложение на русском языке, достаточно длинное.')).toBeNull()
    expect(detectLanguage('Hello there.')).toBeNull()
    expect(detectLanguage('Kubernetes Docker Grafana Prometheus Terraform Ansible')).toBeNull()
  })
})

describe('the glossary', () => {
  it('finds a spaced-script term only as a word, and an unspaced one anywhere', () => {
    expect(containsTerm('the pane is here', 'pane')).toBe(true)
    expect(containsTerm('the panel is here', 'pane')).toBe(false)
    expect(containsTerm('THE PANE', 'pane')).toBe(true)
    expect(containsTerm('ペインは右にある', 'ペイン')).toBe(true)
    expect(containsTerm('anything', '  ')).toBe(false)
  })

  it('sends the terms a text holds, longest first, fifty at most', () => {
    const terms = [
      { source: 'pane', target: 'ペイン' },
      { source: 'tab pane', target: 'タブのペイン' },
      { source: 'window', target: 'ウィンドウ' },
    ]
    expect(selectTerms(terms, 'A tab pane in a tab.').map((t) => t.source)).toEqual([
      'tab pane',
      'pane',
    ])
    const many = Array.from({ length: 80 }, (_, i) => ({ source: `w${i}`, target: 'x' }))
    expect(selectTerms(many, many.map((t) => t.source).join(' '))).toHaveLength(50)
  })

  it('is used only into its own language, a Japanese one into Easy Japanese too', () => {
    expect(glossaryApplies(null, 'fr')).toBe(true)
    expect(glossaryApplies('ja', 'ja')).toBe(true)
    expect(glossaryApplies('ja', 'ja(easy)')).toBe(true)
    expect(glossaryApplies('ja', 'en')).toBe(false)
  })

  it('reads pasted TSV and CSV, and a pasted term replaces one of the same source', () => {
    expect(parseTermLines('pane\tペイン\nwindow,ウィンドウ\nbroken\n\t\n')).toEqual([
      { source: 'pane', target: 'ペイン' },
      { source: 'window', target: 'ウィンドウ' },
    ])
    expect(
      mergeTerms([{ source: 'Pane', target: 'A' }], [{ source: 'pane', target: 'B' }]),
    ).toEqual([{ source: 'pane', target: 'B' }])
  })

  it('drops a broken glossary alone when reading the file', () => {
    expect(
      readGlossaries({
        version: 1,
        glossaries: [
          { id: 'g1', name: 'One', targetLang: 'ja', terms: [] },
          { id: 'g2', name: '', targetLang: 'ja', terms: [] },
        ],
      }).map((g) => g.id),
    ).toEqual(['g1'])
  })
})

const entry = (over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: 'e1',
  draftId: 'd1',
  at: 1,
  updatedAt: 1,
  srcLang: 'en',
  detected: null,
  tgtLang: 'ja',
  form: 'polite',
  blocks: [
    { lead: '', source: 'Hello.', text: 'こんにちは。' },
    { lead: '\n\n', source: 'Bye.', text: 'さようなら。' },
  ],
  tail: '',
  partial: null,
  model: 'm',
  ...over,
})

describe('the history', () => {
  it('goes on with the same draft, and starts anew when half or more is replaced', () => {
    expect(continuesDraft('Hello world', 'Hello world, again')).toBe(true)
    expect(continuesDraft('Hello world', 'Hello wor')).toBe(true)
    expect(continuesDraft('Hello world', 'Goodbye moon')).toBe(false)
    expect(continuesDraft('Hello world', '')).toBe(false)
    expect(continuesDraft('', 'New')).toBe(true)
  })

  it('replaces the newest entry of the same draft and languages, and adds anything else', () => {
    const one = recordEntry([], entry())
    const again = recordEntry(one, entry({ id: 'e2', updatedAt: 5 }))
    expect(again).toHaveLength(1)
    expect(again[0]).toMatchObject({ id: 'e1', at: 1, updatedAt: 5 })
    // The same text into another language keeps the first.
    expect(recordEntry(again, entry({ id: 'e3', tgtLang: 'fr' }))).toHaveLength(2)
    // Another draft too.
    expect(recordEntry(again, entry({ id: 'e4', draftId: 'd2' }))).toHaveLength(2)
  })

  it('keeps two hundred entries and the size limit, dropping the oldest', () => {
    let list: HistoryEntry[] = []
    for (let i = 0; i < 205; i++) list = recordEntry(list, entry({ id: `e${i}`, draftId: `d${i}` }))
    expect(list).toHaveLength(200)
    expect(list[0]?.id).toBe('e204')
    const small = recordEntry(list, entry({ id: 'big', draftId: 'dx' }), {
      count: 200,
      bytes: 2000,
    })
    expect(small.length).toBeLessThan(10)
    expect(small[0]?.id).toBe('big')
  })

  it('puts the source and the translation back together, and lists their start', () => {
    expect(entrySource(entry())).toBe('Hello.\n\nBye.')
    expect(entryTarget(entry())).toBe('こんにちは。\n\nさようなら。')
    expect(
      historyRow(entry({ blocks: [{ lead: '', source: 'x'.repeat(1000), text: 'y' }] })).source,
    ).toHaveLength(240)
  })
})

describe('TranslateLibrary', () => {
  let dir = ''
  const timers: (() => void)[] = []
  const make = () =>
    new TranslateLibrary(dir, {
      setTimer: (fn) => {
        timers.push(fn)
        return timers.length
      },
      clearTimer: () => {},
      changed: () => {},
    })

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'elecdex-library-'))
    timers.length = 0
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('writes the history after a moment, not with every change, and reads it back', () => {
    const library = make()
    library.record(entry())
    library.record(entry({ id: 'e2', draftId: 'd2' }))
    expect(timers).toHaveLength(1)
    expect(() => readFileSync(path.join(dir, 'history.json'))).toThrow()
    timers[0]?.()
    expect(
      make()
        .history()
        .map((e) => e.id),
    ).toEqual(['e2', 'e1'])
    expect(HISTORY_WRITE_MS).toBe(2000)
  })

  it('writes what waits when elecdex quits', () => {
    const library = make()
    library.record(entry())
    library.flush()
    expect(make().history()).toHaveLength(1)
  })

  it('keeps glossaries, refuses what is not one, and counts every change', () => {
    const library = make()
    const before = library.revision
    expect(
      library.saveGlossary({
        id: 'g1',
        name: 'Terms',
        targetLang: 'ja',
        terms: [{ source: 'pane', target: 'ペイン' }],
      }),
    ).toBeNull()
    expect(
      library.saveGlossary({ id: '../x', name: 'Terms', targetLang: 'ja', terms: [] }),
    ).toEqual({ problem: 'Not a glossary.' })
    expect(make().glossary('g1')?.terms).toHaveLength(1)
    library.removeGlossary('g1')
    expect(make().glossaries()).toEqual([])
    expect(library.revision).toBe(before + 2)
  })

  it('reads a broken file as empty, and keeps the good entries of a damaged one', () => {
    writeFileSync(
      path.join(dir, 'history.json'),
      JSON.stringify({ version: 1, entries: [entry(), { id: 1 }] }),
    )
    expect(
      make()
        .history()
        .map((e) => e.id),
    ).toEqual(['e1'])
    writeFileSync(path.join(dir, 'glossaries.json'), 'not json')
    expect(make().glossaries()).toEqual([])
  })
})
