import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The press that blinks is one rule for every pane (styles/press.css; user decision 2026-11-06):
 * a button held flashes the accent. These hold it there: the rule is loaded and reaches every
 * button and the `afterBlink` mark, no pane brings a press of its own, and every button left out
 * is named here with why. tests/e2e/contracts/press.spec.ts holds the buttons of every pane.
 */

const RENDERER = path.join(process.cwd(), 'src', 'renderer')
const read = (file: string) => readFileSync(path.join(RENDERER, file), 'utf8')

function svelteFiles(dir = RENDERER): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return svelteFiles(full)
    return entry.name.endsWith('.svelte')
      ? [path.relative(RENDERER, full).replaceAll('\\', '/')]
      : []
  })
}

/**
 * Every button that does not take the press, by file: (link) styled as text or a link, (graphic)
 * a hit area over a picture or chart, (own) a key or tile that shows its press its own way, (rise)
 * a button that rises in, whose rise the press would play again on release, (none) nothing happens
 * on a click, (chrome) the settings button every pane shares, a bare icon, and the tab strip, which
 * is dragged.
 */
const LEFT_OUT: Record<string, { count: number; why: string }> = {
  'layout/TabStrip.svelte': { count: 2, why: 'chrome: a tab is held to be dragged' },
  'plugins/Blocks.svelte': { count: 1, why: 'link' },
  'widgets/aichat/AiChatWidget.svelte': { count: 3, why: 'link: copy, edit, regenerate as text' },
  'widgets/aichat/Markdown.svelte': { count: 2, why: 'link, and the code bar’s copy as text' },
  'widgets/aichat/Payload.svelte': { count: 1, why: 'graphic: half of an attachment chip' },
  'widgets/calc/CalcWidget.svelte': {
    count: 4,
    why: 'link: an example, a tape row’s cells, a figure',
  },
  'widgets/chip8/Keypad.svelte': { count: 1, why: 'own: the key fills while held' },
  'widgets/chip8/LibraryView.svelte': {
    count: 1,
    why: 'own: the row blinks as it loads, and tiles in',
  },
  'widgets/common/DiffView.svelte': { count: 1, why: 'graphic: an image to zoom' },
  'widgets/common/NewPill.svelte': { count: 1, why: 'rise' },
  'widgets/common/SettingsButton.svelte': { count: 1, why: 'chrome: the settings icon' },
  'widgets/connections/CountryBus.svelte': { count: 1, why: 'none: a tag shown for its card' },
  'widgets/docker/ContainerRow.svelte': { count: 2, why: 'link: the name copied, a port' },
  'widgets/elec/ElecWidget.svelte': {
    count: 3,
    why: 'link and rise: the motion, its actions as text',
  },
  'widgets/elec/SeatsPanel.svelte': { count: 1, why: 'link' },
  'widgets/elec16/CodeView.svelte': { count: 1, why: 'link: an error in the list' },
  'widgets/elec16/CoreView.svelte': { count: 1, why: 'graphic: a breakpoint in the gutter' },
  'widgets/elec16/Keyboard.svelte': { count: 1, why: 'own: the key sinks, darkens or blinks' },
  'widgets/elec16/PlayDevice.svelte': { count: 2, why: 'own: the pads sink' },
  'widgets/elec16/SciDevice.svelte': { count: 2, why: 'own: the keys sink' },
  'widgets/filesystem/FilesystemWidget.svelte': { count: 5, why: 'own: the tiles blink' },
  'widgets/launcher/LauncherWidget.svelte': { count: 1, why: 'own: the tile and its glyph blink' },
  'widgets/logwatch/LogStream.svelte': { count: 1, why: 'link: +N in a line' },
  'widgets/logwatch/LogWatchWidget.svelte': { count: 1, why: 'link: the file' },
  'widgets/markets/MarketsWidget.svelte': { count: 1, why: 'graphic: a bar of the chart' },
  'widgets/notes/NotesWidget.svelte': { count: 1, why: 'link: the note’s title' },
  'widgets/quakes/QuakesWidget.svelte': { count: 1, why: 'link: the credit' },
  'widgets/timer/AlarmList.svelte': { count: 2, why: 'link and graphic: the days, a switch' },
  'widgets/todo/TodoWidget.svelte': {
    count: 4,
    why: 'link: a list’s name, a task, its date, clear',
  },
  'widgets/translate/EngineView.svelte': { count: 2, why: 'link' },
  'widgets/translate/SetupView.svelte': { count: 3, why: 'link' },
  'widgets/translate/TextView.svelte': { count: 1, why: 'none: the spine’s numbers' },
  'widgets/utility/QrModule.svelte': { count: 1, why: 'graphic: over the code' },
  'widgets/weather/WeatherWidget.svelte': {
    count: 3,
    why: 'graphic and rise: today, a day, the credit',
  },
}

/** The only panes that press their own way, for the buttons left out as `own` above. */
const OWN_PRESS = new Set([
  'widgets/filesystem/FilesystemWidget.svelte',
  'widgets/launcher/LauncherWidget.svelte',
])

/** A component's style, its comments taken out. */
const styleOf = (source: string) =>
  (source.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')

describe('the press that blinks', () => {
  it('is one rule, loaded with the page, for every button and row of every pane, and the afterBlink mark', () => {
    // As one line: the formatter may break a long selector.
    const css = read('styles/press.css').replace(/\s+/g, ' ')
    expect(read('main.ts')).toContain("import './styles/press.css'")
    const where = ':is(.pane[data-widget], .popup[data-widget], .tabs-host)'
    expect(css).toContain(`${where} :is(button, [role="button"])`)
    expect(css).toContain(':not(:disabled, [aria-disabled="true"], [data-press="off"]):active')
    expect(css).toContain(`${where} .blinking`)
    // Held down, it outlives its frame: paused with the page off screen.
    expect(css).toContain('animation-play-state: var(--ambient-play-state)')
    expect(css).toMatch(/@keyframes press \{/)
  })

  it('leaves out only the buttons named here, each with why', () => {
    const found: Record<string, number> = {}
    for (const file of svelteFiles()) {
      const count = read(file).split('data-press="off"').length - 1
      if (count > 0) found[file] = count
    }
    const named = Object.fromEntries(
      Object.entries(LEFT_OUT).map(([file, { count }]) => [file, count]),
    )
    expect(found).toEqual(named)
    for (const { why } of Object.values(LEFT_OUT)) expect(why).not.toBe('')
  })

  it('is no pane’s own: no component animates a press of its own, but the tiles left out for it', () => {
    const own: string[] = []
    for (const file of svelteFiles()) {
      const style = styleOf(read(file))
      // A rule whose selector has :active (or the afterBlink mark) and that sets an animation.
      for (const rule of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const [, selector = '', body = ''] = rule
        if (!/:active|\.blinking/.test(selector) || !/animation(-name)?\s*:/.test(body)) continue
        if (!OWN_PRESS.has(file)) own.push(`${file}: ${selector.trim()}`)
      }
    }
    expect(own).toEqual([])
  })
})
