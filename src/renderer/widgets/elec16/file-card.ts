import { CODE_AREA } from '@shared/elec16/map'
import type { Elec16FileInfo } from '@shared/elec16-units'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What FILES' detail card says about a file (docs/elec16.md section 7): what the row has no
 * room for - what kind of file it is, its size to the byte, when it was saved or that it is
 * the SOFT CARD's, and what LOAD types for it. Pure.
 */

export type FileKind = 'listing' | 'code' | 'data'

/** A card name's kind, by its extension: .BAS a listing, .BIN machine code, the rest data. */
export function kindOf(name: string): FileKind {
  if (name.endsWith('.BAS')) return 'listing'
  if (name.endsWith('.BIN')) return 'code'
  return 'data'
}

const KIND_WORDS: Record<FileKind, string> = {
  listing: 'BASIC program',
  code: 'machine code',
  data: 'data file (OPEN, PRINT#, INPUT#)',
}

/** What LOAD ▸ types at BASIC's prompt for a file; null for a data file, which LOAD does not take. */
export function loadLine(name: string): string | null {
  const kind = kindOf(name)
  if (kind === 'data') return null
  return kind === 'code' ? `LOAD "${name}":CALL ${CODE_AREA}` : `LOAD "${name}"`
}

const two = (n: number): string => n.toString().padStart(2, '0')

function dateWords(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`
}

export function fileRows(file: Elec16FileInfo, soft: boolean): CardRow[] {
  const rows: CardRow[] = [
    { label: 'kind', value: KIND_WORDS[kindOf(file.name)] },
    { label: 'size', value: `${file.size.toLocaleString('en-US')} bytes` },
  ]
  if (soft) rows.push({ label: 'card', value: 'SOFT CARD · read only · SAVE keeps a copy' })
  else if (file.modified > 0) rows.push({ label: 'saved', value: dateWords(file.modified) })
  const line = loadLine(file.name)
  if (line !== null) rows.push({ label: 'load ▸', value: line, muted: true })
  return rows
}
