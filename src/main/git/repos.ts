import { randomBytes } from 'node:crypto'
import path from 'node:path'
import type { GitRepoRef } from '@shared/git'
import { z } from 'zod'
import { JsonStore } from '../store/json-store.js'

/**
 * The repositories git panes have been pointed at, in git-repos.json.
 *
 * A pane keeps only an id in its state, so a layout never carries a path: the
 * path is this machine's, and the page never hands one back. Opened on another
 * machine, the id is simply unknown and the pane asks for a folder again.
 */

const RepoSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{16}$/),
  path: z.string().min(1).max(4096),
  name: z.string().max(260),
  lastUsed: z.number(),
})

const FileSchema = z.object({
  version: z.literal(1).default(1),
  repos: z.array(RepoSchema).catch([]).default([]),
})

type Repo = z.infer<typeof RepoSchema>

/** Enough to switch between a working day's repositories without scrolling. */
const KEEP = 30

const samePath = (a: string, b: string): boolean =>
  process.platform === 'win32' || process.platform === 'darwin'
    ? a.toLowerCase() === b.toLowerCase()
    : a === b

export class RepoCatalog {
  private readonly store: JsonStore<z.infer<typeof FileSchema>>

  constructor(file: string) {
    this.store = new JsonStore({
      file,
      schema: FileSchema,
      makeDefault: () => ({ version: 1, repos: [] }),
    })
  }

  get(id: string): GitRepoRef | null {
    const repo = this.store.read().repos.find((entry) => entry.id === id)
    return repo === undefined ? null : ref(repo)
  }

  /** Most recently used first. */
  recent(): GitRepoRef[] {
    return [...this.store.read().repos].sort((a, b) => b.lastUsed - a.lastUsed).map(ref)
  }

  /** Adds the repository at `top` (git's top folder), or finds it; either way it is used now. */
  add(top: string, now: number): GitRepoRef {
    const full = path.resolve(top)
    const file = this.store.read()
    const found = file.repos.find((entry) => samePath(entry.path, full))
    const repo: Repo = found
      ? { ...found, lastUsed: now }
      : { id: randomBytes(8).toString('hex'), path: full, name: path.basename(full), lastUsed: now }
    const others = file.repos.filter((entry) => entry.id !== repo.id)
    const kept = [repo, ...others.sort((a, b) => b.lastUsed - a.lastUsed)].slice(0, KEEP)
    this.store.write({ version: 1, repos: kept })
    return ref(repo)
  }

  /** Marks a repository used, so the recent list follows what the panes show. */
  touch(id: string, now: number): void {
    const file = this.store.read()
    if (!file.repos.some((entry) => entry.id === id)) return
    // Already the most recent: the list's order would not change, so the file is not written.
    const latest = file.repos.reduce((a, b) => (b.lastUsed > a.lastUsed ? b : a))
    if (latest.id === id) return
    this.store.write({
      version: 1,
      repos: file.repos.map((entry) => (entry.id === id ? { ...entry, lastUsed: now } : entry)),
    })
  }
}

const ref = (repo: Repo): GitRepoRef => ({ id: repo.id, name: repo.name, path: repo.path })
