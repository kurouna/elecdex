import { CARD_FILE_MAX, CARD_STATUS } from '../../../src/shared/elec16/card.js'
import { LINK_STATUS } from '../../../src/shared/elec16/link-services.js'

/**
 * The preload surface `window.elecdex` (src/shared/api.ts), for the IPC contract
 * (contracts/ipc.spec.ts; docs/e2e-design.md, section 3.2): every method that takes an argument
 * is called from the page with arguments main must refuse - wrong types, strings too long, ids
 * that are not ids, paths where an id belongs - and each row says how the refusal looks. A
 * method is here as a row, or in one of the lists below with why it is not called.
 * tests/unit/e2e-ipc-contract.test.ts holds this to api.ts, so a method added there and not here
 * fails before any e2e runs.
 *
 * Nothing here is valid-looking enough to act: no id is one main has, no path is inside a
 * repository it knows, no motion or question has words in it. Where the only way to call a
 * method is to let it act (start a shell, open main's own picker), it has a reason instead.
 */

/** A string of `n` characters, made in the page: too long for anything main keeps. */
export const big = (n: number) => ({ $str: n })

/** `n` zero bytes as a Uint8Array, made in the page. */
export const bytes = (n: number) => ({ $bytes: n })

/** How main refuses. */
export type Refusal =
  /** The call throws or its promise rejects. */
  | { rejects: true }
  /** It resolves to exactly this. */
  | { resolves: unknown }
  /** It resolves to something with these fields. */
  | { matches: Record<string, unknown> }
  /** It resolves to what this reader (no arguments) answers right after: nothing changed. */
  | { same: string }
  /** It is a message with no answer, or a listener: it may return or throw, and must change nothing the probe sees. */
  | { ignored: true }

/** What must read the same before and after a row: a reader with no arguments, and a field of its answer. */
export interface Probe {
  call: string
  pick?: string
}

export interface IpcRow {
  /** The method's path on `window.elecdex`. */
  method: string
  /** Lists of arguments to call it with, each to be refused; `big` and `bytes` are made in the page. */
  bad: unknown[][]
  refused: Refusal
  /** Read before and after every call of the row; must not change. */
  probe?: Probe
  /** A subscription: a handler is passed after the arguments, and what it returns is called to let go. */
  subscribes?: true
}

/** A method not called, and why. */
export interface IpcReason {
  method: string
  reason: string
}

/** Paths and ids that are none of main's. */
// Paths to nothing: a refusal that slipped must still find no program to run.
const WIN_PATH = 'C:\\elecdex-e2e-nowhere\\cmd.exe'
const UP = '../../../../etc/passwd'
const NOT_UUID = 'not-a-uuid'
const UUID_NONE = '00000000-0000-4000-8000-000000000000'
const REPO_NONE = '0123456789abcdef'

/** Methods that take no argument: there is nothing for main to refuse. */
export const NO_ARGUMENT = [
  'system.info',
  'system.machine',
  'system.toggleDevTools',
  'system.toggleFullscreen',
  'system.quit',
  'system.closeWindow',
  'system.minimize',
  'system.windowState',
  'background.state',
  'pty.list',
  'layout.load',
  'layout.reset',
  'layout.reveal',
  'layout.saved.list',
  'layout.saved.reveal',
  'metrics.stats',
  'fs.drives',
  'weather.offices',
  'weather.watching',
  'settings.get',
  'settings.openFile',
  'settings.startDirectory',
  'settings.chooseStartDirectory',
  'themes.list',
  'themes.reveal',
  'launcher.list',
  'markets.watching',
  'markets.charts',
  'feeds.watching',
  'clipboard.clear',
  'clipboard.watching',
  'snippets.list',
  'nowPlaying.art',
  'nowPlaying.watching',
  'docker.watching',
  'utility.awake.state',
  'utility.awake.extend',
  'chip8.list',
  'chip8.import',
  'elec16.soft',
  'elec16.games',
  'elec16.importGame',
  'elec16.devWatching',
  'git.pick',
  'git.recent',
  'git.watching',
  'logwatch.recent',
  'logwatch.watching',
  'orbits.watching',
  'agents.watching',
  'ai.providers',
  'ai.chats',
  'ai.create',
  'ai.active',
  'elec.sessions',
  'elec.active',
  'notes.list',
  'notes.create',
  'tasks.list',
  'alarms.list',
  'updates.status',
  'updates.check',
  'audio.restoreMonitor',
  'plugins.catalog',
  'plugins.openFolder',
  'plugins.install',
  'web.list',
  'web.focusWorkspace',
  'web.clearData',
]

