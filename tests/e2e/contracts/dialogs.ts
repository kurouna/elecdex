import type { ElectronApplication, Page } from '@playwright/test'

/**
 * Every dialog, popup, toast and notice drawn over the workspace, for the motion contract
 * (contracts/motion.spec.ts; docs/e2e-design.md, section 3.2): how to bring each up in the
 * contract's layout, the element that powers on and off, and how a person sends it away.
 * tests/unit/e2e-dialogs-contract.test.ts holds the table to the ui store's overlays and to every
 * component outside the widgets that powers on with `crtPower`, so a new one without a row
 * fails before any e2e runs.
 *
 * What a pane draws inside itself (the CHIP-8 import sheet, the chat's payload, ELEC's and the
 * ELEC-16's sheets, a detail card) belongs to that pane and its spec, not here.
 */

/** What the row's opener is given: the app and its page. */
export interface DialogWorld {
  app: ElectronApplication
  page: Page
}

export interface DialogRow {
  /** The overlay of the ui store (src/renderer/stores/ui.svelte.ts `Overlay`) it is, if one. */
  overlay?: string
  /** The component that draws it, under src/renderer. */
  component: string
  /** `data-testid` of the element that powers on and off. */
  testid: string
  /** Brings it up; the contract waits for it to show. */
  open(world: DialogWorld): Promise<void>
  /** How a person sends it away: a key pressed in the window, or a button clicked. */
  close: { key: 'Escape' } | { click: string }
  /** How long it may take to come up (a toast waits on a running timer). */
  within?: number
}

/** The pane ids of the contract's layout. */
export const MOTION_PANES = { shell: 'm-shell', weather: 'm-weather', timer: 'm-timer' } as const

/**
 * A shell (the paste question, and the switch question a reset asks while one is open), a
 * weather pane (its place picker) and a one-second timer (a toast), side by side - and no
 * launcher, so its shortcut pops one up.
 */
export const MOTION_LAYOUT = {
  version: 1,
  root: {
    kind: 'split',
    id: 'm-root',
    direction: 'row',
    sizes: [40, 30, 30],
    children: [
      { kind: 'pane', id: MOTION_PANES.shell, widget: 'terminal' },
      { kind: 'pane', id: MOTION_PANES.weather, widget: 'weather' },
      {
        kind: 'pane',
        id: MOTION_PANES.timer,
        widget: 'timer',
        state: { mode: 'timer', durationMs: 1000 },
      },
    ],
  },
}

const inPane = (page: Page, id: string, testid: string) =>
  page.locator(`[data-testid=pane][data-pane-id="${id}"] [data-testid=${testid}]`)

/** Sends `channel` with `payload` to every window, as main does when it has news for the page. */
async function fromMain(app: ElectronApplication, channel: string, payload: unknown) {
  await app.evaluate(
    ({ BrowserWindow }, { channel, payload }) => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
      }
    },
    { channel, payload },
  )
}

const ESCAPE = { key: 'Escape' } as const

export const DIALOGS: DialogRow[] = [
  {
    overlay: 'picker',
    component: 'layout/PanePicker.svelte',
    testid: 'pane-picker',
    open: ({ page }) => page.keyboard.press('Control+Shift+KeyA'),
    close: ESCAPE,
  },
  {
    overlay: 'palette',
    component: 'palette/ActionPalette.svelte',
    testid: 'action-palette',
    open: ({ page }) => page.keyboard.press('Control+Shift+KeyP'),
    close: ESCAPE,
  },
  {
    overlay: 'layouts',
    component: 'layout/LayoutsDialog.svelte',
    testid: 'layouts-dialog',
    open: ({ page }) => page.keyboard.press('Control+Shift+KeyG'),
    close: ESCAPE,
  },
  {
    overlay: 'settings',
    component: 'SettingsDialog.svelte',
    testid: 'settings-dialog',
    open: ({ page }) => page.keyboard.press('Control+Shift+Period'),
    close: ESCAPE,
  },
  {
    // A reset with a shell open asks first, as a switch does (`confirmReset`); Escape stays.
    overlay: 'switch',
    component: 'layout/SwitchLayoutDialog.svelte',
    testid: 'switch-layout-dialog',
    open: ({ page }) => page.keyboard.press('Control+Shift+Backspace'),
    close: ESCAPE,
  },
  {
    // Ctrl+Shift+Q asks before it quits; Escape stays.
    overlay: 'quit',
    component: 'layout/QuitDialog.svelte',
    testid: 'quit-dialog',
    open: ({ page }) => page.keyboard.press('Control+Shift+KeyQ'),
    close: ESCAPE,
  },
  {
    overlay: 'paste',
    component: 'widgets/terminal/PasteDialog.svelte',
    testid: 'paste-dialog',
    open: async ({ app, page }) => {
      const host = inPane(page, MOTION_PANES.shell, 'terminal-host')
      await host.waitFor()
      // The real clipboard: launch() puts back what was on it when the app quits.
      await app.evaluate(({ clipboard }) => clipboard.writeText('echo one\necho two'))
      await host.click({ button: 'right', position: { x: 60, y: 60 } })
    },
    close: ESCAPE,
  },
  {
    overlay: 'location',
    component: 'LocationPicker.svelte',
    testid: 'location-picker',
    open: async ({ page }) => {
      const place = inPane(page, MOTION_PANES.weather, 'weather-location')
      if (!(await place.isVisible())) {
        await inPane(page, MOTION_PANES.weather, 'weather-settings-toggle').click()
      }
      await place.click()
    },
    close: ESCAPE,
  },
  {
    // With no launcher in the layout, its shortcut pops one up.
    overlay: 'popup',
    component: 'layout/PopupPane.svelte',
    testid: 'popup-pane',
    open: ({ page }) => page.keyboard.press('Control+Shift+KeyL'),
    close: ESCAPE,
  },
  {
    component: 'Toasts.svelte',
    testid: 'toast',
    open: ({ page }) => inPane(page, MOTION_PANES.timer, 'timer-start').click(),
    close: { click: '[data-testid=toast-dismiss]' },
    within: 15_000,
  },
  {
    // What main sends when a check finds a newer release (src/main/ipc/updates.ts).
    component: 'UpdateNotice.svelte',
    testid: 'update-notice',
    open: ({ app }) =>
      fromMain(app, 'updates:changed', {
        state: 'available',
        checkedAt: Date.now(),
        latest: '99.0.0',
        url: 'https://github.com/kurouna/elecdex/releases',
      }),
    close: { click: '[data-testid=update-notice-dismiss]' },
  },
  {
    // What main sends when it decides an earthquake is worth an alert (src/main/ipc/quakes.ts).
    component: 'QuakeAlert.svelte',
    testid: 'quake-alert',
    open: ({ app }) =>
      fromMain(app, 'quakes:alert', {
        quakes: [
          {
            source: 'jma',
            id: 'e2e-motion',
            at: Date.now() - 60_000,
            reportedAt: Date.now() - 30_000,
            area: { ja: '試験', en: 'Test' },
            lat: 35.6,
            lon: 139.7,
            depthKm: 10,
            magnitude: 4.1,
            maxIntensity: '3',
            distant: false,
            url: 'https://www.jma.go.jp/bosai/map.html',
          },
        ],
        tsunami: null,
      }),
    close: { click: '[data-testid=quake-alert-dismiss]' },
  },
]
