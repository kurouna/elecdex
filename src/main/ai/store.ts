import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { AI_LIMITS, CHAT_ID, type Chat, ChatSchema, type ChatSummary, summaryOf } from '@shared/ai'
import {
  ELEC_LIMITS,
  SESSION_ID,
  type Session,
  SessionSchema,
  type SessionSummary,
  sessionSummaryOf,
} from '@shared/elec'
import type { z } from 'zod'
import { replaceFile } from '../store/replace-file.js'

/**
 * Records kept one JSON file each in a folder of userData: conversations
 * (chats/) and deliberations (elec/).
 *
 * One file per record rather than one file for all, unlike notes: an answer can
 * run to tens of kilobytes and a long conversation to megabytes, and finishing
 * one answer should rewrite that record, not every one. The list a pane shows is
 * read from the folder the first time a pane asks and kept in memory from then on.
 *
 * A file that does not parse is left where it is and simply not listed: it may
 * be a hand edit, or written by a newer build.
 */
interface FolderRecord {
  id: string
  updatedAt: number
}

interface FolderKind<T extends FolderRecord, S extends { updatedAt: number }> {
  schema: z.ZodType<T>
  /** Ids are checked against this before they name a file, so they cannot name another folder. */
  id: RegExp
  summaryOf(record: T): S
  /** Kept at most; a new one is refused past this rather than an old one dropped. */
  limit: number
}

export class FolderStore<T extends FolderRecord, S extends { updatedAt: number }> {
  private readonly dir: string
  private readonly kind: FolderKind<T, S>
  private summaries: Map<string, S> | null = null

  constructor(dir: string, kind: FolderKind<T, S>) {
    this.dir = dir
    this.kind = kind
  }

  /** Newest first. */
  list(): S[] {
    return [...this.index().values()].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  get(id: string): T | null {
    if (!this.kind.id.test(id)) return null
    return this.readFile(this.fileOf(id))
  }

  /** False when the record could not be kept: too many of them, or an id that is not one. */
  save(record: T): boolean {
    const parsed = this.kind.schema.safeParse(record)
    if (!parsed.success || !this.kind.id.test(parsed.data.id)) return false
    const index = this.index()
    if (!index.has(record.id) && index.size >= this.kind.limit) return false
    mkdirSync(this.dir, { recursive: true })
    const file = this.fileOf(record.id)
    const temp = `${file}.${process.pid}.tmp`
    writeFileSync(
      temp,
      `${JSON.stringify(parsed.data, null, 2)}
`,
      'utf8',
    )
    replaceFile(temp, file)
    index.set(record.id, this.kind.summaryOf(parsed.data))
    return true
  }

  remove(id: string): boolean {
    if (!this.kind.id.test(id) || !this.index().has(id)) return false
    rmSync(this.fileOf(id), { force: true })
    this.index().delete(id)
    return true
  }

  private fileOf(id: string): string {
    return path.join(this.dir, `${id}.json`)
  }

  private index(): Map<string, S> {
    if (this.summaries !== null) return this.summaries
    const found = new Map<string, S>()
    let names: string[] = []
    try {
      names = readdirSync(this.dir)
    } catch {
      // No folder yet: nothing kept.
    }
    for (const name of names) {
      if (!name.endsWith('.json') || !this.kind.id.test(name.slice(0, -5))) continue
      const record = this.readFile(path.join(this.dir, name))
      // A file renamed by hand must not answer to an id it does not carry.
      if (record !== null && `${record.id}.json` === name) {
        found.set(record.id, this.kind.summaryOf(record))
      }
    }
    this.summaries = found
    return found
  }

  private readFile(file: string): T | null {
    try {
      const parsed = this.kind.schema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }
}

/** Conversations of the chat pane, under userData/chats. */
export class ChatStore extends FolderStore<Chat, ChatSummary> {
  constructor(dir: string) {
    super(dir, { schema: ChatSchema, id: CHAT_ID, summaryOf, limit: AI_LIMITS.chats })
  }
}

/** Deliberations of the ELEC system pane, under userData/elec. */
export class SessionStore extends FolderStore<Session, SessionSummary> {
  constructor(dir: string) {
    super(dir, {
      schema: SessionSchema,
      id: SESSION_ID,
      summaryOf: sessionSummaryOf,
      limit: ELEC_LIMITS.sessions,
    })
  }
}
