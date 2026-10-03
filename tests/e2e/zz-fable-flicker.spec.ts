import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { atDesignSize, launch, settleLayout } from './support.js'

// Throwaway probe (deleted after the review): what repaints the ELEC-16 LCD at idle, and
// whether the top-left dot changes between frames.

const SCRATCH =
  'C:/Users/shinsaku/AppData/Local/Temp/claude/C--Users-shinsaku-Claude-elecdex/86a1456a-35e0-48a3-96ca-5ff94ee105ab/scratchpad'

const LAYOUT = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [20, 80],
    children: [
      { kind: 'pane', id: 'clock', widget: 'clock' },
      { kind: 'pane', id: 'e16', widget: 'elec16' },
    ],
  },
}

const lcdLines = async (page: Page): Promise<string[]> =>
  ((await page.getByTestId('elec16-text').textContent()) ?? '').split('\n').map((l) => l.trimEnd())

async function instrument(page: Page): Promise<void> {
  await page.evaluate(() => {
    const log: unknown[] = []
    ;(window as unknown as { __fable: unknown[] }).__fable = log
    const put = CanvasRenderingContext2D.prototype.putImageData
    CanvasRenderingContext2D.prototype.putImageData = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      const c = this.canvas
      log.push({
        kind: 'put',
        id: c.dataset.testid ?? c.className,
        args: args.slice(1),
        t: Math.round(performance.now()),
      })
      return (put as (...a: unknown[]) => void).apply(this, args)
    } as typeof put
    const desc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width')
    if (desc?.set) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
        ...desc,
        set(this: HTMLCanvasElement, v: number) {
          log.push({ kind: 'width', id: this.dataset.testid ?? this.className, v, t: Math.round(performance.now()) })
          desc.set?.call(this, v)
        },
      })
    }
    let frames = 0
    const raf = window.requestAnimationFrame
    window.requestAnimationFrame = (cb) => {
      frames++
      return raf.call(window, cb)
    }
    ;(window as unknown as { __frames: () => number }).__frames = () => frames
  })
}

async function rects(page: Page) {
  return page.evaluate(() => {
    const r = (el: Element | null) => {
      if (el === null) return null
      const b = el.getBoundingClientRect()
      return [b.x, b.y, b.width, b.height].map((n) => Math.round(n * 1000) / 1000)
    }
    return {
      dpr: window.devicePixelRatio,
      dots: r(document.querySelector('[data-testid=elec16-screen]')),
      shadow: r(document.querySelector('canvas.shadow')),
      grid: r(document.querySelector('canvas.grid')),
      glass: r(document.querySelector('.glass')),
      scale: document.querySelector('[data-testid=elec16-screen]')?.getAttribute('data-scale'),
      frames: (window as unknown as { __frames: () => number }).__frames(),
    }
  })
}

async function sample(page: Page, name: string, shots: number, everyMs: number) {
  const box = await page.getByTestId('elec16-screen').boundingBox()
  if (box === null) throw new Error('no screen')
  const hashes: string[] = []
  const seen = new Map<string, Buffer>()
  const wide: string[] = []
  for (let k = 0; k < shots; k++) {
    const buf = await page.screenshot({
      clip: { x: box.x - 2, y: box.y - 2, width: 20, height: 16 },
      animations: 'disabled',
      caret: 'hide',
    })
    const h = createHash('sha1').update(buf).digest('hex').slice(0, 8)
    hashes.push(h)
    if (!seen.has(h)) seen.set(h, buf)
    const row = await page.screenshot({
      clip: { x: box.x - 2, y: box.y - 2, width: Math.min(box.width + 4, 260), height: 14 },
      animations: 'disabled',
      caret: 'hide',
    })
    wide.push(createHash('sha1').update(row).digest('hex').slice(0, 8))
    await page.waitForTimeout(everyMs)
  }
  for (const [h, buf] of seen) writeFileSync(`${SCRATCH}/${name}-${h}.png`, buf)
  const log = await page.evaluate(() => {
    const w = window as unknown as { __fable: unknown[] }
    const out = w.__fable.splice(0)
    return out
  })
  console.log(`[${name}] corner hashes: ${hashes.join(' ')}`)
  console.log(`[${name}] row hashes:    ${wide.join(' ')}`)
  console.log(`[${name}] distinct corner images: ${seen.size}`)
  console.log(`[${name}] paint log (${log.length}): ${JSON.stringify(log).slice(0, 3000)}`)
  console.log(`[${name}] rects: ${JSON.stringify(await rects(page))}`)
}

test('what repaints the LCD at idle, and whether its top-left dot moves', async () => {
  test.setTimeout(180_000)
  const { app, page, close } = await launch(undefined, { layout: LAYOUT })
  try {
    await atDesignSize(app, page)
    await settleLayout(page)
    await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('ELEC-16 MONITOR 0.1')
    await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
    await instrument(page)
    await page.waitForTimeout(1500)
    console.log(`rects at start: ${JSON.stringify(await rects(page))}`)
    await sample(page, 'idle', 24, 90)
    await page.getByTestId('elec16').focus()
    await page.keyboard.type('d 0', { delay: 15 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(800)
    await sample(page, 'after-d', 24, 90)
    // A program writing the screen every turn (the cost test's), at 4 MHz.
    await page.keyboard.type('e 7000 1f 04 00 07 09 12 07 00 26 00 f5 bf', { delay: 10 })
    await page.keyboard.press('Enter')
    await page.keyboard.type('g 7000', { delay: 10 })
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'run')
    await page.waitForTimeout(800)
    await sample(page, 'running', 24, 90)
    await page.getByTestId('elec16-brk').click()
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'sleep')
    await page.waitForTimeout(800)
    await sample(page, 'after-brk', 24, 90)
  } finally {
    await close()
  }
})
