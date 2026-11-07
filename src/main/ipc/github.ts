import path from 'node:path'
import { CH } from '@shared/channels'
import { repoName } from '@shared/github/derive'
import type { GithubBoard } from '@shared/github/types'
import { app } from 'electron'
import { z } from 'zod'
import { GithubService, type StarNotes } from '../github/service.js'
import { cacheFile } from '../store/cache-file.js'
import { openExternalIfSafe } from '../window.js'
import type { CloudShared } from './cloud.js'
import { cliVersion, cloudBoards } from './cloud-boards.js'
import { registerTable } from './table.js'

/**
 * GITHUB STATUS IPC (docs/github.md): pages subscribe to board keys while a pane is seen, and main
 * runs gh only for the keys somebody subscribes to. The page names nothing else: no host, no
 * URL, no argument. No plugin can reach any of it (plugin-api.ts has no GitHub).
 */

const StarFileSchema = z.record(z.string(), z.record(z.string(), z.number()))

/** The daily star counts of public repositories, 90 days each, in `github-stars.json` (§6). */
function starNotes(): StarNotes {
  const file = cacheFile(
    path.join(app.getPath('userData'), 'github-stars.json'),
    StarFileSchema,
    {},
  )
  let notes: Record<string, Record<string, number>> | null = null
  const load = () => {
    notes ??= file.load()
    return notes
  }
  return {
    note: (repo, day, stars) => {
      const all = load()
      const days = all[repo] ?? {}
      if (days[day] === stars) return
      const kept = Object.fromEntries(
        Object.entries({ ...days, [day]: stars })
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-90),
      )
      all[repo] = kept
      file.save(all)
    },
    history: (repo) => load()[repo] ?? {},
  }
}

export function registerGithubIpc(shared: CloudShared): { dispose: () => void } {
  const boards = cloudBoards<GithubBoard>(shared, 'github', CH.github.update, () => service)
  const service = new GithubService({
    cli: shared.cli,
    limit: shared.limit,
    stars: starNotes(),
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: boards.publish,
    incidents: () => shared.status.incidents('github'),
    ghVersion: cliVersion(shared, 'gh', /gh version ([\d.]+)/),
    executable: () => shared.executable('gh'),
  })
  shared.onIncidents.github = () => service.incidentsChanged()

  const unregister = registerTable({
    on: {
      [CH.github.subscribe]: (event, key) => boards.subscribe(event.sender, key),
      [CH.github.unsubscribe]: (event, key) => boards.unsubscribe(event.sender, key),
    },
    handle: {
      [CH.github.refresh]: (event, key) =>
        boards.holds(event.sender, key) ? service.refresh(key) : 0,
      [CH.github.detail]: (event, key, repo) =>
        boards.holds(event.sender, key) && repoName(repo) !== null
          ? service.detail(key, repo as string)
          : null,
      [CH.github.open]: async (event, key, id) => {
        if (!boards.holds(event.sender, key) || typeof id !== 'string') return false
        const url = service.urlOf(key, id)
        if (url === null) return false
        await openExternalIfSafe(url)
        return true
      },
      [CH.github.watching]: () => service.watching(),
    },
  })

  return {
    dispose: () => {
      shared.shown('github', false)
      service.dispose()
      unregister()
    },
  }
}
