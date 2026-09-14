<script lang="ts">
import type { StartDirectory } from '@shared/api'
import {
  availableOn,
  chordFromEvent,
  conflicts,
  effectiveBindings,
  formatChord,
  KEYBINDING_ACTIONS,
  type KeybindingAction,
  withBinding,
} from '@shared/keybindings'
import { INTENSITIES, intensityLabel, MAGNITUDES, resolveQuakeSource } from '@shared/quakes'
import type { Settings, SettingsPatch } from '@shared/settings'
import type { UpdateStatus } from '@shared/updates'
import ConfirmButton from './ConfirmButton.svelte'
import { appearance } from './stores/appearance.svelte.ts'
import { sfx } from './stores/sound.svelte.ts'
import { ui } from './stores/ui.svelte.ts'
import { updates } from './stores/updates.svelte.ts'

/**
 * Settings, in the app: appearance and sound, the terminal's start folder, the
 * launcher, keyboard shortcuts, alerts and the update check. Everything here writes through settings.patch, so it
 * lands in settings.json and a hand edit to that file shows up here at once.
 * Launcher entries, themes and window options stay in files; the dialog links
 * to them.
 *
 *   Esc   close (or cancel recording a shortcut)
 */

type Section = 'general' | 'keyboard' | 'alerts' | 'updates'
const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'general', label: 'general' },
  { id: 'keyboard', label: 'keyboard' },
  { id: 'alerts', label: 'alerts' },
  { id: 'updates', label: 'updates' },
]

let section = $state<Section>('general')
let version = $state('')
let dialog = $state<HTMLDivElement | null>(null)
let returnFocus: HTMLElement | null = null

/** The action whose shortcut is being recorded, and why the last key was refused. */
let recording = $state<KeybindingAction | null>(null)
let refusal = $state<string | null>(null)
let checking = $state(false)

const settings = $derived(appearance.settings)
const platform = window.elecdex.system.platform
const bindings = $derived(effectiveBindings(settings.keybindings, platform))
const clashes = $derived(conflicts(settings.keybindings, platform))
/** The earthquake source in effect, as main resolves `auto` from the same time zone and locale. */
const magnitudeChoices = $derived(
  [...new Set<number>([...MAGNITUDES, settings.quakes.minMagnitude])].sort((a, b) => a - b),
)
const quakeSource = $derived(
  resolveQuakeSource(
    settings.quakes.source,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ),
)
/** Only the actions this platform has: a shortcut that does nothing here would only confuse. */
const actions = KEYBINDING_ACTIONS.filter((action) => availableOn(action.id, platform))

$effect(() => {
  if (!ui.settingsOpen) return
  const asked = SECTIONS.find((s) => s.id === ui.settingsSection)
  if (asked) section = asked.id
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  updates.init()
  void window.elecdex.system.info().then((info) => {
    version = info.version
  })
  queueMicrotask(() => dialog?.focus())
  return () => {
    stopRecording()
    returnFocus?.focus()
    returnFocus = null
  }
})

function patch(change: SettingsPatch): void {
  void appearance.patch(change)
}

/** Where new shells start under the setting, as main resolves it: the folder, or home when it is not one. */
let startDirectory = $state<StartDirectory | null>(null)

$effect(() => {
  const setting = settings.terminal.startDirectory
  if (!ui.settingsOpen) return
  let current = true
  void window.elecdex.settings.startDirectory().then((resolved) => {
    // A reply to an older setting must not overwrite the answer to the newer one.
    if (current && setting === settings.terminal.startDirectory) startDirectory = resolved
  })
  return () => {
    current = false
  }
})

async function chooseStartDirectory(): Promise<void> {
  const chosen = await window.elecdex.settings.chooseStartDirectory()
  if (chosen !== null) patch({ terminal: { startDirectory: chosen } })
}

function close(): void {
  ui.closeSettings()
}

function startRecording(action: KeybindingAction): void {
  recording = action
  refusal = null
  ui.recordingShortcut = true
}

