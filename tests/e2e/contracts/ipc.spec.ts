import { isDeepStrictEqual } from 'node:util'
import { expect, type Page, test } from '@playwright/test'
import { type Launched, launch, SINGLE_CLOCK } from '../support.js'
import { IPC_ROWS, type IpcRow, type Probe, type Refusal } from './ipc-table.js'

/**
 * The IPC contract (docs/e2e-design.md, section 3.2; CLAUDE.md, "Security boundary"): every method
 * of `window.elecdex` that takes an argument is called from the page with arguments main must
 * refuse (contracts/ipc-table.ts), and is refused as its row says - and through all of it main
 * stays up and answering, the workspace stays drawn, and nothing reaches the machine: main's
 * pickers, message boxes and shell (open, reveal, the browser) are replaced first and must never
 * be called. One app on a lone clock takes every call; a failure names every call that was not
 * refused as its row says at once.
 */

/** How a call came out, as the page saw it. */
type Outcome =
  | { kind: 'threw' | 'rejected'; message: string }
  | { kind: 'resolved' | 'returned'; value: unknown }

/** Stands for `undefined` inside what crosses from the page, where it would be dropped. */
const UNDEFINED = '$undefined'

/** Calls `method` on `window.elecdex` with `args` (markers made real in the page). */
const call = (page: Page, method: string, args: unknown[], subscribes: boolean): Promise<Outcome> =>
  page.evaluate(
    async ({ method, args, subscribes, UNDEFINED }) => {
      const real = (value: unknown): unknown => {
        if (typeof value !== 'object' || value === null) return value
        if ('$str' in value) return 'x'.repeat((value as { $str: number }).$str)
        if ('$bytes' in value) return new Uint8Array((value as { $bytes: number }).$bytes)
        return value
      }
      const out = (value: unknown) => (value === undefined ? UNDEFINED : value)
      const parts = method.split('.')
      const name = parts.pop() ?? ''
      let owner: Record<string, unknown> = window.elecdex as unknown as Record<string, unknown>
      for (const part of parts) owner = owner[part] as Record<string, unknown>
      const fn = owner[name] as (...a: unknown[]) => unknown
      const given = args.map(real)
      if (subscribes) given.push(() => {})
      try {
        const answer = fn(...given)
        if (typeof answer === 'function') {
          // A subscription: let go of it at once, as a pane that unmounts does.
          ;(answer as () => void)()
          return { kind: 'returned' as const, value: UNDEFINED }
        }
        if (typeof (answer as { then?: unknown } | null)?.then === 'function') {
          try {
            return { kind: 'resolved' as const, value: out(await answer) }
          } catch (error) {
            return { kind: 'rejected' as const, message: String((error as Error).message) }
          }
        }
        return { kind: 'returned' as const, value: out(answer) }
      } catch (error) {
        return { kind: 'threw' as const, message: String((error as Error).message) }
      }
    },
    { method, args, subscribes, UNDEFINED },
  )

/** What a reader with no arguments answers now, or the one field of it the probe names. */
async function read(page: Page, probe: Probe): Promise<unknown> {
  const outcome = await call(page, probe.call, [], false)
  if (outcome.kind !== 'resolved') return outcome
  const value = outcome.value as Record<string, unknown> | null
  return probe.pick === undefined ? value : value?.[probe.pick]
}

/** Why `outcome` is not the refusal `refused` asks for, or null when it is. */
async function wrongRefusal(
  page: Page,
  refused: Refusal,
  outcome: Outcome,
): Promise<string | null> {
  const shown = JSON.stringify(outcome).slice(0, 200)
  if ('rejects' in refused) {
    return outcome.kind === 'threw' || outcome.kind === 'rejected'
      ? null
      : `did not reject: ${shown}`
  }
  if ('ignored' in refused) {
    return outcome.kind === 'resolved' && outcome.value !== UNDEFINED
      ? `answered something: ${shown}`
      : null
  }
  if (outcome.kind !== 'resolved') return `did not resolve: ${shown}`
  const value = outcome.value === UNDEFINED ? undefined : outcome.value
  return (await resolvedRight(page, refused, value)) ? null : `resolved otherwise: ${shown}`
}

/** Whether `value`, which a call resolved to, is the refusal `refused` asks for. */
async function resolvedRight(page: Page, refused: Refusal, value: unknown): Promise<boolean> {
  if ('resolves' in refused) return isDeepStrictEqual(value, refused.resolves)
  if ('matches' in refused) {
    const got = (value ?? {}) as Record<string, unknown>
    return Object.entries(refused.matches).every(([k, v]) => isDeepStrictEqual(got[k], v))
  }
  if ('same' in refused) return isDeepStrictEqual(value, await read(page, { call: refused.same }))
  return false
}

