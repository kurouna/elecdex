import { layoutFromPreset, presetById } from '@shared/layout-presets'
import { MAX_SAVED_LAYOUTS } from '@shared/layouts'
import { layout } from '../stores/layout.svelte.ts'
import { toasts } from '../stores/toasts.svelte.ts'

/**
 * Layout presets, as the page carries them out (shared/layout-presets.ts has
 * the decisions, main keeps the list).
 *
 * Kept out of the layout store on purpose: a preset is only a way of adding a
 * saved layout, so everything here goes through what the store already does for
 * saved layouts - the question about the shells, the flush, the switch and its
 * effect - and the store knows nothing about presets.
 */

/**
 * Goes to a preset: to the saved layout already made from it, or else adds one
 * and goes there. The question about the shells comes first, so that answering
 * no leaves the list as it was.
 */
export async function goToPreset(presetId: string): Promise<boolean> {
  const kept = layoutFromPreset(layout.savedLayouts, presetId)
  if (kept !== null) return layout.switchTo(kept.id)
  const preset = presetById(presetId)
  if (preset === null) return false
  if (!(await layout.mayReplace(preset.name))) return false
  const answer = await attempt(() => window.elecdex.layout.saved.addPreset(preset.id))
  if (answer === undefined) return false
  layout.savedLayouts = answer.list
  if (answer.id === null) {
    toasts.show({
      title: 'no room for another layout',
      body: `${MAX_SAVED_LAYOUTS} layouts is as many as are kept. Remove one in the layouts dialog first.`,
      tone: 'warn',
    })
    return false
  }
  return layout.applySaved(answer.id)
}

/**
 * Puts a layout made from a preset back to that preset. When it is the one being
 * worked in, the workspace goes back with it - after the pending save is written,
 * so that save does not land on top of what was just put back.
 */
export async function restorePreset(id: string): Promise<void> {
  const entry = layout.savedLayouts.find((saved) => saved.id === id)
  if (entry === undefined || entry.preset === null) return
  if (entry.active) await layout.flush()
  const list = await attempt(() => window.elecdex.layout.saved.restorePreset(id))
  if (list === undefined) return
  layout.savedLayouts = list
  if (entry.active) await layout.applySaved(id)
}

async function attempt<T>(run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run()
  } catch (error) {
    console.error('[elecdex] a layout preset could not be used', error)
    toasts.show({
      title: 'the saved layouts could not be changed',
      body: 'Nothing was saved. The list on screen is the one on disk.',
      tone: 'danger',
    })
    return undefined
  }
}
