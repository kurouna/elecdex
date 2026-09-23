import { spawn } from 'node:child_process'
import { existsSync, realpathSync, statSync, watch } from 'node:fs'
import { open as openFile, readFile as readFileBytes } from 'node:fs/promises'
import path from 'node:path'
import { CH } from '@shared/channels'
import {
  type GitRepoRef,
  type GitState,
  isCommitId,
  isRepoId,
  isRepoPath,
  openCommand,
  parseDiffRequest,
  parseLogRequest,
} from '@shared/git'
import { app, BrowserWindow, dialog, ipcMain, shell, type WebContents } from 'electron'
import { launchPlan, resolveOnPath, runsWhenOpened } from '../git/open.js'
import { RepoCatalog } from '../git/repos.js'
import { gitBytes, gitError, runGit } from '../git/run.js'
import { GitService, type Watch } from '../git/service.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'

/**
 * Git IPC: panes subscribe to a repository by id; main watches only those.
 *
 * Nothing happens until a git pane shows a repository: the service is created
 * on the first subscription. The page never names a folder - main opens the
 * picker, keeps the path in git-repos.json and hands back an id - and every
 * path it names later is checked against that repository (GitService.locate).
 */

type OpenResult = { ok: true } | { ok: false; message: string }

export function registerGitIpc(settings: SettingsHandle): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const catalog = new RepoCatalog(path.join(app.getPath('userData'), 'git-repos.json'))

  const publish = (state: GitState): void => {
    for (const sender of registry.subscribers(state.repoId)) {
      if (!sender.isDestroyed()) sender.send(CH.git.update, state)
    }
  }

  const service = new GitService({
    run: runGit,
    repo: (id) => catalog.get(id),
    watch: watchTree,
    exists: existsSync,
    readText,
    readBytes: async (file, max) => {
      try {
        if (statSync(file).size > max) return 'too-large'
        return await readFileBytes(file)
      } catch {
        return null
      }
    },
    gitBytes,
    realpath: (file) => {
      try {
        return realpathSync.native(file)
      } catch {
        return null
      }
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish,
  })

  const sync = (): void => {
    const active = new Set(registry.activeSources())
    for (const id of service.watching()) if (!active.has(id)) service.unwatch(id)
    for (const id of active) service.watch(id)
  }

  const track = (sender: WebContents): void => {
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) sync()
    }
    whenPageGoes(sender, registry, drop)
  }

  ipcMain.on(CH.git.subscribe, (event, raw: unknown) => {
    if (!isRepoId(raw)) return
    track(event.sender)
    const snapshot = service.snapshot(raw)
    // Before the first reading the page still learns which repository it is.
    event.sender.send(CH.git.update, { ...snapshot, repo: snapshot.repo ?? catalog.get(raw) })
    if (registry.subscribe(event.sender, raw)) {
      catalog.touch(raw, Date.now())
      sync()
    }
  })

  ipcMain.on(CH.git.unsubscribe, (event, raw: unknown) => {
    if (isRepoId(raw) && registry.unsubscribe(event.sender, raw)) sync()
  })

  ipcMain.handle(CH.git.pick, async (event) => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Watch a git repository',
      properties: ['openDirectory'],
      buttonLabel: 'Watch',
    }
    const picked = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options)
    const folder = picked.canceled ? undefined : picked.filePaths[0]
    if (folder === undefined) return null
    const top = await runGit(folder, ['rev-parse', '--show-toplevel'])
    if (top.missing) return { problem: 'git was not found on PATH' }
    if (!top.ok) return { problem: gitError(top) || 'that folder is not in a git repository' }
    return { repo: catalog.add(top.stdout.trim(), Date.now()) satisfies GitRepoRef }
  })

  ipcMain.handle(CH.git.recent, () => catalog.recent())

  ipcMain.handle(CH.git.diff, async (_event, raw: unknown) => {
    const request = parseDiffRequest(raw)
    // Null for what can never be a file of a repository; the page shows nothing for it.
    return request === null ? null : service.diff(request)
  })

  ipcMain.handle(CH.git.commit, async (_event, repoId: unknown, oid: unknown) =>
    isRepoId(repoId) && isCommitId(oid) ? service.commit(repoId, oid) : null,
  )

  ipcMain.handle(CH.git.log, async (_event, raw: unknown) => {
    const request = parseLogRequest(raw)
    return request === null ? null : service.log(request)
  })

  ipcMain.handle(
    CH.git.open,
    async (_event, repoId: unknown, file: unknown, line: unknown): Promise<OpenResult> => {
      if (!isRepoId(repoId) || !isRepoPath(file))
        return { ok: false, message: 'not a file of this repository' }
      const found = service.locate(repoId, file)
      if (found === null) return { ok: false, message: 'the file is not in the working tree' }
      const at = typeof line === 'number' && Number.isInteger(line) && line > 0 ? line : null
      const root = service.snapshot(repoId).repo?.path ?? path.dirname(found)
      return openWith(settings.current().git.openCommand, found, at, root)
    },
  )

  ipcMain.handle(CH.git.reveal, (_event, repoId: unknown, file: unknown) => {
    if (!isRepoId(repoId) || !isRepoPath(file)) return false
    const found = service.locate(repoId, file)
    if (found === null) return false
    shell.showItemInFolder(found)
    return true
  })

  ipcMain.handle(CH.git.watching, () => service.watching())

  return {
    dispose: () => {
      service.dispose()
      for (const channel of [CH.git.subscribe, CH.git.unsubscribe])
        ipcMain.removeAllListeners(channel)
      for (const channel of [
        CH.git.pick,
        CH.git.recent,
        CH.git.diff,
        CH.git.commit,
        CH.git.log,
        CH.git.open,
        CH.git.reveal,
        CH.git.watching,
      ]) {
        ipcMain.removeHandler(channel)
      }
    },
  }
}

