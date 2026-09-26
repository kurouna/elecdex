import {
  EMPTY_NOW_PLAYING,
  type NowPlaying,
  type NowPlayingAction,
  type NowPlayingSession,
} from '@shared/now-playing'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: NowPlayingWidget } = await import(
  '../../src/renderer/widgets/nowplaying/NowPlayingWidget.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The NOW PLAYING pane: it follows main's session only while seen, draws what
 * the session says (and says so when there is none, or the platform cannot be
 * read), offers only the buttons the player does, and counts the position on.
 */

let deliver: ((state: NowPlaying) => void) | null = null
let subscriptions = 0
const control = vi.fn(async (_action: NowPlayingAction) => 'ok' as const)

const session = (over: Partial<NowPlayingSession> = {}): NowPlayingSession => ({
  appId: 'Spotify.exe',
  app: 'Spotify',
  title: 'Night Transit',
  artist: 'Glass Relay',
  album: 'Signals After Midnight',
  status: 'playing',
  rate: 1,
  position: 84,
  duration: 231,
  positionAt: Date.now(),
  controls: { playPause: true, next: true, previous: false },
  others: 0,
  art: null,
  ...over,
})

const state = (over: Partial<NowPlaying> = {}): NowPlaying => ({
  ...EMPTY_NOW_PLAYING,
  watching: true,
  ...over,
})

beforeEach(() => {
  deliver = null
  subscriptions = 0
  control.mockClear()
  vi.stubGlobal('elecdex', {
    nowPlaying: {
      subscribe: (handler: (state: NowPlaying) => void) => {
        subscriptions += 1
        deliver = handler
        return () => {
          subscriptions -= 1
          deliver = null
        }
      },
      control,
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  vi.useRealTimers()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

async function mount(visible = true) {
  const view = render(NowPlayingWidget, {
    props: { paneId: 'p1', title: 'now playing', props: {}, state: {}, active: true, visible },
  })
  await settle()
  return view
}

async function push(next: NowPlaying): Promise<void> {
  deliver?.(structuredClone(next))
  await settle()
}

describe('NowPlayingWidget', () => {
  it('follows the session only while it is seen', async () => {
    const view = await mount(false)
    expect(subscriptions).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(subscriptions).toBe(1)
    await view.rerender({ visible: false })
    await settle()
    expect(subscriptions).toBe(0)
  })

  it('draws the title, the artist, the album, the application and the time', async () => {
    await mount()
    await push(state({ session: session() }))
    expect(screen.getByTestId('np-title').textContent?.trim()).toBe('Night Transit')
    expect(screen.getByTestId('np-artist').textContent).toBe('Glass Relay')
    expect(screen.getByTestId('np-album').textContent).toBe('Signals After Midnight')
    expect(screen.getByTestId('np-app').textContent).toBe('Spotify')
    expect(screen.getByTestId('np-state').textContent).toContain('PLAYING')
    expect(screen.getByTestId('np-time').textContent).toBe('1:24 / 3:51')
    expect(screen.getByTestId('np-art').dataset.art).toBe('none')
  })

  it('offers only the buttons the player does, and says play or pause by the state', async () => {
    await mount()
    await push(state({ session: session() }))
    expect((screen.getByTestId('np-previous') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByTestId('np-next') as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByTestId('np-play').getAttribute('aria-label')).toBe('pause')
    await push(state({ session: session({ status: 'paused' }) }))
    expect(screen.getByTestId('np-play').getAttribute('aria-label')).toBe('play')
    expect(screen.getByTestId('np-state').textContent).toContain('PAUSED')
  })

  it('passes a press to main, and says when the player did not take it', async () => {
    await mount()
    await push(state({ session: session() }))
    await fireEvent.click(screen.getByTestId('np-next'))
    await settle()
    expect(control).toHaveBeenCalledWith('next')
    expect(screen.queryByTestId('np-note')).toBeNull()
    control.mockResolvedValueOnce('refused' as never)
    await fireEvent.click(screen.getByTestId('np-play'))
    await settle()
    expect(screen.getByTestId('np-note').textContent).toMatch(/did not take/)
  })

  it('says when nothing is playing, with every button off', async () => {
    await mount()
    await push(state())
    expect(screen.getByTestId('np-state').textContent).toContain('NO SESSION')
    expect(screen.getByTestId('np-empty').textContent).toMatch(/Nothing is playing/)
    for (const id of ['np-previous', 'np-play', 'np-next'])
      expect((screen.getByTestId(id) as HTMLButtonElement).disabled).toBe(true)
  })

  it('says when this platform cannot be read', async () => {
    await mount()
    await push(state({ support: 'none', watching: false }))
    expect(screen.getByTestId('np-state').textContent).toContain('UNSUPPORTED')
    expect(screen.getByTestId('np-unsupported').textContent).toMatch(/Windows only/)
  })

  it('shows the art main made, and the error of a failed reading beside what it showed', async () => {
    await mount()
    const art = 'data:image/jpeg;base64,/9j/AAAA'
    await push(state({ session: session({ art }), error: 'the media reader stopped' }))
    expect(screen.getByTestId('np-art').querySelector('img')?.getAttribute('src')).toBe(art)
    expect(screen.getByTestId('np-error').textContent).toBe('the media reader stopped')
    expect(screen.getByTestId('np-title').textContent?.trim()).toBe('Night Transit')
  })

  it('counts the position on once a second while playing, and holds it while paused', async () => {
    vi.useFakeTimers({ now: 1_800_000_000_000 })
    await mount()
    await push(state({ session: session({ position: 10, positionAt: Date.now() }) }))
    expect(screen.getByTestId('np-time').textContent).toBe('0:10 / 3:51')
    // A boundary lands in the frame loop's next frame, a little after the second.
    await vi.advanceTimersByTimeAsync(3200)
    await settle()
    expect(screen.getByTestId('np-time').textContent).toBe('0:13 / 3:51')
    await push(
      state({ session: session({ status: 'paused', position: 13, positionAt: Date.now() }) }),
    )
    await vi.advanceTimersByTimeAsync(3000)
    await settle()
    expect(screen.getByTestId('np-time').textContent).toBe('0:13 / 3:51')
  })

  it('leaves out the bar for a stream with no length', async () => {
    await mount()
    await push(state({ session: session({ duration: null }) }))
    expect(screen.queryByTestId('np-bar')).toBeNull()
    expect(screen.getByTestId('np-time').textContent).toBe('1:24')
  })
})
