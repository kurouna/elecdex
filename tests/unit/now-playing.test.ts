import { readFileSync } from 'node:fs'
import {
  appLabel,
  artUrl,
  cutText,
  ELECDEX_APP_ID,
  EMPTY_NOW_PLAYING,
  formatClock,
  isOwnApp,
  MAX_ART_BASE64,
  MAX_TEXT_CHARS,
  NOW_PLAYING_LINGER_MS,
  NOW_PLAYING_PERIOD_MS,
  type NowPlaying,
  nextBoundary,
  positionNow,
  readSession,
  SEEK_HOLD_MS,
  sameSession,
  seekTarget,
  shownPosition,
  statusWord,
} from '@shared/now-playing'
import { describe, expect, it } from 'vitest'
import { stubNowPlaying } from '../../src/main/media/stub.js'
import {
  type NowPlayingBackend,
  type NowPlayingReading,
  NowPlayingWatcher,
  type ReaderArt,
} from '../../src/main/media/watcher.js'
import { NOW_PLAYING_SCRIPT, parseReaderLine } from '../../src/main/media/windows.js'
import { nowPlayingRows } from '../../src/renderer/widgets/nowplaying/card.js'

const JPEG = '/9j/4AAQSkZJRgABAQEAYABgAAD'
const LARGE = '/9j/LARGEArtOfTheTrack'

const raw = (over: Record<string, unknown> = {}) => ({
  app: 'Spotify.exe',
  title: 'Track',
  artist: 'Artist',
  album: 'Album',
  status: 'Playing',
  rate: 1,
  position: 30,
  start: 0,
  end: 200,
  at: 1_000_000,
  playPause: true,
  next: true,
  previous: false,
  others: 0,
  ...over,
})

describe('reading a session', () => {
  it('checks every field, and cuts what the page draws', () => {
    const s = readSession(raw({ title: `  ${'あ'.repeat(300)}\n` }), null, 1_000_500)
    expect(s?.app).toBe('Spotify')
    expect([...(s?.title ?? '')]).toHaveLength(MAX_TEXT_CHARS)
    expect(s?.title?.endsWith('…')).toBe(true)
    expect(s?.status).toBe('playing')
    expect(s?.duration).toBe(200)
    expect(s?.position).toBe(30)
    expect(s?.positionAt).toBe(1_000_000)
    expect(s?.controls).toEqual({ playPause: true, next: true, previous: false, seek: false })
  })

  it('is null for what is not a session', () => {
    expect(readSession(null, null, 0)).toBeNull()
    expect(readSession('Track', null, 0)).toBeNull()
  })

  it('leaves out what cannot be read rather than guessing it', () => {
    const s = readSession(
      raw({
        title: '',
        artist: 42,
        album: null,
        end: 0,
        position: 'x',
        status: 'Weird',
        rate: null,
      }),
      null,
      5,
    )
    expect(s?.title).toBeNull()
    expect(s?.artist).toBeNull()
    expect(s?.album).toBeNull()
    expect(s?.duration).toBeNull()
    expect(s?.position).toBeNull()
    expect(s?.status).toBe('unknown')
    expect(s?.rate).toBe(1)
  })

  it('counts the position from the timeline start, and never past the end', () => {
    expect(readSession(raw({ start: 10, end: 110, position: 40 }), null, 0)?.position).toBe(30)
    expect(readSession(raw({ position: 500 }), null, 0)?.position).toBe(200)
    expect(readSession(raw({ position: -3 }), null, 0)?.position).toBe(0)
  })

  it("does not believe a player's clock that is years off", () => {
    // DateTimeOffset.MinValue, as some players report an unset time.
    const s = readSession(raw({ at: -62_135_596_800_000 }), null, 1_790_000_000_000)
    expect(s?.positionAt).toBe(1_790_000_000_000)
  })

  it('takes out control characters a player leaves in a title', () => {
    expect(cutText('a\u0000b\u200Bc\td')).toBe('a b c d')
    expect(cutText('   ')).toBeNull()
  })

  it("names elecdex's own session elecdex, in whatever case Windows reports it", () => {
    // A YouTube (TV) pane playing was shown as DEV.KUROUNA.ELECDEX.
    expect(readSession(raw({ app: 'DEV.KUROUNA.ELECDEX' }), null, 0)?.app).toBe('elecdex')
    expect(appLabel(ELECDEX_APP_ID)).toBe('elecdex')
    expect(isOwnApp(' Dev.Kurouna.Elecdex ')).toBe(true)
    expect(isOwnApp('dev.kurouna.elecdex.other')).toBe(false)
    expect(appLabel('Contoso.Elecdex_abc123!App')).toBe('Elecdex')
  })

  it('is the id main gives the app and the package is built with', () => {
    expect(readFileSync('src/main/index.ts', 'utf8')).toMatch(/setAppUserModelId\(ELECDEX_APP_ID\)/)
    expect(readFileSync('electron-builder.yml', 'utf8').split(/\r?\n/)).toContain(
      `appId: ${ELECDEX_APP_ID}`,
    )
  })

  it('names applications by what people call them', () => {
    expect(appLabel('Spotify.exe')).toBe('Spotify')
    expect(appLabel('chrome')).toBe('Chrome')
    expect(appLabel('MSEdge')).toBe('Edge')
    expect(appLabel('308046B0AF4A39CB')).toBe('Firefox')
    expect(appLabel('Microsoft.ZuneMusic_8wekyb3d8bbwe!Microsoft.ZuneMusic')).toBe('Media Player')
    expect(appLabel('Contoso.Radio_abc123xyz!App')).toBe('Radio')
    expect(appLabel('C:\\Tools\\player.exe')).toBe('player')
  })
})

