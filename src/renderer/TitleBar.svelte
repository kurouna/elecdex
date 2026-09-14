<script lang="ts">
import { cssColorToHex as toHex } from '@shared/title-bar'
import { appearance } from './stores/appearance.svelte.ts'
import { windowState } from './stores/window-state.svelte.ts'

/**
 * The window's title bar, drawn by the page so it can wear the theme.
 *
 * The native one cannot be coloured, so the window hides it (titleBarStyle
 * 'hidden'). The OS still draws its window controls over this strip - top right
 * on Windows and Linux, where they are recoloured to match through
 * setTitleBarOverlay, and the traffic lights top left on macOS. The CSS
 * titlebar-area environment variables keep the text clear of them. Absent in
 * fullscreen, where there is no title bar to replace.
 */
interface Props {
  platform: NodeJS.Platform | null
}

const { platform }: Props = $props()

let probe = $state<HTMLSpanElement | null>(null)
const fullscreen = $derived(windowState.fullscreen)

windowState.follow()

// Repaint the native controls whenever the theme changes.
$effect(() => {
  void appearance.revision
  const el = probe
  if (el === null || fullscreen) return
  const style = getComputedStyle(el)
  const background = toHex(style.backgroundColor)
  const symbols = toHex(style.color)
  if (background && symbols) window.elecdex.system.setTitleBarColors({ background, symbols })
})
</script>

{#if !fullscreen}
  <header class="titlebar" class:mac={platform === 'darwin'} data-testid="titlebar">
    <span class="title" bind:this={probe}>elecdex</span>
  </header>
{/if}

<style>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  flex: 0 0 auto;
  /* The native controls overlay this area; keep the text inside what is left. */
  padding-left: env(titlebar-area-x, 0);
  width: env(titlebar-area-width, 100%);
  background: var(--app-bg);
  border-bottom: 1px solid var(--panel-rule);
  -webkit-app-region: drag;
  user-select: none;
}

.titlebar.mac {
  padding-left: 78px;
}

.title {
  background: var(--app-bg);
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wider);
}
</style>
