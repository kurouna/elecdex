<script lang="ts">
import type { WidgetProps } from './registry.ts'

/**
 * Stands in for a widget whose implementation has not landed yet (the globe
 * arrives with GeoIP in phase 6, the filesystem browser in phase 4), so the
 * default layout keeps its shape in the meantime.
 */
const { title }: WidgetProps = $props()
</script>

<div class="placeholder" data-testid="placeholder">
  <span class="name">{title}</span>
  <span class="note">not yet available</span>
</div>

<style>
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 100%;
  padding: var(--space-3);
  text-align: center;
}

.name {
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.note {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  opacity: 0.5;
}
</style>
