/**
 * The NOW PLAYING pane (architecture.md §5.15): what the system's media session
 * says is playing - the title, the artist, the album, where it is, the art - and
 * the three buttons every media overlay has. Main reads it (main/media/), only
 * while a pane is seen, and owns the decisions below; the page only draws them.
 *
 * Pure, and shared by main (reading what the platform reported) and the page
 * (where the position is now, how a time is written).
 */

export type PlaybackStatus = 'playing' | 'paused' | 'stopped' | 'changing' | 'unknown'

/** What the pane can ask of the player: nothing else, and never the volume (the mixer's). */
export const NOW_PLAYING_ACTIONS = ['playPause', 'next', 'previous'] as const
export type NowPlayingAction = (typeof NOW_PLAYING_ACTIONS)[number]

/** How a press ended: said beside the buttons when it was not done. */
export type NowPlayingControlResult = 'ok' | 'refused' | 'no-session' | 'unsupported' | 'failed'

export interface NowPlayingSession {
  /** The platform's name for the application (Windows' AppUserModelId), cut. */
  appId: string
  /** The application's name as shown (`appLabel`). */
  app: string
  title: string | null
  artist: string | null
  album: string | null
  status: PlaybackStatus
  /** 1 at normal speed. */
  rate: number
  /** Seconds from the start, as last reported; null for a stream with no length. */
  position: number | null
  /** Seconds; null when unknown (a live stream). */
  duration: number | null
  /** When `position` was true (epoch ms): the page carries it on from there while playing. */
  positionAt: number
  /** Which buttons the player itself offers now. */
  controls: { playPause: boolean; next: boolean; previous: boolean }
  /** Other players with a session, not shown (the system's own choice is). */
  others: number
  /** The art, made small in the reader: a JPEG data URL, or null. */
  art: string | null
}

export interface NowPlaying {
  /** Whether this platform's sessions can be read at all. */
  support: 'full' | 'none'
  /** Whether main is reading now (a pane is seen). */
  watching: boolean
  /** The session shown, or null when nothing reports one. The last one read stays while unseen. */
  session: NowPlayingSession | null
  /** Why the last reading failed; the session before it stays on screen. */
  error: string | null
}

/**
 * Main looks on the wall clock's half seconds while a pane is seen. A reading
 * costs the reader about a millisecond (measured on Windows: GetCurrentSession,
 * the media properties, the playback and timeline info), so the grid is set by
 * what the eye needs - a track changing, a pause from the player's own button -
 * not by the cost.
 */
export const NOW_PLAYING_PERIOD_MS = 500

/**
 * How long the reader outlives the last pane: a pane moved remounts, and a tab
 * flicked away and back should not start PowerShell again. It reads nothing
 * meanwhile - only a pane seen makes it read.
 */
export const NOW_PLAYING_LINGER_MS = 15_000

/** Titles, artists and albums past this many characters are cut: no player needs more. */
export const MAX_TEXT_CHARS = 200
/** The art's longer edge in the reader, in pixels: sharp at twice the plate's size. */
export const ART_EDGE = 192
/** The most art main passes on, as base64 characters (about 64 kB of JPEG). */
export const MAX_ART_BASE64 = 88_000

export const EMPTY_NOW_PLAYING: NowPlaying = {
  support: 'full',
  watching: false,
  session: null,
  error: null,
}

/** The next boundary of `period` strictly after `now`. */
export function nextBoundary(now: number, period: number = NOW_PLAYING_PERIOD_MS): number {
  return (Math.floor(now / period) + 1) * period
}

export function isNowPlayingAction(value: unknown): value is NowPlayingAction {
  return typeof value === 'string' && (NOW_PLAYING_ACTIONS as readonly string[]).includes(value)
}

