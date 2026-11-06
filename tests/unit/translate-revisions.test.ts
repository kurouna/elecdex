import { describe, expect, it } from 'vitest'
import {
  behind,
  CHECK_EVERY_MS,
  dueForCheck,
  inPlace,
  parseRevision,
  revisionUrl,
} from '../../src/shared/translate/revisions'

/**
 * Following the model repositories' newest commits (docs/translate.md §5, user decision
 * 2026-11-06): Hugging Face's answer read, the once-a-day check, a file in place recognised.
 */

const SHA = 'a'.repeat(64)
const COMMIT = 'd'.repeat(40)

describe('the newest commit, as Hugging Face says it', () => {
  it('asks the revision API with the files’ sizes and hashes', () => {
    expect(revisionUrl('https://huggingface.co/', 'pfnet/x-GGUF')).toBe(
      'https://huggingface.co/api/models/pfnet/x-GGUF/revision/main?blobs=true',
    )
  })

  it('keeps the commit, its date and the GGUF files stored as LFS', () => {
    const heard = parseRevision({
      sha: COMMIT,
      lastModified: '2026-11-06T00:49:00.000Z',
      siblings: [
        { rfilename: 'README.md', size: 10 },
        { rfilename: 'figures/a.png', lfs: { sha256: SHA, size: 5 } },
        { rfilename: 'm-Q4_0.gguf', lfs: { sha256: SHA, size: 547_539_584 } },
      ],
    })
    expect(heard).toEqual({
      revision: COMMIT,
      date: '2026-11-06T00:49:00.000Z',
      files: { 'm-Q4_0.gguf': { bytes: 547_539_584, sha256: SHA } },
    })
  })

  it('takes nothing that is not an answer', () => {
    expect(parseRevision(null)).toBeNull()
    expect(parseRevision({ sha: 'main', siblings: [] })).toBeNull()
    expect(
      parseRevision({
        sha: COMMIT,
        siblings: [{ rfilename: 'm.gguf', lfs: { sha256: 'x', size: 1 } }],
      }),
    ).toBeNull()
    expect(parseRevision({ sha: COMMIT, siblings: [] })?.date).toBeNull()
  })
})

describe('the once-a-day check', () => {
  const at = Date.parse('2026-11-06T00:00:00.000Z')
  it('asks when never asked, and a day after the last time, not before', () => {
    expect(dueForCheck(null, at)).toBe(true)
    expect(dueForCheck('2026-11-06T00:00:00.000Z', at + CHECK_EVERY_MS - 1)).toBe(false)
    expect(dueForCheck('2026-11-06T00:00:00.000Z', at + CHECK_EVERY_MS)).toBe(true)
  })

  it('is not put off for good by a clock set back, nor by a time it cannot read', () => {
    expect(dueForCheck('2026-11-06T00:00:00.000Z', at - 60_000)).toBe(false)
    expect(dueForCheck('2026-11-06T00:00:00.000Z', at - CHECK_EVERY_MS)).toBe(true)
    expect(dueForCheck('yesterday', at)).toBe(true)
  })
})

describe('a model in place', () => {
  const known = { revision: 'old', bytes: 100, sha256: SHA }
  const record = { revision: 'new', bytes: 120, sha256: SHA }

  it('is its record’s file when the size is that one’s', () => {
    expect(inPlace(record, known, 120)).toEqual(record)
    expect(inPlace(record, known, 100)).toBeNull()
  })

  it('is a first release, with no record, when the size is that release’s', () => {
    expect(inPlace(undefined, known, 100)).toEqual(known)
    expect(inPlace(undefined, known, 99)).toBeNull()
    expect(inPlace(undefined, known, 0)).toBeNull()
    expect(inPlace(undefined, known, null)).toBeNull()
  })

  it('is behind only when its file changed, whatever else a newer commit changed', () => {
    expect(behind(known, { sha256: 'b'.repeat(64) })).toBe(true)
    // A commit that left this file as it was (the README, another quant): nothing to fetch.
    expect(behind(known, { sha256: SHA })).toBe(false)
    expect(behind(known, undefined)).toBe(false)
    expect(behind(null, { sha256: 'b'.repeat(64) })).toBe(false)
  })
})
