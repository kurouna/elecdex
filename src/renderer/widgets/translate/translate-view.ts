import { joinBlocks } from '@shared/translate/blocks'
import type { EnginePhase, EngineView, FetchView, TranslateBoard } from '@shared/translate/board'
import type { HistoryRow } from '@shared/translate/history'
import { asSource, EASY_JAPANESE, LANGUAGES } from '@shared/translate/languages'
import { type ModelEntry, type ModelFit, modelFit } from '@shared/translate/models'
import type { RunView } from '@shared/translate/run'

/**
 * What the TRANSLATE pane shows of the board, decided apart from the components so a unit test
 * reaches it (docs/translate.md §3).
 */

export type LampKind = 'ok' | 'off' | 'warn' | 'bad' | 'busy'

/** The footer's lamp and word for an engine phase. */
export function phaseLamp(phase: EnginePhase): { kind: LampKind; word: string } {
  switch (phase) {
    case 'absent':
      return { kind: 'warn', word: 'No model' }
    case 'stopped':
      return { kind: 'off', word: 'Standby' }
    case 'starting':
      return { kind: 'busy', word: 'Boot' }
    case 'ready':
    case 'external-ready':
      return { kind: 'ok', word: 'Ready' }
    case 'stopping':
      return { kind: 'busy', word: 'Stopping' }
    case 'fault':
      return { kind: 'bad', word: 'Fault' }
    case 'external-untested':
      return { kind: 'off', word: 'Untested' }
    case 'external-unreachable':
      return { kind: 'bad', word: 'Unreachable' }
  }
}

/** Where the text goes, for the footer's right end: this PC, or the external server (§3). */
export function whereTextGoes(engine: EngineView): { text: string; warn: boolean } {
  if (engine.source === 'external' && engine.externalHost) {
    return { text: `sent to ${engine.externalHost}`, warn: !engine.externalLoopback }
  }
  return { text: 'local, nothing leaves this PC', warn: false }
}

/**
 * The step SETUP opens on: FETCH while one goes on; READY when the engine and the chosen model are
 * in place and that model is the settings' (READY tests the settings' model); else the first. A
 * model only chosen in ENGINE is set up from the start, so it is agreed to and fetched.
 */
export function firstSetupStep(board: TranslateBoard, chosen = board.selectedModel): number {
  const model = board.models.find((m) => m.id === chosen)
  // A fetch under way, paused or failed: its progress, its error, RESUME and CANCEL are on FETCH.
  if (board.fetch) return 4
  const engine = board.engine.fetched || board.engine.source !== 'fetched'
  if (chosen === board.selectedModel && model?.installed && engine) return 5
  return 1
}

/** Bytes as Hugging Face writes them (1 GB = 10^9 bytes). */
export function formatBytes(bytes: number): string {
  if (bytes < 1e6) return `${Math.max(0, Math.round(bytes / 1e3))} KB`
  if (bytes < 1e9) return `${Math.round(bytes / 1e6)} MB`
  return `${(bytes / 1e9).toFixed(2)} GB`
}

/** "about 0:42 left" at the smoothed speed, or nothing before there is one. */
export function etaText(fetch: FetchView): string {
  if (fetch.speed <= 0 || fetch.phase !== 'downloading') return ''
  const left = Math.max(0, Math.round((fetch.total - fetch.received) / fetch.speed))
  return `about ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left`
}

export function fetchPercent(fetch: FetchView): number {
  return fetch.total > 0 ? Math.min(100, Math.floor((fetch.received / fetch.total) * 100)) : 0
}

export const FIT_WORD: Record<ModelFit, string> = {
  fits: 'fits',
  tight: 'tight',
  'too-big': 'too big',
}

/** Cells of the fit meter lit (of ten): how much of the model's want this PC meets. */
export function fitCells(model: ModelEntry, ramGB: number): number {
  return Math.max(1, Math.min(10, Math.round((ramGB / model.ramGB) * 5)))
}

export { modelFit }