/** A text to show, cut to `max` characters (not UTF-16 units), or null when there is none. */
export function cutText(value: unknown, max: number = MAX_TEXT_CHARS): string | null {
  if (typeof value !== 'string') return null
  // Control characters (a player's stray newline) would break the row.
  const text = value.replace(/[\p{Cc}\p{Cf}]+/gu, ' ').trim()
  if (text === '') return null
  const chars = [...text]
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`
}

/**
 * Applications Windows names by an id that says little: a packaged app's id, or
 * the hash Firefox registers under. Matched on the lower-cased id.
 */
const KNOWN_APPS: readonly (readonly [RegExp, string])[] = [
  [/^spotify/, 'Spotify'],
  [/^chrome$|^google chrome/, 'Chrome'],
  [/^msedge|microsoftedge/, 'Edge'],
  [/^308046b0af4a39cb$|^firefox/, 'Firefox'],
  [/^brave/, 'Brave'],
  [/^opera/, 'Opera'],
  [/^vivaldi/, 'Vivaldi'],
  [/^microsoft\.zunemusic/, 'Media Player'],
  [/^microsoft\.zunevideo/, 'Movies & TV'],
  [/^applemusic|^appleinc\.applemusic/, 'Apple Music'],
  [/^itunes/, 'iTunes'],
  [/^vlc/, 'VLC'],
  [/^foobar2000/, 'foobar2000'],
  [/^musicbee/, 'MusicBee'],
  [/^amazonmobilellc\.amazonmusic|^amazon music/, 'Amazon Music'],
]

/**
 * elecdex's own AppUserModelId (main/index.ts sets it, electron-builder.yml's
 * appId): what Windows names the session of a web pane playing.
 */
export const ELECDEX_APP_ID = 'dev.kurouna.elecdex'

/** Whether an application id is elecdex's own; Windows may report it in capitals. */
export function isOwnApp(appId: string): boolean {
  return appId.trim().toLowerCase() === ELECDEX_APP_ID
}

/**
 * The name to show for an application id: a known one by name, otherwise the id
 * made readable - a packaged app's name part ("Publisher.App_hash!App" -> "App"),
 * an executable without ".exe".
 */
export function appLabel(appId: string): string {
  const id = appId.trim()
  const lower = id.toLowerCase()
  // A web pane playing: Windows names the session by the app's own id, in capitals.
  if (isOwnApp(id)) return 'elecdex'
  for (const [pattern, name] of KNOWN_APPS) if (pattern.test(lower)) return name
  const packaged = /^[^!_]+?\.([^.!_]+)_[a-z0-9]+!/i.exec(id)
  if (packaged?.[1]) return packaged[1]
  const base = id.split(/[\\/]/).pop() ?? id
  return cutText(base.replace(/\.exe$/i, ''), 40) ?? 'unknown'
}

const STATUSES: Record<string, PlaybackStatus> = {
  playing: 'playing',
  paused: 'paused',
  stopped: 'stopped',
  changing: 'changing',
  opened: 'stopped',
  closed: 'stopped',
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const CLOCK_SLACK_MS = 10 * 365 * 86_400_000

/**
 * Where a track is, from the reader's timeline: the position counted from the
 * timeline's start, never past its end; no length for a stream that has none.
 * A player's clock more than ten years off is not believed.
 */
function timeline(
  r: Record<string, unknown>,
  readAt: number,
): Pick<NowPlayingSession, 'rate' | 'position' | 'duration' | 'positionAt'> {
  const start = finite(r.start) ?? 0
  const end = finite(r.end)
  const duration = end !== null && end - start > 0.5 ? end - start : null
  const reported = finite(r.position)
  const at = finite(r.at)
  const rate = finite(r.rate)
  return {
    rate: rate !== null && rate > 0 && rate <= 16 ? rate : 1,
    position:
      reported === null ? null : Math.max(0, Math.min(duration ?? Infinity, reported - start)),
    duration,
    positionAt: at !== null && Math.abs(at - readAt) < CLOCK_SLACK_MS ? at : readAt,
  }
}

/**
 * A session as the reader reported it (one JSON object: see main/media/windows.ts),
 * checked field by field. Anything the page will draw is cut to size here; what
 * cannot be read is left null rather than guessed. Null when it is not a session.
 */
export function readSession(
  raw: unknown,
  art: string | null,
  readAt: number,
): NowPlayingSession | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const appId = cutText(r.app, 120) ?? ''
  const others = finite(r.others)
  return {
    appId,
    app: appId === '' ? 'unknown' : appLabel(appId),
    title: cutText(r.title),
    artist: cutText(r.artist),
    album: cutText(r.album),
    status: STATUSES[String(r.status).toLowerCase()] ?? 'unknown',
    ...timeline(r, readAt),
    controls: {
      playPause: r.playPause === true,
      next: r.next === true,
      previous: r.previous === true,
    },
    others: others !== null && others > 0 ? Math.min(99, Math.floor(others)) : 0,
    art,
  }
}

/**
 * The art the reader sent (base64 of a JPEG it made), as a data URL the page's
 * CSP allows (`img-src data:`); null when it is missing, too big, or not a JPEG.
 */
export function artUrl(base64: unknown): string | null {
  if (typeof base64 !== 'string' || base64.length === 0 || base64.length > MAX_ART_BASE64)
    return null
  // A JPEG starts FF D8 FF, which base64 writes "/9j/".
  if (!base64.startsWith('/9j/') || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null
  return `data:image/jpeg;base64,${base64}`
}

/** Whether two sessions would be drawn the same: a reading that changes nothing is not sent. */
export function sameSession(a: NowPlayingSession | null, b: NowPlayingSession | null): boolean {
  if (a === null || b === null) return a === b
  return (
    a.appId === b.appId &&
    a.title === b.title &&
    a.artist === b.artist &&
    a.album === b.album &&
    a.status === b.status &&
    a.rate === b.rate &&
    a.position === b.position &&
    a.duration === b.duration &&
    a.positionAt === b.positionAt &&
    a.controls.playPause === b.controls.playPause &&
    a.controls.next === b.controls.next &&
    a.controls.previous === b.controls.previous &&
    a.others === b.others &&
    a.art === b.art
  )
}

/**
 * Where the track is at `now`: the reported position carried on at its rate
 * while playing, held while not, never past the end. The player reports its
 * position now and then (a browser on a seek, a pause, every few seconds), so
 * the page does the counting in between.
 */
export function positionNow(session: NowPlayingSession, now: number): number | null {
  if (session.position === null) return null
  const moved =
    session.status === 'playing' ? (Math.max(0, now - session.positionAt) / 1000) * session.rate : 0
  const at = session.position + moved
  return session.duration === null ? at : Math.min(session.duration, at)
}

/** "1:24", "12:05", "1:02:09". */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** The word the pane's lamp says. */
export function statusWord(state: NowPlaying): string {
  if (state.support === 'none') return 'UNSUPPORTED'
  if (state.session === null) return state.watching ? 'NO SESSION' : 'STANDBY'
  switch (state.session.status) {
    case 'playing':
      return 'PLAYING'
    case 'paused':
      return 'PAUSED'
    case 'changing':
      return 'CHANGING'
    case 'stopped':
      return 'STOPPED'
    default:
      return 'SESSION'
  }
}
