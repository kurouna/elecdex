<script lang="ts">
import { ai } from '../../stores/ai.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'

/**
 * TUNE's LINK (docs/elec16.md section 12): whether a program may reach main's services at all,
 * and which provider of the AI settings the AI asks - every one may be chosen, one with no key
 * too (a local server needs none; one that does says so when asked). The settings are the
 * app's, not the pane's: every ELEC-16 pane shares them. Below, why the last request failed,
 * in the service's words, and how many were sent.
 */
interface Props {
  /** LINK requests this pane sent. */
  sent: number
  /** Why the last one failed; null after one that did not. */
  note: string | null
}

const { sent, note }: Props = $props()

$effect(() => ai.use())

const link = $derived(appearance.settings.elec16.link)
const providers = $derived(appearance.settings.ai.providers)

function setLink(change: { on?: boolean; provider?: string }): void {
  sfx.play('panel')
  void appearance.patch({
    elec16: {
      link: {
        on: change.on ?? link.on,
        ai: { provider: change.provider ?? link.ai.provider },
      },
    },
  })
}
</script>

<section data-testid="elec16-link">
  <h3>link</h3>
  <div class="chips" role="radiogroup" aria-label="LINK">
    {#each [false, true] as on (on)}
      <button
        type="button"
        class="e16-chip"
        role="radio"
        aria-checked={link.on === on}
        onclick={() => link.on !== on && setLink({ on })}
        data-testid="elec16-link-on"
        data-on={on}>{on ? 'on' : 'off'}</button
      >
    {/each}
  </div>
  <div class="chips" role="radiogroup" aria-label="AI provider">
    {#each providers as p (p.id)}
      <button
        type="button"
        class="e16-chip"
        role="radio"
        aria-checked={link.ai.provider === p.id}
        onclick={() => link.ai.provider !== p.id && setLink({ provider: p.id })}
        data-testid="elec16-link-provider"
        data-provider={p.id}
        >{p.name}{#if ai.keys[p.id] == null}<span class="nokey">{' · no key'}</span>{/if}</button
      >
    {/each}
  </div>
  {#if providers.length === 0}
    <p class="note">Add a provider in the settings' AI section for the AI to answer.</p>
  {/if}
  <p class="note">
    A program asks the AI with ASK; what it sends goes to the provider chosen here. Off, nothing
    is sent.{#if sent > 0}{' '}<span data-testid="elec16-link-sent">{sent} sent.</span>{/if}
  </p>
  {#if note !== null}
    <p class="note failed" data-testid="elec16-link-note">{note}</p>
  {/if}
</section>

<style>
h3 {
  margin: 0 0 2px;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.chips + .chips {
  margin-top: 2px;
}

/* Fainter than the name, on a chosen chip's ground as on a plain one. */
.nokey {
  opacity: 0.7;
}

.note {
  margin: 2px 0 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.note.failed {
  color: var(--danger);
  overflow-wrap: anywhere;
}
</style>
