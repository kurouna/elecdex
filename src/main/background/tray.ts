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
  { id: 'separator' },
  { id: 'quit', label: 'Quit elecdex' },
] as const

type MenuEntry = (typeof TRAY_MENU)[number]
type MenuItem = Exclude<MenuEntry, { id: 'separator' }>
const isItem = (entry: MenuEntry): entry is MenuItem => entry.id !== 'separator'

export interface AppTray {
  /** Shows or removes the icon. */
  setVisible(on: boolean): void
  dispose(): void
}

/**
 * The icon outside the window, at the sizes the platform asks for. Rendered from
 * the SVGs by `npm run gen:icon`, so no size is a blurry resample of another.
 *
 * macOS gets a template image - black plus alpha, which the system recolours for
 * the light and dark menu bar and while it is clicked. It is a different drawing
 * (build/tray-template.svg), because the app icon is a light card with dark
 * panes on it and would come out of that treatment as a solid block.
 */
function trayImage(): Electron.NativeImage {
  const image = nativeImage.createEmpty()
  const sizes: ReadonlyArray<readonly [string, number]> =
    process.platform === 'darwin'
      ? [
          ['trayTemplate.png', 1],
          ['trayTemplate@2x.png', 2],
        ]
      : [
          ['tray-16.png', 1],
          ['tray-20.png', 1.25],
          ['tray-24.png', 1.5],
          ['tray-32.png', 2],
        ]
  for (const [name, scaleFactor] of sizes) {
    const file = resourceIcon(name)
    if (file)
      image.addRepresentation({ scaleFactor, buffer: nativeImage.createFromPath(file).toPNG() })
  }
  if (process.platform === 'darwin') image.setTemplateImage(true)
  return image
}

/**
 * Whether an icon can be shown at all, asked by making one and taking it away.
 *
 * Windows and macOS always can. On Linux it is the desktop's decision - a
 * session with no StatusNotifier host (stock GNOME, without an extension) has
 * nowhere to put it - and hiding the window where nothing can bring it back
 * would be worse than not offering to hide it. The probe catches the case where
 * Electron refuses outright; a desktop that accepts the icon and then ignores it
 * cannot be told apart from here, which is why the settings say so and why
 * starting elecdex again always brings the window back (main/index.ts).
 */
export function trayCanBeShown(): boolean {
  if (process.platform !== 'linux') return true
  try {
    const probe = new Tray(trayImage())
    probe.destroy()
    return true
  } catch {
    return false
  }
}

/**
 * The icon, created only while it is wanted and destroyed after. As in Teams or
 * Slack, a click (or double-click) opens the window rather than toggling it,
 * and the menu is on the right button - on macOS, where a status item with a
 * menu shows it on either button, the menu's first entry does the same thing.
 */
export function createTray(actions: TrayActions): AppTray {
  let tray: Tray | null = null
  return {
    setVisible: (on) => {
      if (on && tray === null) {
        tray = new Tray(trayImage())
        tray.setToolTip('elecdex')
        tray.setContextMenu(
          Menu.buildFromTemplate(
            TRAY_MENU.map((entry) =>
              isItem(entry)
                ? { label: entry.label, click: actions[entry.id] }
                : { type: 'separator' as const },
            ),
          ),
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
    return this.visible ? TRAY_MENU.filter(isItem).map((item) => item.label) : []
  }

  choose(label: string): void {
    const item = TRAY_MENU.filter(isItem).find((entry) => entry.label === label)
    if (this.visible && item) this.#actions[item.id]()
  }

  dispose(): void {
    this.visible = false
  }
}
