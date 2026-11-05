<script lang="ts">
import {
  containsTerm,
  type Glossary,
  glossaryApplies,
  MAX_GLOSSARIES,
  mergeTerms,
  parseTermLines,
  type Term,
} from '@shared/translate/glossary'
import { LANGUAGES } from '@shared/translate/languages'
import { langCode } from './translate-view.ts'

/**
 * The glossary drawer (docs/translate.md §6.3): choose one of main's glossaries for this pane,
 * or make one; name it, give it a target language, edit its terms, paste TSV or CSV. A term the
 * text holds says so. Every change is saved whole to main a moment after the last edit.
 */
interface Props {
  glossaries: readonly Glossary[]
  selected: string | null
  tgtLang: string
  text: string
  onselect: (id: string | null) => void
}

const { glossaries, selected, tgtLang, text, onselect }: Props = $props()
const api = window.elecdex.translate

const current = $derived(glossaries.find((g) => g.id === selected) ?? null)
/** The glossary as being edited: main's copy until a change, then this until it is saved. */
let draft = $state<Glossary | null>(null)
let problem = $state<string | null>(null)
let pasting = $state(false)
let pasted = $state('')
let armed = $state(false)
let saveTimer: ReturnType<typeof setTimeout> | null = null
let armTimer: ReturnType<typeof setTimeout> | null = null

const shown = $derived(draft !== null && draft.id === selected ? draft : current)
const applies = $derived(shown === null || glossaryApplies(shown.targetLang, tgtLang))

$effect(() => () => {
  if (saveTimer !== null) flush()
  if (armTimer !== null) clearTimeout(armTimer)
})

function edit(change: (g: Glossary) => Glossary): void {
  const base = shown
  if (base === null) return
  draft = change($state.snapshot(base) as Glossary)
  if (saveTimer !== null) clearTimeout(saveTimer)
  saveTimer = setTimeout(flush, 600)
}

function flush(): void {
  if (saveTimer !== null) clearTimeout(saveTimer)
  saveTimer = null
  if (draft === null) return
  // A snapshot first: IPC cannot clone a $state proxy, and the terms are ones.
  const glossary = $state.snapshot(draft) as Glossary
  // Rows still empty are kept on screen, never sent: main takes only whole terms.
  const terms = glossary.terms.filter((t) => t.source.trim() !== '' && t.target.trim() !== '')
  void api
    .glossarySave({ ...glossary, terms })
    .then((answer) => (problem = answer?.problem ?? null))
    .catch((error: unknown) => (problem = error instanceof Error ? error.message : String(error)))
}

async function create(): Promise<void> {
  const glossary: Glossary = {
    id: crypto.randomUUID().replaceAll('-', '').slice(0, 16),
    name: `Glossary ${glossaries.length + 1}`,
    targetLang: tgtLang,
    terms: [],
  }
  const answer = await api.glossarySave(glossary)
  if (answer) {
    problem = answer.problem
    return
  }
  draft = glossary
  onselect(glossary.id)
}

function remove(): void {
  if (shown === null) return
  if (!armed) {
    armed = true
    armTimer = setTimeout(() => (armed = false), 3000)
    return
  }
  armed = false
  const id = shown.id
  draft = null
  onselect(null)
  void api.glossaryRemove(id)
}

function setTerm(index: number, side: keyof Term, value: string): void {
  edit((g) => ({ ...g, terms: g.terms.map((t, i) => (i === index ? { ...t, [side]: value } : t)) }))
}

function addTerm(): void {
  edit((g) => ({ ...g, terms: [...g.terms, { source: '', target: '' }] }))
}

function removeTerm(index: number): void {
  edit((g) => ({ ...g, terms: g.terms.filter((_, i) => i !== index) }))
}

function applyPaste(): void {
  const terms = parseTermLines(pasted)
  if (terms.length > 0) edit((g) => ({ ...g, terms: mergeTerms(g.terms, terms) }))
  pasted = ''
  pasting = false
}
</script>

