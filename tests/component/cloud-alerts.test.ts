import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CloudAlertView } from '../../src/shared/api'
import { awsBoardKey } from '../../src/shared/aws/board'
import { stubElecdex } from './support/elecdex.ts'

const { watchCloudAlerts } = await import('../../src/renderer/stores/cloud-alerts.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { widgetState } = await import('../../src/renderer/stores/widget-state.svelte.ts')
const { popupPaneId } = await import('../../src/renderer/layout/popup.ts')

/**
 * The CLI panes' toasts (docs/cloud-cli.md §12.5) and MASK: a pane that masks keeps the account
 * out of a toast, popped up as well as in the layout, and OPEN COST finds the popped-up pane.
 */

const KEY = awsBoardKey({ profile: 'default', regions: [], activity: true, slow: false })
let deliver: ((alert: CloudAlertView) => void) | null = null

const QUOTA: CloudAlertView = {
  id: 'quota:1:2026-11:1',
  title: 'Cost quota · 100%',
  body: 'acme-prod passed 100% of its $1,000 quota',
  maskedBody: 'An AWS account passed 100% of its quota',
  tone: 'danger',
  action: { kind: 'cost', key: KEY },
}

beforeEach(() => {
  deliver = null
  toasts.clear()
  stubElecdex({
    cloud: {
      onAlert: (handler: (alert: CloudAlertView) => void) => {
        deliver = handler
        return () => {
          deliver = null
        }
      },
      open: async () => true,
      watching: async () => [],
    },
  })
})

afterEach(async () => {
  ui.closePopup()
  vi.restoreAllMocks()
  await layout.flush()
  vi.unstubAllGlobals()
})

describe('cloud alerts', () => {
  it("masks a toast for a popped-up pane's MASK, and OPEN COST goes to that pane", () => {
    // Only the layout's panes were looked at: a masked pane popped up let the account through.
    const id = popupPaneId('aws')
    widgetState.patch(id, { mask: true })
    ui.openPopup('aws')
    const stop = watchCloudAlerts()
    deliver?.(QUOTA)
    const toast = toasts.items.at(-1)
    expect(toast?.body).toBe(QUOTA.maskedBody)
    toast?.actions[0]?.run()
    expect(widgetState.popup(id)).toMatchObject({ tab: 'cost', mask: true })
    stop()
  })

  it('names the account when no pane masks', () => {
    ui.closePopup()
    const stop = watchCloudAlerts()
    deliver?.(QUOTA)
    expect(toasts.items.at(-1)?.body).toBe(QUOTA.body)
    stop()
  })
})
