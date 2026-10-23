import type { ElectronApplication } from '@playwright/test'

/**
 * Main's stand-ins (STUB_ENV) put their test hooks on `globalThis`: the clipboard
 * (src/main/clipboard/stub.ts), the media session (src/main/media/stub.ts), the Docker engine
 * (src/main/docker/stub.ts) and the power-save blocker (src/main/awake/stub.ts). Their shapes are
 * written again here rather than imported, as the e2e program does not take in main's sources;
 * keep them in step with those files.
 */

export interface ClipboardHooks {
  copy(text: string, options?: { html?: string; rtf?: string; private?: boolean }): void
  /** Something the pane does not keep, an image say. */
  copyOther(): void
  current(): { text: string; html: string | null; rtf: string | null } | null
  /** How many times the clipboard has been looked at. */
  reads(): number
}

export interface NowPlayingHooks {
  /** Puts a track on (merged over the current one), or takes the session away (null). */
  set(track: Record<string, unknown> | null): void
  playlist(tracks: readonly Record<string, unknown>[]): void
  /** The presses the pane passed on, in order; a seek as `seek <seconds>`. */
  presses(): string[]
  /** How many times the session has been read. */
  reads(): number
  open(): boolean
}

export interface DockerHooks {
  set(containers: Record<string, unknown>[]): void
  change(name: string, patch: Record<string, unknown>): void
  link(state: 'up' | 'down' | 'denied'): void
  /** The presses passed on, in order, as `<action> <name>`. */
  presses(): string[]
  /** How many times the list has been read. */
  lists(): number
  /** How many event streams are open now. */
  streams(): number
  /** How many stats readings were made. */
  statsReads(): number
}

export interface AwakeHooks {
  /** The kinds held now, in the order they were asked for. */
  held(): string[]
  /** Every kind ever asked for. */
  asked(): string[]
  battery(on: boolean): void
  resume(): void
}

interface Hooks {
  clipboard: ClipboardHooks
  nowPlaying: NowPlayingHooks
  docker: DockerHooks
  awake: AwakeHooks
}

const GLOBALS: Record<keyof Hooks, string> = {
  clipboard: '__elecdexClipboard',
  nowPlaying: '__elecdexNowPlaying',
  docker: '__elecdexDocker',
  awake: '__elecdexAwake',
}

/** A stand-in's hooks as seen from the test: each call goes to main and answers a promise. */
export type Remote<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : never
}

/**
 * The hooks of main's stand-in `name`, called from the test: `stubOf(app, 'docker').lists()`.
 * Arguments and answers cross as Playwright serialises them.
 */
export function stubOf<K extends keyof Hooks>(app: ElectronApplication, name: K): Remote<Hooks[K]> {
  const global = GLOBALS[name]
  return new Proxy({} as Remote<Hooks[K]>, {
    get: (_target, method) =>
      // Not a thenable: the hooks object handed through an `await` must stay itself.
      method === 'then' || typeof method === 'symbol'
        ? undefined
        : (...args: unknown[]) =>
            app.evaluate(
              (_electron, [where, what, given]) => {
                const hooks = (globalThis as unknown as Record<string, Record<string, unknown>>)[
                  where as string
                ]
                const call = hooks?.[what as string]
                if (typeof call !== 'function') throw new Error(`no stand-in hook ${where}.${what}`)
                return (call as (...a: unknown[]) => unknown).apply(hooks, given as unknown[])
              },
              [global, String(method), args] as const,
            ),
  })
}

/** The text on main's stand-in clipboard, or null when it holds none. */
export const clipboardText = async (app: ElectronApplication): Promise<string | null> =>
  (await stubOf(app, 'clipboard').current())?.text ?? null

/** The first `count` bytes of the picture on main's stand-in clipboard, or null when none. */
export const clipboardImageHead = (app: ElectronApplication, count = 8): Promise<number[] | null> =>
  app.evaluate((_electron, n) => {
    const hooks = (globalThis as unknown as { __elecdexClipboard: { image(): Uint8Array | null } })
      .__elecdexClipboard
    const png = hooks.image()
    return png === null ? null : [...png.subarray(0, n)]
  }, count)
