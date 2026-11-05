import type { EnginePhase, EngineView, FetchView, TranslateBoard } from '@shared/translate/board'
import { type ModelEntry, type ModelFit, modelFit } from '@shared/translate/models'

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

/** The step SETUP opens on: READY when the engine and the model are in place, else the first. */
export function firstSetupStep(board: TranslateBoard): number {
  const model = board.models.find((m) => m.id === board.selectedModel)
  if (board.fetch && board.fetch.phase !== 'failed') return 4
  if (model?.installed && (board.engine.fetched || board.engine.source !== 'fetched')) return 5
  return 1
}

/** Whether the pane has what it needs to translate: a model in place and an engine to run it. */
export function canTranslate(board: TranslateBoard): boolean {
  return board.engine.phase !== 'absent'
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
