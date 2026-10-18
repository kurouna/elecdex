import { toasts } from '../stores/toasts.svelte.ts'

/**
 * What went wrong, put where it is seen: a toast, once per message for as long as
 * the page runs, offering the words to copy with the app's version and platform
 * for a report. Nothing is sent anywhere. Three ways in: a reader's own problems
 * (the Ethernet pane's, on adapters and drivers nobody here has tried), a pane
 * that threw (PaneHost's boundary), and an exception nothing caught in the page
 * (`watchPageFaults`). A fault that repeats is said once; a burst of different
 * ones is held to a few a minute, so a broken loop cannot wall the corner.
 */

const said = new Set<string>()
/** When each of the last toasts was raised, for the burst limit. */
const recent: number[] = []

const BURST = 3
const BURST_MS = 60_000
const MAX_LENGTH = 300

/** For tests: say everything again. */
export function forgetSaid(): void {
  said.clear()
  recent.length = 0
}

/** One line of an error, at most MAX_LENGTH: its name and message, never its stack. */
export function faultText(error: unknown): string {
  const text =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? 'unknown')
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_LENGTH)
}

async function details(source: string, message: string): Promise<string> {
  let app: string
  try {
    const info = await window.elecdex.system.info()
    app = `elecdex ${info.version} on ${info.platform} ${info.arch}`
  } catch {
    app = 'elecdex'
  }
  return `${source} problem\n${app}\n${message}`
}

function room(now: number): boolean {
  while (recent.length > 0 && now - (recent[0] as number) > BURST_MS) recent.shift()
  return recent.length < BURST
}

function say(source: string, message: string, tone: 'warn' | 'danger', body: string): void {
  const key = `${source}\n${message}`
  if (message === '' || said.has(key)) return
  const now = Date.now()
  if (!room(now)) return
  said.add(key)
  recent.push(now)
  toasts.show({
    title: `${source}: ${tone === 'danger' ? 'something failed' : 'something could not be read'}`,
    body,
    tone,
    timeoutMs: 0,
    actions: [
      {
        label: 'copy details',
        primary: true,
        run: () => {
          void details(source, message).then((text) => navigator.clipboard.writeText(text))
        },
      },
      { label: 'dismiss', run: () => undefined },
    ],
  })
}

/** A toast for each problem a reader reported that was not yet said. */
export function reportProblems(source: string, problems: readonly string[]): void {
  for (const message of problems)
    say(
      source,
      message.slice(0, MAX_LENGTH),
      'warn',
      `${message}. The pane goes on with what it has. Copy the details to report it.`,
    )
}

/** A red toast for an exception: where, and its message. */
export function reportFault(source: string, error: unknown): void {
  const message = faultText(error)
  say(source, message, 'danger', `${message}. Copy the details to report it.`)
}

/**
 * Not faults: the browser's note that a ResizeObserver could not deliver every
 * size in one frame, which is harmless and comes in bursts while panes move.
 */
const IGNORED = [/ResizeObserver loop/]

/** Exceptions nothing in the page caught, as toasts. Returns the way to stop. */
export function watchPageFaults(target: Window = window): () => void {
  const onError = (event: ErrorEvent): void => {
    const message = event.error ?? event.message
    if (IGNORED.some((pattern) => pattern.test(faultText(message)))) return
    reportFault('elecdex', message)
  }
  const onRejection = (event: PromiseRejectionEvent): void => reportFault('elecdex', event.reason)
  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onRejection)
  return () => {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
