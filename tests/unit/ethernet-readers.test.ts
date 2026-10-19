import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import {
  parseIfconfig,
  parseNetstat,
  routeGateway,
  routeInterface,
  wiredPorts,
} from '../../src/services/metrics/ethernet/darwin'
import {
  busPart,
  countersOf,
  defaultInterface,
  downsOf,
  isWiredPort,
  sysDuplex,
  sysNumber,
} from '../../src/services/metrics/ethernet/linux'
import { ETHER_STUBS, etherStubFrom, stubEthernet } from '../../src/services/metrics/ethernet/stub'
import {
  busOf,
  duplexOf,
  ETHER_INFO_ENV,
  ETHER_INFO_SCRIPT,
  ETHER_SCRIPT,
  ETHER_SCRIPT_ENV,
  ETHER_SOURCE,
  ETHER_WATCH_ENV,
  ETHER_WATCH_SOURCE,
  etherStateOf,
  parseEtherLine,
  type RawEtherInfo,
  routeOf,
  settingsOf,
  speedDuplexOf,
  toNetEthernet,
} from '../../src/services/metrics/ethernet/windows'
import { pingArgs } from '../../src/services/metrics/wifi/ping-stream'
import { SAMPLER_ENV, samplerScript } from '../../src/services/metrics/windows-sampler'

/**
 * The Ethernet pane's readers: what each platform's text and tables become, that
 * only physical wired ports are taken, that what must not leave the script does
 * not, and that the sampler still fits Windows' command line.
 */

/** The advanced properties as this machine's Realtek GbE reported them (2026-10-18). */
const REALTEK: RawEtherInfo = {
  dup: 0,
  bus: 'PCI',
  drv: 'Realtek',
  dv: '10.71.312.2024',
  dd: '2024-03-12',
  vlan: 0,
  adv: {
    '*SpeedDuplex': { v: '0', o: ['0', '1', '2', '3', '4', '6'] },
    '*EEE': { v: '0', o: ['0', '1'] },
    '*FlowControl': { v: '3', o: ['0', '3'] },
    '*JumboPacket': { v: '1514', o: ['1514', '4088', '9014'] },
    '*WakeOnMagicPacket': { v: '1', o: ['0', '1'] },
    AdvancedEEE: { v: '0', o: ['0', '1'] },
    EnableGreenEthernet: { v: '1', o: ['0', '1'] },
    GigaLite: { v: '1', o: ['0', '1'] },
    PowerSavingMode: { v: '1', o: ['0', '1'] },
    AutoDisableGigabit: { v: '0', o: ['0', '1', '2'] },
  },
  ps: '2.5 GT/s',
  pw: '1',
}

