<script lang="ts">
import {
  EMPTY_NOW_PLAYING,
  type NowPlaying,
  type NowPlayingAction,
  type NowPlayingControlResult,
  type SeekHold,
  shownPosition,
  statusWord,
} from '@shared/now-playing'
import { onBoundary } from '../../lib/frame-loop.ts'
import {
  anchorOf,
  CARD_GAP,
  type CardAnchor,
  type CardSize,
  HoverRest,
} from '../../lib/hover-card.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import ArtCard from './ArtCard.svelte'
import Plate from './Plate.svelte'
import SeekBar from './SeekBar.svelte'

/**
 * What is playing (architecture.md §5.15): the media session the system calls
 * current - its art, title, artist and album, where it is - and the player's
 * previous, play/pause and next; the position moves when the player takes a new
 * one. Resting on the art opens the track's card, with the art large.
 *
 * Main reads the session only while a pane like this is seen: this one
 * subscribes only then, so behind another tab or with the window put away
 * nothing is read. The player reports its position now and then; the pane
 * counts on from there once a second, on the wall clock, while it plays.
 */
const { paneId, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

let media = $state.raw<NowPlaying>(EMPTY_NOW_PLAYING)
let connected = $state(false)
/** The clock the position is counted to: a second's steps, only while seen and playing. */
let now = $state(Date.now())

function receive(next: NowPlaying): void {
  connected = true
  media = next
  now = Date.now()
}

$effect(() => (visible ? window.elecdex.nowPlaying.subscribe(receive) : undefined))

const session = $derived(media.session)
const playing = $derived(session?.status === 'playing')

$effect(() => {
  if (!visible || !playing) return
  now = Date.now()
  return onBoundary(1000, () => {
    now = Date.now()
  })
})

/** The last seek asked for: shown until the player reports a position of its own. */
let hold = $state.raw<SeekHold | null>(null)
const position = $derived(session === null ? null : shownPosition(session, now, hold))
const duration = $derived(session?.duration ?? null)
const lamp = $derived(
  !connected
    ? 'idle'
    : media.support === 'none' || media.error !== null
      ? 'warn'
      : session === null
        ? 'idle'
        : playing
          ? 'on'
          : 'held',
)

$effect(() => {
  // The application, and the other players, are named in the pane itself, which a
  // popped-up pane (no header) shows too.
  paneMeta.set(paneId, {
    subtitle: media.support === 'none' ? 'Windows only for now' : '',
    ...(media.error ? { badge: 'error', badgeKind: 'warn' as const } : {}),
  })
})

/** What a press came to when it was not done, said beside the buttons for a moment. */
let note = $state<string | null>(null)
let noteTimer: ReturnType<typeof setTimeout> | undefined
const NOTES: Record<Exclude<NowPlayingControlResult, 'ok'>, string> = {
  refused: 'the player did not take it',
  'no-session': 'nothing is playing',
  unsupported: 'not available here',
  failed: 'the player did not answer',
}

async function press(action: NowPlayingAction): Promise<void> {
  sfx.play('folder')
  tell(await window.elecdex.nowPlaying.control(action))
}

async function seek(to: number): Promise<void> {
  hold = { to, at: Date.now() }
  now = Date.now()
  const result = await window.elecdex.nowPlaying.seek(to)
  if (result !== 'ok') hold = null
  tell(result)
}

function tell(result: NowPlayingControlResult): void {
  clearTimeout(noteTimer)
  note = result === 'ok' ? null : NOTES[result]
  if (note !== null)
    noteTimer = setTimeout(() => {
      note = null
    }, 3000)
}

$effect(() => () => clearTimeout(noteTimer))

const byline = $derived(session === null ? '' : (session.artist ?? ''))

/**
 * The track's card, and where it goes: beside the plate when the pane is wide
 * enough (the plate fills its height), else under or over it. It waits for a
 * rest like every detail card, and asks main for the larger art as it opens.
 */
let rootEl = $state<HTMLElement | null>(null)
let card = $state.raw<{ anchor: CardAnchor; bounds: CardSize } | null>(null)
let large = $state.raw<{ for: string; url: string | null } | null>(null)
const resting = new HoverRest<string>(() => (card = null))
/** Room a card needs beside the plate. */
const CARD_BESIDE_PX = 300

function onplate(event: { plate: DOMRect; x: number | null } | null): void {
  if (event === null) {
    resting.leave('art')
    return
  }
  const show = (): void => {
    if (rootEl === null) return
    const box = rootEl.getBoundingClientRect()
    const right = event.plate.right - box.left
    const beside = box.width - right > CARD_BESIDE_PX
    const top = event.plate.top - box.top - CARD_GAP
    card = {
      anchor: beside
        ? { x: right + CARD_GAP, top, bottom: top }
        : anchorOf(box, event.plate, event.x),
      bounds: { width: box.width, height: box.height },
    }
    void fetchLarge()
  }
  resting.enter('art', show, event.x === null)
}

async function fetchLarge(): Promise<void> {
  const art = session?.art ?? null
  if (art === null || large?.for === art) return
  const url = await window.elecdex.nowPlaying.art()
  // The track changed while it was asked for: the answer is another track's.
  if (session?.art === art) large = { for: art, url }
}

// Put away, or the track gone, the card goes.
$effect(() => {
  if (!visible || session === null) resting.leave()
})
$effect(() => () => resting.dispose())
</script>

<div
  class="np"
  bind:this={rootEl}
  data-testid="now-playing"
  data-pane-id={paneId}
  data-status={session?.status ?? (media.support === 'none' ? 'unsupported' : 'none')}
>
  <div class="deck">
    <Plate art={session?.art ?? null} {playing} onhover={session === null ? undefined : onplate} />

    <div class="info">
      <div class="lamp" data-lamp={lamp} data-testid="np-state">
        <i></i><span class="word">{connected ? statusWord(media) : 'STANDBY'}</span>
        {#if session !== null}
          <span class="app" data-testid="np-app">{session.app}</span>
          {#if session.others > 0}
            <span class="others" title="other players with a session: the system chooses the one shown">+{session.others}</span>
          {/if}
        {/if}
      </div>

      {#if media.support === 'none'}
        <!-- The lamp says UNSUPPORTED; this says why. -->
        <div class="empty" data-testid="np-unsupported">
          <span>What is playing is read on Windows only, for now.</span>
        </div>
      {:else if session === null}
        <!-- The lamp says NO SESSION; this says what that means. -->
        <div class="empty" data-testid="np-empty">
          <span>{connected ? 'Nothing is playing in a player that tells the system.' : '…'}</span>
        </div>
      {:else}
        <h3 class="title" title={session.title ?? ''} data-testid="np-title">
          {session.title ?? 'untitled'}
        </h3>
        {#if byline}<p class="artist" data-testid="np-artist">{byline}</p>{/if}
        {#if session.album}<p class="album" data-testid="np-album">{session.album}</p>{/if}

        <div class="seek">
          <SeekBar {position} {duration} seekable={session.controls.seek} onseek={(to) => void seek(to)} />
        </div>
      {/if}

      <div class="controls">
        <span></span>
        <span class="buttons">
        <button
          type="button"
          class="ctl"
          aria-label="previous"
          title="previous"
          disabled={!session?.controls.previous}
          onclick={() => void press('previous')}
          data-testid="np-previous"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h2v10H3z M13 3v10L6 8z" /></svg>
        </button>
        <button
          type="button"
          class="ctl main"
          aria-label={playing ? 'pause' : 'play'}
          title={playing ? 'pause' : 'play'}
          disabled={!session?.controls.playPause}
          onclick={() => void press('playPause')}
          data-testid="np-play"
        >
          {#if playing}
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4z M9 3h3v10H9z" /></svg>
          {:else}
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11L13 8z" /></svg>
          {/if}
        </button>
        <button
          type="button"
          class="ctl"
          aria-label="next"
          title="next"
          disabled={!session?.controls.next}
          onclick={() => void press('next')}
          data-testid="np-next"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 3h2v10h-2z M3 3v10l7-5z" /></svg>
        </button>
        </span>
        <span class="note" data-testid="np-note">{note ?? ''}</span>
      </div>
    </div>
  </div>

  {#if card !== null && session !== null}
    <ArtCard
      {session}
      large={large !== null && large.for === session.art ? large.url : null}
      anchor={card.anchor}
      bounds={card.bounds}
    />
  {/if}

  {#if media.error !== null}
    <p class="problem" data-testid="np-error">{media.error}</p>
  {/if}
</div>

<style>
.np {
  position: relative;
  container-type: size;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: var(--space-2);
  font-family: var(--font-ui);
  overflow: hidden;
}

/* Tall or square: the plate above, the words under it. */
.deck {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  min-height: 0;
}

.deck > :global(.plate) {
  inline-size: min(100cqw - 1rem, 46cqh, 15rem);
}

.info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  min-height: 0;
  width: 100%;
}

.lamp {
  --tone: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.lamp[data-lamp="on"] {
  --tone: var(--ok);
}

.lamp[data-lamp="held"] {
  --tone: var(--accent);
}

.lamp[data-lamp="warn"] {
  --tone: var(--warn);
}

.lamp i {
  flex: none;
  width: 0.45rem;
  height: 0.45rem;
  transform: rotate(45deg);
  background: var(--tone);
  box-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
}

.lamp .word {
  flex: none;
}

.lamp .app {
  overflow: hidden;
  margin-left: auto;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lamp .others {
  flex: none;
  color: var(--text-muted);
}

.title {
  display: -webkit-box;
  overflow: hidden;
  margin: 0.15rem 0 0;
  font-size: var(--step-1);
  font-weight: 600;
  line-height: 1.2;
  color: var(--text);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow-wrap: anywhere;
}

.artist,
.album {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: var(--step-0);
  color: var(--text);
}

.album {
  font-size: var(--step--1);
  color: var(--text-muted);
}

.seek {
  margin-top: auto;
  padding-top: var(--space-2);
}

/* The buttons in the middle; a note on a press that was not taken to their right. */
.controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.buttons {
  display: flex;
  gap: 0.4rem;
}

.ctl {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 1.7rem;
  padding: 0;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
}

.ctl svg {
  width: 0.8rem;
  height: 0.8rem;
  fill: currentColor;
}

.ctl.main {
  width: 2.6rem;
  border-color: var(--accent);
  background: var(--accent-faint);
}

.ctl:hover:not(:disabled) {
  border-color: var(--accent-strong);
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.ctl:focus-visible {
  outline: 1px solid var(--accent-strong);
  outline-offset: -3px;
}

.ctl:disabled {
  opacity: 0.35;
  cursor: default;
}

.note {
  overflow: hidden;
  font-size: var(--step--1);
  color: var(--warn);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  min-height: 0;
}

.empty span {
  font-size: var(--step--1);
  color: var(--text-muted);
}

.problem {
  margin: var(--space-1) 0 0;
  overflow: hidden;
  font-size: var(--step--1);
  color: var(--warn);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Wide: the plate at the left, as tall as the pane lets it be. Last, so these win. */
@container (aspect-ratio > 1.35) {
  .deck {
    flex-direction: row;
    align-items: stretch;
    gap: var(--space-4);
  }

  .deck > :global(.plate) {
    align-self: center;
    inline-size: min(100cqh - 1.5rem, 42cqw, 15rem);
  }

  /* Beside the plate, the words and the track stay together at its middle; a bar
     across a whole screen's width is read as a divider, not a track. */
  .info {
    justify-content: center;
    max-width: 38rem;
  }

  .seek {
    margin-top: 0;
  }

  .empty {
    flex: none;
  }
}
</style>
