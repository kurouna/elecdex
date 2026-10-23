import { expect, type Page, test } from '@playwright/test'
import {
  booted,
  type Launched,
  launchOnTwoLayouts,
  lcdLines,
  pluginFiles,
  serviceStub,
  settleLayout,
  single,
  turnOnPlugin,
  typeLine,
} from '../support.js'

/**
 * The same-id contract (docs/e2e-design.md, section 3.2): two saved layouts may hold panes of
 * the same id - a layout kept under a new name keeps its ids - and main keeps state by pane id
 * in four ways: an ELEC-16 pane's unit, a CHIP-8 pane's machine, a web pane's view and a plugin
 * pane's state. For each, switching between the layouts (Ctrl+Shift+1 and 2) opens each
 * layout's pane on its own state, and back. The panes' own specs follow each further.
 */

/** Goes to saved layout `n` by its key and waits until it has arrived. */
async function toLayout(page: Page, n: 1 | 2): Promise<void> {
  await page.keyboard.press(`Control+Shift+Digit${n}`)
  await settleLayout(page)
}

test("an ELEC-16 pane opens on its own layout's unit", async () => {
  const onUnit = (unit: string) => single('elec16', { id: 'e16', state: { unit, panel: false } })
  const unit = (id: string, name: string) => ({
    id,
    name,
    clock: 4,
    model: 'pocket-48',
    autoOff: 10,
    created: 0,
  })
  const { page, close } = await launchOnTwoLayouts(onUnit('u1'), onUnit('u2'), {
    files: {
      'elec16/units.json': JSON.stringify({
        version: 1,
        units: [unit('u1', 'UNIT 1'), unit('u2', 'UNIT 2')],
      }),
    },
  })
  /** Switched to layout `n`: its unit named, booted, and the keyboard in it. */
  const onLayout = async (n: 1 | 2) => {
    await toLayout(page, n)
    await expect(page.getByTestId('pane-subtitle')).toContainText(`UNIT ${n}`)
    await booted(page)
    await page.getByTestId('elec16').focus()
  }
  try {
    await settleLayout(page)
    await booted(page)
    await expect(page.getByTestId('pane-subtitle')).toContainText('UNIT 1')
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'z=7')
    // UNIT 2's own RAM: z was set on UNIT 1 only; and UNIT 1 still has it.
    await onLayout(2)
    await typeLine(page, 'print z')
    await expect.poll(() => lcdLines(page)).toContain('0')
    await onLayout(1)
    await typeLine(page, 'print z')
    await expect.poll(() => lcdLines(page)).toContain('7')
  } finally {
    await close()
  }
})

test("a CHIP-8 pane runs its own layout's program", async () => {
  const running = (program: string) =>
    single('chip8', { id: 'c8', state: { view: 'run', program } })
  const { page, close } = await launchOnTwoLayouts(
    running('diag/3-corax+'),
    running('diag/6-keypad'),
  )
  try {
    const subtitle = page.getByTestId('pane-subtitle')
    await expect(subtitle).toHaveText('Corax+')
    await toLayout(page, 2)
    await expect(subtitle).toHaveText('Keypad')
    await expect(page.getByTestId('chip8-run')).toContainText('Keypad')
    await toLayout(page, 1)
    await expect(subtitle).toHaveText('Corax+')
    await expect(page.getByTestId('chip8-run')).toContainText('Corax+')
  } finally {
    await close()
  }
})

test("a web pane opens its own layout's page", async () => {
  const site = await serviceStub(({ url }) => {
    const title = { '/yt/': 'YT home', '/yt/next': 'YT next' }[url]
    if (title === undefined) return undefined
    return {
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: `<!doctype html><title>${title}</title><h1>${title}</h1>`,
    }
  })
  const home = `${site.origin}/yt/`
  /** A web pane of id `web` on `url`, beside a clock. */
  const onPage = (url: string) => ({
    version: 1,
    root: {
      kind: 'split',
      id: 'root',
      direction: 'row',
      sizes: [0.3, 0.7],
      children: [
        { kind: 'pane', id: 'clock', widget: 'clock' },
        { kind: 'pane', id: 'web', widget: 'web.youtube', state: { url } },
      ],
    },
  })
  let app: Launched | undefined
  try {
    app = await launchOnTwoLayouts(onPage(home), onPage(`${home}next`), {
      env: { ELECDEX_WEB_HOMES: `youtube=${home}` },
    })
    const { page } = app
    /** The pages main's web views are on. */
    const views = () =>
      (app as Launched).app.evaluate(({ BrowserWindow, WebContentsView }) =>
        BrowserWindow.getAllWindows()
          .flatMap((win) => win.contentView.children)
          .filter((view): view is InstanceType<typeof WebContentsView> => 'webContents' in view)
          .map((view) => view.webContents.getURL()),
      )
    const subtitle = page
      .locator('[data-testid=pane][data-pane-id=web]')
      .getByTestId('pane-subtitle')
    await expect(subtitle).toHaveText('YT home')
    await toLayout(page, 2)
    await expect(subtitle).toHaveText('YT next')
    await expect.poll(views).toEqual([`${home}next`])
    await toLayout(page, 1)
    await expect(subtitle).toHaveText('YT home')
    await expect.poll(views).toEqual([home])
  } finally {
    await app?.close()
    await site.close()
  }
})

test("a plugin pane gets its own layout's state", async () => {
  // The pane stays mounted over the switch and only its state changes, which the plugin must
  // be given.
  const files = pluginFiles({
    'tally.js': `export default {
      apiVersion: 1, id: 'tally', title: 'tally',
      view(ctx) {
        let n = ctx.state.get()?.n ?? 0
        const draw = () => ctx.render([
          { t: 'text', text: 'tally ' + n },
          { t: 'buttons', items: [{ action: 'add', text: 'add' }] },
        ])
        ctx.on('action', (a) => {
          if (a.action !== 'add') return
          n += 1
          ctx.state.set({ n })
          draw()
        })
        draw()
      },
    }`,
  })
  const tally = (n: number) => single('plugin:tally', { id: 'p1', state: { plugin: { n } } })
  const { page, close } = await launchOnTwoLayouts(tally(2), tally(7), { files })
  const plugin = page.locator('[data-testid=pane][data-pane-id=p1] [data-testid=plugin-pane]')
  try {
    await turnOnPlugin(page, 'tally')
    await expect(plugin.getByText('tally 2')).toBeVisible()
    await toLayout(page, 2)
    await expect(plugin.getByText('tally 7')).toBeVisible()
    // Its own state is its own: counted on from there, not mounted again from the first.
    await plugin.getByTestId('plugin-button').click()
    await expect(plugin.getByText('tally 8')).toBeVisible()
    await toLayout(page, 1)
    await expect(plugin.getByText('tally 2')).toBeVisible()
  } finally {
    await close()
  }
})
