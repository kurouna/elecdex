<script lang="ts">
/**
 * Line-art icons for the file browser, drawn in the accent colour.
 *
 * eDEX-UI shipped a large per-extension icon set; a handful of HUD-style glyphs
 * keeps the grid readable at a glance and adds no third-party assets.
 */
interface Props {
  kind: 'dir' | 'dirlink' | 'file' | 'symlink' | 'other' | 'up' | 'drive'
}

const { kind }: Props = $props()
</script>

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
  {#if kind === 'dir' || kind === 'dirlink'}
    <path d="M2.5 6.5h7l2 2h10v11h-19z" />
    <path d="M2.5 10.5h19" opacity="0.5" />
    {#if kind === 'dirlink'}
      <path d="M9 17l3-3m0 0h-2.5m2.5 0v2.5" />
    {/if}
  {:else if kind === 'file' || kind === 'other'}
    <path d="M5.5 2.5h9l4 4v15h-13z" />
    <path d="M14.5 2.5v4h4" />
    {#if kind === 'file'}
      <path d="M8 11h8M8 14h8M8 17h5" opacity="0.5" />
    {/if}
  {:else if kind === 'symlink'}
    <path d="M5.5 2.5h9l4 4v15h-13z" />
    <path d="M9 16l5-5m0 0h-3.5m3.5 0v3.5" />
  {:else if kind === 'up'}
    <path d="M12 19V6m0 0l-5 5m5-5l5 5" />
    <path d="M5 3.5h14" opacity="0.5" />
  {:else if kind === 'drive'}
    <rect x="2.5" y="6.5" width="19" height="11" />
    <path d="M2.5 13.5h19" opacity="0.5" />
    <circle cx="17.5" cy="15.5" r="0.8" fill="currentColor" />
  {/if}
</svg>
