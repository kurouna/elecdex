import { vi } from 'vitest'

/**
 * The preload API (`window.elecdex`) as a test gives it to the page: the sections the test
 * writes, and a `layout.save` that does nothing, which every pane needs because the layout
 * store saves when a pane writes its state. A section the test writes replaces the default
 * one whole. Returned, so a test can reach the mocks it did not keep.
 */
export function stubElecdex<T extends object>(
  sections: T = {} as T,
): { layout: { save: ReturnType<typeof vi.fn> } } & T {
  const api = { layout: { save: vi.fn(async () => {}) }, ...sections }
  vi.stubGlobal('elecdex', api)
  return api
}

/**
 * A pane's state after `patch`, merged as the layout store merges it: what the patch says
 * replaces what was held, and a key set to undefined goes. The patch is copied as IPC would
 * copy it, since IPC cannot clone a `$state` proxy and a mock that kept the proxy would hide
 * that (CLAUDE.md, Tests).
 */
export function mergePatch(
  held: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...held, ...structuredClone(patch) }
  for (const [key, value] of Object.entries(patch)) if (value === undefined) delete next[key]
  return next
}
