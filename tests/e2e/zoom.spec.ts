import { expect, type Page, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL, terminalPane, typeInto, zoomSettled } from './support.js'

/**
 * Bringing one pane to the front of the workspace and putting it back.
 *
 * What only the running app can show: the pane really covers the workspace, the
 * panes behind it keep their size (so no terminal but this one is resized), it
 * is what the pointer and the keyboard reach, and a shell that goes there and
 * back still has its history - the size it was given changed once, not per frame.
 */

const pane = (page: Page, widget: string) =>
  page.locator(`[data-testid=pane][data-widget=${widget}]:not(.hidden)`)

interface Box {
  x: number
  y: number
  width: number
  height: number
}

async function boxOf(page: Page, selector: string): Promise<Box> {
  const box = await page.locator(selector).first().boundingBox()
  if (box === null) throw new Error(`no box for ${selector}`)
  return box
}

/** Whether `box` is nine tenths of `area`, centred in it, give or take a pixel. */
function fillsMostOf(box: Box, area: Box): boolean {
  const near = (a: number, b: number) => Math.abs(a - b) <= 2
  return (
    near(box.width, area.width * 0.9) &&
    near(box.height, area.height * 0.9) &&
    near(box.x, area.x + area.width * 0.05) &&
    near(box.y, area.y + area.height * 0.05)
  )
}

/** Brings a pane forward with its own button, which shows on hover. */
async function zoomPane(page: Page, widget: string): Promise<void> {
  await pane(page, widget).hover()
  await pane(page, widget).getByTestId('pane-zoom').click()
  await expect(page.getByTestId('zoom-backdrop')).toBeVisible()
  await zoomSettled(page)
}

const zoomClock = (page: Page) => zoomPane(page, 'clock')

test('a pane brought forward covers the workspace, and the panes behind it keep their place', async () => {
  const { page, close } = await launch()
  try {
    const before = {
      cpu: await boxOf(page, '[data-testid=pane][data-widget=cpu]'),
      calendar: await boxOf(page, '[data-testid=pane][data-widget=calendar]'),
    }
    await zoomClock(page)

    const area = await boxOf(page, '[data-testid=workspace]')
    const clock = await boxOf(page, '[data-testid=pane][data-widget=clock]')
    expect(fillsMostOf(clock, area)).toBe(true)

    // Nothing behind it moved or was resized: a pane brought forward is drawn
    // over the workspace, not taken out of the layout.
    expect(await boxOf(page, '[data-testid=pane][data-widget=cpu]')).toEqual(before.cpu)
    expect(await boxOf(page, '[data-testid=pane][data-widget=calendar]')).toEqual(before.calendar)

    // It is what the pointer reaches in the middle of the window, and everything
    // else is out of reach behind the shade.
    const onTop = await page.evaluate(() => {
      const at = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      return at?.closest('[data-testid=pane]')?.getAttribute('data-widget') ?? null
    })
    expect(onTop).toBe('clock')
    await expect(pane(page, 'cpu')).toHaveAttribute('inert', '')
    await expect(pane(page, 'clock')).not.toHaveAttribute('inert', '')
  } finally {
    await close()
  }
})

test('it is at its full size from the first frame, and flies there rather than growing', async () => {
  const { page, close } = await launch()
  try {
    await pane(page, 'clock').hover()
    // Measured one frame after the click, while the flight is still playing. The
    // laid-out size (offsetWidth, which a transform does not change) is already
    // the final one: that is what keeps a terminal from sending ConPTY a size
    // per frame, and the flight itself is a transform the compositor plays.
    const first = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('[data-testid=pane-zoom]')?.click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const el = document.querySelector<HTMLElement>('[data-widget=clock]')
      const running = document
        .getAnimations()
        .filter((a) => (a as CSSAnimation).animationName === 'crt-zoom')
        .map((a) => a.playState)
      return { width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0, running }
    })
    expect(first.running).toContain('running')

    const area = await boxOf(page, '[data-testid=workspace]')
    expect(Math.abs(first.width - area.width * 0.9)).toBeLessThanOrEqual(2)
    expect(Math.abs(first.height - area.height * 0.9)).toBeLessThanOrEqual(2)
  } finally {
    await close()
  }
})