/** The tiers in the order SETUP shows them, each with the quants the manifest has. */
export function tiers(
  models: readonly ModelEntry[],
): { params: string; tier: ModelEntry['tier']; entries: ModelEntry[] }[] {
  const order = ['lite', 'standard', 'pro', 'max'] as const
  return order
    .map((tier) => {
      const entries = models.filter((m) => m.tier === tier)
      return { tier, params: entries[0]?.params ?? '', entries }
    })
    .filter((group) => group.entries.length > 0)
}

export const TIER_NAME: Record<ModelEntry['tier'], string> = {
  lite: 'Lite',
  standard: 'Standard',
  pro: 'Pro',
  max: 'Max',
}

export const TIER_NOTE: Record<ModelEntry['tier'], string> = {
  lite: 'Fastest. Japanese and English hold up well even at this size.',
  standard: 'The balance of quality and speed for most PCs.',
  pro: 'Higher quality. Slow without a GPU of 8 GB.',
  max: 'The best quality. A workstation’s model.',
}

// ---------------------------------------------------------------------------
// TEXT (phase 2)
// ---------------------------------------------------------------------------

/** What the target side shows (§3): the blocks, or the state when there are none to show. */
export type TargetMode = 'nomodel' | 'empty' | 'boot' | 'fault' | 'blocks'

export function targetMode(board: TranslateBoard, run: RunView | null): TargetMode {
  const phase = board.engine.phase
  if (phase === 'absent' && run === null) return 'nomodel'
  if (run === null || run.blocks.length === 0) return 'empty'
  const nothingYet = run.blocks.every((block) => block.text === '')
  if (phase === 'starting' && nothingYet && run.state === 'running') return 'boot'
  if (phase === 'fault' && run.state === 'stopped' && nothingYet) return 'fault'
  return 'blocks'
}

/** A language's code as the pane writes it: upper case, `ja(easy)` as EASY JA. */
export function langCode(code: string): string {
  if (code === 'auto') return 'AUTO'
  if (code === EASY_JAPANESE) return 'EASY JA'
  return code.toUpperCase()
}

export function langName(code: string): string {
  if (code === 'auto') return 'detect'
  if (code === EASY_JAPANESE) return 'やさしい日本語'
  return LANGUAGES.find((language) => language.code === code)?.native ?? code
}

/** The spine's direction when nothing is drawn on it: `EN ▸ JA`. */
export function direction(src: string, tgt: string): string {
  return `${langCode(src)} ▸ ${langCode(tgt)}`
}

/**
 * Where a point of the source shown as blocks lies in the source text: past the blocks before it
 * and their leads, then `offset` into the block's own text (clamped to it). The caret is put
 * there when a click turns the blocks into the editor (§3, user's report 2026-11-06).
 */
export function sourceOffset(
  blocks: readonly { lead: string; source: string }[],
  index: number,
  offset: number,
): number {
  let at = 0
  for (const [i, block] of blocks.entries()) {
    at += block.lead.length
    if (i === index) return at + Math.max(0, Math.min(offset, block.source.length))
    at += block.source.length
  }
  return at
}

/** A block's number on the spine: 01, 02 … */
export function blockNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

/** A language picker's rows: the recent ones first, then the rest; filtered by code or name. */
export function pickerRows(
  side: 'src' | 'tgt',
  recent: readonly string[],
  filter: string,
): { group: 'recent' | 'all'; code: string; native: string; english: string }[] {
  const all = [
    ...(side === 'src' ? [{ code: 'auto', native: 'detect', english: 'Auto detect' }] : []),
    ...LANGUAGES.flatMap((language) =>
      side === 'tgt' && language.code === 'ja'
        ? [language, { code: EASY_JAPANESE, native: 'やさしい日本語', english: 'Easy Japanese' }]
        : [language],
    ),
  ]
  const needle = filter.trim().toLowerCase()
  const matches = (row: (typeof all)[number]): boolean =>
    needle === '' ||
    row.code.toLowerCase().includes(needle) ||
    row.native.toLowerCase().includes(needle) ||
    row.english.toLowerCase().includes(needle)
  const recentRows = recent
    .map((code) => all.find((row) => row.code === code))
    .filter((row): row is (typeof all)[number] => row !== undefined && matches(row))
    .map((row) => ({ group: 'recent' as const, ...row }))
  const rest = all
    .filter((row) => matches(row) && !recent.includes(row.code))
    .map((row) => ({ group: 'all' as const, ...row }))
  return [...recentRows, ...rest]
}