/**
 * Methods whose one argument is the page's own handler: a listener on a channel main sends on,
 * or a board main keeps for every page alike. The page names nothing main could refuse.
 */
export const HANDLER_ONLY = [
  'system.onWindowState',
  'background.onChange',
  'background.onOpenSettings',
  'settings.onChange',
  'themes.onChange',
  'launcher.onChange',
  'clipboard.subscribe',
  'snippets.onChange',
  'nowPlaying.subscribe',
  'docker.subscribe',
  'utility.awake.onChange',
  'chip8.onChange',
  'elec16.onChange',
  'elec16.onFilesChange',
  'elec16.onGiveBack',
  'elec16.onGamesChange',
  'elec16.onDevChange',
  'logwatch.onExplained',
  'agents.subscribe',
  'ai.onProviders',
  'ai.onChats',
  'elec.onSessions',
  'quakes.subscribe',
  'quakes.observe',
  'quakes.onAlert',
  'notes.onChange',
  'tasks.onChange',
  'tasks.onRemind',
  'alarms.onChange',
  'alarms.onRing',
  'updates.onChange',
  'audio.spectrum',
  'audio.mixer',
  'plugins.onChange',
  'plugins.onSession',
  'web.onShortcut',
  'web.onFocused',
]

export const IPC_REASONS: IpcReason[] = [
  {
    method: 'pty.create',
    reason:
      'options main cannot use are dropped and a shell starts anyway (validateCreateOptions): there is no refusal to see, only a shell this contract would have to end',
  },
  {
    method: 'elec16.create',
    reason: 'a seed main cannot use is dropped and a unit is made from the defaults: no refusal',
  },
  {
    method: 'logwatch.pick',
    reason:
      "its one flag only chooses the picker's title; main opens its own picker whatever it is (logwatch.spec drives it)",
  },
  {
    method: 'web.onState',
    reason: 'a listener filtered in the preload by pane id: nothing reaches main',
  },
  {
    method: 'web.onSnapshot',
    reason: 'a listener filtered in the preload by pane id: nothing reaches main',
  },
]

const NOT_OPEN = { ok: false, problem: 'no folder is open' }

