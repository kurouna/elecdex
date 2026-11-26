import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CH } from '@shared/channels'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The modules that read their file once, at start, and keep it in memory - notes, tasks, alarms
 * and settings - started on a file another program held open (EBUSY on Windows) and so held the
 * default in its place. Two faults then lost the user's file:
 *  - the store refused one write made from that default, then took the file for readable and let
 *    the next one through, which replaced the file whole (nothing reads it again: the lock going
 *    changes no time, so the watch says nothing);
 *  - a refused write had already changed what the module held, so the panes were shown, and
 *    went on from, a change that was never saved.
 */

const busy = vi.hoisted(() => ({ files: new Set<string>() }))

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>()
  const readFileSync = ((file: Parameters<typeof fs.readFileSync>[0], ...rest: unknown[]) => {
    if (typeof file === 'string' && busy.files.has(file)) {
      throw Object.assign(new Error(`EBUSY: resource busy or locked, open '${file}'`), {
        code: 'EBUSY',
      })
    }
    return (fs.readFileSync as (...args: unknown[]) => unknown)(file, ...rest)
  }) as typeof fs.readFileSync
  return { ...fs, default: { ...fs, readFileSync }, readFileSync }
})

const { handles, ipcMain } = await vi.hoisted(async () =>
  (await import('./support/electron-ipc')).fakeIpcMain(),
)

let userData = ''

vi.mock('electron', () => ({
  app: { getPath: () => userData, getVersion: () => '0.0.0' },
  ipcMain,
  BrowserWindow: { fromWebContents: () => null, getFocusedWindow: () => null },
  dialog: {},
  Notification: { isSupported: () => false },
  powerMonitor: { on: () => {}, off: () => {} },
  shell: { openPath: async () => '', showItemInFolder: () => {} },
}))

vi.mock('../../src/main/app-windows.js', () => ({ appWindows: () => [] }))

const { registerNotesIpc } = await import('../../src/main/ipc/notes.js')
const { registerTasksIpc } = await import('../../src/main/ipc/tasks.js')
const { registerAlarmsIpc } = await import('../../src/main/ipc/alarms.js')
const { registerSettingsIpc } = await import('../../src/main/ipc/settings.js')
const { unreadableFiles } = await import('../../src/main/store/unreadable-files.js')

const call = (channel: string, ...args: unknown[]): unknown => {
  const handler = handles.get(channel)
  if (handler === undefined) throw new Error(`no handler for ${channel}`)
  return handler({}, ...args)
}

const quietSettings = {
  current: () => ({ reminders: { system: false, leadMinutes: 0 } }),
  onChange: () => {},
  file: '',
  dispose() {},
}

interface Held {
  name: string
  file: string
  register(): { dispose: () => void }
  /** One change the user makes, the n-th. */
  change(n: number): void
  /** What the module holds now, as the page reads it. */
  shown(): string[]
  /** What is in the file on disk. */
  onDisk(): string[]
}

const read = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(userData, file), 'utf8'))

const MODULES: Held[] = [
  {
    name: 'notes',
    file: 'notes.json',
    register: registerNotesIpc,
    change: (n) => {
      const note = call(CH.notes.create) as { id: string } | null
      if (note !== null) call(CH.notes.save, note.id, `note ${n}`)
    },
    shown: () => (call(CH.notes.list) as { notes: { body: string }[] }).notes.map((x) => x.body),
    onDisk: () => (read('notes.json').notes as { body: string }[]).map((x) => x.body),
  },
  {
    name: 'tasks',
    file: 'tasks.json',
    register: () => registerTasksIpc(quietSettings as never),
    change: (n) => call(CH.tasks.add, { listId: 'tasks', title: `task ${n}` }),
    shown: () => (call(CH.tasks.list) as { tasks: { title: string }[] }).tasks.map((x) => x.title),
    onDisk: () => (read('tasks.json').tasks as { title: string }[]).map((x) => x.title),
  },
  {
    name: 'alarms',
    file: 'alarms.json',
    register: () => registerAlarmsIpc(quietSettings as never),
    change: (n) => call(CH.alarms.add, { label: `alarm ${n}`, hour: 7, minute: n }),
    shown: () =>
      (call(CH.alarms.list) as { alarms: { label: string }[] }).alarms.map((x) => x.label),
    onDisk: () => (read('alarms.json').alarms as { label: string }[]).map((x) => x.label),
  },
  {
    name: 'settings',
    file: 'settings.json',
    register: registerSettingsIpc,
    // The user's own choice is the theme; what follows changes the volume, so the theme the
    // user chose must still be there after it.
    change: (n) =>
      call(CH.settings.patch, n <= 2 ? { theme: `theme-${n}` } : { sound: { volume: n / 10 } }),
    shown: () => {
      const { theme, sound } = call(CH.settings.get) as { theme: string; sound: { volume: number } }
      return [theme, `volume ${sound.volume}`]
    },
    // The theme alone: the volume is meant to change.
    onDisk: () => [read('settings.json').theme as string],
  },
]