describe('Windows', () => {
  it('reads the driver’s settings by keyword: auto, best 1 Gb/s, which power saving is on', () => {
    expect(settingsOf(REALTEK)).toEqual({
      speed: null,
      duplex: null,
      capMbps: 1000,
      power: {
        eee: false,
        advancedEee: false,
        green: true,
        gigaLite: true,
        powerSave: true,
        autoDisableGigabit: false,
      },
      jumbo: 0,
      flow: true,
      vlan: null,
      wol: true,
    })
  })

  it('a speed set by hand is a fixed speed and duplex; an unknown vendor value is ignored, never guessed', () => {
    const fixed = settingsOf({
      ...REALTEK,
      adv: { ...REALTEK.adv, '*SpeedDuplex': { v: '4', o: ['0', '4', '6', '99'] } },
    })
    expect(fixed?.speed).toBe(100)
    expect(fixed?.duplex).toBe('full')
    expect(fixed?.capMbps).toBe(1000)
    expect(settingsOf({ ...REALTEK, adv: {} })).toBeNull()
  })

  it('takes the duplex only when it is told: 0 is not half', () => {
    expect(duplexOf(0)).toBeNull()
    expect(duplexOf(1)).toBe('half')
    expect(duplexOf(2)).toBe('full')
  })

  it('names the bus from the component id’s first word only', () => {
    expect(busOf(REALTEK)).toEqual({ bus: 'pci', detail: 'PCIe 2.5 GT/s x1' })
    expect(busOf({ ...REALTEK, bus: 'USB' })).toEqual({ bus: 'usb', detail: 'USB' })
  })

  it('tells a cable out from an adapter switched off', () => {
    expect(etherStateOf({ ad: 1, m: 1, o: 1 })).toBe('up')
    expect(etherStateOf({ ad: 1, m: 2, o: 2 })).toBe('no-carrier')
    expect(etherStateOf({ ad: 2, m: 2, o: 2 })).toBe('disabled')
  })

  it('says which way the internet’s echo leaves when it is not this adapter', () => {
    expect(routeOf(3, { i: 3, k: 'wired' })).toBe('default')
    expect(routeOf(3, { i: 8, k: 'wifi' })).toBe('wifi')
    expect(routeOf(3, { i: 21, k: 'virtual' })).toBe('vpn')
    expect(routeOf(3, { i: 4, k: 'wired' })).toBe('other')
  })

  it('reads a line into links, the addresses only while the link is up, rates between readings', () => {
    const row = {
      i: 3,
      a: 'Ethernet',
      d: 'Realtek Gaming GbE Family Controller',
      na: false,
      o: 1,
      ad: 1,
      m: 1,
      rs: 1_000_000_000,
      ts: 1_000_000_000,
      c: {
        io: 1000,
        iu: 10,
        inu: 5,
        id: 0,
        ie: 0,
        iun: 0,
        ibo: 600,
        oo: 500,
        ou: 4,
        onu: 1,
        od: 0,
        oe: 0,
      },
      mac: '02:00:5e:10:00:02',
      ip4: '192.0.2.31',
      pfx: 24,
      ip6: [],
      gw: '192.0.2.1',
      dns: ['192.0.2.1'],
      mtu: 1500,
      dhcp: true,
      lease: 3600,
      lvl: 'InternetAccess',
      inf: { ...REALTEK, dup: 2 },
    }
    const line = parseEtherLine({ rows: [row], route: { i: 3, k: 'wired' } })
    const later = parseEtherLine({
      rows: [{ ...row, c: { ...row.c, io: 3000 } }],
      route: { i: 3, k: 'wired' },
    })
    const net = toNetEthernet({ at: 0, data: line }, { at: 1000, data: later }, null)
    const link = net.links[0]
    expect(link?.id).toBe('if3')
    expect(link?.speedMbps).toBe(1000)
    expect(link?.duplex).toBe('full')
    expect(link?.route).toBe('default')
    expect(link?.internet).toBe('internet')
    expect(link?.rxSec).toBe(2000)
    expect(link?.counters?.rxPackets).toBe(15)
    const down = toNetEthernet(
      null,
      { at: 0, data: parseEtherLine({ rows: [{ ...row, m: 2, o: 2 }] }) },
      null,
    ).links[0]
    expect(down?.state).toBe('no-carrier')
    expect(down?.ip4).toBeNull()
    expect(down?.gateway).toBeNull()
    expect(down?.speedMbps).toBeNull()
  })

  it('takes only physical wired rows: type 6, medium 14, a hardware interface that is not a filter', () => {
    expect(ETHER_SOURCE).toContain('ReadInt32(r, 1128) == 6')
    expect(ETHER_SOURCE).toContain('ReadInt32(r, 1140) == 14')
    expect(ETHER_SOURCE).toContain('(flags & 1) == 1 && (flags & 2) == 0')
  })

  it('never lets the interface GUID, the device ids or a profile’s name leave the script', () => {
    const script = ETHER_SCRIPT
    expect(script).toContain("$r.Remove('g')")
    expect(script).not.toMatch(/ProfileName|\.Name\b.*profile/i)
    // The bus is the component id's first word: nothing after its backslash.
    expect(ETHER_INFO_SCRIPT).toContain("-split '\\\\')[0]")
    expect(ETHER_INFO_SCRIPT).not.toMatch(/PnPDeviceID|PermanentAddress|NetworkAddress/)
  })

  it('changes nothing: no Set- or Enable- or Disable- cmdlet anywhere', () => {
    for (const text of [ETHER_SCRIPT, ETHER_INFO_SCRIPT, ETHER_SOURCE])
      expect(text).not.toMatch(/\b(Set|Enable|Disable|Restart|Reset)-NetAdapter/)
  })

  it('keeps the sampler under Windows’ command-line limit, the C# and its script going in its environment', () => {
    const script = samplerScript('1.1.1.1')
    expect(script.length).toBeLessThan(32_000)
    expect(script).not.toContain('class ElecdexEther')
    expect(script).not.toContain('function EmitEther')
    expect(script).toContain("$etherPingHost = '1.1.1.1'")
    expect(SAMPLER_ENV[ETHER_SCRIPT_ENV]).toBe(ETHER_SCRIPT)
    expect(SAMPLER_ENV[ETHER_WATCH_ENV]).toBe(ETHER_WATCH_SOURCE)
  })

  it('counts NDIS disconnects by adapter and reads nothing of the event but its name', () => {
    expect(ETHER_WATCH_SOURCE).toContain('MSNdis_StatusMediaDisconnect')
    expect(ETHER_WATCH_SOURCE).toContain('e.NewEvent["InstanceName"]')
    expect(ETHER_WATCH_SOURCE).not.toMatch(/NdisStatusMediaSpecificIndication|Data\b/)
    // The watcher goes when the pane stops being seen.
    expect(samplerScript('1.1.1.1')).toMatch(
      /elseif \(.*\$etherWatching -or \$null -ne \$etherJob\) \{ .*EtherWatchStop \}/,
    )
    // Stopped once: the flag goes down with it, so a closed pane does not stop it every second.
    expect(ETHER_SCRIPT).toMatch(
      /function EtherWatchStop \{\s*if \(\$script:etherWatching\) \{ \[ElecdexEtherWatch\]::Stop\(\); \$script:etherWatching = \$false \}/,
    )
  })

  it('the Wi-Fi gateways leave the echo round when nothing wants Wi-Fi, as Ethernet’s do', () => {
    expect(samplerScript('1.1.1.1')).toContain(
      "if ($want.ContainsKey('wlan')) { EmitWlan } elseif ($wlanGws.Count -gt 0) { $wlanGws = @() }",
    )
  })

  it('reads an adapter’s settings once: a read under way is collected first and not asked again', () => {
    const step = ETHER_SCRIPT.slice(ETHER_SCRIPT.indexOf('function EtherInfoStep'))
    expect(step.indexOf('EtherInfoCollect')).toBeLessThan(step.indexOf('foreach ($r in $rows)'))
    expect(step).toContain('$busy -notcontains $i')
    expect(step).toContain('ix = $ix')
  })

  it('reads the conflict log’s last day until a read works, on the five seconds after the first', () => {
    const step = ETHER_SCRIPT.slice(ETHER_SCRIPT.indexOf('function EtherConflictStep'))
    const body = step.slice(0, step.indexOf('\n}\n'))
    // Moved on to "only newer records" inside the try, never after a read that failed.
    expect(body.indexOf('$script:etherConflictLast = 0')).toBeLessThan(body.indexOf('} catch'))
    expect(ETHER_SCRIPT).toContain(
      'if (-not $script:etherConflictTried -or $script:tick % 5 -eq 0) { EtherConflictStep }',
    )
  })

  it('collects a settings read that ended after the pane went, without waiting on one', () => {
    expect(ETHER_SCRIPT).toMatch(/function EtherWatchStop \{[^}]*\}[^}]*EtherInfoCollect\s*\}/)
  })

  it('gives the event logs’ handles back', () => {
    for (const script of [ETHER_SCRIPT, samplerScript('1.1.1.1')]) {
      expect(script).toContain('$e.Dispose()')
      expect(script).toContain('$reader.Dispose()')
    }
  })

  it('takes of an address conflict only its time and which wired address it was', () => {
    expect(ETHER_SCRIPT).toContain('EventID=4199')
    expect(ETHER_SCRIPT).toContain('@{ at = ')
    // The other machine's hardware address and the message stay in the script.
    expect(ETHER_SCRIPT).not.toMatch(/FormatDescription|\$e\.Message|mac\s*=/)
  })

  it('reads 2.5 and 5 Gb/s as a *SpeedDuplex value in Mb/s, and still ignores a private one', () => {
    expect(speedDuplexOf('2500')).toEqual([2500, 'full'])
    expect(speedDuplexOf('5000')).toEqual([5000, 'full'])
    expect(speedDuplexOf('10')).toEqual([100_000, 'full'])
    expect(speedDuplexOf('6')).toEqual([1000, 'full'])
    expect(speedDuplexOf('99')).toBeNull()
    expect(speedDuplexOf('0')).toBeNull()
    const best = settingsOf({
      ...REALTEK,
      adv: { ...REALTEK.adv, '*SpeedDuplex': { v: '0', o: ['0', '6', '2500', '99'] } },
    })
    expect(best?.capMbps).toBe(2500)
  })

  it('carries the NDIS count, the conflicts and the script’s problems through, checked', () => {
    const line = parseEtherLine({
      rows: [
        { i: 3, a: 'Ethernet', d: 'x', o: 1, ad: 1, m: 1, dn: 2, cf: [1_790_000_000_000, 'x', -1] },
      ],
      err: ['the link-event watcher did not compile: no', 42, 'y'.repeat(400)],
    })
    expect(line.rows[0]?.dn).toBe(2)
    expect(line.rows[0]?.cf).toEqual([1_790_000_000_000])
    expect(line.err[0]).toBe('the link-event watcher did not compile: no')
    expect(line.err.every((e) => e.length <= 300)).toBe(true)
    const net = toNetEthernet(null, { at: 0, data: line }, null)
    expect(net.problems).toEqual(line.err)
    expect(net.links[0]?.carrierDowns).toBe(2)
    expect(net.links[0]?.conflicts).toEqual([1_790_000_000_000])
    expect(parseEtherLine({ rows: [{ i: 3, o: 1, ad: 1, m: 1 }] }).rows[0]?.dn).toBeNull()
  })
})

