/**
 * The Wi-Fi pane's readings, and every decision made about them.
 *
 * The collector reads what the operating system gives without asking for the
 * user's location (architecture.md §5.12): since Windows 11 24H2 the BSSID, the
 * list of networks around and a scan are behind the location consent, and
 * elecdex never asks for it - so none of them is here, on any platform. What is
 * here is enough to say *where* a connection is failing: the radio (signal,
 * retries), the hop to the access point (a ping to the gateway), or beyond it
 * (a ping to the internet), and what the machine itself is sending meanwhile.
 *
 * Everything but the types is pure, so the pane's judgements are unit-tested
 * on their own (tests/unit/wifi.test.ts).
 *
 * One file a part: the readings (types.ts), the radio's words, the points the
 * history keeps, the diagnosis, the events, the timeline's columns, the pane's
 * shape and the report. This file is the face the rest of the app imports as
 * `@shared/wifi`.
 */

// What the Ethernet pane shares with this one lives in netpath.ts; the Wi-Fi
// names stay, so nothing that reads them has to change.
export {
  correlation,
  DIAGNOSIS_WINDOW_MS,
  type GatewayEcho as WifiGatewayEcho,
  gatewayEcho,
  type Health,
  HISTORY_MS as WIFI_HISTORY_MS,
  maskAddress,
  maskName,
  mosEstimate,
  mosOf,
  PATH_WINDOWS as WIFI_WINDOWS,
  type PathProbe as WifiProbe,
  type PathWindowId as WifiWindowId,
  type ProbeStats,
  perMinute,
  pointAt,
  probeStats,
  pushPoint,
  regularInterval,
  type Spread,
  windowMs,
} from '../netpath.js'

export * from './diagnose.js'
export * from './events.js'
export * from './layout.js'
export * from './points.js'
export * from './radio.js'
export * from './report.js'
export * from './timeline.js'
export * from './types.js'
