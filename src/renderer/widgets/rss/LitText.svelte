<script lang="ts">
import { litParts } from '@shared/feeds-view'

/** A headline with its highlight words and what is searched lit; always text, never HTML. */
interface Props {
  text: string
  highlight: RegExp | null
  find: string
}

const { text, highlight, find }: Props = $props()
const parts = $derived(litParts(text, highlight, find))
</script>

{#each parts as part, i (i)}{#if part.lit}<mark class="lit" data-testid="rss-lit">{part.text}</mark>{:else}{part.text}{/if}{/each}

<style>
.lit {
  padding: 0 0.12em;
  background: var(--accent-strong);
  color: var(--surface-1);
}

:global(:root[data-mode="light"]) .lit {
  color: var(--surface-2);
}
</style>