describe.runIf(process.platform === 'win32')('the Windows settings read, run', () => {
  // EtherInfoStep and EtherInfoCollect as the sampler runs them, given a row whose adapter is not
  // there (as one pulled out between GetIfTable2's row and its read). Each step waits for the read.
  const SCRIPT = `
    . ([scriptblock]::Create($env:${ETHER_SCRIPT_ENV}))
    function Step($rows) {
      EtherInfoStep $rows
      $asked = $null -ne $script:etherJob
      if ($asked) { [void]$script:etherJob.h.AsyncWaitHandle.WaitOne(60000) }
      $asked
    }
    $gone = @(@{ i = 2147480000; m = 1 })
    $asked = @((Step $gone), (Step $gone), (Step $gone), (Step @()), (Step $gone))
    @{ asked = $asked; err = @($script:etherErr); info = $script:etherInfo.Count } | ConvertTo-Json -Compress
  `
  it('an adapter gone before its read is not a problem, and is asked again only once', () => {
    const out = JSON.parse(
      execFileSync(
        'powershell.exe',
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', SCRIPT],
        {
          env: {
            ...process.env,
            [ETHER_SCRIPT_ENV]: ETHER_SCRIPT,
            [ETHER_INFO_ENV]: ETHER_INFO_SCRIPT,
          },
          encoding: 'utf8',
        },
      ),
    )
    // Issue #25: a USB adapter pulled out was a toast, "could not be read", in the user's language.
    expect(out.err).toEqual([])
    expect(out.info).toBe(0)
    // Asked, asked once more, then left; gone from the rows and back, it is asked again.
    expect(out.asked).toEqual([true, true, false, false, true])
  }, 120_000)
})

