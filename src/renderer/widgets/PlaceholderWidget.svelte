<script lang="ts">
import type { WidgetProps } from './registry.ts'

/**
 * Stands in for the monitoring widgets until phase 3 provides the metrics they
 * read.
 *
 * It exists so the default layout is real and the layout engine can be
 * exercised end to end now, rather than waiting on the metrics broker. Each
 * instance names the widget it is holding a place for.
 */
const { title }: WidgetProps = $props()
</script>

<div class="placeholder" data-testid="placeholder">
  <span class="name">{title}</span>
  <span class="note">phase 3</span>
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
