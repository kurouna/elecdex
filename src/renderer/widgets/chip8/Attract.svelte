<script lang="ts">
import { PREVIEW_FRAMES } from '@shared/chip8/preview'
import type { Chip8Program } from '@shared/chip8-library'
import { appearance } from '../../stores/appearance.svelte.ts'
import { chip8Library } from './library.svelte.ts'
import type { Palette } from './palette.ts'
import { browserHost, Chip8Runner } from './runner.svelte.ts'
import Screen from './Screen.svelte'
import Thumb from './Thumb.svelte'

/**
 * The chosen program playing by itself in the library, as an arcade cabinet's attract
 * mode does (docs/architecture.md section 5.18): no keys, no sound, ten seconds of its own
 * time and then from the start again. It runs only while the library is seen, on the same
 * runner as a game (so out of sight it stops, and a still screen drops to the timer); with
 * motion reduced it is the still preview instead.
 */
interface Props {
  program: Chip8Program
  palette: Palette
  glow: boolean
  dots: boolean
  /** The library is seen: shown, its tab in front, the window on screen. */
  seen: boolean
}

const { program, palette, glow, dots, seen }: Props = $props()

const runner = new Chip8Runner(browserHost(() => {}))
/** The attract loop's length, in the program's own time. */
const LOOP_MS = (PREVIEW_FRAMES / 60) * 1000

let playedMs = 0
let lastAt = 0

$effect(() => {
  const chosen = program
  playedMs = 0
  let current = true
  void chip8Library.rom(chosen.id).then((rom) => {
    if (!current || rom === null) return
    runner.load(chosen, rom, 1)
    lastAt = performance.now()
  })
  return () => {
    current = false
  }
})

$effect(() => {
  runner.setSeen(seen)
  if (seen && runner.status === 'paused') {
    lastAt = performance.now()
    runner.resume()
  }
})

// Round again after ten seconds of it, or once it has stopped by itself.
$effect(() =>
  runner.onFrame(() => {
    const now = performance.now()
    if (runner.status === 'running') playedMs += now - lastAt
    lastAt = now
    if (playedMs >= LOOP_MS || runner.status === 'halted') {
      playedMs = 0
      runner.reset(1)
    }
  }),
)

$effect(() => () => runner.dispose())
</script>

<div class="attract" data-testid="chip8-attract" data-program={program.id}>
  {#if appearance.reducedMotion}
    <Thumb preview={program.preview} {palette} rotation={program.rotation} width={256} height={128} />
  {:else}
    <Screen {runner} {palette} {glow} {dots} mode="integer" rotation={program.rotation} />
  {/if}
</div>

<style>
/* It takes the detail column's spare height, between the least a screen needs and a size
   that leaves the words below it room. */
.attract {
  position: relative;
  flex: 1 1 12rem;
  min-height: 7rem;
  max-height: 24rem;
  display: grid;
  place-items: center;
}
</style>