let root = ''
let running: { dispose: () => void } | null = null

beforeEach(() => {
  handles.clear()
  root = mkdtempSync(path.join(tmpdir(), 'elecdex-held-'))
  userData = path.join(root, 'userData')
  mkdirSync(userData, { recursive: true })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  running?.dispose()
  running = null
  busy.files.clear()
  vi.restoreAllMocks()
  rmSync(root, { recursive: true, force: true })
})

/** A run that leaves the user's own file behind, then a start with that file held open. */
function startOnHeldFile(module: Held): string[] {
  running = module.register()
  module.change(1)
  module.change(2)
  const mine = module.onDisk()
  running.dispose()
  handles.clear()
  busy.files.add(path.join(userData, module.file))
  running = module.register()
  return mine
}

describe.each(MODULES)('$name, started on a file another program holds open', (module) => {
  it('never replaces the file, however many changes follow once it is free', () => {
    const mine = startOnHeldFile(module)
    busy.files.clear()
    for (let n = 3; n <= 5; n += 1) tryChange(module, n)
    for (const kept of mine) expect(module.onDisk()).toContain(kept)
  })

  it('shows nothing that was not saved while the file cannot be written', () => {
    startOnHeldFile(module)
    const before = module.shown()
    expect(tryChange(module, 3)).toBe('refused')
    expect(module.shown()).toEqual(before)
  })

  it('takes the file in once it can be read, and the change after that is saved on top of it', () => {
    const mine = startOnHeldFile(module)
    busy.files.clear()
    tryChange(module, 3)
    for (const kept of mine) expect(module.shown()).toContain(kept)
    expect(tryChange(module, 4)).toBe('done')
    for (const kept of mine) expect(module.onDisk()).toContain(kept)
  })
})

/**
 * Nothing used to read the file again until the user changed something: the panes showed the
 * default (an empty notes pane, as if every note were gone) without a word, and the first change
 * after the file came free was refused to take the file in. Now the module reads it again by
 * itself, a little less often each time, and the page is told which file could not be read.
 */
describe.each(MODULES)('$name, read again by itself', (module) => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('takes the file in once it is free, with no change made, and the next change is saved', async () => {
    const mine = startOnHeldFile(module)
    busy.files.clear()
    await vi.advanceTimersByTimeAsync(60_000)
    for (const kept of mine) expect(module.shown()).toContain(kept)
    expect(tryChange(module, 3)).toBe('done')
    for (const kept of mine) expect(module.onDisk()).toContain(kept)
  })

  it('says the file could not be read while it cannot, and no longer once it has been', async () => {
    startOnHeldFile(module)
    expect(unreadableFiles.list()).toEqual([module.file])
    // Held for a long while: still tried, still said.
    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(unreadableFiles.list()).toEqual([module.file])
    busy.files.clear()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(unreadableFiles.list()).toEqual([])
  })

  it('settles the notice when a change takes the file in first', () => {
    startOnHeldFile(module)
    busy.files.clear()
    tryChange(module, 3)
    expect(unreadableFiles.list()).toEqual([])
  })

  it('stops trying, and says nothing more of the file, once the module is gone', () => {
    startOnHeldFile(module)
    running?.dispose()
    running = null
    expect(unreadableFiles.list()).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
  })
})

function tryChange(module: Held, n: number): 'done' | 'refused' {
  try {
    module.change(n)
    return 'done'
  } catch {
    return 'refused'
  }
}

