<script lang="ts">
import type { SkyGlyph } from '@shared/weather-report'

/**
 * A sky as a HUD glyph, whichever source described it: the main condition large, and a second one
 * small in the corner with "/" for 時々・一時 or an arrow for 後・から.
 *
 * Drawn here rather than using JMA's icon images: the renderer loads nothing
 * from the network, and line art in the accent colour belongs on this screen.
 */
interface Props {
  glyph: SkyGlyph | null
}

const { glyph }: Props = $props()
</script>

{#snippet sky(kind: string)}
  {#if kind === 'clear'}
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
  {:else if kind === 'cloudy'}
    <path d="M6.5 18.5h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.2 3.4 3.4 0 0 0-.8 6.8z" />
  {:else if kind === 'rain'}
    <path d="M6.5 14.5h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.2 3.4 3.4 0 0 0-.8 6.8z" />
    <path d="M8 17l-1 3.5M12 17l-1 3.5M16 17l-1 3.5" />
  {:else if kind === 'snow'}
    <path d="M6.5 14.5h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.2 3.4 3.4 0 0 0-.8 6.8z" />
    <path d="M8 18.5h.01M12 20h.01M16 18.5h.01M10 21.5h.01M14 21.5h.01" stroke-width="2.2" stroke-linecap="round" />
  {:else if kind === 'thunder'}
    <path d="M6.5 13.5h11a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.2 3.4 3.4 0 0 0-.8 6.8z" />
    <path d="M12.5 14l-2.5 4h3l-2 4" />
  {:else}
    <path d="M3.5 8.5h17M5.5 12h13M3.5 15.5h17M6.5 19h11" />
  {/if}
{/snippet}

<span class="sky" title={glyph?.label ?? ''} data-testid="sky-icon" data-sky={glyph?.primary}>
  {#if glyph !== null}
    <svg class="primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
      {@render sky(glyph.primary)}
    </svg>
    {#if glyph.secondary !== null}
      <span class="link">{glyph.transition === 'later' ? '→' : '/'}</span>
      <svg class="secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        {@render sky(glyph.secondary)}
      </svg>
    {/if}
  {/if}
</span>

<style>
.sky {
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  width: var(--sky-size, 2.4rem);
  height: var(--sky-size, 2.4rem);
  color: var(--accent);
}

.primary {
  width: 78%;
  height: 78%;
}

.link {
  position: absolute;
  right: 36%;
  bottom: -4%;
  font-family: var(--font-ui);
  font-size: calc(var(--sky-size, 2.4rem) * 0.28);
  line-height: 1;
  color: var(--text-muted);
}

.secondary {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 44%;
  height: 44%;
}
</style>