/** Short, for a key in the failures: the method and its arguments, long strings named by length. */
function label(method: string, args: unknown[]): string {
  const shown = JSON.stringify(args, (_k, v: unknown) =>
    typeof v === 'object' && v !== null && '$str' in v
      ? `<${(v as { $str: number }).$str} chars>`
      : v,
  )
  return `${method}(${shown.slice(1, -1).slice(0, 80)})`
}

let ctx: Launched
let page: Page
const pageErrors: string[] = []

test.beforeAll(async () => {
  ctx = await launch(undefined, { layout: SINGLE_CLOCK })
  page = ctx.page
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('crash', () => pageErrors.push('the page crashed'))
  // Everything main could do on the machine for a page, kept instead of done: a refusal that
  // slipped would show here, and nothing opens in front of whoever runs the suite.
  await ctx.app.evaluate(({ clipboard, dialog, shell }) => {
    const acted: string[] = []
    ;(globalThis as { __ipcActed?: string[] }).__ipcActed = acted
    const keep =
      (what: string, answer: unknown) =>
      async (...args: unknown[]) => {
        acted.push(
          `${what} ${JSON.stringify(args.filter((a) => typeof a !== 'object')).slice(0, 200)}`,
        )
        return answer
      }
    shell.openExternal = keep('openExternal', undefined) as never
    shell.openPath = keep('openPath', '') as never
    shell.showItemInFolder = keep('showItemInFolder', undefined) as never
    shell.trashItem = keep('trashItem', undefined) as never
    dialog.showOpenDialog = keep('showOpenDialog', { canceled: true, filePaths: [] }) as never
    dialog.showSaveDialog = keep('showSaveDialog', { canceled: true, filePath: '' }) as never
    dialog.showMessageBox = keep('showMessageBox', { response: 1, checkboxChecked: false }) as never
    // The machine's clipboard too: a copy that slipped through must not replace what is on it.
    for (const name of ['writeText', 'writeHTML', 'writeRTF', 'writeImage', 'write', 'clear']) {
      ;(clipboard as unknown as Record<string, unknown>)[name] = keep(
        `clipboard.${name}`,
        undefined,
      )
    }
  })
})

test.afterAll(async () => {
  await ctx?.close()
})

/** Main is up, answers, and the workspace is drawn. */
async function stillUp(): Promise<string | null> {
  if (ctx.app.process().exitCode !== null) return 'main exited'
  const info = await Promise.race([
    page.evaluate(() => window.elecdex.system.info().then((i) => i.name)).catch(() => null),
    // wait: a main that hangs answers nothing; this bounds the question rather than the test.
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5_000)),
  ])
  if (info === null) return 'system.info() did not answer'
  const loaded = await page.getByTestId('workspace').getAttribute('data-loaded')
  return loaded === 'true' ? null : 'the workspace is not drawn'
}

/** Calls every bad argument list of `row`; the failures by call. */
async function checkRow(row: IpcRow): Promise<Record<string, string>> {
  const failed: Record<string, string> = {}
  for (const args of row.bad) {
    const key = label(row.method, args)
    const before = row.probe === undefined ? undefined : await read(page, row.probe)
    const outcome = await call(page, row.method, args, row.subscribes === true)
    const wrong = await wrongRefusal(page, row.refused, outcome)
    if (wrong !== null) failed[key] = wrong
    if (row.probe !== undefined) {
      const after = await read(page, row.probe)
      if (!isDeepStrictEqual(before, after)) {
        failed[`${key} probe`] = `${row.probe.call} changed: ${JSON.stringify(after).slice(0, 200)}`
      }
    }
  }
  const down = await stillUp()
  if (down !== null) failed[`${row.method} after`] = down
  return failed
}

test('every method of window.elecdex refuses arguments that are not its own, and main stays up', async () => {
  test.setTimeout(240_000)
  const failed: Record<string, string> = {}
  for (const row of IPC_ROWS) {
    Object.assign(failed, await checkRow(row))
    // A main that went down fails every row after it the same way: say it once.
    if (ctx.app.process().exitCode !== null) break
  }
  expect(failed).toEqual({})
  const acted = await ctx.app.evaluate(
    () => (globalThis as { __ipcActed?: string[] }).__ipcActed ?? [],
  )
  expect(acted, 'what main did on the machine for a refused call').toEqual([])
  expect(pageErrors).toEqual([])
  expect(await stillUp()).toBeNull()
})