describe('the art', () => {
  it('becomes a data URL only when it is a JPEG of a sensible size', () => {
    expect(artUrl(JPEG)).toBe(`data:image/jpeg;base64,${JPEG}`)
    expect(artUrl(null)).toBeNull()
    expect(artUrl('')).toBeNull()
    expect(artUrl('iVBORw0KGgo=')).toBeNull()
    expect(artUrl(`${JPEG}"><script>`)).toBeNull()
    expect(artUrl(`/9j/${'A'.repeat(MAX_ART_BASE64)}`)).toBeNull()
  })
})

describe('the position between readings', () => {
  const session = readSession(raw({ position: 30, end: 200, at: 1_000_000 }), null, 1_000_000)
  if (session === null) throw new Error('no session')

  it('counts on from the last report while playing, at the rate', () => {
    expect(positionNow(session, 1_010_000)).toBe(40)
    expect(positionNow({ ...session, rate: 2 }, 1_010_000)).toBe(50)
  })

  it('holds while paused, and never passes the end', () => {
    expect(positionNow({ ...session, status: 'paused' }, 1_050_000)).toBe(30)
    expect(positionNow(session, 9_000_000)).toBe(200)
    expect(positionNow({ ...session, position: null }, 1_010_000)).toBeNull()
  })

  it('writes times as a player does', () => {
    expect(formatClock(84.9)).toBe('1:24')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(3729)).toBe('1:02:09')
  })
})

describe('the state word', () => {
  const s = readSession(raw(), null, 0)
  it('says what the lamp shows', () => {
    const with_ = (over: Partial<NowPlaying>): NowPlaying => ({ ...EMPTY_NOW_PLAYING, ...over })
    expect(statusWord(with_({ support: 'none' }))).toBe('UNSUPPORTED')
    expect(statusWord(with_({ watching: true }))).toBe('NO SESSION')
    expect(statusWord(with_({}))).toBe('STANDBY')
    expect(statusWord(with_({ session: s }))).toBe('PLAYING')
    if (s) expect(statusWord(with_({ session: { ...s, status: 'paused' } }))).toBe('PAUSED')
  })
})

describe("the reader's lines", () => {
  it('reads a session, its art at both sizes, and whether a press was taken', () => {
    expect(parseReaderLine('{"session":null}')).toEqual({ session: null })
    const art = { small: JPEG, large: LARGE, width: 600, height: 400 }
    expect(parseReaderLine(JSON.stringify({ session: { title: 'x' }, art, done: false }))).toEqual({
      session: { title: 'x' },
      art,
      done: false,
    })
    // An art that is not the reader's shape is none.
    expect(parseReaderLine(`{"session":{},"art":"${JPEG}"}`)).toEqual({ session: {}, art: null })
    // Art null means "none", said once; no art key means "the same as before".
    expect(parseReaderLine('{"session":{},"art":null}')).toEqual({ session: {}, art: null })
  })

  it('turns an error line into a failure', () => {
    expect(() => parseReaderLine('{"error":"boom"}')).toThrow(/boom/)
  })
})

