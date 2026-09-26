import type { NowPlayingBackend, NowPlayingReading } from './watcher.js'

/**
 * A stand-in media session (ELECDEX_NOWPLAYING_STUB=1, the tests; =demo, the
 * screenshots): a run never reads what this machine is playing, and never
 * presses its player's buttons.
 *
 * The end-to-end tests change the track through `globalThis.__elecdexNowPlaying`,
 * and read back what was pressed and how often the session was read.
 */
export interface StubTrack {
  app: string
  title: string | null
  artist: string | null
  album: string | null
  status: 'Playing' | 'Paused' | 'Stopped'
  /** Seconds. */
  position: number
  end: number
  /** When `position` was true (epoch ms). */
  at: number
  /** Base64 of a JPEG, or null: the stand-in sends it as both the plate's and the card's. */
  art: string | null
  next: boolean
  previous: boolean
  /** Whether it takes a new position. */
  seek: boolean
}

export interface NowPlayingHooks {
  /** Puts a track on (merged over the current one), or takes the session away (null). */
  set(track: Partial<StubTrack> | null): void
  /** The presses the pane passed on, in order; a seek as `seek <seconds>`. */
  presses(): string[]
  /** How many times the session has been read. */
  reads(): number
  /** Whether the stand-in reader is open (a real one would be a process). */
  open(): boolean
}

const DEMO: Omit<StubTrack, 'at'>[] = [
  {
    app: 'Spotify.exe',
    title: 'Night Transit',
    artist: 'Glass Relay',
    album: 'Signals After Midnight',
    status: 'Playing',
    position: 84,
    end: 231,
    art: null,
    next: true,
    previous: true,
    seek: true,
  },
  {
    app: 'Spotify.exe',
    title: 'Low Orbit',
    artist: 'Glass Relay',
    album: 'Signals After Midnight',
    status: 'Playing',
    position: 0,
    end: 198,
    art: null,
    next: true,
    previous: true,
    seek: true,
  },
]

const TEST: Omit<StubTrack, 'at'> = {
  app: 'Spotify.exe',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  status: 'Playing',
  position: 10,
  end: 200,
  art: null,
  next: true,
  previous: true,
  seek: true,
}

export function stubNowPlaying(demo: boolean, now: () => number = Date.now): NowPlayingBackend {
  const list = demo ? DEMO : [TEST, { ...TEST, title: 'Second Track', position: 0 }]
  let index = 0
  let track: StubTrack | null = { ...(list[0] ?? TEST), at: now() }
  /** The art already sent for this track, as the real reader sends it once. */
  let artSent: string | null | undefined
  let open = false
  let reads = 0
  const presses: string[] = []

  const hooks: NowPlayingHooks = {
    set: (next) => {
      track = next === null ? null : { ...(track ?? TEST), at: now(), ...next }
    },
    presses: () => [...presses],
    reads: () => reads,
    open: () => open,
  }
  ;(globalThis as { __elecdexNowPlaying?: NowPlayingHooks }).__elecdexNowPlaying = hooks

  const reading = (): NowPlayingReading => {
    open = true
    reads += 1
    if (track === null) {
      artSent = undefined
      return { session: null }
    }
    const art = track.art
    const session = {
      app: track.app,
      title: track.title,
      artist: track.artist,
      album: track.album,
      status: track.status,
      rate: 1,
      position: track.position,
      start: 0,
      end: track.end,
      at: track.at,
      playPause: true,
      next: track.next,
      previous: track.previous,
      seek: track.seek,
      others: 0,
    }
    if (art === artSent) return { session }
    artSent = art
    return {
      session,
      art: art === null ? null : { small: art, large: art, width: 640, height: 640 },
    }
  }

  const skip = (step: number): void => {
    if (track === null) return
    index = (index + step + list.length) % list.length
    track = { ...(list[index] ?? TEST), position: 0, at: now() }
  }

  return {
    read: async () => reading(),
    control: async (action) => {
      presses.push(action)
      if (track !== null && action === 'playPause') {
        const playing = track.status === 'Playing'
        const at = now()
        const position = playing ? track.position + (at - track.at) / 1000 : track.position
        track = { ...track, status: playing ? 'Paused' : 'Playing', position, at }
      } else if (action === 'next') skip(1)
      else if (action === 'previous') skip(-1)
      return { ...reading(), done: track !== null }
    },
    seek: async (seconds) => {
      presses.push(`seek ${seconds}`)
      const done = track?.seek === true
      if (track !== null && done) track = { ...track, position: seconds, at: now() }
      return { ...reading(), done }
    },
    close: () => {
      open = false
      artSent = undefined
    },
  }
}
