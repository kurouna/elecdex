<script lang="ts">
/**
 * The sliders icon in a widget's top-right corner that opens its settings, in
 * every pane that has any (weather, calendar, RSS, quakes). The widget owns the
 * open state and draws the panel - or, for settings of the app's, opens the
 * settings dialog; this is only the switch, so every pane's looks the same.
 */
interface Props {
  open: boolean
  label: string
  testid: string
  ontoggle: () => void
}

const { open, label, testid, ontoggle }: Props = $props()
</script>

<button
  type="button"
  class="settings-toggle"
  aria-label={label}
  title={label}
  aria-expanded={open}
  onclick={ontoggle}
  data-testid={testid}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
</button>

<style>
.settings-toggle {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 1.4rem;
  height: 1.4rem;
  padding: 0.15rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.settings-toggle:hover,
.settings-toggle[aria-expanded='true'] {
  color: var(--accent);
}
</style>
