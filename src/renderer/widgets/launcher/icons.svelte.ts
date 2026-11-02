import { SvelteMap } from 'svelte/reactivity'

/**
 * The launcher icons this page has been given, shared by every launcher in it.
 * A launcher popped up again, or a pane moved (which remounts it), draws its
 * icons at once instead of monograms that turn into icons a moment later.
 *
 * Only answers are held: main keeps nothing for this page, so there is nothing
 * to release when the last launcher goes. A reload starts it empty.
 */
const icons = new SvelteMap<string, string | null>()
const asking = new Set<string>()

/** The icon for an entry id: a data URL, or null for none or not yet known. */
export function launcherIcon(id: string): string | null {
  return icons.get(id) ?? null
}

/** Asks main once for each id not known yet; a failed request may be asked again. */
export function requestLauncherIcon(id: string): void {
  if (icons.has(id) || asking.has(id)) return
  asking.add(id)
  window.elecdex.launcher
    .icon(id)
    .then((data) => icons.set(id, data))
    .catch(() => {})
    .finally(() => asking.delete(id))
}

/** Tests only: a page as it loads. */
export function forgetLauncherIcons(): void {
  icons.clear()
  asking.clear()
}
