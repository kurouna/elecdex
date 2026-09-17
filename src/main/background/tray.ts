import { Menu, nativeImage, Tray } from 'electron'
import { resourceIcon } from '../window.js'

export interface TrayActions {
  open(): void
  settings(): void
  quit(): void
}

/** The menu, as data: the tests read and click it through the stub. */
export const TRAY_MENU = [
  { id: 'open', label: 'Open elecdex' },
  { id: 'settings', label: 'Settings' },
  { id: 'quit', label: 'Quit elecdex' },
] as const

export interface AppTray {
  /** Shows or removes the icon. */
  setVisible(on: boolean): void
  dispose(): void
}

/**
 * The notification-area icon at the sizes Windows asks for: 16 px at 100 %
 * scaling up to 32 px at 200 %. Rendered from the SVG by `npm run gen:icon`, so
 * no size is a blurry resample of another.
 */
function trayImage(): Electron.NativeImage {
  const image = nativeImage.createEmpty()
  for (const [size, scaleFactor] of [
    [16, 1],
    [20, 1.25],
    [24, 1.5],
    [32, 2],
  ] as const) {
    const file = resourceIcon(`tray-${size}.png`)
    if (file)
      image.addRepresentation({ scaleFactor, buffer: nativeImage.createFromPath(file).toPNG() })
  }
  return image
}

/**
 * The icon, created only while it is wanted and destroyed after. As in Teams or
 * Slack, a click (or double-click) opens the window rather than toggling it,
 * and the menu is on the right button.
 */
export function createTray(actions: TrayActions): AppTray {
  let tray: Tray | null = null
  const handlers: Record<(typeof TRAY_MENU)[number]['id'], () => void> = actions
  return {
    setVisible: (on) => {
      if (on && tray === null) {
        tray = new Tray(trayImage())
        tray.setToolTip('elecdex')
        tray.setContextMenu(
          Menu.buildFromTemplate([
            ...TRAY_MENU.slice(0, 2).map((item) => ({
              label: item.label,
              click: handlers[item.id],
            })),
            { type: 'separator' as const },
            { label: TRAY_MENU[2].label, click: handlers.quit },
          ]),
        )
        tray.on('click', actions.open)
        tray.on('double-click', actions.open)
      } else if (!on && tray !== null) {
        tray.destroy()
        tray = null
      }
    },
    dispose: () => {
      tray?.destroy()
      tray = null
    },
  }
}

/** The end-to-end tests' tray: never on the machine's taskbar, clicked through its methods. */
export class StubTray implements AppTray {
  visible = false
  readonly #actions: TrayActions

  constructor(actions: TrayActions) {
    this.#actions = actions
  }

  setVisible(on: boolean): void {
    this.visible = on
  }

  click(): void {
    if (this.visible) this.#actions.open()
  }

  menu(): string[] {
    return this.visible ? TRAY_MENU.map((item) => item.label) : []
  }

  choose(label: string): void {
    const item = TRAY_MENU.find((entry) => entry.label === label)
    if (this.visible && item) this.#actions[item.id]()
  }

  dispose(): void {
    this.visible = false
  }
}
