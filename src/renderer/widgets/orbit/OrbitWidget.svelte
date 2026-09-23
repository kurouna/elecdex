<script lang="ts">
import cities from '@shared/geo/cities.json'
import { type OrbitElements, type OrbitUpdate, STATIONS } from '@shared/orbits'
import type { CityRow } from '@shared/weather-places'
import { untrack } from 'svelte'
import { type CanvasSize, observeCanvas } from '../../lib/canvas.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import type { SatRec } from '../../lib/sgp4.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import {
  compass,
  footprintDegrees,
  gmtClock,
  type Pass,
  passes,
  satrecOf,
  satState,
  subsolarPoint,
  sunAltitude,
} from './astro.ts'
import {
  CLOCK_CITIES,
  clockFace,
  defaultObserver,
  findCities,
  type Observer,
  observerOf,
  readObserver,
} from './clocks.ts'
import {
  drawGround,
  drawNight,
  drawScene,
  type Frame,
  frameFor,
  type Palette,
  px,
  py,
  rgbOf,
  type TrackPoint,
} from './draw.ts'
import { StarlinkField } from './starlink.ts'

/**
 * ORBIT: the world as mission control's front screen shows it. A flat map with
 * the night side, the lines where clocks change and the hour each zone keeps;
 * the ISS and Tiangong where they are now, with the focused one's ground track
 * lit where it is in sunlight; mission control's GMT day-of-year clock and the
 * world's clocks along the top; and, when asked for, the Starlink constellation.
 *
 * Every position is worked out here from orbital elements that main downloads
 * from CelesTrak twice a day (once a day for Starlink, and only while shown).
 * The observer the passes are worked out for is this pane's own choice, from the
 * bundled city list - no location is asked for and no other pane consulted.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const CITY_ROWS = cities as CityRow[]
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

const observer = $derived<Observer>(
  readObserver(paneState?.observer) ?? defaultObserver(CITY_ROWS, zone),
)
const focusCode = $derived(paneState?.focus === 'CSS' ? 'CSS' : 'ISS')
const show = $derived({
  tracks: paneState?.tracks !== false,
  night: paneState?.night !== false,
  cities: paneState?.cities !== false,
  starlink: paneState?.starlink === true,
})

const setState = (patch: Record<string, unknown>): void => {
  layout.setPaneState(paneId, { ...(paneState ?? {}), ...patch })
}

let stations = $state.raw<OrbitUpdate | null>(null)
let starlink = $state.raw<OrbitUpdate | null>(null)
let canvas = $state<HTMLCanvasElement | null>(null)
let size = $state.raw<CanvasSize | null>(null)
let choosing = $state(false)
let query = $state('')

/** What the header and the readouts say; assigned only when it changes. */
let gmt = $state('')
let faces = $state.raw<{ code: string; time: string; offset: string; night: boolean }[]>([])
let readout = $state.raw({ pos: '—', alt: '—', vel: '—', light: '—', lit: true, pass: '—' })

$effect(() => window.elecdex.orbits.subscribe('stations', (update) => (stations = update)))
$effect(() => {
  if (!show.starlink) {
    starlink = null
    return
  }
  return window.elecdex.orbits.subscribe('starlink', (update) => (starlink = update))
})

/** SGP4 records for the stations, by code. */
const records = $derived.by(() => {
  const out = new Map<string, SatRec>()
  for (const station of STATIONS) {
    const elements = stations?.elements.find((e: OrbitElements) => e.id === station.id)
    const satrec = elements ? satrecOf(elements) : null
    if (satrec !== null) out.set(station.code, satrec)
  }
  return out
})

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const ground = document.createElement('canvas')
const night = document.createElement('canvas')
night.width = 360
night.height = 180
let palette: Palette | null = null
let past: TrackPoint[] = []
let next: TrackPoint[] = []
let upcoming: Pass[] = []
let tracksAt = 0
let passesAt = 0
let nightAt = 0

