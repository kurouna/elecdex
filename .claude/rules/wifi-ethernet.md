---
paths:
  - "src/shared/wifi/**"
  - "src/shared/ethernet/**"
  - "src/shared/netpath.ts"
  - "src/services/metrics/wifi/**"
  - "src/services/metrics/ethernet/**"
  - "src/services/metrics/ping-host.ts"
  - "src/renderer/widgets/wifi/**"
  - "src/renderer/widgets/ethernet/**"
  - "src/renderer/widgets/netpath/**"
  - "tests/unit/wifi*"
  - "tests/unit/ethernet*"
  - "tests/e2e/panes/wifi.spec.ts"
  - "tests/e2e/panes/ethernet.spec.ts"
  - "docs/ethernet-mock/**"
  - "scripts/demo-wifi.mjs"
  - "tests/unit/netpath*"
  - "tests/unit/ping-host*"
  - "tests/component/wifi-*"
  - "tests/component/ethernet-*"
  - "tests/component/netpath-*"
---

# The Wi-Fi and Ethernet panes

Two panes on one medium each (architecture.md §5.12 and §5.23; docs/ethernet-mock), sharing
shared/netpath.ts and widgets/netpath/; both read behind no consent and never scan.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The Wi-Fi pane reads nothing behind the location consent** (§5.12, shared/wifi/,
  services/metrics/wifi/). No BSSID and no scan, on any platform (user decision 2026-09-25): on
  Windows never WlanGetNetworkBssList, WlanGetAvailableNetworkList, WlanScan or
  WlanQueryInterface opcode 7 (a unit test holds the script to it); on macOS never CoreWLAN. Only
  the named event-log fields leave the script.
  - One echo round serves the network status pane and this one, pinged in the collector, never
    in main.
  - `net.wifi` and `net.wifi.events` are private and not kept while hidden. Judgements are pure
    in shared/wifi/. Every `data-hint` figure has a card in widgets/wifi/hints.ts quoting
    `WIFI_LIMITS` (a unit test checks).
- **The Ethernet pane reads the cable without a process per reading** (§5.23, shared/ethernet/,
  services/metrics/ethernet/; the Wi-Fi pane's sibling, sharing shared/netpath.ts and
  widgets/netpath/: the path strip, the cards, the history, the timeline's and the log's frames;
  what differs by medium stays in each pane). Windows: the sampler's `ether` kind, `GetIfTable2`
  rows of type 6, medium 14, HardwareInterface and not FilterInterface; the duplex and the driver's settings in a runspace of
  the sampler's (never on its loop), read by keyword, never changed. The interface GUID, the device
  ids and a profile's name never leave the script; the C# and the pane's functions go in the
  sampler's environment (its command line stays under 32,000, a unit test checks).
  - One source, `net.ethernet`, private, not kept while hidden. No OS log of drops is read: the log
    is what the pane saw. Two system sources only while seen: NDIS's disconnect events, counted by
    adapter and never parsed (sub-second drops), and Tcpip 4199 (an address conflict: its time and
    which wired address, never the other machine's MAC). Gateways are echoed from each adapter's own address (`IcmpSendEcho2Ex`, `ping -I` /
    `-S`), Wi-Fi's too; one internet echo serves three panes.
  - Judgements are pure (`diagnoseEthernet`, `ETHER_LIMITS`): a fall from the speed seen is a fault,
    a steady low speed only BELOW MAX; CRC errors need a count and a share; discards are the host's;
    drops come back within a minute; multicast is never judged. The speed is coloured by the speed's
    judgement only. Power saving is named only after a drop or a fall was seen with it on.
  - No words on a canvas, in this pane or Wi-Fi's: lane names, scales and marks are HTML over it.
  - What a reader could not read travels as `problems` and is a toast, once each.
  - Tests: `ELECDEX_ETHER_STUB=1` (every case of docs/ethernet-mock, plus `conflict`, `problem`).
  - Its limits, unverified with a cable or on Linux and macOS, are listed in §5.23.1 and the
    README: keep both until someone has tried them.