describe('Linux', () => {
  it('a wired port is Ethernet, not wireless, not virtual, not a bridge, a bond or a phone', () => {
    const port = {
      type: '1\n',
      wireless: false,
      device: '../../devices/pci0000:00/0000:00:1f.6/net/eno1',
      bridge: false,
      bond: false,
      driver: 'e1000e',
    }
    expect(isWiredPort(port)).toBe(true)
    expect(isWiredPort({ ...port, device: '../../devices/virtual/net/docker0' })).toBe(false)
    expect(isWiredPort({ ...port, wireless: true })).toBe(false)
    expect(isWiredPort({ ...port, bridge: true })).toBe(false)
    expect(isWiredPort({ ...port, driver: 'rndis_host' })).toBe(false)
    expect(isWiredPort({ ...port, type: '772' })).toBe(false)
  })

  it('reads -1 and an empty file as not known', () => {
    expect(sysNumber('-1\n')).toBeNull()
    expect(sysNumber('')).toBeNull()
    expect(sysNumber('1000\n')).toBe(1000)
    expect(sysDuplex('unknown')).toBeNull()
    expect(sysDuplex('half\n')).toBe('half')
  })

  it('judges only damaged frames, keeping the kernel’s own drops apart', () => {
    const c = countersOf({
      rx_packets: 100,
      tx_packets: 50,
      multicast: 7,
      rx_crc_errors: 2,
      rx_frame_errors: 1,
      rx_length_errors: null,
      tx_errors: 0,
      rx_dropped: 40,
      rx_missed_errors: 3,
      tx_dropped: 0,
      collisions: 0,
      rx_bytes: 1,
      tx_bytes: 1,
    })
    expect(c.rxErrors).toBe(3)
    expect(c.rxDiscards).toBe(43)
    expect(c.rxMulticast).toBe(7)
    expect(c.rxBroadcastOctets).toBeNull()
  })

  it('counts drops by carrier_down_count, or half of carrier_changes on an older kernel', () => {
    expect(downsOf('4\n', '9\n')).toBe(4)
    expect(downsOf('', '9\n')).toBe(4)
    expect(downsOf('', '')).toBeNull()
  })

  it('names the default route’s interface by the lowest metric', () => {
    const route = [
      'Iface\tDestination\tGateway \tFlags\tRefCnt\tUse\tMetric\tMask',
      'wlan0\t00000000\t0102000A\t0003\t0\t0\t600\t00000000',
      'eno1\t00000000\t0100A8C0\t0003\t0\t0\t100\t00000000',
    ].join('\n')
    expect(defaultInterface(route)).toBe('eno1')
  })

  it('a USB port at 480 Mb/s is USB 2.0', () => {
    expect(busPart('usb', 480)).toEqual({ bus: 'usb', busDetail: 'USB 480 Mb/s', usbMbps: 480 })
    expect(busPart('pci', null)).toEqual({ bus: 'pci', busDetail: 'PCIe', usbMbps: null })
  })
})

