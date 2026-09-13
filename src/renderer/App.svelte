<script lang="ts">
import type { AppInfo } from '@shared/api'
import BootScreen from './BootScreen.svelte'
import ConfirmButton from './ConfirmButton.svelte'
import PanePicker from './layout/PanePicker.svelte'
import Workspace from './layout/Workspace.svelte'
import { appearance } from './stores/appearance.svelte.ts'
import { boot } from './stores/boot.svelte.ts'
import { layout } from './stores/layout.svelte.ts'
import { sfx } from './stores/sound.svelte.ts'
import { ui } from './stores/ui.svelte.ts'

let info = $state<AppInfo | null>(null)

$effect(() => {
  // The theme is applied before the boot sequence starts, so the intro plays in
  // the user's colours rather than flashing the default theme first.
  void Promise.all([window.elecdex.system.info(), appearance.init()]).then(([result]) => {
    info = result
    void boot.run(result)
  })
})

function chooseTheme(id: string): void {
  void appearance.patch({ theme: id }).then(() => sfx.play('theme'))
}

function toggleSound(): void {
  const enabled = !appearance.settings.sound.enabled
  void appearance.patch({ sound: { enabled } }).then(() => {
    if (enabled) sfx.play('granted')
  })
}
</script>

<!--
  The workspace mounts immediately, even under the boot screen, so shells start
  and metrics flow while the intro plays. It is hidden with visibility rather
  than display so every pane already has its real size when it powers on.
-->
<main data-boot={boot.concealed ? 'concealed' : boot.phase} data-testid="app">
  <Workspace />

  <footer>
    <span>elecdex{info === null ? '' : ` ${info.version}`}</span>
    <span class="hint">
      ctrl+shift+ a add pane · e split · o split down · t tab · w close · [ ] focus · backspace reset · q quit
      · f11 fullscreen
    </span>
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

<BootScreen />
<PanePicker />

<style>
main[data-boot="concealed"] {
  visibility: hidden;
}

main[data-boot="reveal"] > footer {
  animation: footer-in 400ms var(--ease-out) 1200ms both;
}

@keyframes footer-in {
  from {
    opacity: 0;
  }
}

main {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  gap: var(--space-2);
  padding: var(--space-2);
  min-height: 0;
}

footer {
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


.hint {
  flex: 1;
  text-align: right;
  font-family: var(--font-mono);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.55;
}
</style>
