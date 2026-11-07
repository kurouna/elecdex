import type { CliTool } from '@shared/cloud-cli/probe'
import type { WebContents } from 'electron'
import type { StatusSource } from '../cloud-cli/status.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import type { CloudShared } from './cloud.js'
import { whenPageGoes } from './page-gone.js'

/**
 * What the two CLI panes' IPC share (docs/cloud-cli.md): boards by key, subscribed while a pane
 * is seen and dropped when its page goes, the public status of the source following them, and
 * the CLI's version for the ledger's card.
 */

export interface BoardService<B> {
  watch(key: string): B | null
  unwatch(key: string): void
  watching(): string[]
}

export function cloudBoards<B extends { key: string }>(
  shared: CloudShared,
  source: StatusSource,
  update: string,
  service: () => BoardService<B>,
) {
  const registry = new SubscriptionRegistry<WebContents>()

  /** Stops the boards no page subscribes to any more, and the status with the last of them. */
  const sync = (): void => {
    const active = new Set(registry.activeSources())
    for (const entry of service().watching()) {
      const key = entry.slice('board:'.length)
      if (!active.has(key)) service().unwatch(key)
    }
    shared.shown(source, service().watching().length > 0)
  }

  return {
    publish: (board: B): void => {
      for (const page of registry.subscribers(board.key))
        if (!page.isDestroyed()) page.send(update, board)
    },
    /** Whether `sender` subscribes to `key`: every call but subscribe needs it. */
    holds: (sender: WebContents, key: unknown): key is string =>
      typeof key === 'string' && registry.subscribers(key).has(sender),
    subscribe: (sender: WebContents, key: unknown): void => {
      if (typeof key !== 'string') return
      const board = service().watch(key)
      if (board === null) return
      whenPageGoes(sender, registry, () => {
        if (registry.dropSubscriber(sender)) sync()
      })
      registry.subscribe(sender, key)
      shared.shown(source, true)
      sender.send(update, board)
    },
    unsubscribe: (sender: WebContents, key: unknown): void => {
      if (typeof key === 'string' && registry.unsubscribe(sender, key)) sync()
    },
  }
}

/**
 * The CLI's version, asked through the shared limit when first wanted, and again a minute after
 * a miss (a CLI installed while elecdex runs, or one that did not answer).
 */
export function cliVersion(
  shared: CloudShared,
  tool: CliTool,
  pattern: RegExp,
  now: () => number = Date.now,
): () => string | null {
  let version: string | null = null
  let askedAt = Number.NEGATIVE_INFINITY
  return () => {
    if (version === null && now() - askedAt >= 60_000) {
      askedAt = now()
      void shared
        .limit(() => shared.cli({ tool, argv: ['--version'] }))
        .then((result) => {
          version = pattern.exec(result.stdout)?.[1] ?? null
        })
    }
    return version
  }
}