function readPalette(el: Element): Palette {
  const style = getComputedStyle(el)
  const probe = document.createElement('span')
  el.append(probe)
  const color = (token: string, alpha = 1): string => {
    probe.style.color = `color-mix(in srgb, var(${token}) ${alpha * 100}%, transparent)`
    return getComputedStyle(probe).color
  }
  const font = (token: string) => style.getPropertyValue(token).trim() || 'monospace'
  const palette: Palette = {
    ground: color('--app-bg'),
    land: color('--accent', 0.6),
    grid: color('--panel-rule', 0.8),
    zones: color('--accent', 0.28),
    text: color('--text'),
    muted: color('--text-muted'),
    accent: color('--accent'),
    strong: color('--accent-strong'),
    info: color('--info'),
    warn: color('--warn'),
    ok: color('--ok'),
    mono: font('--font-mono'),
    ui: font('--font-ui'),
    display: font('--font-display'),
  }
  probe.remove()
  return palette
}

$effect(() => {
  const el = canvas
  if (el === null) return
  return observeCanvas(el, (next) => {
    size = next
  })
})

// The ground layer: again for a new size or a new theme, and for nothing else.
$effect(() => {
  const el = canvas
  const s = size
  void appearance.revision
  if (el === null || s === null || s.width === 0) return
  palette = readPalette(el)
  // The night is drawn in the theme's colours too.
  nightAt = 0
  ground.width = el.width
  ground.height = el.height
  const ctx = ground.getContext('2d')
  if (ctx !== null) drawGround(ctx, frameFor(s.width, s.height), palette, s.ratio)
  untrack(() => draw(Date.now()))
})

function recompute(now: number): void {
  const satrec = records.get(focusCode)
  if (satrec !== undefined && now - tracksAt >= 60_000) {
    tracksAt = now
    const sample = (from: number, to: number): TrackPoint[] => {
      const out: TrackPoint[] = []
      for (let t = from; t <= to; t += 30_000) {
        const state = satState(satrec, new Date(t))
        if (state !== null) out.push({ lat: state.lat, lon: state.lon, t, sunlit: state.sunlit })
      }
      return out
    }
    // One orbit behind, two ahead, as the front screen draws it.
    past = sample(now - 93 * 60_000, now)
    next = sample(now, now + 186 * 60_000)
  }
  if (satrec !== undefined && now - passesAt >= 10 * 60_000) {
    passesAt = now
    upcoming = passes(satrec, observer, now, 24)
  }
  if (now - nightAt >= 60_000) {
    nightAt = now
    const ctx = night.getContext('2d')
    const light = document.documentElement.dataset.mode === 'light'
    if (ctx !== null)
      drawNight(ctx, new Date(now), light || palette === null ? null : rgbOf(palette.accent))
  }
}

function draw(now: number): void {
  const el = canvas
  const s = size
  if (el === null || s === null || s.width === 0 || palette === null) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  recompute(now)
  const f = frameFor(s.width, s.height)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, el.width, el.height)
  ctx.drawImage(ground, 0, 0)
  ctx.setTransform(s.ratio, 0, 0, s.ratio, 0, 0)
  if (show.night) {
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(night, f.left, f.top, 360 * f.scale, 180 * f.scale)
  }
  const at = new Date(now)
  const focus = records.get(focusCode)
  const state = focus ? satState(focus, at) : null
  drawScene(ctx, f, palette, {
    at,
    beat: Math.floor(now / 1000) % 2 === 0,
    focus: state ? { code: focusCode, state, past, next } : null,
    others: STATIONS.filter((s) => s.code !== focusCode).flatMap((station) => {
      const satrec = records.get(station.code)
      const other = satrec ? satState(satrec, at) : null
      return other ? [{ code: station.code, state: other }] : []
    }),
    starlink: show.starlink && field !== null ? field.positions : null,
    cities: CLOCK_CITIES.map((c) => ({ ...c, home: c.timeZone === observer.timeZone })),
    observer: { lat: observer.lat, lon: observer.lon, code: observer.name },
    footprintDeg: footprintDegrees(state?.altKm ?? 420),
    show,
  })
  updateReadout(now, state)
  if (pointer !== null) updateTip(now)
  // Where the stations are drawn and how many satellites are, for the tests to aim at.
  el.dataset.stations = JSON.stringify(
    Object.fromEntries(
      STATIONS.flatMap((station) => {
        const satrec = records.get(station.code)
        const where = satrec ? satState(satrec, at) : null
        return where ? [[station.code, [px(f, where.lon), py(f, where.lat)]]] : []
      }),
    ),
  )
  el.dataset.starlink = String(show.starlink && field !== null ? field.placed() : 0)
}