describe('macOS', () => {
  it('takes Ethernet, USB and Thunderbolt LAN ports - not Wi-Fi, not the Thunderbolt Bridge', () => {
    const text = [
      'Hardware Port: Ethernet\nDevice: en0\nEthernet Address: 02:00:5e:00:00:01',
      'Hardware Port: Wi-Fi\nDevice: en1\nEthernet Address: 02:00:5e:00:00:02',
      'Hardware Port: Thunderbolt Bridge\nDevice: bridge0\nEthernet Address: N/A',
      'Hardware Port: Thunderbolt 1\nDevice: en2\nEthernet Address: 02:00:5e:00:00:03',
      'Hardware Port: USB 10/100/1000 LAN\nDevice: en7\nEthernet Address: 02:00:5e:00:00:04',
    ].join('\n\n')
    expect(wiredPorts(text).map((p) => p.device)).toEqual(['en0', 'en7'])
  })

  it('reads the media line: speed, duplex, flow control and EEE', () => {
    const media = parseIfconfig(
      'en7: flags=8863<UP> mtu 1500\n\tmedia: autoselect (1000baseT <full-duplex,flow-control,energy-efficient-ethernet>)\n\tstatus: active\n',
    )
    expect(media).toEqual({
      active: true,
      speed: 1000,
      duplex: 'full',
      flow: true,
      eee: true,
      mtu: 1500,
    })
    expect(
      parseIfconfig('en7: mtu 1500\n\tmedia: autoselect (none)\n\tstatus: inactive\n').speed,
    ).toBeNull()
  })

  it('reads the link row of netstat -I -b', () => {
    const text = [
      'Name       Mtu   Network       Address            Ipkts Ierrs     Ibytes    Opkts Oerrs     Obytes  Coll',
      'en7        1500  <Link#12>     02:00:5e:00:00:04  12345     3    9876543     6789     0    1234567     0',
    ].join('\n')
    expect(parseNetstat(text)).toEqual({
      rxPackets: 12345,
      txPackets: 6789,
      rxErrors: 3,
      txErrors: 0,
      collisions: 0,
      rx: 9876543,
      tx: 1234567,
    })
  })

  it('names the default route’s interface, and its gateway when it is an IPv4 address', () => {
    const route = '   route to: default\n    gateway: 192.0.2.1\n  interface: en7\n'
    expect(routeInterface(route)).toBe('en7')
    expect(routeGateway(route)).toBe('192.0.2.1')
    expect(routeGateway('   route to: default\n    gateway: link#7\n')).toBeNull()
    expect(routeGateway('   route to: default\n  interface: utun3\n')).toBeNull()
  })
})

