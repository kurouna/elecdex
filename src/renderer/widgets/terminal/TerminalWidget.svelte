<script lang="ts">
import { sessions } from '../../stores/sessions.svelte.ts'
import TabStrip from './TabStrip.svelte'
import TerminalPane from './TerminalPane.svelte'

// Open the first shell on mount. Every pane stays mounted once created so its
// scrollback and the shell's state survive tab switching.
$effect(() => {
  if (sessions.tabs.length === 0) void sessions.open()
})

function onKeydown(event: KeyboardEvent): void {
  if (!event.ctrlKey && !event.metaKey) return

  // Ctrl/Cmd+Shift+T opens a tab, Ctrl/Cmd+Shift+W closes it, Ctrl/Cmd+Tab
  // cycles. These use Shift so they do not shadow the terminal's own Ctrl+T /
  // Ctrl+W, which readline and editors bind.
  if (event.shiftKey && event.code === 'KeyT') {
    event.preventDefault()
    void sessions.open()
    return
  }
  if (event.shiftKey && event.code === 'KeyW') {
    event.preventDefault()
    if (sessions.activeKey !== null) void sessions.close(sessions.activeKey)
    return
  }
  if (event.code === 'Tab') {
    event.preventDefault()
    sessions.focusOffset(event.shiftKey ? -1 : 1)
    return
  }
  // Ctrl/Cmd+1..9 jumps to a tab by position.
  const digit = /^Digit([1-9])$/.exec(event.code)
  if (digit?.[1] !== undefined) {
    event.preventDefault()
    sessions.focusIndex(Number(digit[1]) - 1)
  }
}
</script>

<svelte:window onkeydown={onKeydown} />

<section class="frame terminal" data-notch="tr bl" data-testid="terminal-widget">
  <header class="frame-title">
    <span>terminal</span>
    <span>
      {#if sessions.active?.process}
        {sessions.active.process}
      {:else}
        {sessions.tabs.length} session{sessions.tabs.length === 1 ? '' : 's'}
      {/if}
    </span>
  </header>

  <TabStrip />

  <div class="panes">
    {#each sessions.tabs as tab (tab.key)}
      <TerminalPane {tab} active={tab.key === sessions.activeKey} />
    {/each}
  </div>
</section>

<style>
.terminal {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.panes {
  position: relative;
  flex: 1;
  min-height: 0;
}
</style>
