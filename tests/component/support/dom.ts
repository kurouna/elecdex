import { vi } from 'vitest'

/**
 * What jsdom lacks and the panes ask the browser for: media queries, observers, Web
 * Animations and a 2D canvas. Every component file used to write its own copy of the same
 * stand-ins; each now calls the ones it needs in its own `beforeEach`, so a reader sees what
 * is stubbed. The globals go through `vi.stubGlobal`, so the files' `vi.unstubAllGlobals()`
 * takes them away again.
 */

/** Both stand-ins most panes need: motion not reduced, and an observer that never reports. */
export function inertDom(): void {
  stubMatchMedia(false)
  stubResizeObserver('none')
}

/**
 * A `matchMedia` answering every query with `matches` (or what it says for that query). The
 * CRT transitions ask whether motion is reduced; `true` skips them.
 */
export function stubMatchMedia(matches: boolean | ((query: string) => boolean) = false): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: typeof matches === 'function' ? matches(query) : matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

/** A box's size, as a `ResizeObserverEntry`'s `contentRect` carries it. */
export type BoxSize = { width: number; height: number }

/**
 * How the stand-in `ResizeObserver` reports when it starts observing:
 * - `'none'`: never, for panes that only need the constructor to exist;
 * - `'once'`: its callback once with no entries, for panes that then measure the element
 *   themselves (`clientWidth`, which the test stubs);
 * - a size: one entry with the target and that size, read when observing starts, so a test
 *   may change the object between mounts;
 * - a function: the entry it makes for the target, for panes that read more than the size.
 */
export type ResizeReport = 'none' | 'once' | BoxSize | ((target: Element) => object)

export function stubResizeObserver(report: ResizeReport = 'none'): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) {
        this.#callback = callback
      }
      observe(target: Element): void {
        if (report === 'none') return
        if (report === 'once') {
          ;(this.#callback as () => void)()
          return
        }
        const entry =
          typeof report === 'function' ? report(target) : { target, contentRect: { ...report } }
        this.#callback([entry as ResizeObserverEntry], this as unknown as ResizeObserver)
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  )
}

/**
 * An `IntersectionObserver` that says the element is in view as soon as it is observed
 * (`'visible'`), or never says anything (`'none'`). jsdom has no layout to tell.
 */
export function stubIntersectionObserver(report: 'visible' | 'none' = 'visible'): void {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly #callback: IntersectionObserverCallback
      constructor(callback: IntersectionObserverCallback) {
        this.#callback = callback
      }
      observe(): void {
        if (report === 'none') return
        this.#callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  )
}

/**
 * Enough of Web Animations for a CRT transition to end. By default every animation finishes on
 * the next microtask, after the caller has set its `onfinish`: waiting out its duration on a
 * real timer only made the tests slower. With `runs: 'its length'` it finishes after its
 * duration on `setTimeout`, for a file whose fake clock times what a transition holds up.
 * Assigned to the prototype (the file's own jsdom), so it stays for the whole file.
 */
export function finishAnimations({
  runs = 'at once',
}: {
  runs?: 'at once' | 'its length'
} = {}): void {
  Element.prototype.getAnimations ??= () => []
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const finish = () => animation.onfinish?.()
    if (runs === 'at once') queueMicrotask(finish)
    else setTimeout(finish, typeof options === 'number' ? options : Number(options?.duration ?? 0))
    return animation as unknown as Animation
  }
}

/**
 * A 2D context that takes any call and ignores it, recording each method's name in `drawn`
 * when given; `answers` are returned as they are for the names they hold (a `measureText`
 * that answers a width, say).
 */
export function canvasContext(
  drawn?: string[],
  answers: Record<string, unknown> = {},
): CanvasRenderingContext2D {
  return new Proxy(
    {},
    {
      get: (_target, name) => {
        if (typeof name !== 'string') return undefined
        if (name in answers) return answers[name]
        return (..._args: unknown[]) => drawn?.push(name)
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}

/** Every canvas answers `getContext` with `ctx`: jsdom has no canvas of its own. */
export function stubCanvas(ctx: unknown = canvasContext()): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
}