function stopRecording(): void {
  recording = null
  refusal = null
  ui.recordingShortcut = false
}

function setBinding(action: KeybindingAction, chord: string | null | undefined): void {
  patch({
    keybindings: withBinding(settings.keybindings, action, chord) as Settings['keybindings'],
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (!ui.settingsOpen) return
  if (recording !== null) {
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      stopRecording()
      return
    }
    const chord = chordFromEvent(event)
    if (chord === null) {
      // A lone modifier is the start of a chord; anything else cannot be a shortcut.
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        refusal = 'use Ctrl, Alt or a function key - the shell needs the rest'
      }
      return
    }
    setBinding(recording, chord)
    sfx.play('granted')
    stopRecording()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
}

async function checkNow(): Promise<void> {
  checking = true
  try {
    await updates.check()
  } finally {
    checking = false
  }
}

const labelOf = (action: KeybindingAction): string =>
  KEYBINDING_ACTIONS.find((a) => a.id === action)?.label ?? action

function describeUpdate(status: UpdateStatus): string {
  const when = 'checkedAt' in status ? new Date(status.checkedAt).toLocaleString('en-GB') : ''
  switch (status.state) {
    case 'idle':
      return 'not checked yet'
    case 'disabled':
      return 'daily check is off'
    case 'checking':
      return 'checking…'
    case 'current':
      return status.latest === null
        ? `no release published yet · checked ${when}`
        : `up to date (latest ${status.latest}) · checked ${when}`
    case 'available':
      return `${status.latest} is available · checked ${when}`
    case 'error':
      return `could not check: ${status.error} · ${when}`
  }
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if ui.settingsOpen}
  <!-- The backdrop closes on click; the keyboard path is Escape, handled above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onpointerdown={(e) => e.target === e.currentTarget && close()}>
    <div
      class="dialog crt-on"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      tabindex="-1"
      bind:this={dialog}
      data-testid="settings-dialog"
    >
      <header class="hud-label">
        <span>settings</span>
        <span>esc close · saved to settings.json as you go</span>
      </header>
      <div class="shell-frame body">
        <nav class="sections" aria-label="Sections">
          {#each SECTIONS as s (s.id)}
            <button
              type="button"
              class:active={section === s.id}
              aria-current={section === s.id ? 'page' : undefined}
              onclick={() => {
                stopRecording()
                section = s.id
              }}
              data-testid="settings-section"
              data-section={s.id}
            >
              {s.label}
            </button>
          {/each}
          <span class="spacer"></span>
          <button type="button" class="file" onclick={() => void window.elecdex.settings.openFile()} data-testid="settings-open-file">
            settings.json
          </button>
          <button type="button" class="close" onclick={close} data-testid="settings-close">close</button>
        </nav>

        <div class="content">
          {#if section === 'general'}
            <section>
              <h3>appearance</h3>
              <label class="row">
                <span>theme</span>
                <select
                  value={appearance.theme.id}
                  onchange={(e) => {
                    patch({ theme: e.currentTarget.value })
                    sfx.play('theme')
                  }}
                  data-testid="settings-theme"
                >
                  {#each appearance.catalog.themes as theme (theme.id)}
                    <option value={theme.id}>{theme.name}</option>
                  {/each}
                </select>
                <button
                  type="button"
                  class="link"
                  onclick={() => void window.elecdex.themes.folder().then((dir) => window.elecdex.system.revealInFolder(dir))}
                >
                  themes folder
                </button>
              </label>
              <div class="row" role="radiogroup" aria-label="Motion">
                <span>motion</span>
                {#each ['system', 'full', 'reduced'] as const as motion (motion)}
                  <label class="choice">
                    <input
                      type="radio"
                      name="motion"
                      checked={settings.motion === motion}
                      onchange={() => patch({ motion })}
                      data-testid="settings-motion"
                      value={motion}
                    />
                    {motion}
                  </label>
                {/each}
              </div>
            </section>

            <section>
              <h3>sound</h3>
              <label class="row">
                <span>interface sounds</span>
                <input
                  type="checkbox"
                  checked={settings.sound.enabled}
                  onchange={(e) => patch({ sound: { enabled: e.currentTarget.checked } })}
                  data-testid="settings-sound"
                />
              </label>
              <label class="row">
                <span>volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(settings.sound.volume * 100)}
                  disabled={!settings.sound.enabled}
                  onchange={(e) => {
                    patch({ sound: { volume: Number(e.currentTarget.value) / 100 } })
                    sfx.play('granted')
                  }}
                  data-testid="settings-volume"
                />
                <output>{Math.round(settings.sound.volume * 100)}%</output>
              </label>
            </section>

            <section>
              <h3>terminal</h3>
              <label class="row">
                <span>start folder</span>
                <input
                  type="text"
                  class="path"
                  spellcheck="false"
                  value={settings.terminal.startDirectory}
                  placeholder={startDirectory?.fellBack === false && settings.terminal.startDirectory === ''
                    ? `home (${startDirectory.path})`
                    : 'home'}
                  onchange={(e) => patch({ terminal: { startDirectory: e.currentTarget.value.trim() } })}
                  data-testid="settings-start-directory"
                />
                <button type="button" class="link" onclick={chooseStartDirectory} data-testid="settings-start-directory-browse">
                  browse…
                </button>
                <button
                  type="button"
                  class="link"
                  disabled={settings.terminal.startDirectory === ''}
                  onclick={() => patch({ terminal: { startDirectory: '' } })}
                  data-testid="settings-start-directory-home"
                >
                  home
                </button>
              </label>
              <p class="note" class:problem={startDirectory?.fellBack} data-testid="settings-start-directory-note">
                {#if startDirectory?.fellBack}
                  Not a folder: new shells start at home ({startDirectory.path}) instead.
                {:else}
                  New shells start here; open shells stay where they are. "~" stands for your home folder.
                {/if}
              </p>
            </section>

            <section>
              <h3>launcher</h3>
              <label class="row">
                <span>list installed applications</span>
                <input
                  type="checkbox"
                  checked={settings.launcher.showSystem}
                  onchange={(e) => patch({ launcher: { showSystem: e.currentTarget.checked } })}
                  data-testid="settings-launcher-system"
                />
              </label>
              <p class="note">
                {settings.launcher.items.length} entries of your own. Add them under
                <code>launcher.items</code> in settings.json.
              </p>
            </section>
          {:else if section === 'keyboard'}
            <section>
              <h3>shortcuts</h3>
              <p class="note">
                Click a shortcut and press the new keys. It needs Ctrl (Cmd), Alt or a function key, so
                the shell keeps every other key.
              </p>
              <table class="keys">
                <tbody>
                  {#each actions as action (action.id)}
                    {@const chord = bindings[action.id]}
                    {@const clash = clashes[action.id]}
                    <tr data-testid="keybinding" data-action={action.id}>
                      <th scope="row">{action.label}</th>
                      <td>
                        <button
                          type="button"
                          class="chord"
                          class:recording={recording === action.id}
                          class:custom={action.id in settings.keybindings}
                          onclick={() => (recording === action.id ? stopRecording() : startRecording(action.id))}
                          data-testid="keybinding-chord"
                        >
                          {recording === action.id ? 'press keys…' : chord === null ? 'none' : formatChord(chord)}
                        </button>
                      </td>
                      <td class="state">
                        {#if recording === action.id && refusal}
                          <span class="warn">{refusal}</span>
                        {:else if clash}
                          <span class="warn" data-testid="keybinding-conflict">in use by {labelOf(clash)}</span>
                        {/if}
                      </td>
                      <td class="actions">
                        <button
                          type="button"
                          title="Remove this shortcut"
                          disabled={chord === null}
                          onclick={() => setBinding(action.id, null)}
                          data-testid="keybinding-clear">clear</button
                        >
                        <button
                          type="button"
                          title={`Default: ${formatChord(action.chord)}`}
                          disabled={!(action.id in settings.keybindings)}
                          onclick={() => setBinding(action.id, undefined)}
                          data-testid="keybinding-reset">default</button
                        >
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
              <div class="row end">
                <ConfirmButton
                  label="reset all shortcuts"
                  action="reset"
                  title="Restore every default shortcut"
                  testid="keybindings-reset-all"
                  onconfirm={() => patch({ keybindings: {} })}
                />
              </div>
            </section>
          {:else if section === 'alerts'}
            <section>
              <h3>earthquakes and tsunamis</h3>
              <label class="row">
                <span>source</span>
                <select
                  value={settings.quakes.source}
                  onchange={(e) =>
                    patch({ quakes: { source: e.currentTarget.value as Settings['quakes']['source'] } })}
                  data-testid="settings-quakes-source"
                >
                  <option value="auto">automatic ({quakeSource === 'jma' ? 'Japan' : 'world'}, from the time zone)</option>
                  <option value="jma">Japan · Japan Meteorological Agency</option>
                  <option value="usgs">world · USGS, tsunamis from NOAA</option>
                </select>
              </label>
              <p class="note" data-testid="settings-quakes-about">
                {quakeSource === 'jma'
                  ? "Earthquakes in and around Japan by maximum intensity (shindo), and JMA's tsunami warnings and advisories."
                  : "Earthquakes of magnitude 4.5 and up around the world from the USGS, and the tsunami warnings, watches and advisories of NOAA's Pacific and National Tsunami Warning Centers."}
                Checked every minute while alerts are on or a quakes pane is open. Reports come a minute or
                more after the shaking: this is not an earthquake early warning.
              </p>
              <label class="row">
                <span>alerts</span>
                <input
                  type="checkbox"
                  checked={settings.quakes.notify}
                  onchange={(e) => patch({ quakes: { notify: e.currentTarget.checked } })}
                  data-testid="settings-quakes-notify"
                />
              </label>
              {#if quakeSource === 'jma'}
                <label class="row">
                  <span>earthquakes at a maximum intensity of</span>
                  <select
                    value={settings.quakes.minIntensity}
                    disabled={!settings.quakes.notify}
                    onchange={(e) =>
                      patch({ quakes: { minIntensity: e.currentTarget.value as Settings['quakes']['minIntensity'] } })}
                    data-testid="settings-quakes-intensity"
                  >
                    {#each INTENSITIES as intensity (intensity)}
                      <option value={intensity}>{intensityLabel(intensity, 'en')} ({intensityLabel(intensity, 'ja')}) or stronger</option>
                    {/each}
                  </select>
                </label>
              {:else}
                <label class="row">
                  <span>earthquakes of magnitude</span>
                  <select
                    value={String(settings.quakes.minMagnitude)}
                    disabled={!settings.quakes.notify}
                    onchange={(e) =>
                      patch({ quakes: { minMagnitude: Number(e.currentTarget.value) } })}
                    data-testid="settings-quakes-magnitude"
                  >
                    <!-- A value set by hand in settings.json, off the offered steps, is shown as it is. -->
                    {#each magnitudeChoices as magnitude (magnitude)}
                      <option value={String(magnitude)}>M{magnitude.toFixed(1)} or greater</option>
                    {/each}
                  </select>
                </label>
              {/if}
              <label class="row">
                <span>tsunami warnings, watches and advisories</span>
                <input
                  type="checkbox"
                  checked={settings.quakes.tsunami}
                  disabled={!settings.quakes.notify}
                  onchange={(e) => patch({ quakes: { tsunami: e.currentTarget.checked } })}
                  data-testid="settings-quakes-tsunami"
                />
              </label>
              <label class="row">
                <span>system notification when elecdex is not in front</span>
                <input
                  type="checkbox"
                  checked={settings.quakes.system}
                  disabled={!settings.quakes.notify}
                  onchange={(e) => patch({ quakes: { system: e.currentTarget.checked } })}
                  data-testid="settings-quakes-system"
                />
              </label>
              <label class="row">
                <span>alert sound (with interface sounds on)</span>
                <input
                  type="checkbox"
                  checked={settings.quakes.sound}
                  disabled={!settings.quakes.notify}
                  onchange={(e) => patch({ quakes: { sound: e.currentTarget.checked } })}
                  data-testid="settings-quakes-sound"
                />
              </label>
            </section>
          {:else}
            <section>
              <h3>updates</h3>
              <p class="note">
                elecdex {version}. The check asks GitHub for the latest release, once a day; nothing is
                downloaded or installed.
              </p>
              <label class="row">
                <span>check for updates daily</span>
                <input
                  type="checkbox"
                  checked={settings.updates.check}
                  onchange={(e) => patch({ updates: { check: e.currentTarget.checked } })}
                  data-testid="settings-updates-check"
                />
              </label>
              <div class="row">
                <span class="status" data-testid="settings-updates-status" data-state={updates.status.state}>
                  {describeUpdate(updates.status)}
                </span>
                <button type="button" class="link" disabled={checking} onclick={() => void checkNow()} data-testid="settings-updates-now">
                  check now
                </button>
                {#if updates.status.state === 'available'}
                  {@const url = updates.status.url}
                  <button type="button" class="link" onclick={() => void window.elecdex.system.openExternal(url)}>
                    open release page
                  </button>
                {/if}
              </div>
            </section>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.dialog {
  --crt-duration: 380ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(52rem, 92vw);
  height: min(36rem, 84vh);
  background: var(--app-bg);
  outline: none;
}

.body {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: var(--space-4);
  min-height: 0;
  flex: 1;
  padding: var(--space-3);
}

.sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sections .spacer {
  flex: 1;
}

.sections button {
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  text-align: left;
  text-transform: uppercase;
  cursor: pointer;
}

.sections button:hover,
.sections button.active {
  color: var(--accent);
}

.sections button.active {
  border-left-color: var(--accent);
  background: var(--accent-faint);
}

.sections .file,
.sections .close {
  font-size: var(--step--1);
}

.sections .file {
  text-transform: none;
}

.content {
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--space-2);
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

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
  margin-top: var(--space-2);
}

.choice {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  cursor: pointer;
}

input[type='checkbox'],
input[type='radio'],
input[type='range'] {
  margin: 0;
  accent-color: var(--accent);
}

select {
  background: var(--app-bg);
  color: var(--text);
  border: 1px solid var(--panel-border);
  font: inherit;
  text-transform: none;
  padding: 0 var(--space-1);
}

output {
  min-width: 3ch;
  color: var(--text-muted);
}

input.path {
  flex: 1;
  min-width: 12rem;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0;
  text-transform: none;
}

input.path:focus {
  border-color: var(--accent);
  outline: none;
}

.note.problem {
  color: var(--warn);
}

.note {
  margin: 0 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--step--1);
  line-height: 1.5;
}

code {
  font-family: var(--font-mono);
  color: var(--text);
}

button.link,
.actions button {
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

button.link:hover:not(:disabled),
.actions button:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}

.keys {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

/* Sized by the longest action name, so none runs into its shortcut. */
.keys th {
  width: 1%;
  white-space: nowrap;
  padding: var(--space-1) var(--space-3) var(--space-1) 0;
  font-weight: 400;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.keys td {
  padding: var(--space-1) var(--space-2) var(--space-1) 0;
  border-top: 1px solid var(--panel-rule);
}

.keys th {
  border-top: 1px solid var(--panel-rule);
}

.chord {
  min-width: 9rem;
  padding: 0.1rem var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
}

.chord.custom {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.chord.recording {
  border-color: var(--accent);
  background: var(--accent-faint);
  color: var(--accent-strong);
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
  to {
    border-color: transparent;
  }
}

.state {
  width: 100%;
}

.warn {
  color: var(--warn);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.actions {
  white-space: nowrap;
}

.actions button + button {
  margin-left: var(--space-1);
}

.status {
  flex: 1;
  min-width: 0;
  color: var(--text);
  text-transform: none;
  letter-spacing: 0;
}
</style>
