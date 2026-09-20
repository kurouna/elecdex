<script lang="ts">
/**
 * A large numeric readout whose digits roll when they change.
 *
 * eDEX-UI's big numbers simply swapped. Rolling only the digits that actually
 * moved is what makes a readout look like a machine rather than a label: the
 * tenths spin, the minutes sit still, and the eye is drawn to the part that is
 * changing.
 *
 * The roll is a CSS animation on an element Svelte recreates for the new digit
 * (`{#key}`), so nothing is scheduled in JavaScript and an unchanged digit is
 * not touched at all. With motion reduced the animation has no duration and the
 * digit simply appears.
 *
 * The tail does not roll. It is for tenths, which change twice in the length of
 * a roll: the digit never landed, so it was never sharp, and with an animation
 * always running the compositor drew at the display's rate for as long as the
 * stopwatch ran. Measured with the stopwatch on its own: 33% of one core with
 * the tail rolling, 11% without. The tenths change where they stand, ten times a
 * second, which is what reads as a spin.
 */

interface Props {
  /** The text to show. Digits roll; everything else (: . ,) stays put. */
  value: string
  /** Dimmer trailing part, for tenths or a unit. */
  tail?: string | undefined
  /** Type scale token for the main text. */
  size?: 'step-2' | 'step-3' | 'step-4'
  /** Colour token: the accent by default, or a status colour as a deadline nears. */
  tone?: 'accent' | 'warn' | 'danger' | 'ok'
  testid?: string | undefined
  label?: string | undefined
}

const { value, tail, size = 'step-3', tone = 'accent', testid, label }: Props = $props()

/**
 * Split into characters, each with the index it keeps across renders.
 *
 * Keying by position rather than by the character is deliberate: the element for
 * a given column is recreated when the character in that column changes, which
 * is exactly when the roll should play.
 */
const cells = $derived([...value])
</script>

<span
  class="readout {tone}"
  style:--readout-size="var(--{size})"
  data-testid={testid}
  aria-label={label}
  role={label ? 'status' : undefined}
>
  {#each cells as cell, i (i)}
    {#if /\d/.test(cell)}
      {#key cell}<span class="digit">{cell}</span>{/key}
    {:else}
      <span class="fixed">{cell}</span>
    {/if}
  {/each}
  {#if tail !== undefined}
    <span class="tail">
      {#each [...tail] as cell, i (i)}
        <span class={/\d/.test(cell) ? 'still' : 'fixed'}>{cell}</span>
      {/each}
    </span>
  {/if}
</span>

<style>
/*
 * A readout is an instrument, not something to click on - and it must not take a
 * click meant for what is under it. A digit rolls in from half a line below, and
 * the browser hit-tests where a transform puts a box: for those few frames every
 * second the number lay over the buttons beneath it and swallowed whatever was
 * pressed there. Found as a lost click on the chrono's reset.
 */
.readout {
  pointer-events: none;
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--readout-size);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--accent-strong);
  white-space: nowrap;
}

.readout.warn { color: var(--warn); }
.readout.danger { color: var(--danger); }
.readout.ok { color: var(--ok); }

.digit,
.still,
.fixed {
  display: inline-block;
  /* A fixed advance keeps the row still while a digit rolls through it. */
  min-width: 0.62em;
  text-align: center;
}

.fixed {
  min-width: auto;
  opacity: 0.7;
}

.tail {
  font-size: 0.55em;
  opacity: 0.65;
  margin-left: 0.15em;
}

.digit {
  animation: roll calc(200ms * var(--motion-scale)) var(--ease-out) backwards;
}

/* Up and in, with the phosphor flaring for the first frame - the way a fresh
   number lands on a tube rather than being painted on. */
@keyframes roll {
  from {
    transform: translateY(0.55em);
    opacity: 0;
    filter: brightness(2.2);
  }
  60% {
    filter: brightness(1.5);
  }
  to {
    transform: none;
    opacity: 1;
    filter: none;
  }
}
</style>
