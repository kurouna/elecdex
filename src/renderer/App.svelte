<script lang="ts">
import type { AppInfo } from '@shared/api'
import { effectiveBindings, formatChord, type KeybindingAction } from '@shared/keybindings'
import BootScreen from './BootScreen.svelte'
import ConfirmButton from './ConfirmButton.svelte'
import LocationPicker from './LocationPicker.svelte'
import PanePicker from './layout/PanePicker.svelte'
import Workspace from './layout/Workspace.svelte'
import { EdgeReveal } from './lib/edge-reveal.svelte.ts'
import { plugins } from './plugins/plugins.svelte.ts'
import QuakeAlert from './QuakeAlert.svelte'
import SettingsDialog from './SettingsDialog.svelte'
import { appearance } from './stores/appearance.svelte.ts'
import { boot } from './stores/boot.svelte.ts'
import { layout } from './stores/layout.svelte.ts'
import { sfx } from './stores/sound.svelte.ts'
import { ui } from './stores/ui.svelte.ts'
import TitleBar from './TitleBar.svelte'
import UpdateNotice from './UpdateNotice.svelte'
import WindowCorner from './WindowCorner.svelte'

let info = $state<AppInfo | null>(null)

$effect(() => {
  // The theme is applied before the boot sequence starts, so the intro plays in
  // the user's colours rather than flashing the default theme first.
  void Promise.all([window.elecdex.system.info(), appearance.init()]).then(([result]) => {
    info = result
    // After the settings, which say which plugins are on and what they may do.
    void plugins.init()
    void boot.run(result)
  })
})

function chooseTheme(id: string): void {
  void appearance.patch({ theme: id }).then(() => sfx.play('theme'))
}

const REPO_URL = 'https://github.com/kurouna/elecdex'

/** The shortcut hint in the status bar, from the bindings in effect. */
const HINTS: Array<[KeybindingAction, string]> = [
  ['pane.add', 'add pane'],
  ['pane.splitRight', 'split'],
  ['pane.splitDown', 'split down'],
  ['pane.newTab', 'tab'],
  ['pane.close', 'close'],
  ['launcher.focus', 'launcher'],
  ['settings.open', 'settings'],
  ['app.quit', 'quit'],
  ['window.fullscreen', 'fullscreen'],
  ['window.minimize', 'minimize'],
]
const hint = $derived.by(() => {
  const bindings = effectiveBindings(
    appearance.settings.keybindings,
    window.elecdex.system.platform,
  )
  return HINTS.flatMap(([action, label]) => {
    const chord = bindings[action]
    return chord === null ? [] : [`${formatChord(chord).toLowerCase()} ${label}`]
  }).join(' · ')
})

/** How close to the bottom edge, in CSS pixels, calls the status bar up. */
const EDGE_PX = 8
/** The status bar slides in from the bottom edge and away again (lib/edge-reveal). */
const status = new EdgeReveal((_x, y) => y >= window.innerHeight - EDGE_PX)

function toggleSound(): void {
  const enabled = !appearance.settings.sound.enabled
  void appearance.patch({ sound: { enabled } }).then(() => {
    if (enabled) sfx.play('granted')
  })
}
</script>

<svelte:window onpointermove={(event) => status.track(event.clientX, event.clientY)} />
<svelte:body onmouseleave={() => status.hideSoon()} />

<!--
  The workspace mounts immediately, even under the boot screen, so shells start
  and metrics flow while the intro plays. It is hidden with visibility rather
  than display so every pane already has its real size when it powers on.
-->
<div class="window">
<TitleBar platform={info?.platform ?? null} />
<main data-boot={boot.concealed ? 'concealed' : boot.phase} data-testid="app">
  <Workspace />

  <!-- A short tick at the bottom edge while the status bar is away, so it can be found. -->
  <span class="status-handle" class:away={!status.shown} aria-hidden="true"></span>
  <footer
    bind:this={status.element}
    class:shown={status.shown}
    onfocusin={() => status.show()}
    onfocusout={() => status.hideSoon()}
    data-testid="status-bar"
    data-shown={status.shown}
  >
    <button
      type="button"
      class="brand"
      title={REPO_URL}
      onclick={() => void window.elecdex.system.openExternal(REPO_URL)}
      data-testid="brand-link"
    >
      elecdex{info === null ? '' : ` ${info.version}`}
    </button>
    <span class="hint" data-testid="shortcut-hint">{hint}</span>
    <button
      type="button"
      class="control toggle"
      onclick={() => ui.openPanePicker()}
      title="Add a pane (Ctrl+Shift+A)"
      data-testid="add-pane"
    >
      + pane
    </button>
    <ConfirmButton
      label="reset layout"
      action="reset"
      title="Restore the default layout (Ctrl+Shift+Backspace)"
      testid="reset-layout"
      onconfirm={() => void layout.reset()}
    />
    <button
      type="button"
      class="control toggle"
      onclick={() => ui.openSettings()}
      title="Settings"
      data-testid="open-settings"
    >
      settings
    </button>
    <label class="control">
      <span>theme</span>
      <select
        value={appearance.theme.id}
        onchange={(e) => chooseTheme(e.currentTarget.value)}
        data-testid="theme-select"
      >
        {#each appearance.catalog.themes as theme (theme.id)}
          <option value={theme.id}>{theme.name}</option>
        {/each}
      </select>
    </label>
    <button
      type="button"
      class="control toggle"
      aria-pressed={appearance.settings.sound.enabled}
      onclick={toggleSound}
      data-testid="sound-toggle"
    >
      sound {appearance.settings.sound.enabled ? 'on' : 'off'}
    </button>
    <ConfirmButton
      label="exit"
      action="exit"
      title="Quit elecdex (Ctrl+Shift+Q)"
      testid="exit"
      onconfirm={() => window.elecdex.system.quit()}
    />
  </footer>
</main>
</div>

<BootScreen />
<PanePicker />
<LocationPicker />
<SettingsDialog />
<UpdateNotice />
<QuakeAlert />
<WindowCorner />

<style>
main[data-boot="concealed"] {
  visibility: hidden;
}

.window {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

main {
  position: relative;
  display: grid;
  grid-template-rows: 1fr;
  flex: 1;
  padding: var(--space-2);
  min-height: 0;
  overflow: hidden;
}

footer {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 20;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--app-bg);
  border-top: 1px solid var(--panel-border);
  box-shadow: 0 -6px 18px hsl(0 0% 0% / 0.45);
  transform: translateY(100%);
  visibility: hidden;
  transition:
    transform var(--dur-base) var(--ease-out),
    visibility 0s linear var(--dur-base);
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-1);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.control {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
}

.control select,
.toggle {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: uppercase;
  cursor: pointer;
}

.toggle[aria-pressed='true'] {
  color: var(--accent);
}


.status-handle {
  position: absolute;
  left: 50%;
  bottom: 2px;
  z-index: 19;
  width: 3rem;
  height: 2px;
  background: var(--panel-border);
  opacity: 0;
  transform: translateX(-50%);
  transition: opacity var(--dur-base) var(--ease-out);
  pointer-events: none;
}

.status-handle.away {
  opacity: 0.6;
}

footer.shown {
  transform: none;
  visibility: visible;
  transition:
    transform var(--dur-base) var(--ease-out),
    visibility 0s;
}

.brand {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: none;
  cursor: pointer;
}

.brand:hover,
.brand:focus-visible {
  color: var(--accent);
  text-decoration: underline;
  outline: none;
}

.hint {
  flex: 1;
  text-align: right;
  font-family: var(--font-mono);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.55;
}
</style>