/**
 * Watches a folder and everything in it. Windows and macOS watch a tree with
 * one handle; Linux has Node walk it and watch each folder.
 */
function watchTree(folder: string, onChange: (relative: string) => void): Watch | null {
  try {
    const watcher = watch(folder, { recursive: true, persistent: false }, (_event, name) => {
      onChange(typeof name === 'string' ? name : '')
    })
    // A folder deleted or made unreadable: one more reading, which says so.
    watcher.on('error', () => {
      watcher.close()
      onChange('.')
    })
    return watcher
  } catch {
    return null
  }
}

async function readText(file: string, max: number): Promise<string | 'too-large' | null> {
  try {
    if (statSync(file).size > max) return 'too-large'
    const handle = await openFile(file, 'r')
    try {
      return (await handle.readFile()).toString('utf8')
    } finally {
      await handle.close()
    }
  } catch {
    return null
  }
}

/** Opens a file with the user's command, or with the system's own application. */
async function openWith(
  template: string,
  file: string,
  line: number | null,
  root: string,
): Promise<OpenResult> {
  const command = openCommand(template, { file, line, dir: root })
  if (command === null) {
    if (runsWhenOpened(file, process.platform)) {
      shell.showItemInFolder(file)
      return { ok: false, message: 'it would run rather than open: shown in its folder instead' }
    }
    const error = await shell.openPath(file)
    return error === '' ? { ok: true } : { ok: false, message: error }
  }
  const plan = launchPlan(command.program, command.args, process.platform, (program) =>
    resolveOnPath(program, process.env),
  )
  if (plan.kind === 'refused') return { ok: false, message: plan.message }
  const child =
    plan.kind === 'cmd'
      ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', plan.line], {
          cwd: root,
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          windowsVerbatimArguments: true,
        })
      : spawn(plan.program, plan.args, { cwd: root, detached: true, stdio: 'ignore' })
  return new Promise((resolve) => {
    child.once('error', (error) =>
      resolve({ ok: false, message: `cannot start the command: ${error.message}` }),
    )
    child.once('spawn', () => {
      child.unref()
      resolve({ ok: true })
    })
  })
}
