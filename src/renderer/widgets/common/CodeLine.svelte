<script lang="ts">
/**
 * A state as a link reports it - a short code in a box - with the words that explain it beside
 * it, never in a tooltip: how an answer ended, why a request was refused. The AI chat and the
 * ELEC council draw the same line, so it is drawn here once.
 */
interface Props {
  code: string
  /** The explanation in its own words (a provider's error), when there is one. */
  detail?: string | undefined
  /** In the warning colour: a failure, or something the user has to act on. */
  warn?: boolean
  testid: string
}

const { code, detail, warn = false, testid }: Props = $props()
</script>

<p class="line" class:warn data-testid={testid}>
  <span class="code">{code}</span>{#if detail}<span class="detail">{detail}</span>{/if}
</p>

<style>
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.line.warn {
  color: var(--warn);
}

.code {
  flex: none;
  padding: 0 0.35rem;
  border: 1px solid currentcolor;
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.detail {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
