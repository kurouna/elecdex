<script lang="ts">
import type { ButtonIcon } from '@shared/plugin-api'

/**
 * The icons a plugin may put on a button, drawn in the button's own colour so they follow the
 * theme and the hover and disabled states. Line icons on a 16px grid, like the rest of the UI.
 */
const { name, busy = false }: { name: ButtonIcon; busy?: boolean } = $props()

/** Icons that are already a circle turn while busy; the rest pulse. */
const TURNS: readonly ButtonIcon[] = ['refresh', 'reset']

const PATHS: Record<ButtonIcon, string> = {
  // Two arrows chasing each other round: fetch again.
  refresh: 'M13 8a5 5 0 1 1-1.46-3.54M13 3v3h-3',
  play: 'M5 3.5v9l7-4.5z',
  pause: 'M5.5 3.5v9M10.5 3.5v9',
  stop: 'M4.5 4.5h7v7h-7z',
  skip: 'M4 3.5v9l6-4.5zM12 3.5v9',
  reset: 'M3 8a5 5 0 1 0 1.46-3.54M3 3v3h3',
  add: 'M8 3.5v9M3.5 8h9',
  remove: 'M3.5 8h9',
  settings:
    'M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4',
  open: 'M9 3h4v4M13 3l-6 6M11.5 9.5v3h-8v-8h3',
}
</script>

<svg
  viewBox="0 0 16 16"
  aria-hidden="true"
  data-icon={name}
  class:turn={busy && TURNS.includes(name)}
  class:pulse={busy && !TURNS.includes(name)}
><path d={PATHS[name]} /></svg>

<style>
svg {
  width: 0.95rem;
  height: 0.95rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* A CSS animation runs on the compositor, and only while the plugin says it is busy. */
.turn {
  animation: turn 0.9s linear infinite;
}
.pulse {
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
/* With motion reduced - by the in-app setting, or by the OS unless the setting says full -
   a turning icon pulses instead: it still says busy, without moving. */
@media (prefers-reduced-motion: reduce) {
  :global(:root:not([data-motion='full'])) .turn {
    animation: pulse 1.2s ease-in-out infinite;
  }
}
:global(:root[data-motion='reduced']) .turn {
  animation: pulse 1.2s ease-in-out infinite;
}

svg[data-icon='play'],
svg[data-icon='skip'] {
  fill: currentColor;
}
</style>