function updateReadout(now: number, state: ReturnType<typeof satState>): void {
  const sign = (v: number, pos: string, neg: string) =>
    `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`
  const value =
    state === null
      ? { pos: '—', alt: '—', vel: '—', light: '—', lit: true, pass: passText(now) }
      : {
          pos: `${sign(state.lat, 'N', 'S')} ${sign(state.lon, 'E', 'W')}`,
          alt: `${state.altKm.toFixed(0)} km`,
          vel: `${state.speedKmS.toFixed(2)} km/s`,
          light: lightText(now, state.sunlit),
          lit: state.sunlit,
          pass: passText(now),
        }
  if (JSON.stringify(value) !== JSON.stringify(readout)) readout = value
}

/** Day or eclipse, and how long until the orbit crosses into the other. */
function lightText(now: number, sunlit: boolean): string {
  const flip = next.find((point) => point.sunlit !== sunlit)
  if (flip === undefined) return sunlit ? 'DAY' : 'ECLIPSE'
  const left = Math.max(0, Math.round((flip.t - now) / 1000))
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  return `${sunlit ? 'DAY · sets' : 'ECLIPSE · rises'} in ${mmss}`
}

/** The next pass the observer can see, else the next pass at all, in the observer's own time. */
function passText(now: number): string {
  const pass = upcoming.find((p) => p.visible && p.end > now) ?? upcoming.find((p) => p.end > now)
  if (pass === undefined) return 'none in 24 h'
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: observer.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(pass.start)
  const path = `${compass(pass.startAzimuth)}→${compass(pass.endAzimuth)}`
  return `${time} · ${Math.round(pass.maxElevation)}° ${path}${pass.visible ? '' : ' · not visible'}`
}

function tick(): void {
  const now = Date.now()
  const at = new Date(now)
  const text = gmtClock(at).text
  if (text !== gmt) gmt = text
  const sun = subsolarPoint(at)
  const nextFaces = CLOCK_CITIES.map((c) => ({
    code: c.code,
    ...clockFace(at, c.timeZone),
    night: sunAltitude(c, sun) < 0,
  }))
  if (JSON.stringify(nextFaces) !== JSON.stringify(faces)) faces = nextFaces
  if (show.starlink) field?.step(now)
  draw(now)
}

// Once a second, on the second, with every other clock in the app; nothing runs while the window is put away.
$effect(() => {
  void records
  void observer
  void focusCode
  untrack(() => {
    tracksAt = 0
    passesAt = 0
    tick()
  })
  return onBoundary(1000, tick)
})

// ---------------------------------------------------------------------------
// Starlink, a slice each second (starlink.ts)
// ---------------------------------------------------------------------------

let field: StarlinkField | null = null

$effect(() => {
  const update = starlink
  field = update !== null && update.elements.length > 0 ? new StarlinkField(update.elements) : null
  return () => {
    field = null
  }
})

// ---------------------------------------------------------------------------
// What is under the pointer
// ---------------------------------------------------------------------------

interface Tip {
  x: number
  y: number
  title: string
  lines: string[]
  station: boolean
}

let pointer: { x: number; y: number } | null = null
let tip = $state.raw<Tip | null>(null)

/** How close the pointer must come to a mark, in CSS pixels. */
const REACH_STATION = 14
const REACH_STARLINK = 6

const julianMs = (satrec: SatRec): number => (satrec.jdsatepoch - 2440587.5) * 86_400_000