export const IPC_ROWS: IpcRow[] = [
  /* ---- system and background ---- */
  {
    method: 'system.openExternal',
    // Main's shell.openExternal is replaced by the spec and must never be reached.
    bad: [
      [123],
      ['file:///C:/elecdex-e2e-nowhere/calc.exe'],
      ['javascript:alert(1)'],
      [big(100_000)],
    ],
    refused: { ignored: true },
  },
  {
    method: 'system.setFullscreen',
    bad: [['yes'], [1], [null]],
    refused: { ignored: true },
    probe: { call: 'system.windowState' },
  },
  {
    method: 'system.setTitleBarColors',
    bad: [['red'], [{ background: 123, symbols: '#zzzzzz' }], [{ background: big(10_000) }]],
    refused: { ignored: true },
  },
  {
    method: 'background.setLaunchAtLogin',
    bad: [['yes'], [1]],
    refused: { same: 'background.state' },
  },
  {
    method: 'background.suspendShortcut',
    bad: [['yes'], [{}]],
    refused: { ignored: true },
    probe: { call: 'background.state' },
  },

  /* ---- shells ---- */
  {
    method: 'pty.attach',
    bad: [
      [NOT_UUID, {}],
      [UUID_NONE, {}],
      [123, {}],
      [WIN_PATH, {}],
    ],
    refused: { rejects: true },
  },
  {
    method: 'pty.write',
    bad: [
      [NOT_UUID, 'echo pwned\r'],
      [UUID_NONE, big(2_000_000)],
      [123, 456],
    ],
    refused: { ignored: true },
    probe: { call: 'pty.list' },
  },
  {
    method: 'pty.resize',
    bad: [
      [UUID_NONE, -1, 'x'],
      [123, 1e9, 1e9],
    ],
    refused: { ignored: true },
    probe: { call: 'pty.list' },
  },
  {
    method: 'pty.clearScrollback',
    bad: [[UUID_NONE], [123]],
    refused: { ignored: true },
    probe: { call: 'pty.list' },
  },
  {
    method: 'pty.dispose',
    bad: [[UUID_NONE], [NOT_UUID], [123]],
    refused: { resolves: undefined },
    probe: { call: 'pty.list' },
  },

  /* ---- layouts ---- */
  {
    method: 'layout.save',
    bad: [['x'], [null], [{ version: 99 }], [{ version: 1, root: WIN_PATH }]],
    refused: { same: 'layout.load' },
  },
  {
    method: 'layout.saved.save',
    bad: [
      [123, { version: 1, root: { kind: 'pane', id: 'a', widget: 'clock' } }],
      ['kept', 'not a tree'],
      ['kept', { version: 1, root: 123 }],
    ],
    refused: { same: 'layout.saved.list' },
  },
  {
    method: 'layout.saved.apply',
    bad: [['nope'], [UP], [123]],
    refused: { resolves: null },
    probe: { call: 'layout.load' },
  },
  {
    method: 'layout.saved.remove',
    bad: [['nope'], [123]],
    refused: { same: 'layout.saved.list' },
  },
  {
    method: 'layout.saved.rename',
    bad: [
      ['nope', 'x'],
      [123, 456],
      ['nope', big(100_000)],
    ],
    refused: { same: 'layout.saved.list' },
  },
  {
    method: 'layout.saved.move',
    bad: [
      ['nope', 1],
      [123, 'x'],
    ],
    refused: { same: 'layout.saved.list' },
  },
  {
    method: 'layout.saved.addPreset',
    bad: [['nope'], [123], [big(10_000)]],
    refused: { matches: { id: null } },
    probe: { call: 'layout.saved.list' },
  },
  {
    method: 'layout.saved.restorePreset',
    bad: [['nope'], [123]],
    refused: { same: 'layout.saved.list' },
  },

  /* ---- what main reads and fetches for the panes ---- */
  {
    method: 'metrics.subscribe',
    bad: [['nope'], [WIN_PATH], [123]],
    refused: { ignored: true },
    probe: { call: 'metrics.stats', pick: 'active' },
    subscribes: true,
  },
  {
    method: 'fs.readDir',
    bad: [['relative/folder'], [123], [big(100_000)]],
    refused: { resolves: { ok: false, error: 'EINVAL' } },
  },
  {
    method: 'fs.watch',
    bad: [['relative/folder'], [123]],
    refused: { ignored: true },
    subscribes: true,
  },
  {
    method: 'weather.subscribe',
    bad: [['nope'], [WIN_PATH], [123], [big(100_000)]],
    refused: { ignored: true },
    probe: { call: 'weather.watching' },
    subscribes: true,
  },
  {
    method: 'markets.subscribe',
    bad: [
      [123, 'x'],
      ['^N225', 'nope'],
      [big(10_000), '1d'],
    ],
    refused: { ignored: true },
    probe: { call: 'markets.watching' },
    subscribes: true,
  },
  {
    method: 'feeds.subscribe',
    bad: [['file:///C:/Windows/win.ini'], ['not a url'], [123]],
    refused: { ignored: true },
    probe: { call: 'feeds.watching' },
    subscribes: true,
  },
  {
    method: 'orbits.subscribe',
    bad: [['all'], [UP], [123]],
    refused: { ignored: true },
    probe: { call: 'orbits.watching' },
    subscribes: true,
  },
  {
    method: 'git.subscribe',
    bad: [[WIN_PATH], [UP], [123]],
    refused: { ignored: true },
    probe: { call: 'git.watching' },
    subscribes: true,
  },
  {
    method: 'logwatch.subscribe',
    bad: [['x'], [{ id: WIN_PATH, encoding: 'utf-8' }], [{ id: 123 }]],
    refused: { ignored: true },
    probe: { call: 'logwatch.watching' },
    subscribes: true,
  },

  /* ---- settings, themes, launcher ---- */
  {
    method: 'settings.patch',
    bad: [['x'], [null], [{ theme: 123 }], [{ terminal: { fontSize: 'big' } }]],
    refused: { same: 'settings.get' },
  },
  {
    method: 'launcher.icon',
    bad: [[123], [WIN_PATH], [big(100_000)]],
    refused: { resolves: null },
  },
  {
    method: 'launcher.launch',
    bad: [[123]],
    refused: { resolves: { ok: false, error: 'invalid id' } },
  },
  {
    method: 'launcher.launch',
    // A path is not an id: main launches only what its own catalog names (CLAUDE.md, Security).
    bad: [[WIN_PATH], ['C:\\elecdex-e2e-nowhere\\calc.exe'], ['/elecdex-e2e-nowhere/xterm']],
    refused: { resolves: { ok: false, error: 'not in the launcher' } },
  },

  /* ---- clipboard and snippets ---- */
  {
    method: 'clipboard.restore',
    bad: [['nope'], [123]],
    refused: { resolves: 'missing' },
  },
  {
    method: 'clipboard.remove',
    bad: [['nope'], [123]],
    refused: { ignored: true },
  },
  {
    method: 'clipboard.pause',
    bad: [['yes'], [1]],
    refused: { ignored: true },
    probe: { call: 'clipboard.watching' },
  },
  {
    method: 'snippets.fromClip',
    bad: [['nope'], [123]],
    refused: { resolves: { error: 'missing' } },
    probe: { call: 'snippets.list' },
  },
  {
    method: 'snippets.create',
    bad: [
      [123, 'text'],
      ['name', ''],
      ['name', 123],
      ['name', big(5_000_000)],
    ],
    refused: { resolves: { error: 'invalid' } },
    probe: { call: 'snippets.list' },
  },
  {
    method: 'snippets.read',
    bad: [['nope'], [123], [UP]],
    refused: { resolves: null },
  },
  {
    method: 'snippets.update',
    bad: [
      ['nope', { name: 'x' }],
      ['nope', 'x'],
      [123, { evil: true }],
    ],
    refused: { resolves: false },
  },
  {
    method: 'snippets.move',
    bad: [
      ['nope', 0],
      ['nope', 'x'],
    ],
    refused: { resolves: false },
  },
  {
    method: 'snippets.remove',
    bad: [['nope'], [123]],
    refused: { resolves: false },
  },
  {
    method: 'snippets.copy',
    bad: [['nope'], [123]],
    refused: { resolves: 'missing' },
  },

  /* ---- now playing, Docker, utility ---- */
  {
    method: 'nowPlaying.control',
    bad: [['volumeUp'], [123], ['next']],
    // Not subscribed: a page that shows no NOW PLAYING pane presses nothing, even a real button.
    refused: { resolves: 'unsupported' },
  },
  {
    method: 'nowPlaying.seek',
    bad: [['x'], [-1], [1e12]],
    refused: { resolves: 'unsupported' },
  },
  {
    method: 'docker.control',
    bad: [
      ['nope', 'remove'],
      ['abcdef123456', 'kill'],
      [123, 'start'],
      ['abcdef123456', 'start'],
    ],
    // Not subscribed: nothing is pressed for a page that shows no list.
    refused: { resolves: 'unsupported' },
  },
  {
    method: 'utility.awake.set',
    bad: [['x'], [{ level: 'forever' }], [{ level: 'system', forMs: -5 }]],
    refused: { same: 'utility.awake.state' },
    probe: { call: 'utility.awake.state' },
  },
  {
    method: 'utility.seal',
    bad: [[123], [''], [big(100_000)]],
    refused: { resolves: null },
  },
  {
    method: 'utility.unseal',
    bad: [['garbage'], [123], [big(100_000)]],
    refused: { resolves: null },
  },
  {
    method: 'utility.copy',
    bad: [['x'], [{ kind: 'text', text: 123 }], [{ kind: 'file', path: WIN_PATH }]],
    refused: { resolves: false },
  },

  /* ---- CHIP-8 ---- */
  {
    method: 'chip8.rom',
    bad: [['nope'], [UP], [123]],
    refused: { resolves: null },
  },
  {
    method: 'chip8.tune',
    bad: [
      ['nope', null],
      [UP, { speed: 1 }],
    ],
    refused: { resolves: false },
  },
  {
    method: 'chip8.favourite',
    bad: [
      ['nope', true],
      [123, 'yes'],
    ],
    refused: { resolves: false },
  },
  {
    method: 'chip8.update',
    bad: [
      ['nope', { title: 'x' }],
      [UP, 'x'],
    ],
    refused: { resolves: false },
  },
  {
    method: 'chip8.remove',
    bad: [['nope'], [UP]],
    refused: { resolves: false },
    probe: { call: 'chip8.list' },
  },
  {
    method: 'chip8.slots',
    bad: [['nope'], [UP]],
    refused: { resolves: [] },
  },
  {
    method: 'chip8.save',
    bad: [
      ['nope', 1, bytes(16)],
      [UP, UP, bytes(16)],
    ],
    refused: { resolves: null },
  },
  {
    method: 'chip8.load',
    bad: [
      ['nope', 1],
      [UP, UP],
    ],
    refused: { resolves: null },
  },

  /* ---- ELEC-16 ---- */
  {
    method: 'elec16.board',
    // A seed it cannot use is dropped: the board is the one a page with no seed gets.
    bad: [['x'], [{ clock: 'warp', model: 'nope' }]],
    refused: { same: 'elec16.board' },
  },
  {
    method: 'elec16.update',
    bad: [
      ['nope', { name: 'x' }],
      [UP, 'x'],
    ],
    refused: { resolves: null },
  },
  {
    method: 'elec16.remove',
    bad: [['nope'], [UP]],
    refused: { resolves: false },
  },
  {
    method: 'elec16.claim',
    bad: [
      ['nope', 'p'],
      ['nope', 123],
      ['nope', big(1000)],
    ],
    refused: { resolves: { ok: false } },
  },
  {
    method: 'elec16.moveHere',
    bad: [
      ['nope', 'p'],
      ['nope', 123],
    ],
    refused: { resolves: { ok: false } },
  },
  {
    method: 'elec16.release',
    bad: [
      ['nope', 'p', null],
      ['nope', 123, bytes(8)],
    ],
    refused: { resolves: false },
  },
  {
    method: 'elec16.save',
    bad: [
      ['nope', 'p', bytes(8)],
      ['nope', 123, 'x'],
    ],
    refused: { resolves: false },
  },
  {
    method: 'elec16.card',
    bad: [
      ['nope', 'p', { op: 'dir' }],
      ['nope', 123, 'x'],
    ],
    refused: { resolves: { status: CARD_STATUS.noCard } },
  },
  {
    method: 'elec16.link',
    bad: [
      ['nope', 'p', {}],
      [123, 'p', 'x'],
    ],
    refused: {
      resolves: { status: LINK_STATUS.failed, note: 'this pane does not run that unit' },
    },
  },
  {
    method: 'elec16.linkDrop',
    bad: [
      ['nope', 'p', 1],
      [123, 456, 'x'],
    ],
    refused: { ignored: true },
  },
  {
    method: 'elec16.files',
    bad: [['nope'], [UP]],
    refused: { resolves: [] },
  },
  {
    method: 'elec16.import',
    // An unknown unit is refused before main's picker opens (the spec catches any picker).
    bad: [['nope'], [123]],
    refused: { resolves: null },
  },
  {
    method: 'elec16.export',
    bad: [
      ['nope', 'A.BAS'],
      ['nope', UP],
    ],
    refused: { resolves: false },
  },
  {
    method: 'elec16.readFile',
    bad: [
      ['nope', 'A.BAS'],
      ['nope', UP],
      ['nope', 123],
    ],
    refused: { resolves: null },
  },
  {
    method: 'elec16.writeFile',
    bad: [
      [123, 'A.TS', bytes(4)],
      ['nope', UP, bytes(4)],
      ['nope', 'A.EXE', bytes(4)],
    ],
    refused: { resolves: CARD_STATUS.badName },
  },
  {
    method: 'elec16.writeFile',
    bad: [
      ['nope', 'A.TS', 'not bytes'],
      ['nope', 'A.TS', bytes(CARD_FILE_MAX + 1)],
    ],
    refused: { resolves: CARD_STATUS.full },
  },
  {
    method: 'elec16.writeFile',
    bad: [['nope', 'A.TS', bytes(4)]],
    refused: { resolves: CARD_STATUS.noCard },
  },
  {
    method: 'elec16.removeGame',
    bad: [['nope'], [UP], [123]],
    refused: { resolves: false },
    probe: { call: 'elec16.games' },
  },
  {
    method: 'elec16.insertGame',
    bad: [
      ['nope', 'p', 'nope'],
      ['nope', 123, null],
      ['nope', 'p', UP],
    ],
    refused: { resolves: null },
  },
  {
    method: 'elec16.gameImage',
    bad: [
      ['nope', 'p'],
      [123, 456],
    ],
    refused: { resolves: null },
  },
  {
    method: 'elec16.devOpen',
    // Only a pane id that is not one: a real one would open main's picker.
    bad: [[123], [''], [big(1000)]],
    refused: { resolves: null },
  },
  {
    method: 'elec16.devNew',
    bad: [[123], [''], [big(1000)]],
    refused: { resolves: null },
  },
  {
    method: 'elec16.devState',
    bad: [[123], ['p'], [big(1000)]],
    refused: { resolves: null },
  },
  {
    method: 'elec16.devRead',
    bad: [
      ['p', 1],
      [123, 'x'],
    ],
    refused: { resolves: NOT_OPEN },
  },
  {
    method: 'elec16.devWrite',
    bad: [
      ['p', 1, 'a', 'b'],
      [123, 'x', 1, 2],
    ],
    refused: { resolves: false },
  },
  {
    method: 'elec16.devInstall',
    bad: [
      ['p', 1, bytes(16)],
      [123, 'x', 'y'],
    ],
    refused: { resolves: NOT_OPEN },
    probe: { call: 'elec16.games' },
  },
  {
    method: 'elec16.devClose',
    bad: [[123], ['p']],
    refused: { resolves: undefined },
  },
  {
    method: 'elec16.devWatch',
    bad: [
      [123, true],
      ['p', true],
    ],
    refused: { ignored: true },
    probe: { call: 'elec16.devWatching' },
  },

  /* ---- git ---- */
  {
    method: 'git.diff',
    bad: [['x'], [{ repoId: REPO_NONE, path: UP }], [{ repoId: WIN_PATH }]],
    refused: { resolves: null },
  },
  {
    method: 'git.commit',
    bad: [
      [REPO_NONE, 'HEAD'],
      [WIN_PATH, 'deadbeef'],
      [123, 456],
    ],
    refused: { resolves: null },
  },
  {
    method: 'git.log',
    bad: [['x'], [{ repoId: REPO_NONE }], [{ repoId: WIN_PATH, count: 1e9 }]],
    refused: { resolves: null },
  },
  {
    method: 'git.open',
    bad: [
      [REPO_NONE, 'README.md', 1],
      [REPO_NONE, UP, 1],
      [WIN_PATH, WIN_PATH, null],
      [123, 456, 'x'],
    ],
    refused: { matches: { ok: false } },
  },
  {
    method: 'git.reveal',
    bad: [
      [REPO_NONE, 'README.md'],
      [REPO_NONE, UP],
      [WIN_PATH, WIN_PATH],
    ],
    refused: { resolves: false },
  },
  {
    method: 'git.sync',
    // Not a repository this page shows: refused before anything runs.
    bad: [
      [REPO_NONE, 'push'],
      [REPO_NONE, 'reset'],
      [WIN_PATH, 'fetch'],
    ],
    refused: { resolves: null },
  },

  /* ---- LOG WATCH ---- */
  {
    method: 'logwatch.describe',
    bad: [[WIN_PATH], [UP], [123]],
    refused: { resolves: null },
  },
  {
    method: 'logwatch.setFormat',
    bad: [
      ['nope', 'jsonl'],
      [WIN_PATH, 'evil'],
      [123, null],
    ],
    refused: { resolves: false },
  },
  {
    method: 'logwatch.preview',
    bad: [['x'], [{ id: WIN_PATH, encoding: 'utf-8', seqs: [1] }]],
    refused: { resolves: null },
  },
  {
    method: 'logwatch.explain',
    bad: [['x'], [{ id: 123 }]],
    refused: { resolves: { problem: 'not a line this pane shows' } },
  },
  {
    method: 'logwatch.cancelExplain',
    bad: [['nope'], [123]],
    refused: { ignored: true },
  },

  /* ---- AI AGENT, AI chat, ELEC ---- */
  {
    method: 'agents.diff',
    bad: [['x'], [{ session: UP, path: WIN_PATH }]],
    refused: { resolves: null },
  },
  {
    method: 'ai.setKey',
    // No provider of these ids: no key is kept.
    bad: [
      ['nope', 'sk-test'],
      [123, 'sk-test'],
      ['nope', 123],
    ],
    refused: { resolves: null },
    probe: { call: 'ai.providers' },
  },
  {
    method: 'ai.removeKey',
    bad: [[123], [UP]],
    refused: { resolves: undefined },
    probe: { call: 'ai.providers' },
  },
  {
    method: 'ai.models',
    // An id that is not one: refused before any provider is asked.
    bad: [[123], [UP]],
    refused: { resolves: { models: [], error: 'no such provider' } },
  },
  {
    method: 'ai.remove',
    bad: [[NOT_UUID], [UP], [123]],
    refused: { resolves: false },
  },
  {
    method: 'ai.export',
    bad: [[NOT_UUID], [UUID_NONE], [123]],
    refused: { resolves: null },
  },
  {
    method: 'ai.subscribe',
    bad: [[NOT_UUID], [UP], [123]],
    refused: { ignored: true },
    probe: { call: 'ai.active' },
    subscribes: true,
  },
  {
    method: 'ai.send',
    bad: [
      [NOT_UUID, { text: '' }],
      [UUID_NONE, 'x'],
      [123, null],
    ],
    refused: { resolves: { ok: false, error: 'not a valid request' } },
    probe: { call: 'ai.active' },
  },
  {
    method: 'ai.stop',
    bad: [[NOT_UUID], [123]],
    refused: { ignored: true },
  },
  {
    method: 'ai.attach',
    bad: [
      [NOT_UUID, { name: 'a.txt', bytes: bytes(4) }],
      [UUID_NONE, { name: WIN_PATH }],
      [UUID_NONE, { name: big(5000), bytes: bytes(4) }],
    ],
    refused: { matches: { ok: false, code: 'unreadable' } },
  },
  {
    method: 'ai.pending',
    bad: [[NOT_UUID], [123]],
    refused: { resolves: [] },
  },
  {
    method: 'ai.detach',
    bad: [
      [NOT_UUID, 'x'],
      [UUID_NONE, 123],
    ],
    refused: { resolves: [] },
  },
  {
    method: 'ai.discard',
    bad: [[NOT_UUID], [123]],
    refused: { resolves: undefined },
  },
  {
    method: 'ai.thumbs',
    bad: [[NOT_UUID], [UUID_NONE], [123]],
    refused: { resolves: {} },
  },
  {
    method: 'elec.submit',
    // No words: a motion with any would be put to the council.
    bad: [[123], [null], [{}]],
    refused: { resolves: { ok: false, error: 'there is no motion to put' } },
    probe: { call: 'elec.active' },
  },
  {
    method: 'elec.remove',
    bad: [[NOT_UUID], [UUID_NONE], [123]],
    refused: { resolves: false },
  },
  {
    method: 'elec.export',
    bad: [[NOT_UUID], [UUID_NONE], [123]],
    refused: { resolves: null },
  },
  {
    method: 'elec.subscribe',
    bad: [[NOT_UUID], [123]],
    refused: { ignored: true },
    probe: { call: 'elec.active' },
    subscribes: true,
  },
  {
    method: 'elec.stop',
    bad: [[NOT_UUID], [123]],
    refused: { ignored: true },
  },

  /* ---- desk ---- */
  {
    method: 'notes.save',
    bad: [
      ['nope', 'x'],
      [123, 'x'],
      ['nope', big(2_000_000)],
      ['nope', 123],
    ],
    refused: { resolves: null },
    probe: { call: 'notes.list' },
  },
  {
    method: 'notes.remove',
    bad: [['nope'], [123]],
    refused: { resolves: false },
    probe: { call: 'notes.list' },
  },
  {
    method: 'notes.export',
    bad: [['nope'], [123]],
    refused: { resolves: null },
  },
  {
    method: 'tasks.add',
    bad: [['x'], [{ title: 123 }], [{ listId: 'nope', title: big(100_000) }]],
    refused: { resolves: null },
    probe: { call: 'tasks.list' },
  },
  {
    method: 'tasks.update',
    bad: [
      ['nope', { title: 'x' }],
      [123, {}],
      ['nope', 'x'],
    ],
    refused: { resolves: null },
    probe: { call: 'tasks.list' },
  },
  {
    method: 'tasks.remove',
    bad: [['nope'], [123]],
    refused: { resolves: false },
  },
  {
    method: 'tasks.clearCompleted',
    bad: [[123], ['nope']],
    refused: { resolves: 0 },
    probe: { call: 'tasks.list' },
  },
  {
    method: 'tasks.addList',
    bad: [[123], ['   ']],
    refused: { resolves: null },
    probe: { call: 'tasks.list' },
  },
  {
    method: 'tasks.renameList',
    bad: [
      ['nope', 'x'],
      [123, 456],
    ],
    refused: { resolves: false },
  },
  {
    method: 'tasks.removeList',
    bad: [['nope'], [123]],
    refused: { resolves: false },
    probe: { call: 'tasks.list' },
  },
  {
    method: 'alarms.add',
    bad: [['x'], [{ hour: 99, minute: 0 }], [{ hour: 'seven' }]],
    refused: { resolves: null },
    probe: { call: 'alarms.list' },
  },
  {
    method: 'alarms.update',
    bad: [
      ['nope', { hour: 1 }],
      [123, {}],
    ],
    refused: { resolves: null },
  },
  {
    method: 'alarms.remove',
    bad: [['nope'], [123]],
    refused: { resolves: false },
  },

  /* ---- sound ---- */
  {
    method: 'audio.mixerCommand',
    // Not subscribed to the mixer: nothing is set, valid or not.
    bad: [['x'], [{ channel: 'master', volume: 9999 }]],
    refused: { ignored: true },
  },

  /* ---- plugins ---- */
  {
    method: 'plugins.fetch',
    bad: [
      [123, 'x', undefined],
      ['nope', big(3000), undefined],
    ],
    refused: { resolves: { ok: false, error: 'invalid request' } },
  },
  {
    method: 'plugins.fetch',
    // A plugin that is not granted anything: refused before any request (a closed local port anyway).
    bad: [['nope', 'http://127.0.0.1:9/', { cookie: 'x' }]],
    refused: { matches: { ok: false } },
  },
  {
    method: 'plugins.storageLoad',
    bad: [['nope'], [UP], [123]],
    refused: { resolves: {} },
  },
  {
    method: 'plugins.storageSet',
    bad: [
      ['nope', 'k', 1, false],
      [UP, UP, 1, false],
    ],
    refused: { resolves: false },
  },
  {
    method: 'plugins.signIn',
    // Not granted: no sign-in window opens.
    bad: [
      ['nope', '127.0.0.1'],
      [123, 456],
    ],
    refused: { resolves: undefined },
  },
  {
    method: 'plugins.signOut',
    bad: [[123], [UP]],
    refused: { resolves: undefined },
  },
  {
    method: 'plugins.closeSignIn',
    bad: [[123], [UP]],
    refused: { ignored: true },
  },
  {
    method: 'plugins.notify',
    bad: [
      ['nope', { title: 'x' }],
      [123, 'x'],
    ],
    refused: { ignored: true },
  },
  {
    method: 'plugins.forget',
    bad: [[123], [UP]],
    refused: { resolves: undefined },
  },

  /* ---- web panes ---- */
  {
    method: 'web.open',
    // An id or claim that is not one, or a widget that is no preset: no view is made.
    bad: [
      [123, 'c', 'youtube', null],
      ['p', 123, 'youtube', null],
      ['p', 'c', 'nope', 'file:///C:/Windows/win.ini'],
      ['p', 'c', 'web:nope', null],
    ],
    refused: { resolves: null },
    probe: { call: 'web.list' },
  },
  {
    method: 'web.show',
    bad: [
      [123, 'c', {}],
      ['nope', 'c', 'x'],
    ],
    refused: { ignored: true },
    probe: { call: 'web.list' },
  },
  {
    method: 'web.hide',
    bad: [
      [123, 'c', true],
      ['p', 123, true],
    ],
    refused: { resolves: null },
  },
  {
    method: 'web.command',
    bad: [
      [123, 'x'],
      ['nope', { t: 'navigate', url: 'file:///C:/' }],
    ],
    refused: { ignored: true },
    probe: { call: 'web.list' },
  },
  {
    method: 'web.close',
    bad: [
      [123, null],
      ['nope', 123],
    ],
    refused: { ignored: true },
    probe: { call: 'web.list' },
  },
  {
    method: 'web.setAppearance',
    bad: [['x'], [{ colorScheme: 123 }]],
    refused: { ignored: true },
  },
  {
    method: 'web.focus',
    bad: [[123], ['nope']],
    refused: { ignored: true },
  },
  {
    method: 'web.leaveToPage',
    bad: [['x'], [[123]]],
    refused: { ignored: true },
  },
]
