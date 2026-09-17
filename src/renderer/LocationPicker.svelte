<script lang="ts">
import cities from '@shared/geo/cities.json'
import type { OfficeInfo } from '@shared/weather'
import { type CityRow, type PlaceChoice, searchPlaces, sourceName } from '@shared/weather-places'
import { backdropShade, dialogDelay, dialogPower } from './lib/dialog-transitions.ts'
import { sfx } from './stores/sound.svelte.ts'
import { ui } from './stores/ui.svelte.ts'

/**
 * Where a weather pane forecasts: a searchable list of every city of half a
 * million people or more and every capital, bundled so that nothing typed here
 * leaves the machine. Japanese places resolve to their JMA forecast office (and
 * JMA's own office list is searchable too), US cities use the National Weather
 * Service, everywhere else MET Norway. Coordinates typed as "lat, lon" are a
 * place of their own.
 *
 *   ↑ ↓  choose     Enter  use it     Esc  close
 */

const regions = new Intl.DisplayNames('en', { type: 'region' })
const countryName = (code: string): string => {
  try {
    return regions.of(code) ?? code
  } catch {
    return code
  }
}
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

let filter = $state('')
let selected = $state(0)
let input = $state<HTMLInputElement | null>(null)
let list = $state<HTMLUListElement | null>(null)
let offices = $state.raw<OfficeInfo[]>([])

const request = $derived(ui.locationRequest)

$effect(() => {
  if (request === null) return
  filter = ''
  selected = 0
  queueMicrotask(() => input?.focus())
  // JMA's office list comes from JMA; without it Japanese cities still resolve.
  void window.elecdex.weather
    .offices()
    .then((list) => {
      offices = list
    })
    .catch(() => {})
})

const choices = $derived(
  searchPlaces(filter, { cities: cities as CityRow[], offices, countryName, timeZone }),
)

$effect(() => {
  if (selected >= choices.length) selected = Math.max(0, choices.length - 1)
})

// Keep the selected row in view as the arrow keys move past the edge.
$effect(() => {
  void selected
  list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
})

function choose(choice: PlaceChoice | undefined): void {
  if (!choice || request === null) return
  request.choose(choice.location)
  sfx.play('granted')
  ui.closeLocationPicker()
}

function onKeydown(event: KeyboardEvent): void {
  if (request === null) return
  const take = () => {
    event.preventDefault()
    event.stopPropagation()
  }
  switch (event.key) {
    case 'Escape':
      take()
      ui.closeLocationPicker()
      return
    case 'ArrowDown':
      take()
      selected = (selected + 1) % Math.max(1, choices.length)
      return
    case 'ArrowUp':
      take()
      selected = (selected - 1 + choices.length) % Math.max(1, choices.length)
      return
    case 'Enter':
      take()
      choose(choices[selected])
      return
  }
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if request !== null}
  <!-- The backdrop closes on click; the keyboard path is Escape, handled above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" transition:backdropShade onpointerdown={(e) => e.target === e.currentTarget && ui.closeLocationPicker()}>
    <div class="picker crt-on" style:--crt-delay={dialogDelay()} transition:dialogPower role="dialog" aria-modal="true" aria-label="Weather location" data-testid="location-picker">
      <header class="hud-label">
        <span>weather location</span>
        <span>↑↓ choose · enter use · esc close</span>
      </header>
      <div class="shell-frame body">
        <input
          bind:this={input}
          bind:value={filter}
          class="filter"
          placeholder="city, country, or lat, lon"
          spellcheck="false"
          data-testid="location-filter"
        />
        <p class="current">now: <strong>{request.current.name}</strong> · {sourceName(request.current.source)}</p>

        <ul class="list" role="listbox" aria-label="Places" bind:this={list}>
          {#each choices as choice, i (choice.id)}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={i === selected}
                class:selected={i === selected}
                onpointerenter={() => (selected = i)}
                onclick={() => choose(choice)}
                data-testid="location-choice"
                data-source={choice.source}
              >
                <span class="title">{choice.title}</span>
                <span class="detail">{choice.detail}</span>
                <span class="source">{sourceName(choice.source)}</span>
              </button>
            </li>
          {:else}
            <li class="empty">no place matches “{filter}” - try a larger city nearby, or type lat, lon</li>
          {/each}
        </ul>

        <footer class="credits">
          Places: GeoNames (CC BY 4.0). Forecasts: JMA in Japan, the National Weather Service in the United States, MET Norway elsewhere.
        </footer>
      </div>
    </div>
  </div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.picker {
  --crt-duration: 380ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(46rem, 90vw);
  height: min(34rem, 80vh);
  background: var(--app-bg);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-height: 0;
  padding: var(--space-3);
}

.filter {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step-0);
  outline: none;
}

.filter:focus {
  border-color: var(--accent);
}

.current {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.current strong {
  color: var(--text);
  font-weight: 600;
}

.list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.list button {
  display: grid;
  grid-template-columns: minmax(8rem, 14rem) 1fr auto;
  align-items: baseline;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.list button.selected {
  border-left-color: var(--accent);
  background: var(--accent-faint);
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-size: var(--step-0);
  letter-spacing: 0.04em;
}

.detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.source {
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.empty {
  padding: var(--space-3);
  color: var(--text-muted);
  font-size: var(--step--1);
}

.credits {
  padding-top: var(--space-2);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