/** The lines a tooltip shows for a satellite: where it is, its orbit, and how old its elements are. */
function satLines(satrec: SatRec, id: number, now: number): string[] {
  const state = satState(satrec, new Date(now))
  const lines = [`NORAD ${id}`]
  if (state !== null) {
    const sign = (v: number, pos: string, neg: string) =>
      `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`
    lines.push(`${sign(state.lat, 'N', 'S')} ${sign(state.lon, 'E', 'W')}`)
    lines.push(`ALT ${state.altKm.toFixed(0)} km · VEL ${state.speedKmS.toFixed(2)} km/s`)
    lines.push(state.sunlit ? 'IN SUNLIGHT' : "IN THE EARTH'S SHADOW")
  }
  const period = (2 * Math.PI) / satrec.no
  lines.push(
    `INC ${((satrec.inclo * 180) / Math.PI).toFixed(2)}° · PERIOD ${period.toFixed(1)} min`,
  )
  const age = Math.max(0, Math.round((now - julianMs(satrec)) / 3_600_000))
  lines.push(`ELEMENTS ${age} h old`)
  return lines
}

function stationTip(f: Frame, at: { x: number; y: number }, now: number): Tip | null {
  for (const station of STATIONS) {
    const satrec = records.get(station.code)
    const state = satrec ? satState(satrec, new Date(now)) : null
    if (!satrec || state === null) continue
    if (Math.hypot(px(f, state.lon) - at.x, py(f, state.lat) - at.y) > REACH_STATION) continue
    const lines = satLines(satrec, station.id, now)
    if (station.code === focusCode)
      lines.push(`NEXT PASS · ${observer.name.toUpperCase()} ${readout.pass}`)
    return { x: at.x, y: at.y, title: `${station.code} · ${station.name}`, lines, station: true }
  }
  return null
}

function starlinkTip(f: Frame, at: { x: number; y: number }, now: number): Tip | null {
  if (!show.starlink || field === null) return null
  const positions = field.positions
  let best = -1
  let bestDistance = REACH_STARLINK
  for (let i = 0; i < field.size; i += 1) {
    const lat = positions[i * 2] ?? Number.NaN
    if (Number.isNaN(lat)) continue
    const distance = Math.hypot(px(f, positions[i * 2 + 1] ?? 0) - at.x, py(f, lat) - at.y)
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  }
  const satrec = best < 0 ? null : field.record(best)
  if (satrec === null) return null
  return {
    x: at.x,
    y: at.y,
    title: field.names[best] ?? 'STARLINK',
    lines: satLines(satrec, Number(satrec.satnum), now),
    station: false,
  }
}

/** The tooltip for what is under the pointer; again each second while it rests there, as marks move. */
function updateTip(now: number): void {
  const s = size
  if (pointer === null || s === null) {
    if (tip !== null) tip = null
    return
  }
  const f = frameFor(s.width, s.height)
  tip = stationTip(f, pointer, now) ?? starlinkTip(f, pointer, now)
}

function onPointer(event: PointerEvent): void {
  pointer = { x: event.offsetX, y: event.offsetY }
  updateTip(Date.now())
}

function onLeave(): void {
  pointer = null
  tip = null
}

// ---------------------------------------------------------------------------
// The pane's title, and the observer
// ---------------------------------------------------------------------------

const ago = (at: number | null): string => {
  if (at === null) return 'no elements yet'
  const hours = Math.floor((Date.now() - at) / 3_600_000)
  return hours < 1 ? 'elements <1 h old' : `elements ${hours} h old`
}

$effect(() => {
  const error = stations?.error ?? starlink?.error ?? null
  paneMeta.set(paneId, {
    subtitle: `${focusCode} · ${show.starlink ? `STARLINK ${starlinkCount} · ` : ''}${ago(stations?.fetchedAt ?? null)}`,
    ...(error !== null ? { badge: 'CelesTrak', badgeKind: 'warn' as const } : {}),
  })
})

const starlinkCount = $derived(starlink?.elements.length.toLocaleString('en-US') ?? '…')
const found = $derived(choosing ? findCities(CITY_ROWS, query) : [])

function chooseObserver(row: CityRow): void {
  setState({ observer: observerOf(row) })
  choosing = false
  query = ''
}

const TOGGLES = [
  ['tracks', 'TRACK'],
  ['night', 'TERMINATOR'],
  ['cities', 'CITIES'],
  ['starlink', 'STARLINK'],
] as const
</script>

