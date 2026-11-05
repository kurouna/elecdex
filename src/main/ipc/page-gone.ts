/**
 * When a page goes - its WebContents destroyed, or navigated to a new document
 * (a reload) - every IPC module that took subscriptions for it must drop them
 * (CLAUDE.md: subscriptions are dropped on reload and destroy).
 *
 * Each module used to add its own `destroyed` and `did-start-navigation`
 * listeners to every page that subscribed: a dozen modules on the one window,
 * past Node's limit of ten listeners per event. Here the page gets one pair,
 * and each module registers what to do once, under itself - however often it asks.
 */

/** What is used of a WebContents: its two events. */
export interface PageEvents {
  once(event: 'destroyed', listener: () => void): unknown
  on(
    event: 'did-start-navigation',
    listener: (details: { isMainFrame: boolean; isSameDocument: boolean }) => void,
  ): unknown
}

const followed = new WeakMap<PageEvents, Map<object, () => void>>()

/**
 * Calls `onGone` whenever the page in `sender` goes. `owner` is the module's own
 * object (its registry): a second registration by the same owner is ignored, so
 * a module may call this with every subscription, and a module made again (a
 * test registering IPC twice) is not taken for the one before.
 */
export function whenPageGoes(sender: PageEvents, owner: object, onGone: () => void): void {
  let modules = followed.get(sender)
  if (modules === undefined) {
    const handlers = new Map<object, () => void>()
    modules = handlers
    followed.set(sender, handlers)
    const tellAll = (): void => {
      for (const handler of [...handlers.values()]) handler()
    }
    const onNavigation = (details: { isMainFrame: boolean; isSameDocument: boolean }): void => {
      if (details.isMainFrame && !details.isSameDocument) tellAll()
    }
    sender.on('did-start-navigation', onNavigation)
    sender.once('destroyed', () => {
      // The page is gone for good, and its listeners with it.
      tellAll()
      followed.delete(sender)
    })
  }
  if (!modules.has(owner)) modules.set(owner, onGone)
}

/** What is used of a WebContents to hear it has loaded. */
export interface PageLoads {
  on(event: 'did-finish-load', listener: () => void): unknown
}

const loading = new WeakMap<PageLoads, Map<object, () => void>>()

/**
 * Calls `onLoad` whenever the page in `sender` finishes loading (after a reload too), with one
 * listener on the page for every module, as `whenPageGoes` does. TRANSLATE holds a pane's run
 * through a reload until then (docs/translate.md §8.5).
 */
export function whenPageLoads(sender: PageLoads, owner: object, onLoad: () => void): void {
  let modules = loading.get(sender)
  if (modules === undefined) {
    const handlers = new Map<object, () => void>()
    modules = handlers
    loading.set(sender, handlers)
    sender.on('did-finish-load', () => {
      for (const handler of [...handlers.values()]) handler()
    })
  }
  if (!modules.has(owner)) modules.set(owner, onLoad)
}
