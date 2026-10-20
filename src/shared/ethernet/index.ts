/**
 * The Ethernet pane's readings, and every decision made about them
 * (architecture.md §5.23).
 *
 * The wired sibling of the Wi-Fi pane: the same path - this machine, the link,
 * the gateway, the internet - with the cable and its two ports where the Wi-Fi
 * pane has the radio. A wired fault rarely stops traffic; it slows it: a link
 * that fell from 1 Gb/s to 100 Mb/s (a damaged pair), CRC errors (a worn cable,
 * a bad connector), a duplex mismatch, a link that sleeps every few minutes
 * (power saving), a broadcast storm (a loop between switch ports).
 *
 * Nothing here reads anything. Everything but the types is pure, so the
 * judgements are unit-tested on their own (tests/unit/ethernet.test.ts).
 *
 * One file a part: the readings (types.ts), the speed's words, the points the
 * history keeps, the limits and figures, the diagnosis, the events, the
 * timeline's columns, the pane's shape and the report. This file is the face the
 * rest of the app imports as `@shared/ethernet`; parts.ts stays behind it.
 */
export * from './diagnose.js'
export * from './events.js'
export * from './figures.js'
export * from './layout.js'
export * from './points.js'
export * from './report.js'
export * from './speed.js'
export * from './timeline.js'
export * from './types.js'