<div class="orbit" data-testid="orbit" data-pane-id={paneId}>
  <div class="clocks" data-testid="orbit-clocks">
    <div class="clock gmt">
      <span class="code">GMT <span class="dim">DAY</span></span>
      <span class="time" data-testid="orbit-gmt">{gmt}</span>
    </div>
    {#each faces as face (face.code)}
      <div
        class="clock"
        class:night={face.night}
        class:home={CLOCK_CITIES.find((c) => c.code === face.code)?.timeZone === observer.timeZone}
      >
        <span class="code">{face.code} <span class="dim">{face.night ? '☾' : '☼'}</span></span>
        <span class="time">{face.time}</span>
        <span class="offset">{face.offset}</span>
      </div>
    {/each}
  </div>

  <div class="bar">
    {#each STATIONS as station (station.code)}
      <button
        type="button"
        class:on={focusCode === station.code}
        title={station.name}
        data-testid="orbit-focus"
        data-code={station.code}
        onclick={() => setState({ focus: station.code })}>{station.code}</button
      >
    {/each}
    <span class="gap"></span>
    {#each TOGGLES as [key, label] (key)}
      <button
        type="button"
        class:on={show[key]}
        aria-pressed={show[key]}
        data-testid="orbit-toggle"
        data-toggle={key}
        onclick={() => setState({ [key]: !show[key] })}>{label}</button
      >
    {/each}
    <span class="label" id="orbit-observer-label-{paneId}">OBSERVER</span>
    <button
      type="button"
      class="observer"
      title="The place the next pass is worked out for - choose another"
      aria-labelledby="orbit-observer-label-{paneId} orbit-observer-{paneId}"
      id="orbit-observer-{paneId}"
      data-testid="orbit-observer"
      onclick={() => (choosing = !choosing)}>⌖ {observer.name}</button
    >
  </div>

  <div class="map">
    <canvas
      bind:this={canvas}
      onpointermove={onPointer}
      onpointerleave={onLeave}
      data-testid="orbit-map" aria-label="World map with the stations' ground tracks"></canvas>
    {#if tip !== null}
      <div
        class="tip"
        class:station={tip.station}
        class:flip={tip.x > (size?.width ?? 0) - 280}
        style:left="{tip.x}px"
        style:top="{tip.y}px"
        data-testid="orbit-tip"
      >
        <p class="tip-title">{tip.title}</p>
        {#each tip.lines as line (line)}<p>{line}</p>{/each}
      </div>
    {/if}
    {#if choosing}
      <div class="picker" data-testid="orbit-picker">
        <input
          type="text"
          placeholder="city"
          spellcheck="false"
          bind:value={query}
          data-testid="orbit-picker-input"
        />
        <ul>
          {#each found as row (`${row[0]}|${row[1]}|${row[2]}`)}
            <li>
              <button type="button" data-testid="orbit-picker-city" onclick={() => chooseObserver(row)}
                >{row[0]} <span class="dim">{row[1]}, {row[2]}</span></button
              >
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <div class="telemetry" data-testid="orbit-telemetry">
    <div><span class="k">{focusCode} LAT / LON</span><span class="v" data-testid="orbit-pos">{readout.pos}</span></div>
    <div><span class="k">ALT</span><span class="v">{readout.alt}</span></div>
    <div><span class="k">VEL</span><span class="v">{readout.vel}</span></div>
    <div>
      <span class="k">LIGHT</span>
      {#key readout.lit}<span class="v" class:flash={true} class:eclipse={!readout.lit}>{readout.light}</span>{/key}
    </div>
    <div>
      <span class="k">NEXT PASS · {observer.name.toUpperCase()}</span><span class="v" data-testid="orbit-pass"
        >{readout.pass}</span
      >
    </div>
  </div>

  <p class="credit">
    Orbital elements: CelesTrak, from the 18th / 19th Space Defense Squadrons via Space-Track.org.
    Time zones: timezone-boundary-builder, © OpenStreetMap contributors (ODbL). Map: Made with
    Natural Earth.{#if stations?.error}<span class="error"> {stations.error}</span>{/if}
  </p>
</div>

<style>
.orbit {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  /* A pane taller than the map needs keeps it in the middle, not hung from the top. */
  justify-content: center;
  height: 100%;
  min-height: 0;
}

.orbit > * {
  flex: none;
}

.clocks {
  display: flex;
  overflow: hidden;
  border-bottom: 1px solid var(--panel-rule);
}

.clock {
  display: grid;
  overflow: hidden;
  flex: 1 1 0;
  min-width: 4.2rem;
  padding: 0.2rem 0.5rem;
  border-right: 1px solid var(--panel-rule);
}

.clock:last-child {
  border-right: none;
}

.clock.gmt {
  flex: 1.6 1 0;
  min-width: 9rem;
}

.code {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.clock.home .code {
  color: var(--accent-strong);
}

.dim {
  color: var(--text-muted);
  opacity: 0.8;
}

.time {
  font-family: var(--font-display);
  font-size: var(--step-1);
  letter-spacing: 0.05em;
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.gmt .time {
  font-size: var(--step-2);
}

.clock.night .time {
  color: var(--text-muted);
}

.offset {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
}

.gap {
  width: 0.5rem;
}

.bar button {
  padding: 0 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.bar button.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.bar button:hover {
  color: var(--text);
}

/* What the button beside it is for; the button holds only the place, as weather's "place" does. */
.bar .label {
  margin-left: auto;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.bar .observer {
  letter-spacing: 0.04em;
  color: var(--text);
}

.map {
  /*
   * As tall as a map twice as wide as high, plus the hour ruler, so the readouts
   * sit right under it; in a short pane it gives way and the map fits the height.
   */
  position: relative;
  flex: 0 1 calc(50cqw + 16px);
  min-height: 6rem;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/*
 * The tooltip: a small readout pinned beside the mark, flipped to its left near the
 * right edge. It takes no pointer, so moving onto it never loses the mark beneath.
 */
.tip {
  position: absolute;
  z-index: 1;
  min-width: 13rem;
  max-width: 18rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--accent-dim);
  border-left: 2px solid var(--info);
  background: color-mix(in srgb, var(--panel-bg-raised) 92%, transparent);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.45;
  color: var(--text);
  pointer-events: none;
  transform: translate(0.9rem, 0.9rem);
}

.tip.station {
  border-left-color: var(--accent-strong);
}

.tip.flip {
  transform: translate(calc(-100% - 0.9rem), 0.9rem);
}

.tip p {
  margin: 0;
  white-space: nowrap;
}

.tip .tip-title {
  margin-bottom: 0.15rem;
  font-family: var(--font-display);
  font-size: var(--step--1);
  letter-spacing: 0.06em;
  color: var(--accent-strong);
}

.picker {
  position: absolute;
  top: 0.3rem;
  right: 0.5rem;
  z-index: 2;
  width: 16rem;
  max-height: calc(100% - 0.6rem);
  overflow: auto;
  padding: 0.3rem;
  border: 1px solid var(--accent);
  background: var(--panel-bg-raised);
}

.picker input {
  width: 100%;
  padding: 0.1rem 0.35rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
}

.picker ul {
  margin: 0.2rem 0 0;
  padding: 0;
  list-style: none;
}

.picker li button {
  width: 100%;
  padding: 0.05rem 0.3rem;
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  text-align: left;
  cursor: pointer;
}

.picker li button:hover {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.telemetry {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  border-top: 1px solid var(--panel-rule);
}

.telemetry > div {
  display: grid;
  padding: 0.2rem 0.6rem;
  border-right: 1px solid var(--panel-rule);
  min-width: 0;
}

.k {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  color: var(--text-muted);
  white-space: nowrap;
}

.v {
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--accent-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.v.eclipse {
  color: var(--text-muted);
}

/* Sunrise or sunset on the orbit: the reading lights up once as it turns. */
.v.flash {
  animation: orbit-flash calc(900ms * var(--motion-scale)) ease-out backwards;
}

@keyframes orbit-flash {
  from {
    opacity: 0.2;
    filter: brightness(2);
  }
}

.credit {
  margin: 0;
  padding: 0.15rem var(--space-2);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  line-height: 1.3;
  color: var(--text-muted);
}

.error {
  color: var(--warn);
}

@container (max-width: 44rem) {
  .clock:nth-child(n + 7) {
    display: none;
  }

  .gmt .time {
    font-size: var(--step-1);
  }
}

@container (max-width: 28rem) {
  .clock:nth-child(n + 4) {
    display: none;
  }
}
</style>
