<script lang="ts">
import {
  AI_CONTEXT,
  AI_LIMITS,
  AI_PRESETS,
  type AiProvider,
  aiBaseUrl,
  contextWindow,
  freshProviderId,
  isLocalAddress,
  keyMayTravel,
} from '@shared/ai'
import ConfirmButton from '../../ConfirmButton.svelte'
import { ai } from '../../stores/ai.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * The AI section of the settings dialog: the providers the chat pane may ask,
 * and what is said to a model ahead of every conversation.
 *
 * A key typed here goes to main once and is gone from the page: what comes back
 * is only where it is held. Nothing on this page asks a provider anything until
 * "test" is pressed.
 */

const providers = $derived(appearance.settings.ai.providers)

$effect(() => ai.use())

function write(next: AiProvider[]): void {
  // The list holds entries of the settings store: plain copies, or IPC cannot clone them.
  void appearance.patch({ ai: { providers: $state.snapshot(next) } })
}

function change(id: string, fields: Partial<AiProvider>): void {
  write(providers.map((p) => (p.id === id ? { ...p, ...fields } : p)))
}

let preset = $state(AI_PRESETS[0]?.id ?? 'custom')

function add(): void {
  const chosen = AI_PRESETS.find((p) => p.id === preset)
  if (chosen === undefined || providers.length >= AI_LIMITS.providers) return
  const id = freshProviderId(
    chosen.id,
    providers.map((p) => p.id),
  )
  write([
    ...providers,
    { id, name: chosen.name, kind: chosen.kind, baseUrl: chosen.baseUrl, model: chosen.model },
  ])
}

/** The key first, then the provider: a key left behind would be a key nobody can see. */
async function remove(id: string): Promise<void> {
  await window.elecdex.ai.removeKey(id)
  write(providers.filter((p) => p.id !== id))
}

/** What was typed into each provider's key field; cleared the moment it is handed over. */
let typed = $state<Record<string, string>>({})

async function saveKey(id: string): Promise<void> {
  const key = (typed[id] ?? '').trim()
  if (key === '') return
  typed = { ...typed, [id]: '' }
  await window.elecdex.ai.setKey(id, key)
}

const KEY_WORDS = {
  stored: 'key held, encrypted by this computer',
  session: 'key held until elecdex quits - this system cannot encrypt it',
} as const

let tested = $state<Record<string, string>>({})
let testing = $state<string | null>(null)
let modelsOf = $state<Record<string, string[]>>({})

async function test(provider: AiProvider): Promise<void> {
  testing = provider.id
  const result = await window.elecdex.ai.models(provider.id)
  testing = null
  modelsOf = { ...modelsOf, [provider.id]: result.models.map((m) => m.id) }
  tested = {
    ...tested,
    [provider.id]:
      result.error ??
      `ok · ${result.models.length} ${result.models.length === 1 ? 'model' : 'models'}`,
  }
}

const isLocal = (provider: AiProvider): boolean => isLocalAddress(provider.baseUrl)

/** The window typed for a provider; an empty field goes back to what its address suggests. */
function setWindow(provider: AiProvider, field: HTMLInputElement): void {
  const typed = field.value.trim()
  const tokens = Number(typed)
  const { contextTokens: _was, ...rest } = provider
  if (typed === '') write(providers.map((p) => (p.id === provider.id ? rest : p)))
  else if (Number.isInteger(tokens) && tokens >= 0 && tokens <= AI_LIMITS.contextTokens) {
    change(provider.id, { contextTokens: tokens })
  } else field.value = provider.contextTokens === undefined ? '' : String(provider.contextTokens)
}

function windowNote(provider: AiProvider): string {
  const tokens = contextWindow(provider)
  if (tokens === 0) return 'every conversation is sent whole'
  return `up to ${Math.round(tokens * AI_CONTEXT.high)} tokens of a conversation are sent - the oldest messages stay behind`
}

function keyPlaceholder(provider: AiProvider, held: boolean): string {
  if (held) return 'type a new key to replace it'
  return isLocal(provider)
    ? 'none - a local server usually needs none'
    : 'none yet - paste the key for this service'
}