/**
 * Two more files of the user's own read once and kept in memory, outside JsonStore: the AI
 * keys (ai-keys.json, which went through the cache helper, whose files are meant to be
 * replaced) and a plugin's stored data (plugin-data/<id>.json). Read while held open, each was
 * taken for empty, and the next change replaced the file: every other key, every other value.
 */
describe('files of the user held in memory outside the store', () => {
  it('an AI key stored while ai-keys.json cannot be read never takes the other keys with it', async () => {
    const { keyVaultOn, stubCodec } = await import('../../src/main/ai/keys.js')
    const file = path.join(userData, 'ai-keys.json')
    const first = keyVaultOn(file, stubCodec, [])
    first.set('openai', 'sk-one')
    first.set('anthropic', 'sk-two')
    busy.files.add(file)
    const held = keyVaultOn(file, stubCodec, [])
    expect(() => held.set('gemini', 'sk-three')).toThrow()
    busy.files.clear()
    // Once free: refused once more while the file is taken in, then stored beside the others.
    try {
      held.set('gemini', 'sk-three')
    } catch {
      held.set('gemini', 'sk-three')
    }
    const after = keyVaultOn(file, stubCodec, [])
    expect(after.get('openai')).toBe('sk-one')
    expect(after.get('anthropic')).toBe('sk-two')
    expect(after.get('gemini')).toBe('sk-three')
  })

  it("a plugin's change made while its file cannot be read never replaces what it stored", async () => {
    const { PluginStorage } = await import('../../src/main/plugins/storage.js')
    const dir = path.join(userData, 'plugin-data')
    const first = new PluginStorage(dir)
    first.set('pomodoro', 'kept', 'mine', false)
    first.flush()
    busy.files.add(path.join(dir, 'pomodoro.json'))
    const held = new PluginStorage(dir)
    // Not an empty store: the plugin would start on nothing and take it for what it had.
    expect(() => held.load('pomodoro')).toThrow(/could not be read/)
    expect(held.set('pomodoro', 'other', 1, false)).toBe(false)
    held.flush()
    busy.files.clear()
    expect(new PluginStorage(dir).load('pomodoro')).toEqual({ kept: 'mine' })
    // Free again, the same storage reads it, and a change lands beside what was kept.
    expect(held.load('pomodoro')).toEqual({ kept: 'mine' })
    expect(held.set('pomodoro', 'other', 1, false)).toBe(true)
    held.flush()
    expect(new PluginStorage(dir).load('pomodoro')).toEqual({ kept: 'mine', other: 1 })
  })
})

/**
 * What a module does to its file as it reads it, it does to the file it takes in after a failed
 * read as well, and a read of its own (a hand edit) settles the failed one.
 */
describe('a file taken in after a failed read', () => {
  it('tasks: given its default list, as at start, when the file has none', () => {
    const file = path.join(userData, 'tasks.json')
    writeFileSync(file, JSON.stringify({ version: 1, lists: [], tasks: [] }))
    busy.files.add(file)
    running = registerTasksIpc(quietSettings as never)
    busy.files.clear()
    expect(tryChange(MODULES[1] as Held, 1)).toBe('refused')
    const lists = (call(CH.tasks.list) as { lists: { id: string }[] }).lists
    expect(lists.map((list) => list.id)).toEqual(['tasks'])
    expect(tryChange(MODULES[1] as Held, 2)).toBe('done')
  })

  it('settings: a hand edit read while the file was failing lets the next change through', async () => {
    const file = path.join(userData, 'settings.json')
    writeFileSync(file, JSON.stringify({ theme: 'mine' }))
    busy.files.add(file)
    running = registerSettingsIpc()
    expect((call(CH.settings.get) as { theme: string }).theme).not.toBe('mine')
    busy.files.clear()
    writeFileSync(file, JSON.stringify({ theme: 'by-hand' }))
    await vi.waitFor(
      () => expect((call(CH.settings.get) as { theme: string }).theme).toBe('by-hand'),
      { timeout: 5000, interval: 50 },
    )
    // Read whole, by hand: the change made from it is the file's own, and is saved.
    expect(tryChange(MODULES[3] as Held, 3)).toBe('done')
    expect(read('settings.json').theme).toBe('by-hand')
  })
})
