import { toPoint, type WifiCounters, type WifiLink, type WifiPoint } from '@shared/wifi'
import { PathHistory } from '../netpath/history.svelte.ts'

/**
 * The Wi-Fi pane's last hour (netpath's `PathHistory`): a point a second for
 * every adapter, its retries counted from the reading before.
 */
export const wifiHistory = new PathHistory<WifiCounters, WifiLink, WifiPoint>(
  (link, probe, at, before) => toPoint(link, probe, at, before?.link ?? null),
)