test('the shade, Escape, the shortcut and the button all put it back', async () => {
  const { page, close } = await launch()
  try {
    const home = await boxOf(page, '[data-testid=pane][data-widget=clock]')
    const back = async () => {
      await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
      await zoomSettled(page)
      await expect
        .poll(async () => await boxOf(page, '[data-testid=pane][data-widget=clock]'))
        .toEqual(home)
    }

    // Its own button again.
    await zoomClock(page)
    await pane(page, 'clock').getByTestId('pane-zoom').click()
    await back()

    // A press on the shade behind it.
    await zoomClock(page)
    await page.getByTestId('zoom-backdrop').click({ position: { x: 4, y: 4 } })
    await back()

    // Escape, as a dialog closes.
    await zoomClock(page)
    await page.keyboard.press('Escape')
    await back()

    // And the shortcut, which brings the focused pane forward and puts it back.
    await page.keyboard.press('Control+Shift+KeyZ')
    await expect(page.getByTestId('zoom-backdrop')).toBeVisible()
    await page.keyboard.press('Control+Shift+KeyZ')
    await back()
  } finally {
    await close()
  }
})

test('a shell brought forward and put back keeps its history', async () => {
  const { page, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  const marker = `FORWARD-MARKER-${Date.now()}`
  try {
    const shell = terminalPane(page).first()
    await typeInto(page, shell, `echo ${marker}`)
    await page.waitForTimeout(1500)

    await shell.getByTestId('tab-zoom').click()
    await expect(page.getByTestId('zoom-backdrop')).toBeVisible()
    await zoomSettled(page)
    await page.waitForTimeout(800) // the shell is told its new size once, and repaints

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
    await zoomSettled(page)
    await page.waitForTimeout(800)

    // The session's screen as a reattaching pane would receive it: ConPTY
    // rewraps its buffer to every size it is given, so a size sent per frame
    // leaves the lines broken up here.
    const screen = await page.evaluate(async () => {
      const decoder = new TextDecoder()
      const id = (await window.elecdex.pty.list())[0]?.id
      if (id === undefined) return ''
      let text = ''
      const detach = await window.elecdex.pty.attach(id, {
        onData: (chunk) => {
          text += decoder.decode(chunk, { stream: true })
        },
        onExit: () => {},
        onCwd: () => {},
        onCommandEnd: () => {},
        onIntegrationUnavailable: () => {},
      })
      await new Promise((r) => setTimeout(r, 800))
      detach()
      return text
    })
    const ESC = String.fromCharCode(27)
    const lines = screen
      .replaceAll(new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g'), '')
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
    expect(lines.some((line) => line.endsWith(`echo ${marker}`))).toBe(true)
    expect(lines).toContain(marker)
  } finally {
    await close()
  }
})

test('a tab group comes forward with its strip, and another tab keeps it forward', async () => {
  const { page, close } = await launch()
  try {
    const group = page.getByTestId('tabs-host').first()
    await group.getByTestId('tab-zoom').click()
    await expect(page.getByTestId('zoom-backdrop')).toBeVisible()
    await zoomSettled(page)

    const area = await boxOf(page, '[data-testid=workspace]')
    expect(fillsMostOf(await boxOf(page, '[data-testid=tabs-host]'), area)).toBe(true)
    // The strip comes with it, so the group's other tabs are still reachable.
    await expect(group.getByTestId('tab')).toHaveCount(3)

    // Another tab takes the zoom with it rather than dropping it: the group is
    // what is forward, and only the tab shown in it has changed.
    await group.getByTestId('tab').nth(1).click()
    await expect(page.getByTestId('zoom-backdrop')).toBeVisible()
    expect(fillsMostOf(await boxOf(page, '[data-testid=tabs-host]'), area)).toBe(true)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('dragging the pane that is forward puts it back, so it can be dropped somewhere', async () => {
  const { page, close } = await launch()
  try {
    // The CPU pane, which has a title to drag it by (the clock has none).
    await zoomPane(page, 'cpu')

    // Press its title and move: the pane goes home as the drag starts, and the
    // drop targets behind the shade are reachable again.
    const from = await boxOf(page, '[data-testid=pane][data-widget=cpu] .module-title')
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    const onto = await boxOf(page, '[data-testid=pane][data-widget=calendar]')
    await page.mouse.move(onto.x + onto.width / 2, onto.y + onto.height - 12, { steps: 12 })
    await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
    await expect(page.getByTestId('pane-drag')).toHaveCount(1)
    await expect(page.getByTestId('pane-drop-preview')).toHaveCount(1)
    await page.mouse.up()

    // It really moved: under the calendar, at the bottom of the right column.
    await zoomSettled(page)
    const moved = await boxOf(page, '[data-testid=pane][data-widget=cpu]')
    expect(moved.y).toBeGreaterThan(onto.y)
  } finally {
    await close()
  }
})

test('a widget that follows its size sees the room the front gives it', async () => {
  // Regression: the calendar asks how many months fit whenever its pane resizes,
  // and measured the pane again inside the resize callback. A pane just pinned
  // over the workspace still answers there with the size it had in the layout it
  // left, so a calendar brought forward kept its one month in a window of space.
  const { page, close } = await launch()
  try {
    const calendar = page.getByTestId('calendar')
    await expect(calendar).toHaveAttribute('data-months', '1')

    await zoomPane(page, 'calendar')
    await expect(calendar).toHaveAttribute('data-months', '3')
    await expect(page.getByTestId('calendar-grid')).toHaveCount(3)

    await page.keyboard.press('Escape')
    await zoomSettled(page)
    await expect(calendar).toHaveAttribute('data-months', '1')
  } finally {
    await close()
  }
})

test('closing the pane that is forward, and a layout change, let go of it', async () => {
  const { page, close } = await launch()
  try {
    await zoomClock(page)
    await pane(page, 'clock').getByTestId('pane-close').click()
    await expect(pane(page, 'clock')).toHaveCount(0)
    await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)

    // A pane added while another is forward settles the zoom rather than leaving
    // a pinned pane over a layout that has changed under it.
    await pane(page, 'cpu').hover()
    await pane(page, 'cpu').getByTestId('pane-zoom').click()
    await expect(page.getByTestId('zoom-backdrop')).toBeVisible()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
    await expect(page.locator('[data-testid=pane].zoomed')).toHaveCount(0)
  } finally {
    await close()
  }
})

/** A layout of one pane per widget named, side by side. */
const rowOf = (...widgets: string[]) => ({
  version: 1,
  root: {
    kind: 'split',
    id: 'root',
    direction: 'row',
    sizes: widgets.map(() => 1 / widgets.length),
    children: widgets.map((widget, i) => ({ kind: 'pane', id: `p${i}`, widget })),
  },
})

test('a pane with nothing more to show at any size has no way forward', async () => {
  const { page, close } = await launch(undefined, { layout: rowOf('netstat', 'sysinfo', 'clock') })
  try {
    // No button on either readout, and the shortcut leaves them where they are.
    for (const widget of ['netstat', 'sysinfo']) {
      await pane(page, widget).hover()
      await expect(pane(page, widget).getByTestId('pane-zoom')).toHaveCount(0)
      await pane(page, widget).dispatchEvent('pointerdown')
      await page.keyboard.press('Control+Shift+KeyZ')
      await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
    }

    // The clock beside them still has both.
    await pane(page, 'clock').hover()
    await expect(pane(page, 'clock').getByTestId('pane-zoom')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a widget with little to show comes forward as a panel, not as the whole workspace', async () => {
  const { page, close } = await launch(undefined, { layout: rowOf('calc', 'clock') })
  try {
    await zoomPane(page, 'calc')
    const area = await boxOf(page, '[data-testid=workspace]')
    const panel = await boxOf(page, '[data-testid=pane][data-widget=calc]')

    // Its own size, centred in the workspace - not the nine tenths a full pane takes.
    expect(panel.width).toBeLessThan(area.width * 0.9 - 2)
    expect(Math.abs(panel.x + panel.width / 2 - (area.x + area.width / 2))).toBeLessThanOrEqual(2)
    expect(Math.abs(panel.y + panel.height / 2 - (area.y + area.height / 2))).toBeLessThanOrEqual(2)

    // And it is still a zoom: the shade is there and Escape puts it back.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('zoom-backdrop')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a tab strip offers the zoom only for a tab that can take it', async () => {
  const layout = {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'g',
      activeIndex: 0,
      children: [
        { kind: 'pane', id: 't', widget: 'terminal' },
        { kind: 'pane', id: 'n', widget: 'netstat' },
      ],
    },
  }
  const { page, close } = await launch(undefined, { layout })
  try {
    const strip = page.getByTestId('tabs-host')
    await expect(strip.getByTestId('tab-zoom')).toHaveCount(1)

    // The second tab has nothing to gain from the whole workspace, so the group
    // offers nothing while it is the one showing.
    await strip.getByTestId('tab').nth(1).click()
    await expect(strip.getByTestId('tab-zoom')).toHaveCount(0)
    await strip.getByTestId('tab').nth(0).click()
    await expect(strip.getByTestId('tab-zoom')).toHaveCount(1)
  } finally {
    await close()
  }
})
