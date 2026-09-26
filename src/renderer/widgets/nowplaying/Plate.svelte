<script lang="ts">
/**
 * The art, on a plate with its corners cut like the HUD's other frames; with no
 * art, a disc drawn in lines rather than a note, so an empty plate still reads
 * as the pane's own. The art is a data URL main made from what the player gave
 * (a JPEG it shrank), never an address the page would fetch.
 */
const { art, playing }: { art: string | null; playing: boolean } = $props()

const TICKS = Array.from({ length: 24 }, (_, i) => (i * 360) / 24)
</script>

<div class="plate" class:playing data-testid="np-art" data-art={art === null ? 'none' : 'image'}>
  <div class="face">
    {#if art !== null}
      <img src={art} alt="" draggable="false" />
    {:else}
      <svg viewBox="-50 -50 100 100" aria-hidden="true">
        <circle r="40" class="rim" />
        <circle r="29" class="groove" />
        <circle r="21" class="groove" />
        <circle r="9" class="hub" />
        <circle r="2.2" class="spindle" />
        {#each TICKS as angle (angle)}
          <line y1="-44.5" y2={angle % 90 === 0 ? '-48' : '-46.5'} transform="rotate({angle})" />
        {/each}
        <path d="M 0 -34 A 34 34 0 0 1 29.4 -17" class="arc" />
      </svg>
    {/if}
  </div>
</div>

<style>
.plate {
  --cut: 0.7rem;
  flex: none;
  aspect-ratio: 1;
  padding: 1px;
  background: var(--panel-border);
  clip-path: polygon(
    var(--cut) 0,
    100% 0,
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    0 100%,
    0 var(--cut)
  );
}

.plate.playing {
  background: var(--accent);
}

.face {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--app-bg);
  clip-path: inherit;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--accent-dim);
  stroke-width: 0.8;
}

.rim {
  stroke: var(--panel-border);
}

.hub {
  fill: var(--accent-faint);
}

.spindle {
  fill: var(--accent-dim);
  stroke: none;
}

line {
  stroke: var(--panel-rule);
}

.arc {
  stroke: var(--accent);
  stroke-width: 1.4;
}
</style>