describe('the Windows reader', () => {
  const source = readFileSync('src/main/media/windows.ts', 'utf8')

  it('is handed its script in the environment, not on the command line', () => {
    // Windows scans a new process's command line while spawn holds main (CLAUDE.md).
    expect(source).toMatch(/powerShellStart\(NOW_PLAYING_SCRIPT/)
    expect(source).not.toMatch(/'-Command',\s*NOW_PLAYING_SCRIPT/)
  })

  it('presses only the three buttons and the position, and never touches the volume', () => {
    expect(NOW_PLAYING_SCRIPT).toMatch(/TryTogglePlayPauseAsync/)
    expect(NOW_PLAYING_SCRIPT).toMatch(/TrySkipNextAsync/)
    expect(NOW_PLAYING_SCRIPT).toMatch(/TrySkipPreviousAsync/)
    expect(NOW_PLAYING_SCRIPT).toMatch(/TryChangePlaybackPositionAsync/)
    expect(NOW_PLAYING_SCRIPT.replaceAll('TryChangePlaybackPositionAsync', '')).not.toMatch(
      /TryChange|TryStop|TryRecord|TryFastForward|TryRewind|Volume|Shuffle|AutoRepeat/i,
    )
  })

  it('writes nothing to disk', () => {
    expect(NOW_PLAYING_SCRIPT).not.toMatch(/Out-File|Set-Content|WriteAll|\.Save\(\s*['"$]\w*path/i)
  })
})

/** A watcher on a fake clock and a fake reader, whose timers are run by hand. */
function rig(backend: NowPlayingBackend | null = fakeReader().backend, start = 10_100) {
  let now = start
  const timers = new Map<number, { at: number; fn: () => void }>()
  let nextTimer = 1
  const states: NowPlaying[] = []
  const watcher = new NowPlayingWatcher({
    backend,
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextTimer++
      timers.set(id, { at: now + ms, fn })
      return id
    },
    clearTimer: (id) => {
      timers.delete(id as number)
    },
    publish: (state) => states.push(state),
  })
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  }
  return {
    watcher,
    states,
    timers,
    flush,
    last: () => states.at(-1),
    async advance(ms: number) {
      await flush()
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined || due[1].at > end) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
        await flush()
      }
      now = end
      await flush()
    },
    now: () => now,
  }
}

function fakeReader() {
  let session: unknown = raw()
  const both = (small: string | null): ReaderArt | null =>
    small === null ? null : { small, large: LARGE, width: 600, height: 400 }
  let art: ReaderArt | null | undefined = both(JPEG)
  const readAt: number[] = []
  const presses: string[] = []
  let closed = 0
  let hold: Promise<void> | null = null
  let fail = false
  const answer = (): NowPlayingReading => {
    const reading: NowPlayingReading = { session }
    if (art !== undefined) reading.art = art
    art = undefined
    return reading
  }
  const backend: NowPlayingBackend = {
    read: async () => {
      readAt.push(readAt.length)
      if (hold) await hold
      if (fail) throw new Error('the media reader stopped')
      return answer()
    },
    control: async (action) => {
      presses.push(action)
      return { ...answer(), done: true }
    },
    seek: async (seconds) => {
      presses.push(`seek ${seconds}`)
      return { ...answer(), done: true }
    },
    close: () => {
      closed += 1
    },
  }
  return {
    backend,
    reads: () => readAt.length,
    presses,
    closed: () => closed,
    set: (next: unknown, nextArt?: string | null) => {
      session = next
      art = nextArt === undefined ? undefined : both(nextArt)
    },
    holdReads: () => {
      let release = () => {}
      hold = new Promise<void>((resolve) => {
        release = resolve
      })
      return () => {
        hold = null
        release()
      }
    },
    failReads: (on: boolean) => {
      fail = on
    },
  }
}

