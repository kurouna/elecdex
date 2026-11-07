import type { CloudAlertView } from '@shared/api'
import { awsBoardKey, readAwsPane } from '@shared/aws/board'
import { layout } from './layout.svelte.ts'
import { toasts } from './toasts.svelte.ts'
import { widgetState } from './widget-state.svelte.ts'

/**
 * The CLI panes' toasts (docs/cloud-cli.md §12.5): a public incident with OPEN STATUS, or a cost
 * QUOTA step with OPEN COST. Main decides when one is due - only while a pane was shown and read,
 * once each - and sends it here when elecdex is in front. Listened for at the app level, so the
 * toast outlives the pane that read it.
 */

/** The AWS STATUS pane on the board the alert is about: its COST tab, focused. */
function openCost(key: string): void {
  const pane = layout.panes.find(
    (p) => p.widget === 'aws' && awsBoardKey(readAwsPane(p.state).spec) === key,
  )
  if (pane === undefined) return
  widgetState.patch(pane.id, { tab: 'cost', drill: undefined, from: undefined })
  layout.focus(pane.id)
}

/** Whether a CLI pane masks now: then a toast names no account either (cloud-cli.md §7). */
const masking = (): boolean =>
  layout.panes.some((p) => (p.widget === 'aws' || p.widget === 'github') && p.state?.mask === true)

export function watchCloudAlerts(): () => void {
  return window.elecdex.cloud.onAlert((alert: CloudAlertView) => {
    toasts.show({
      title: alert.title,
      body: masking() ? alert.maskedBody : alert.body,
      tone: alert.tone,
      actions: [
        alert.action.kind === 'status'
          ? {
              label: 'open status',
              primary: true,
              run: () => void window.elecdex.cloud.open(alert.id),
            }
          : {
              label: 'open cost',
              primary: true,
              run: () => {
                if (alert.action.kind === 'cost') openCost(alert.action.key)
              },
            },
      ],
    })
  })
}
