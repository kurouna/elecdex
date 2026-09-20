<script lang="ts">
import type { SettingValue } from '@shared/plugin-api'
import { grantFor, type Permissions, type PluginSettings, type SettingDef } from '@shared/plugins'
import ConfirmButton from '../ConfirmButton.svelte'
import { appearance } from '../stores/appearance.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { type PluginEntry, type PluginStatus, plugins } from './plugins.svelte.ts'

/**
 * The plugins section of the settings dialog (docs/plugins.md 8.3, 8.4): every plugin in
 * the folder, whether it runs, what it may do, and its own settings. Turning a plugin on is
 * agreeing to what it asks for, spelled out first; a plugin that later asks for more stops
 * until the user agrees again.
 */

const entries = $derived([...plugins.entries.values()].sort((a, b) => a.key.localeCompare(b.key)))
/** The plugin whose permissions are being shown before it is turned on. */
let asking = $state<string | null>(null)

const STATUS: Record<PluginStatus, string> = {
  loading: 'loading',
  error: 'error',
  newer: 'needs a newer elecdex',
  duplicate: 'duplicate id',
  disabled: 'off',
  consent: 'needs your agreement',
  ready: 'on',
}

const METRIC_WORDS: Record<string, string> = {
  'proc.list': 'the names of the programs running',
  'net.connections': 'the addresses this computer is connected to',
  'net.interface': 'your network address',
  'hardware.system': "this computer's make and model",
  'os.info': 'the operating system and machine name',
}

/** Readings that say something about the user or their machine rather than its load. */
const PERSONAL = new Set([
  'proc.list',
  'net.connections',
  'net.interface',
  'hardware.system',
  'os.info',
])

/**
 * Said when a plugin may both read such readings and reach the internet: a request's address
 * can carry what it read, and the user should know that before agreeing.
 */
function exposure(p: Permissions): string | null {
  const personal = p.metrics.filter((m) => PERSONAL.has(m))
  if (personal.length === 0 || p.hosts.length === 0) return null
  return `It could send ${personal.map((m) => METRIC_WORDS[m]).join(', ')} to ${p.hosts.join(', ')}.`
}

/** Why an enabled plugin waits: a different file now has its id, or it asks for more. */
function consentReason(entry: PluginEntry, stored: PluginSettings | undefined): string | null {
  if (entry.status !== 'consent' || stored === undefined) return null
  if (stored.key !== entry.key) {
    return stored.key === null
      ? `${entry.key} has not been agreed to yet.`
      : `${entry.key} now uses the id you agreed to for ${stored.key}.`
  }
  return 'It now asks for more than you agreed to.'
}

function describe(p: Permissions): string[] {
  return [
    ...p.metrics.map((m) => `read ${METRIC_WORDS[m] ?? `${m} readings`}`),
    ...p.hosts
      .filter((h) => !p.session.includes(h))
      .map((h) => `reach ${h} over the internet, without cookies`),
    ...p.session.map((h) => `use ${h} signed in as you - it sees what that site shows you`),
    ...(p.background ? ['keep running while none of its panes is open'] : []),
    ...(p.notify ? ['play a sound and show system notifications'] : []),
  ]
}

function patch(id: string, change: Partial<PluginSettings> | null): void {
  void appearance.patch({ plugins: { [id]: change } })
}

function turnOn(entry: PluginEntry): void {
  const descriptor = entry.descriptor
  if (descriptor === null) return
  asking = null
  patch(descriptor.id, {
    enabled: true,
    key: entry.key,
    granted: grantFor(descriptor.permissions),
  })
  sfx.play('granted')
}

function toggle(entry: PluginEntry, on: boolean): void {
  const descriptor = entry.descriptor
  if (descriptor === null) return
  if (!on) {
    asking = null
    patch(descriptor.id, { enabled: false })
    return
  }
  if (describe(descriptor.permissions).length === 0) turnOn(entry)
  else asking = descriptor.id
}

function setValue(id: string, def: SettingDef, value: SettingValue): void {
  const current = appearance.settings.plugins[id]?.values ?? {}
  patch(id, { values: { ...current, [def.key]: value } })
}