describe('the watcher', () => {
  it('reads nothing until a pane wants it, then at once and on the half seconds', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend, 10_100)
    await r.advance(5000)
    expect(reader.reads()).toBe(0)
    r.watcher.sync(true)
    await r.flush()
    expect(reader.reads()).toBe(1)
    expect(r.last()?.watching).toBe(true)
    expect(r.last()?.session?.title).toBe('Track')
    expect(r.last()?.session?.art).toBe(`data:image/jpeg;base64,${JPEG}`)
    const [timer] = [...r.timers.values()]
    expect(timer?.at).toBe(nextBoundary(r.now()))
    expect((timer?.at ?? 0) % NOW_PLAYING_PERIOD_MS).toBe(0)
    await r.advance(2000)
    expect(reader.reads()).toBe(5)
  })

  it('stops reading when the last pane goes, and lets the reader go after a while', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    r.watcher.sync(true)
    await r.advance(1000)
    const before = reader.reads()
    r.watcher.sync(false)
    expect(r.last()?.watching).toBe(false)
    await r.advance(NOW_PLAYING_LINGER_MS - 1)
    expect(reader.reads()).toBe(before)
    expect(reader.closed()).toBe(0)
    await r.advance(1)
    expect(reader.closed()).toBe(1)
  })

  it('keeps the reader for a pane that comes back within the while', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    r.watcher.sync(true)
    await r.advance(600)
    r.watcher.sync(false)
    await r.advance(3000)
    r.watcher.sync(true)
    await r.advance(NOW_PLAYING_LINGER_MS * 2)
    expect(reader.closed()).toBe(0)
  })

  it('sends a reading only when it changes what a pane draws', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    r.watcher.sync(true)
    await r.advance(3000)
    const sent = r.states.length
    reader.set(raw({ status: 'Paused' }))
    await r.advance(600)
    expect(r.states.length).toBe(sent + 1)
    expect(r.last()?.session?.status).toBe('paused')
    // The art was sent once, for the track, and stays with it.
    expect(r.last()?.session?.art).toBe(`data:image/jpeg;base64,${JPEG}`)
  })

  it('takes the art with the track, and drops it with the session', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    r.watcher.sync(true)
    await r.advance(600)
    reader.set(raw({ title: 'Other' }), null)
    await r.advance(600)
    expect(r.last()?.session?.art).toBeNull()
    reader.set(null)
    await r.advance(600)
    expect(r.last()?.session).toBeNull()
  })

  it('keeps the art read while no pane was looking, since the reader sends it once', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    const release = reader.holdReads()
    r.watcher.sync(true)
    r.watcher.sync(false)
    release()
    await r.flush()
    expect(r.last()?.session).toBeNull()
    r.watcher.sync(true)
    await r.flush()
    expect(r.last()?.session?.art).toBe(`data:image/jpeg;base64,${JPEG}`)
  })

  it('does not overlap a look still running', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    const release = reader.holdReads()
    r.watcher.sync(true)
    await r.advance(2000)
    expect(reader.reads()).toBe(1)
    release()
    await r.advance(500)
    expect(reader.reads()).toBe(2)
  })

  it('says why a reading failed, keeps what it showed, and goes on', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    r.watcher.sync(true)
    await r.advance(600)
    reader.failReads(true)
    await r.advance(500)
    expect(r.last()?.error).toMatch(/stopped/)
    expect(r.last()?.session?.title).toBe('Track')
    reader.failReads(false)
    await r.advance(500)
    expect(r.last()?.error).toBeNull()
  })

  it('passes a press to the player, only while a pane is seen', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    expect(await r.watcher.control('next')).toBe('unsupported')
    r.watcher.sync(true)
    await r.flush()
    expect(await r.watcher.control('playPause')).toBe('ok')
    expect(reader.presses).toEqual(['playPause'])
    reader.set(null)
    await r.advance(600)
    expect(await r.watcher.control('next')).toBe('no-session')
  })

  it('passes a seek on only inside the track and to a player that takes one', async () => {
    const reader = fakeReader()
    reader.set(raw({ seek: true, end: 200 }))
    const r = rig(reader.backend)
    expect(await r.watcher.seek(50)).toBe('unsupported')
    r.watcher.sync(true)
    await r.flush()
    expect(await r.watcher.seek(500)).toBe('ok')
    expect(await r.watcher.seek('50')).toBe('refused')
    reader.set(raw({ seek: false }))
    await r.advance(600)
    expect(await r.watcher.seek(50)).toBe('refused')
    expect(reader.presses).toEqual(['seek 200'])
  })

  it('keeps the art at the card size, for a page that shows the track only', async () => {
    const reader = fakeReader()
    const r = rig(reader.backend)
    expect(r.watcher.largeArt()).toBeNull()
    r.watcher.sync(true)
    await r.flush()
    expect(r.watcher.largeArt()).toBe(`data:image/jpeg;base64,${LARGE}`)
    expect(r.last()?.session?.artSize).toEqual({ width: 600, height: 400 })
    // The page is never sent the large one with every reading.
    expect(JSON.stringify(r.states)).not.toContain(LARGE)
    reader.set(raw({ title: 'No Art' }), null)
    await r.advance(600)
    expect(r.watcher.largeArt()).toBeNull()
    expect(r.last()?.session?.artSize).toBeNull()
    r.watcher.sync(false)
    expect(r.watcher.largeArt()).toBeNull()
  })

  it('runs nothing where the platform cannot be read, and says so', async () => {
    const r = rig(null)
    expect(r.watcher.state().support).toBe('none')
    r.watcher.sync(true)
    await r.advance(5000)
    expect(r.timers.size).toBe(0)
    expect(r.watcher.active).toBe(false)
    expect(await r.watcher.control('playPause')).toBe('unsupported')
  })
})