<section class="glossary" data-testid="translate-glossary">
  <div class="dhead">
    <b>Glossary</b>
    <select
      aria-label="Glossary"
      value={selected ?? ''}
      onchange={(e) => {
        draft = null
        onselect(e.currentTarget.value === '' ? null : e.currentTarget.value)
      }}
    >
      <option value="">none</option>
      {#each glossaries as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
    </select>
    <button type="button" class="btn" disabled={glossaries.length >= MAX_GLOSSARIES} onclick={() => void create()}>+ New</button>
    {#if shown !== null}
      <span class="spacer"></span>
      <button type="button" class="btn" onclick={() => (pasting = !pasting)}>Paste TSV</button>
      <button type="button" class="btn" class:warn={armed} onclick={remove}>{armed ? 'Delete it?' : 'Delete'}</button>
    {/if}
  </div>
  {#if shown !== null}
    <div class="meta">
      <input class="name" aria-label="Glossary name" value={shown.name} oninput={(e) => edit((g) => ({ ...g, name: e.currentTarget.value }))} />
      <label>
        <span>for</span>
        <select
          aria-label="Its target language"
          value={shown.targetLang ?? ''}
          onchange={(e) => edit((g) => ({ ...g, targetLang: e.currentTarget.value === '' ? null : e.currentTarget.value }))}
        >
          <option value="">any language</option>
          {#each LANGUAGES as language (language.code)}<option value={language.code}>{language.code.toUpperCase()} · {language.english}</option>{/each}
        </select>
      </label>
      <span class="note" class:warn={!applies} data-testid="translate-glossary-note">
        {applies
          ? `${shown.terms.length} terms · the ones in the text are sent`
          : `for ${langCode(shown.targetLang ?? '')} only: not used into ${langCode(tgtLang)}`}
      </span>
    </div>
    {#if pasting}
      <div class="paste">
        <textarea bind:value={pasted} aria-label="Terms to paste" placeholder="term[Tab]translation, one a line (or term,translation)"></textarea>
        <button type="button" class="btn lit" disabled={pasted.trim() === ''} onclick={applyPaste}>Add</button>
      </div>
    {/if}
    <div class="terms">
      {#each shown.terms as term, i (i)}
        <input value={term.source} aria-label="Source term {i + 1}" oninput={(e) => setTerm(i, 'source', e.currentTarget.value)} />
        <span class="arr">→</span>
        <input value={term.target} aria-label="Target term {i + 1}" oninput={(e) => setTerm(i, 'target', e.currentTarget.value)} />
        <span class="hits" class:none={!containsTerm(text, term.source)}>{containsTerm(text, term.source) ? 'in text' : '—'}</span>
        <button type="button" class="x" aria-label="Remove term {i + 1}" onclick={() => removeTerm(i)}>×</button>
      {/each}
    </div>
    <button type="button" class="btn add" onclick={addTerm}>+ Term</button>
  {:else}
    <p class="note">No glossary for this pane. Terms of a glossary that the text holds go with each block, longest first.</p>
  {/if}
  {#if problem}<p class="problem">{problem}</p>{/if}
</section>

<style>
.glossary { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.dhead { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.dhead b { color: var(--text); font-weight: 500; }
.spacer { flex: 1; }
select, .name { background: var(--app-bg); color: var(--text); border: 1px solid var(--panel-border); font-family: var(--font-mono); font-size: var(--step--1); padding: 0.05rem 0.3rem; }
.meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.meta label { display: inline-flex; align-items: center; gap: 0.3rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.name { min-width: 8rem; }
.note { font-size: var(--step--2); color: var(--text-muted); letter-spacing: 0.04em; margin: 0; }
.note.warn { color: var(--warn); }
.terms { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto auto; gap: 0.15rem 0.6rem; align-items: center; font-family: var(--font-mono); font-size: var(--step--1); max-height: 9rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--accent-dim) transparent; }
.terms input { width: 100%; min-width: 0; background: transparent; border: 0; border-bottom: 1px solid var(--panel-rule); padding: 0.05rem 0.1rem; color: var(--text); outline: none; font: inherit; }
.terms input:focus { border-bottom-color: var(--accent); }
.arr { color: var(--text-muted); }
.hits { font-size: var(--step--2); color: var(--info); font-family: var(--font-ui); letter-spacing: var(--tracking-wide); text-transform: uppercase; white-space: nowrap; }
.hits.none { color: var(--text-muted); }
.x { border: 0; background: transparent; color: var(--text-muted); padding: 0 0.2rem; }
.x:hover { color: var(--danger); }
.paste { display: flex; gap: var(--space-1); align-items: flex-end; }
.paste textarea { flex: 1; min-height: 3.5rem; resize: vertical; background: transparent; border: 1px solid var(--panel-rule); color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); padding: 0.2rem 0.4rem; outline: none; }
.btn { background: transparent; border: 1px solid var(--panel-border); padding: 0.05rem 0.55rem; color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; white-space: nowrap; }
.btn:not(:disabled):hover { color: var(--accent); border-color: var(--accent); }
.btn:disabled { opacity: 0.45; }
.btn.lit:not(:disabled) { border-color: var(--accent); color: var(--accent-strong); background: var(--accent-faint); }
.btn.warn { border-color: var(--warn); color: var(--warn); }
.add { align-self: flex-start; }
.problem { color: var(--danger); font-size: var(--step--1); margin: 0; }
</style>
