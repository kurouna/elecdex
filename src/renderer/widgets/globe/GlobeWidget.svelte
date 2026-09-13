<script lang="ts">
import type { ConnectionCountry } from '@shared/metrics'
import { Color } from 'three'
import { onFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import { homeFromTimeZone } from './geo.ts'
import { type GlobeColors, GlobeScene } from './globe-scene.ts'

/**
 * eDEX-UI's world view: a spinning globe with this machine's position and the
 * places it is connected to.
 *
 *  - Connections come from the net.connections source: established TCP peers,
 *    placed by country with a GeoIP database bundled in the app. No address is
 *    sent anywhere to be looked up.
 *  - "Here" is the country of the system time zone, rather than eDEX-UI's
 *    request to an online IP-lookup service - and never the OS location service,
 *    which would prompt the user. If the zone names no country, the pane says so
 *    once in the middle of the globe; nothing is retried.
 *  - The globe draws on the charts' shared frame loop - ten frames a second, on
 *    the same wake-ups as every chart - none while the pane or window is hidden,
 *    and holds still when motion is reduced. Measured on the default layout, each
 *    extra wake-up rate was costly: a globe on its own 15 fps timer added ~10% of
 *    a core, at 10 fps ~7%; sharing the chart loop avoids waking the compositor
 *    separately for it.
 */
const { paneId }: WidgetProps = $props()

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
const home = homeFromTimeZone(zone)

const connections = $derived(metrics.get('net.connections'))
const ping = $derived(metrics.get('net.ping'))
const offline = $derived(ping !== null && ping.ms === null && (connections?.total ?? 0) === 0)
const countries = $derived<ConnectionCountry[]>(connections?.countries ?? [])

let canvas = $state<HTMLCanvasElement | null>(null)
let failed = $state<string | null>(null)
let scene: GlobeScene | null = null

$effect(() => {
  paneMeta.set(paneId, {
    subtitle: home ? `endpoint ${home.lat.toFixed(2)}, ${home.lon.toFixed(2)}` : 'endpoint unknown',
  })
})

function readColors(el: Element): GlobeColors {
  const style = getComputedStyle(el)
  const n = (name: string, fallback: number) =>
    Number.parseFloat(style.getPropertyValue(name)) || fallback
  const accent = new Color().setHSL(
    n('--accent-h', 183) / 360,
    n('--accent-s', 22) / 100,
    n('--accent-l', 74) / 100,
  )
  const surface = new Color(style.getPropertyValue('--app-bg').trim() || '#05080d')
  return { accent, surface }
}

// The scene: built once per canvas, driven by its own frame timer.
$effect(() => {
  const el = canvas
  if (el === null) return
  try {
    scene = new GlobeScene(el, readColors(el))
  } catch (error) {
    failed = error instanceof Error ? error.message : String(error)
    return
  }
  const s = scene
  s.setHome(home)

  const resize = () => {
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      s.resize(el.clientWidth, el.clientHeight, window.devicePixelRatio || 1)
    }
  }
  const observer = new ResizeObserver(resize)
  observer.observe(el)
  resize()

  let lastStill = 0
  const stop = onFrame((now) => {
    if (el.clientWidth === 0) return // a background tab
    const spin = !appearance.reducedMotion
    // Holding still, a redraw a second is enough to keep the pins current.
    if (!spin && now - lastStill < 1000) return
    lastStill = now
    s.render(now, spin)
  })

  el.addEventListener('webglcontextlost', onContextLost)

  return () => {
    stop()
    observer.disconnect()
    el.removeEventListener('webglcontextlost', onContextLost)
    s.dispose()
    scene = null
  }
})

function onContextLost(event: Event): void {
  event.preventDefault()
  failed = 'the graphics context was lost'
}

$effect(() => {
  scene?.setConnections(countries)
})

$effect(() => {
  void appearance.revision
  if (scene !== null && canvas !== null) scene.setColors(readColors(canvas))
})

const topCountries = $derived(countries.slice(0, 6))
</script>

<div class="globe" class:offline data-testid="globe">
  {#if failed !== null}
    <p class="failed" data-testid="globe-failed">world view unavailable: {failed}</p>
  {:else}
    <canvas bind:this={canvas} class="canvas" data-testid="globe-canvas"></canvas>
  {/if}

  {#if home === null}
    <!-- Decided once from the time zone: there is nothing to retry. -->
    <div class="overlay notice" data-testid="globe-no-location">
      <p class="headline">location unavailable</p>
      <p class="detail">
        This machine's location could not be determined from its time zone ({zone}).
        Connections are still shown; there is no "you are here" marker.
      </p>
    </div>
  {:else if offline}
    <p class="overlay">offline</p>
  {/if}

  <footer class="legend">
    <div class="counts" data-testid="globe-counts">
      <span><strong>{connections?.total ?? 0}</strong> connections</span>
      <span><strong>{countries.length}</strong> countries</span>
      <span class="zone">{home ? `${zone} · ${home.country}` : zone}</span>
    </div>
    <ul class="countries" data-testid="globe-countries">
      {#each topCountries as c (c.code)}
        <li data-code={c.code}><span>{c.code}</span> {c.count}</li>
      {/each}
    </ul>
    <p class="credit">GeoIP: NRO, CC BY 4.0 · map: Natural Earth</p>
  </footer>
</div>

<style>
.globe {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family: var(--font-ui);
}

.canvas {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: block;
}

.offline .canvas {
  opacity: 0.35;
}

.overlay {
  position: absolute;
  inset: 0 0 4rem;
  display: grid;
  place-items: center;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--step-2);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--danger);
  pointer-events: none;
}

.notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  text-align: center;
  color: var(--warn);
}

.notice p {
  margin: 0;
}

.notice .headline {
  font-size: var(--step-1);
}

.notice .detail {
  max-width: 22rem;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: normal;
  text-transform: none;
  color: var(--text-muted);
}

.failed {
  flex: 1;
  margin: 0;
  padding: var(--space-3);
  color: var(--warn);
  font-size: var(--step--1);
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: var(--space-1) var(--space-1) 0;
  border-top: 1px solid var(--panel-rule);
  font-size: var(--step--1);
  text-transform: uppercase;
}

.counts {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
}

.counts strong {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--accent-strong);
}

.zone {
  margin-left: auto;
  color: var(--text-muted);
  text-transform: none;
}

.countries {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 1.1em;
  color: var(--text-muted);
}

.countries span {
  color: var(--text);
  font-weight: 600;
}

.credit {
  margin: 0;
  font-size: var(--step--2);
  color: var(--text-muted);
  opacity: 0.7;
  text-transform: none;
}
</style>