function addressProblem(provider: AiProvider): string | null {
  const url = aiBaseUrl(provider.baseUrl)
  if (url === null) return 'not a usable http(s) address'
  if (ai.keys[provider.id] != null && !keyMayTravel(url)) {
    return 'a key is not sent over plain http beyond this network - use https'
  }
  return null
}
</script>

<section data-testid="settings-ai">
  <h3>ai chat</h3>
  <p class="note">
    The chat pane talks to the providers listed here: a model running on this computer or your
    network (Ollama, LM Studio, llama.cpp - anything that speaks the OpenAI chat API), or a service
    you have an API key for. Messages go to the provider you chose and nowhere else; conversations
    are kept on this computer. Keys are encrypted by the operating system, kept out of
    settings.json, and never shown again.
  </p>
  <div class="row">
    <span>add a provider</span>
    <select bind:value={preset} data-testid="ai-preset">
      {#each AI_PRESETS as p (p.id)}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
    <button
      type="button"
      class="link primary"
      onclick={add}
      disabled={providers.length >= AI_LIMITS.providers}
      data-testid="ai-add"
    >
      add
    </button>
  </div>
</section>

{#each providers as provider (provider.id)}
  {@const held = ai.keys[provider.id] ?? null}
  {@const problem = addressProblem(provider)}
  <section class="provider" data-testid="ai-provider" data-provider={provider.id}>
    <div class="head">
      <span class="name">{provider.name}</span>
      <span class="chip">{isLocal(provider) ? 'local' : 'hosted'}</span>
      <span class="chip">{provider.kind === 'anthropic' ? 'anthropic api' : 'openai api'}</span>
      {#if held !== null}<span class="chip held">key held</span>{/if}
    </div>
    <label class="row">
      <span>name</span>
      <input
        class="path"
        type="text"
        value={provider.name}
        maxlength="40"
        spellcheck="false"
        onchange={(e) => {
          const name = e.currentTarget.value.trim()
          if (name !== '') change(provider.id, { name })
          else e.currentTarget.value = provider.name
        }}
        data-testid="ai-name"
      />
      <select
        value={provider.kind}
        onchange={(e) => change(provider.id, { kind: e.currentTarget.value === 'anthropic' ? 'anthropic' : 'openai' })}
        title="the API the address speaks"
        data-testid="ai-kind"
      >
        <option value="openai">OpenAI compatible</option>
        <option value="anthropic">Anthropic</option>
      </select>
    </label>
    <label class="row">
      <span>address</span>
      <input
        class="path"
        type="text"
        value={provider.baseUrl}
        spellcheck="false"
        placeholder={provider.kind === 'anthropic' ? 'https://api.anthropic.com' : 'http://localhost:11434/v1'}
        onchange={(e) => change(provider.id, { baseUrl: e.currentTarget.value.trim() })}
        data-testid="ai-address"
      />
    </label>
    {#if problem !== null}<p class="note problem" data-testid="ai-address-problem">{problem}</p>{/if}
    <label class="row">
      <span>default model</span>
      <input
        class="path"
        type="text"
        list={`ai-models-${provider.id}`}
        value={provider.model}
        spellcheck="false"
        placeholder="press test to list the provider's models"
        onchange={(e) => change(provider.id, { model: e.currentTarget.value.trim() })}
        data-testid="ai-model"
      />
      <datalist id={`ai-models-${provider.id}`}>
        {#each modelsOf[provider.id] ?? [] as id (id)}<option value={id}></option>{/each}
      </datalist>
    </label>
    <label class="row">
      <span>context window</span>
      <input
        class="path short"
        type="text"
        inputmode="numeric"
        value={provider.contextTokens ?? ''}
        placeholder={isLocal(provider) ? '8192' : 'unlimited'}
        title="The context length of the model at this address, in tokens - for Ollama, the context length it is set to. 0 sends every conversation whole."
        onchange={(e) => setWindow(provider, e.currentTarget)}
        data-testid="ai-context"
      />
      <span class="hint" data-testid="ai-context-note">{windowNote(provider)}</span>
    </label>
    <div class="row">
      <span>api key</span>
      <input
        class="path"
        type="password"
        autocomplete="off"
        value={typed[provider.id] ?? ''}
        placeholder={keyPlaceholder(provider, held !== null)}
        oninput={(e) => (typed = { ...typed, [provider.id]: e.currentTarget.value })}
        onkeydown={(e) => {
          if (e.key === 'Enter') void saveKey(provider.id)
        }}
        data-testid="ai-key"
      />
      <button
        type="button"
        class="link"
        disabled={(typed[provider.id] ?? '').trim() === ''}
        onclick={() => void saveKey(provider.id)}
        data-testid="ai-key-save"
      >
        save key
      </button>
      {#if held !== null}
        <button type="button" class="link" onclick={() => void window.elecdex.ai.removeKey(provider.id)} data-testid="ai-key-remove">
          forget key
        </button>
      {/if}
    </div>
    {#if held !== null}
      <p class="note" class:problem={held === 'session'} data-testid="ai-key-state">{KEY_WORDS[held]}</p>
    {/if}
    <div class="row end">
      {#if tested[provider.id]}
        <output class="result" data-testid="ai-test-result">{tested[provider.id]}</output>
      {/if}
      <button
        type="button"
        class="link"
        disabled={testing !== null || problem !== null}
        onclick={() => void test(provider)}
        title="Ask the provider for its models"
        data-testid="ai-test"
      >
        {testing === provider.id ? 'asking…' : 'test'}
      </button>
      <ConfirmButton
        label="remove"
        action="remove"
        title="Remove the provider and forget its key"
        testid="ai-remove"
        onconfirm={() => void remove(provider.id)}
      />
    </div>
  </section>
{/each}

<section>
  <h3>long conversations</h3>
  <label class="row">
    <span>summarise what no longer fits</span>
    <input
      type="checkbox"
      checked={appearance.settings.ai.compact}
      onchange={(e) => void appearance.patch({ ai: { compact: e.currentTarget.checked } })}
      data-testid="ai-compact"
    />
  </label>
  <p class="note">
    A conversation longer than its provider's context window is sent without its oldest messages;
    the log marks where. With this on, the model is first asked for a summary of what stays behind,
    which is sent along from then on and can be read in the log - one more request to the same
    provider and model, each time the conversation is cut, and a wait before that answer.
  </p>
</section>

<section>
  <h3>system prompt</h3>
  <textarea
    rows="4"
    maxlength={AI_LIMITS.systemPrompt}
    value={appearance.settings.ai.systemPrompt}
    placeholder="Said to the model ahead of every conversation. Empty for none."
    onchange={(e) => void appearance.patch({ ai: { systemPrompt: e.currentTarget.value } })}
    data-testid="ai-system-prompt"
  ></textarea>
</section>

<style>
/* The settings dialog's own look for its sections, rows and controls (its styles are scoped). */
section + section {
  margin-top: var(--space-4);
}

h3 {
  margin: 0 0 var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
  font-family: var(--font-display);
  font-size: var(--step-0);
  font-weight: 400;
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  min-height: 1.9rem;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text);
}

.row > span:first-child {
  min-width: 11rem;
  color: var(--text-muted);
}

.row.end {
  justify-content: flex-end;
}

.result {
  min-width: 0;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-muted);
}

select,
input.path,
textarea {
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0;
  text-transform: none;
}

input.path {
  flex: 1;
  min-width: 12rem;
}

input.short {
  flex: none;
  width: 7rem;
  min-width: 0;
}

.hint {
  flex: 1;
  min-width: 12rem;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-muted);
}

textarea {
  width: 100%;
  padding: var(--space-1);
  resize: vertical;
  font-family: var(--font-ui);
  line-height: 1.4;
}

input.path:focus,
select:focus,
textarea:focus {
  border-color: var(--accent);
  outline: none;
}

.note {
  margin: 0 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--step--1);
  line-height: 1.5;
}

.note.problem {
  color: var(--warn);
}

button.link {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

button.link:not(:disabled):hover {
  color: var(--accent);
  border-color: var(--accent);
}

button.link:disabled {
  opacity: 0.5;
  cursor: default;
}

button.primary {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.provider {
  padding-top: var(--space-2);
  border-top: 1px dashed var(--panel-rule);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
  font-family: var(--font-ui);
}

.name {
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text);
}

.chip {
  padding: 0 0.35rem;
  border: 1px solid var(--panel-border);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.chip.held {
  border-color: var(--ok);
  color: var(--ok);
}
</style>
