import { writeFileSync } from 'node:fs'
import type { ElectronApplication, Page } from '@playwright/test'
import { claudeFolder, makeRepo } from '../support/fixtures.js'
import { logFolder } from '../support/logwatch.js'
import { type Launched, launch, removeDir, watchingAll } from '../support.js'
import { ALL_KEPT, type Footprint, PANES, type PaneRow, type World } from './panes.js'

/** The pane id each row gets in the contracts' layouts. */
export const paneId = (widget: string): string => `p-${widget}`

/** A tab of the one group the contracts lay every pane in. */
export const tabOf = (page: Page, widget: string) =>
  page.locator(`[data-testid=tab][data-pane-id="${paneId(widget)}"]`)

/** The pane of `widget` in the contracts' layout. */
export const contractPane = (page: Page, widget: string) =>
  page.locator(`[data-testid=pane][data-pane-id="${paneId(widget)}"]`)

/** Every built-in pane as the tabs of one group, the clock in front. */
export function everyPaneTabbed(rows: PaneRow[] = PANES) {
  const clockFirst = [...rows].sort(
    (a, b) => Number(b.widget === 'clock') - Number(a.widget === 'clock'),
  )
  return {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'all',
      activeIndex: 0,
      children: clockFirst.map((r) => ({
        kind: 'pane',
        id: paneId(r.widget),
        widget: r.widget,
        ...(r.state ? { state: r.state } : {}),
      })),
    },
  }
}

export interface ContractApp extends Launched {
  world: World
  /** Removes the world's folders as well as the app's profile. */
  dispose(): Promise<void>
}

/** Launches on every pane, with a world to put them to work in: a repository, a log, a Claude folder. */
export async function launchContracts(options: { layout?: unknown } = {}): Promise<ContractApp> {
  const repo = makeRepo()
  const { dir: logDir, file: log } = logFolder('elecdex-contracts-')
  writeFileSync(log, '2026-10-23 12:00:00 INFO started\n')
  const claude = claudeFolder()
  const launched = await launch(undefined, {
    layout: options.layout ?? everyPaneTabbed(),
    env: { ELECDEX_CLAUDE_DIR: claude.dir },
  })
  return {
    ...launched,
    world: { repo, log },
    dispose: async () => {
      await launched.close()
      for (const dir of [repo, logDir, claude.dir]) removeDir(dir)
    },
  }
}

/** What main is doing for the pages now (see {@link Footprint}). */
export async function footprint(app: ElectronApplication, page: Page): Promise<Footprint> {
  const all = await watchingAll(page)
  const quakes = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const off = window.elecdex.quakes.observe((state) => {
          resolve(state.active)
          queueMicrotask(() => off())
        })
      }),
  )
  // The capture window is the one window besides the workspace (main/audio/capture-window.ts).
  const capture =
    (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) > 1
  return { ...all, metrics: [...all.metrics].sort(), quakes, capture }
}

/** The footprint with no pane seen: only the sources that `rows` keep behind a tab. */
export function idle(rows: PaneRow[] = PANES): Footprint {
  const kept = rows === PANES ? ALL_KEPT : [...new Set(rows.flatMap((r) => r.kept ?? []))].sort()
  return {
    metrics: kept,
    weather: [],
    markets: [],
    feeds: [],
    orbits: [],
    git: [],
    agents: [],
    clipboard: [],
    nowPlaying: [],
    docker: [],
    logwatch: [],
    quakes: false,
    capture: false,
  }
}

/** What of `row`'s footprint is missing from `now` (empty when the pane is seen at work). */
export function missing(row: PaneRow, now: Footprint): string[] {
  const seen = row.seen ?? {}
  return [
    ...(seen.metrics ?? []).filter((id) => !now.metrics.includes(id)),
    ...(seen.modules ?? []).filter((m) => now[m].length === 0),
    ...(seen.quakes && !now.quakes ? ['quakes'] : []),
    ...(seen.capture && !now.capture ? ['capture'] : []),
  ]
}