/** The recent languages after choosing one: it first, five at most. */
export function withRecent(recent: readonly string[], code: string): string[] {
  if (code === 'auto') return [...recent]
  return [code, ...recent.filter((c) => c !== code)].slice(0, 5)
}

/**
 * The languages swapped (§6.3): Easy Japanese comes back as Japanese, AUTO cannot be a target, so
 * a swap from AUTO is not offered (null) until the source is known (phase 3's detection).
 */
export function swapped(src: string, tgt: string): { src: string; tgt: string } | null {
  if (src === 'auto') return null
  return { src: asSource(tgt), tgt: src }
}

/** The translation as one text, laid out as the source was. */
export function targetText(run: RunView): string {
  return joinBlocks(
    run.blocks.map((block) => ({ lead: block.lead, text: block.text })),
    run.tail,
  )
}

/** What the source side's label says: the language, blocks and characters. */
export function sourceInfo(
  src: string,
  chars: number,
  blocks: number,
  detected: string | null = null,
): string {
  // On AUTO, "≈ EN" only when the letters make it certain (§6.5).
  const parts = [detected ? `${langCode(src)} ≈ ${langCode(detected)}` : langCode(src)]
  if (blocks > 0) parts.push(`${blocks} ${blocks === 1 ? 'block' : 'blocks'}`)
  parts.push(`${chars.toLocaleString('en-US')} ch`)
  return parts.join(' · ')
}

/** What the target side's label says while and after it is written. */
export function targetInfo(run: RunView | null): string {
  if (run === null) return ''
  const done = run.blocks.filter((block) => block.state === 'done').length
  const tokens = run.blocks.reduce((sum, block) => sum + (block.tokens ?? 0), 0)
  const ms = run.blocks.reduce((sum, block) => sum + (block.ms ?? 0), 0)
  const rate = ms > 0 ? ` · ${Math.round((tokens / ms) * 1000)} t/s` : ''
  switch (run.state) {
    case 'waiting':
      return 'waiting for another pane'
    case 'running':
      return `${done} / ${run.blocks.length}${rate}`
    case 'stopped':
      return `stopped at ${done} / ${run.blocks.length}`
    case 'done':
      return `${run.blocks.length} ${run.blocks.length === 1 ? 'block' : 'blocks'}${rate}`
  }
}

// ---------------------------------------------------------------------------
// HISTORY (phase 3)
// ---------------------------------------------------------------------------

/** An entry's languages as the list writes them: `EN → JA`, `AUTO → JA` when nothing was certain. */
export function historyPair(row: Pick<HistoryRow, 'srcLang' | 'detected' | 'tgtLang'>): string {
  const src = row.srcLang === 'auto' ? (row.detected ?? 'auto') : row.srcLang
  return `${langCode(src)} → ${langCode(row.tgtLang)}`
}

export function historyTime(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function dayLabel(at: number, now: number): string {
  const day = (t: number) => new Date(t).toDateString()
  if (day(at) === day(now)) return 'Today'
  if (day(at) === day(now - 86_400_000)) return 'Yesterday'
  const d = new Date(at)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The rows a filter keeps (either side, case ignored), under their days, newest first. */
export function historyDays(
  rows: readonly HistoryRow[],
  filter: string,
  now: number,
): { label: string; rows: HistoryRow[] }[] {
  const needle = filter.trim().toLowerCase()
  const kept = needle
    ? rows.filter(
        (row) =>
          row.source.toLowerCase().includes(needle) || row.target.toLowerCase().includes(needle),
      )
    : rows
  const days: { label: string; rows: HistoryRow[] }[] = []
  for (const row of kept) {
    const label = dayLabel(row.updatedAt, now)
    const last = days.at(-1)
    if (last?.label === label) last.rows.push(row)
    else days.push({ label, rows: [row] })
  }
  return days
}
