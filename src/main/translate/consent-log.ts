import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * The record of each agreement made in SETUP's LICENCE step (docs/translate.md §3, user's request
 * 2026-11-06): a plain text file beside engine.json, only ever added to, that a person can read
 * and keep. engine.json holds the latest consent per model for the app; this holds every one, with
 * what was shown and what was agreed to be fetched, as the evidence should a question come up.
 */

export const CONSENT_LOG = 'licence-consents.txt'

export interface ConsentRecord {
  /** When the agreement was made (ISO). */
  at: string
  appVersion: string
  model: { id: string; repo: string; revision: string; file: string; bytes: number; sha256: string }
  licence: { name: string; url: string; openedAt: string | null }
  /** What AGREE AND FETCH was agreed to fetch, one line each. */
  downloads: readonly string[]
}

/** One entry of the log, as it is written: a heading line, then indented fields. */
export function consentEntry(record: ConsentRecord): string {
  const { model, licence } = record
  return [
    `${record.at}  agreed  ${model.id}`,
    `  licence    ${licence.name}`,
    `             ${licence.url}`,
    `             opened from elecdex ${licence.openedAt ?? '(not opened for this agreement)'}`,
    '  agreed     I have read the licence on Preferred Networks’ site and will use the model under its terms.',
    '             I agree that elecdex downloads the files below to this PC.',
    `  model      ${model.repo}@${model.revision} ${model.file}`,
    `             ${model.bytes} bytes, sha256 ${model.sha256}`,
    ...record.downloads.map((line, i) => `${i === 0 ? '  downloads  ' : '             '}${line}`),
    `  elecdex    ${record.appVersion}`,
    '',
  ].join('\n')
}

/** An agreement that followed its file to a newer commit (docs/translate.md §5). */
export interface MoveRecord {
  at: string
  modelId: string
  from: string
  to: string
  sha256: string
  url: string
}

/**
 * A line for an agreement that followed its file: the repository moved on with the file unchanged
 * (the same sha256), so the file agreed to is fetched from the newer commit's address.
 */
export function moveEntry(record: MoveRecord): string {
  return [
    `${record.at}  moved   ${record.modelId}`,
    `  file       the same file, sha256 ${record.sha256}`,
    `  commit     ${record.from} -> ${record.to}`,
    `  downloads  ${record.url}`,
    '',
  ].join('\n')
}

/** Adds a move to the log, as `appendConsent` adds an agreement. */
export async function appendMove(root: string, record: MoveRecord): Promise<void> {
  await mkdir(root, { recursive: true })
  await appendFile(path.join(root, CONSENT_LOG), `${moveEntry(record)}\n`, 'utf8')
}

/** Adds an entry to the log in `root` (translate/), never rewriting what is there. */
export async function appendConsent(root: string, record: ConsentRecord): Promise<void> {
  await mkdir(root, { recursive: true })
  await appendFile(path.join(root, CONSENT_LOG), `${consentEntry(record)}\n`, 'utf8')
}
