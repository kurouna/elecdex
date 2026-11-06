import { z } from 'zod'

/**
 * The model files' revisions (docs/translate.md §5, user decision 2026-11-06): not pinned. A model
 * is fetched at the newest commit of its repository, found when the licence is agreed to, and
 * checked against the size and sha256 Hugging Face gives for that commit. ENGINE asks again for the
 * models in place at most once a day, and offers UPDATE when a newer commit came out.
 */

/** One file at one commit: what is fetched, and what it is checked against. */
export interface RemoteFile {
  revision: string
  bytes: number
  sha256: string
}

/** A repository's newest commit, and its files' sizes and sha256 (the GGUF files only). */
export interface RepoRevision {
  revision: string
  /** When the commit came out, as Hugging Face says it; null when it did not say. */
  date: string | null
  files: Record<string, { bytes: number; sha256: string }>
}

/** The newest commit of a repository, with the files' sizes and hashes (Hugging Face's API). */
export function revisionUrl(base: string, repo: string): string {
  return `${base.replace(/\/+$/, '')}/api/models/${repo}/revision/main?blobs=true`
}

const RevisionAnswerSchema = z.object({
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  lastModified: z.string().max(40).optional(),
  siblings: z
    .array(
      z.object({
        rfilename: z.string().max(300),
        lfs: z
          .object({
            sha256: z.string().regex(/^[0-9a-f]{64}$/),
            size: z.number().int().positive(),
          })
          .optional(),
      }),
    )
    .max(500),
})

/** Hugging Face's answer read for what elecdex needs, or null when it is not one. */
export function parseRevision(raw: unknown): RepoRevision | null {
  const parsed = RevisionAnswerSchema.safeParse(raw)
  if (!parsed.success) return null
  const files: RepoRevision['files'] = {}
  for (const sibling of parsed.data.siblings) {
    if (sibling.lfs && sibling.rfilename.endsWith('.gguf')) {
      files[sibling.rfilename] = { bytes: sibling.lfs.size, sha256: sibling.lfs.sha256 }
    }
  }
  return { revision: parsed.data.sha, date: parsed.data.lastModified ?? null, files }
}

/** ENGINE asks for newer commits at most this often (user's request 2026-11-06). */
export const CHECK_EVERY_MS = 24 * 60 * 60 * 1000

/**
 * Whether ENGINE may ask again: never asked, or a day since. A clock set back by more than a day
 * counts as a day gone too, so a check is never put off for good.
 */
export function dueForCheck(checkedAt: string | null, now: number): boolean {
  if (checkedAt === null) return true
  const at = Date.parse(checkedAt)
  return Number.isNaN(at) || Math.abs(now - at) >= CHECK_EVERY_MS
}

/**
 * The file a model has in place: the one its record names, when the file on disk is that size;
 * or, with no record, a release elecdex knew when it was made (`known`), when the size is that
 * one's (a model fetched before revisions were followed). Null when nothing usable is there.
 */
export function inPlace(
  record: RemoteFile | undefined,
  known: RemoteFile,
  size: number | null,
): RemoteFile | null {
  if (size === null) return null
  if (record) return size === record.bytes ? record : null
  return size === known.bytes ? known : null
}

/**
 * Whether a model in place is behind its file at the repository's newest commit: by the file's
 * sha256, never the commit, since a commit that leaves this file as it was (another quant, the
 * README) is no reason to fetch gigabytes again.
 */
export function behind(
  installed: RemoteFile | null,
  newest: { sha256: string } | undefined,
): boolean {
  return installed !== null && newest !== undefined && newest.sha256 !== installed.sha256
}