const currentValue = (id: string, key: string) => plugins.values(id)[key]
const optionsOf = (id: string, def: SettingDef & { type: 'select' }) =>
  plugins.options.get(id)?.[def.key] ?? def.options ?? []

/**
 * Off first, then the data: while the plugin is still granted, main would take its next
 * storage write and bring the deleted file back.
 */
async function forget(id: string): Promise<void> {
  await appearance.patch({ plugins: { [id]: null } })
  await window.elecdex.plugins.forget(id)
}

/**
 * Installing from a folder: main asks the user where, copies what the scanner
 * would read, and answers with what happened (main/plugins/install.ts). The
 * page names no path of its own, and the plugin arrives turned off - it goes
 * through the same consent as one put there by hand.
 */
let installing = $state(false)
let installed = $state<{ name: string; files: number } | null>(null)
let refused = $state<string | null>(null)

async function install(): Promise<void> {
  installing = true
  installed = null
  refused = null
  try {
    const result = await window.elecdex.plugins.install()
    if (result.status === 'installed') installed = { name: result.name, files: result.files }
    else if (result.status === 'refused') refused = result.reason
  } catch (error) {
    refused = error instanceof Error ? error.message : String(error)
  } finally {
    installing = false
  }
}
</script>

<section data-testid="settings-plugins">
  <h3>plugins</h3>
  <p class="note">
    Plugins are files in <code>{plugins.catalog?.folder ?? 'the plugins folder'}</code>. Each runs
    sandboxed, with no access to your files or the network beyond what it lists here. Edits to a
    plugin load as you save.
  </p>
  <div class="row">
    <button type="button" class="link primary" onclick={() => void install()} disabled={installing} data-testid="plugins-install">
      {installing ? 'installing…' : 'install from a folder…'}
    </button>
    <button type="button" class="link" onclick={() => void window.elecdex.plugins.openFolder()} data-testid="plugins-open-folder">
      open plugins folder
    </button>
  </div>
  {#if installed !== null}
    <p class="note" data-testid="plugins-install-note">
      <b>{installed.name}</b> installed, {installed.files}
      {installed.files === 1 ? 'file' : 'files'}. Turn it on below; it asks for what it needs first.
    </p>
  {:else if refused !== null}
    <p class="note problem" data-testid="plugins-install-problem">{refused}</p>
  {/if}
  {#if entries.length === 0}
    <p class="note">No plugins found.</p>
  {/if}
</section>

{#each entries as entry (entry.key)}
  {@const d = entry.descriptor}
  {@const stored = d ? appearance.settings.plugins[d.id] : undefined}
  <section class="plugin" data-testid="settings-plugin" data-plugin={d?.id ?? entry.key} data-status={entry.status}>
    <div class="head">
      <span class="name">{d?.title ?? entry.key}</span>
      <span class="chip status-{entry.status}">{STATUS[entry.status]}</span>
      <code class="file">{entry.key}</code>
      <span class="spacer"></span>
      {#if d}
        <label class="choice">
          <input
            type="checkbox"
            checked={stored?.enabled === true}
            disabled={entry.status === 'duplicate'}
            onchange={(e) => {
              const on = e.currentTarget.checked
              // The box shows the setting: it turns on when settings.json says so, after consent.
              e.currentTarget.checked = stored?.enabled === true
              toggle(entry, on)
            }}
            data-testid="plugin-enabled"
          />
          on
        </label>
      {/if}
    </div>
    {#if d?.description}<p class="note">{d.description}</p>{/if}
    {#if entry.error}<p class="note problem">{entry.error}</p>{/if}

    {#if d && (asking === d.id || entry.status === 'consent')}
      <div class="consent" data-testid="plugin-consent">
        {#if consentReason(entry, stored)}
          <p class="reason" data-testid="plugin-consent-reason">{consentReason(entry, stored)}</p>
        {/if}
        {#if describe(d.permissions).length > 0}
          <p>{d.title} will be able to:</p>
          <ul>
            {#each describe(d.permissions) as line, i (i)}<li>{line}</li>{/each}
          </ul>
        {:else}
          <p>{d.title} asks for no permissions.</p>
        {/if}
        {#if exposure(d.permissions)}<p class="exposure" data-testid="plugin-exposure">{exposure(d.permissions)}</p>{/if}
        <div class="row">
          <button type="button" class="link primary" onclick={() => turnOn(entry)} data-testid="plugin-agree">agree and turn on</button>
          <button
            type="button"
            class="link"
            onclick={() => {
              asking = null
              if (entry.status === 'consent') patch(d.id, { enabled: false })
            }}>{entry.status === 'consent' ? 'turn off' : 'cancel'}</button
          >
        </div>
      </div>
    {:else if d && describe(d.permissions).length > 0}
      <ul class="perms">
        {#each describe(d.permissions) as line, i (i)}<li>{line}</li>{/each}
      </ul>
        {#if exposure(d.permissions)}<p class="exposure" data-testid="plugin-exposure">{exposure(d.permissions)}</p>{/if}
    {/if}

    {#if d && d.settings.length > 0}
      <div class="values">
        {#each d.settings as def (def.key)}
          {@const value = currentValue(d.id, def.key)}
          <label class="row" title={def.description ?? ''}>
            <span>{def.label}</span>
            {#if def.type === 'boolean'}
              <input type="checkbox" checked={value === true} onchange={(e) => setValue(d.id, def, e.currentTarget.checked)} data-testid="plugin-setting" data-key={def.key} />
            {:else if def.type === 'number'}
              <input
                class="path number"
                type="number"
                value={value}
                min={def.min}
                max={def.max}
                step={def.step ?? 1}
                onchange={(e) => {
                  const n = e.currentTarget.valueAsNumber
                  if (Number.isFinite(n)) setValue(d.id, def, n)
                }}
                data-testid="plugin-setting"
                data-key={def.key}
              />
            {:else if def.type === 'select'}
              <select value={value} onchange={(e) => setValue(d.id, def, e.currentTarget.value)} data-testid="plugin-setting" data-key={def.key}>
                {#each optionsOf(d.id, def) as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            {:else}
              <input
                class="path"
                type={def.secret ? 'password' : 'text'}
                value={value}
                placeholder={def.placeholder ?? ''}
                spellcheck="false"
                onchange={(e) => setValue(d.id, def, e.currentTarget.value)}
                data-testid="plugin-setting"
                data-key={def.key}
              />
            {/if}
          </label>
        {/each}
      </div>
    {/if}

    {#if d}
      <div class="row end">
        {#if stored?.enabled}
          {#each d.permissions.session as host (host)}
            <button type="button" class="link" onclick={() => void window.elecdex.plugins.signIn(d.id, host)}>sign in to {host}</button>
          {/each}
          {#if d.permissions.session.length > 0}
            <button type="button" class="link" onclick={() => void window.elecdex.plugins.signOut(d.id)}>sign out</button>
          {/if}
        {/if}
        <ConfirmButton
          label="forget"
          action="delete its data"
          title="Turn the plugin off and delete what it stored and its sign-in"
          testid="plugin-forget"
          onconfirm={() => void forget(d.id)}
        />
      </div>
    {/if}
  </section>
{/each}

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

.choice {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--step--1);
  text-transform: uppercase;
  cursor: pointer;
}

input[type='checkbox'] {
  margin: 0;
  accent-color: var(--accent);
}

select,
input.path {
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

input.path:focus,
select:focus {
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

code {
  font-family: var(--font-mono);
  color: var(--text);
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

button.link:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.plugin {
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

.chip.status-ready {
  border-color: var(--ok);
  color: var(--ok);
}

.chip.status-consent,
.chip.status-newer {
  border-color: var(--warn);
  color: var(--warn);
}

.chip.status-error,
.chip.status-duplicate {
  border-color: var(--danger);
  color: var(--danger);
}

.file {
  font-size: var(--step--2);
  color: var(--text-muted);
}

.spacer {
  flex: 1;
}

.consent {
  margin: var(--space-1) 0 var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--warn);
  background: var(--accent-faint);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.consent p {
  margin: 0;
}

.reason,
.exposure {
  margin: 0 0 var(--space-1);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--warn);
}

.consent ul,
.perms {
  margin: var(--space-1) 0;
  padding-left: 1.2rem;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.values {
  margin-top: var(--space-1);
}

input.number {
  flex: 0 0 6rem;
  min-width: 6rem;
}

button.primary {
  border-color: var(--accent);
  color: var(--accent-strong);
}
</style>
