<script lang="ts">
/**
 * Text whose digits roll as they change.
 *
 * Readout has done this since the chrono arrived, but it brings its own type
 * scale and accent colour with it. This is the effect on its own, for a number
 * that already knows how it should look: the clock, whose digits are sized to
 * fill their pane; a market price in a row of them; a plugin's countdown.
 *
 * Each column is keyed by its position, so the element for a column is recreated
 * exactly when the character in it changes - which is when the roll should play,
 * and only there. Nothing is scheduled in JavaScript, an unchanged digit is not
 * touched, and with motion reduced `--motion-scale` takes the duration to zero.
 *
 * Unlike Readout's roll, this one does not flare the phosphor. `filter` repaints
 * the glyph on every frame, which costs nothing at a readout's size but is not
 * free for the clock, whose digits can be a couple of hundred pixels tall and
 * land every second.
 *
 * The caller styles it from the element around it: `--digit-width` gives every
 * digit the same advance, so a figure does not shuffle as it changes, and
 * `--separator-width` and `--separator-opacity` do the same for what is between
 * them. The digits sit in the flow, so a transformed one cannot come to lie over
 * anything; a caller that does draw this over something else wants Readout's
 * `pointer-events: none` as well, or it will swallow the clicks meant for it.
 */

interface Props {
  /** Digits roll; everything else (: . , and spaces) stays where it is. */
  value: string
}

const { value }: Props = $props()

const cells = $derived([...value])
</script>

{#each cells as cell, i (i)}{#if /\d/.test(cell)}{#key cell}<span class="digit fx-digit"
      >{cell}</span
    >{/key}{:else}<span class="separator">{cell}</span>{/if}{/each}

<style>
.digit,
.separator {
  display: inline-block;
  text-align: center;
}

.digit {
  width: var(--digit-width, auto);
}

/*
 * `pre` because a space is a column like any other here, and an inline-block
 * holding nothing but a space would collapse to no width at all - which would
 * close up "3m ago" and "SEP 18" as a plugin's relative times are written.
 */
.separator {
  width: var(--separator-width, auto);
  white-space: pre;
  opacity: var(--separator-opacity, 1);
}
</style>
