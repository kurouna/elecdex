import { tick } from 'svelte'

/**
 * Lets a mounted component's effects, the IPC answers they wait on and the renders those
 * cause run out before a test reads the page. Each Svelte tick ends by flushing what is
 * pending, so no `flushSync` is needed after. Five ticks cover most panes (an answer, its
 * effect, its render); a file whose components chain more says how many.
 */
export async function settle(ticks = 5): Promise<void> {
  for (let i = 0; i < ticks; i++) await tick()
}
