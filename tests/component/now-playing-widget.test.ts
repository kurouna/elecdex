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
const seek = vi.fn(async (_seconds: number) => 'ok' as const)
const art = vi.fn(async () => 'data:image/jpeg;base64,/9j/LARGE' as string | null)

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
  controls: { playPause: true, next: true, previous: false, seek: false },
  artSize: null,
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
  seek.mockClear()
  art.mockClear()
  // The card powers on like a tube, which asks whether motion is reduced.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  // The card measures itself to keep inside the pane; jsdom has no observer.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.getAnimations ??= () => []
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const length = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    setTimeout(() => animation.onfinish?.(), length)
    return animation as unknown as Animation
  }
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
      seek,
      art,
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  Reflect.deleteProperty(Element.prototype, 'animate')
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
    expect(screen.getByTestId('np-note').textContent).toBe('')
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

  it('draws a plain meter, with nothing to drag, when the player takes no position', async () => {
    await mount()
    await push(state({ session: session() }))
    const bar = screen.getByTestId('np-bar')
    expect(bar.dataset.seekable).toBe('false')
    expect(bar.getAttribute('role')).toBeNull()
    expect(bar.querySelector('.head')).toBeNull()
  })

  it('moves the position from the keyboard when it does, and holds it until the player says', async () => {
    await mount()
    const s = session({ controls: { playPause: true, next: true, previous: true, seek: true } })
    await push(state({ session: { ...s, status: 'paused' } }))
    const bar = screen.getByTestId('np-bar')
    expect(bar.getAttribute('role')).toBe('slider')
    expect(bar.querySelector('.head')).not.toBeNull()
    await fireEvent.keyDown(bar, { key: 'ArrowRight' })
    await settle()
    expect(seek).toHaveBeenCalledWith(89)
    // The reading after the seek still has the old report: the asked-for position stays.
    await push(state({ session: { ...s, status: 'paused' } }))
    expect(screen.getByTestId('np-time').textContent).toBe('1:29 / 3:51')
    await fireEvent.keyDown(bar, { key: 'End' })
    await settle()
    expect(seek).toHaveBeenLastCalledWith(231)
  })

  it('goes back to the reported position when the player refuses a seek', async () => {
    await mount()
    const s = session({
      status: 'paused',
      controls: { playPause: true, next: true, previous: true, seek: true },
    })
    await push(state({ session: s }))
    seek.mockResolvedValueOnce('refused' as never)
    await fireEvent.keyDown(screen.getByTestId('np-bar'), { key: 'Home' })
    await settle()
    expect(screen.getByTestId('np-time').textContent).toBe('1:24 / 3:51')
    expect(screen.getByTestId('np-note').textContent).toMatch(/did not take/)
  })

  it("opens the track's card on the art, with the large art main keeps", async () => {
    await mount()
    const small = 'data:image/jpeg;base64,/9j/SMALL'
    await push(
      state({ session: session({ art: small, artSize: { width: 640, height: 640 }, others: 1 }) }),
    )
    await fireEvent.pointerEnter(screen.getByTestId('np-art'))
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
    expect(art).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('np-card-title').textContent).toBe('Night Transit')
    expect(screen.getByTestId('np-card-art').getAttribute('src')).toBe(
      'data:image/jpeg;base64,/9j/LARGE',
    )
    expect(screen.getByTestId('np-card').textContent).toContain('640 × 640 px')
    await fireEvent.pointerLeave(screen.getByTestId('np-art'))
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
    expect(screen.queryByTestId('np-card')).toBeNull()
  })

  it('leaves out the bar for a stream with no length', async () => {
    await mount()
    await push(state({ session: session({ duration: null }) }))
    expect(screen.queryByTestId('np-bar')).toBeNull()
    expect(screen.getByTestId('np-time').textContent).toBe('1:24')
  })
})