describe('seeking', () => {
  const session = readSession(raw({ seek: true, end: 200 }), null, 0)
  if (session === null) throw new Error('no session')

  it('lands inside the track, and only on a player that takes a position', () => {
    expect(session.controls.seek).toBe(true)
    expect(seekTarget(session, 42)).toBe(42)
    expect(seekTarget(session, 900)).toBe(200)
    expect(seekTarget(session, -5)).toBe(0)
    expect(seekTarget(session, Number.NaN)).toBeNull()
    expect(seekTarget(session, '42')).toBeNull()
    expect(
      seekTarget({ ...session, controls: { ...session.controls, seek: false } }, 42),
    ).toBeNull()
    expect(seekTarget({ ...session, duration: null }, 42)).toBeNull()
    expect(seekTarget(null, 42)).toBeNull()
  })

  it('shows the position asked for until the player reports one of its own', () => {
    const s = { ...session, position: 30, positionAt: 1000 }
    const hold = { to: 120, at: 5000 }
    // Playing: the hold is carried on; the old report would have said 34.
    expect(shownPosition(s, 5000, hold)).toBe(120)
    expect(shownPosition(s, 6000, hold)).toBe(121)
    // Paused: held still.
    expect(shownPosition({ ...s, status: 'paused' }, 6000, hold)).toBe(120)
    // The player reported after the seek: its word wins.
    expect(shownPosition({ ...s, position: 119, positionAt: 5200 }, 6000, hold)).toBeCloseTo(119.8)
    // It never reported: after a while, the player's position again.
    expect(shownPosition(s, 5000 + SEEK_HOLD_MS, hold)).toBe(positionNow(s, 5000 + SEEK_HOLD_MS))
    expect(shownPosition(s, 6000, null)).toBe(positionNow(s, 6000))
  })
})

describe('the card', () => {
  it('says what the pane cuts or has no room for', () => {
    const s = readSession(
      raw({ app: 'Spotify.exe', others: 2, end: 0 }),
      { url: 'data:image/jpeg;base64,x', width: 640, height: 640 },
      0,
    )
    if (s === null) throw new Error('no session')
    const rows = Object.fromEntries(nowPlayingRows(s).map((r) => [r.label, r.value]))
    expect(rows).toEqual({
      artist: 'Artist',
      album: 'Album',
      player: 'Spotify · Spotify.exe',
      length: 'no length (a stream)',
      art: '640 × 640 px',
      others: '2 more players: Windows chooses the one shown',
    })
    const own = readSession(raw({ app: 'dev.kurouna.elecdex', artist: null }), null, 0)
    if (own === null) throw new Error('no session')
    const ownRows = nowPlayingRows(own)
    expect(ownRows.find((r) => r.label === 'artist')).toBeUndefined()
    expect(ownRows.find((r) => r.label === 'player')?.value).toBe('elecdex · dev.kurouna.elecdex')
    expect(ownRows.find((r) => r.label === 'art')).toBeUndefined()
  })
})

describe('the stand-in', () => {
  it('is what the end-to-end tests run on, so no run reads this machine', () => {
    const support = readFileSync('tests/e2e/support.ts', 'utf8')
    expect(support).toMatch(/ELECDEX_NOWPLAYING_STUB: '1'/)
  })

  it('pauses, skips, and sends its art once per track', async () => {
    const stub = stubNowPlaying(false, () => 1000)
    const first = await stub.read()
    expect(first.art).toBeNull()
    const moved = await stub.seek(42)
    expect((moved.session as { position: number }).position).toBe(42)
    expect((await stub.read()).art).toBeUndefined()
    const paused = await stub.control('playPause')
    expect((paused.session as { status: string }).status).toBe('Paused')
    const next = await stub.control('next')
    expect((next.session as { title: string }).title).toBe('Second Track')
    expect(sameSession(null, null)).toBe(true)
  })
})