describe('the long-lived pings', () => {
  it('leave from the adapter: its interface on Linux, its address on macOS', () => {
    expect(pingArgs('192.0.2.1', 'eno1', 'linux')).toEqual([
      '-n',
      '-i',
      '1',
      '-I',
      'eno1',
      '192.0.2.1',
    ])
    expect(pingArgs('192.0.2.1', '192.0.2.31', 'darwin')).toEqual([
      '-n',
      '-i',
      '1',
      '-S',
      '192.0.2.31',
      '192.0.2.1',
    ])
    expect(pingArgs('192.0.2.1', null, 'linux')).toEqual(['-n', '-i', '1', '192.0.2.1'])
  })
})

describe('the stub', () => {
  it('knows every case the pane was drawn with, and nothing else', () => {
    expect(etherStubFrom('1')).toBe('steady')
    expect(etherStubFrom('steady')).toBeNull()
    expect(etherStubFrom('flapping')).toBe('flapping')
    expect(etherStubFrom('made-up')).toBeNull()
    expect(ETHER_STUBS).toContain('dual')
  })

  it('uses documentation addresses only', () => {
    for (const kind of ETHER_STUBS) {
      const net = stubEthernet(kind, 0, 30_000)
      for (const l of net.links)
        for (const a of [l.ip4, l.gateway, ...l.dns]) if (a) expect(a).toMatch(/^192\.0\.2\./)
    }
  })

  it('a conflict comes five seconds in, and a problem with every reading', () => {
    expect(stubEthernet('conflict', 0, 4000).links[0]?.conflicts).toEqual([])
    expect(stubEthernet('conflict', 0, 6000).links[0]?.conflicts).toEqual([5000])
    expect(stubEthernet('problem', 0, 1000).problems).toHaveLength(1)
    for (const kind of ETHER_STUBS.filter((k) => k !== 'problem'))
      expect(stubEthernet(kind, 0, 30_000).problems).toEqual([])
  })

  it('a port with no cable keeps its counters still', () => {
    const a = stubEthernet('unplugged', 0, 10_000).links[0]
    const b = stubEthernet('unplugged', 0, 50_000).links[0]
    expect(a?.counters).toEqual(b?.counters)
  })
})
