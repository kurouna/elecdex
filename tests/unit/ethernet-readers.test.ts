import { describe, expect, it } from 'vitest'
import {
  parseIfconfig,
  parseNetstat,
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
  ETHER_INFO_SCRIPT,
  ETHER_SOURCE,
  etherScript,
  etherStateOf,
  parseEtherLine,
  type RawEtherInfo,
  routeOf,
  settingsOf,
  toNetEthernet,
} from '../../src/services/metrics/ethernet/windows'
import { pingArgs } from '../../src/services/metrics/wifi/ping-stream'
import { samplerScript } from '../../src/services/metrics/windows-sampler'

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
    const script = etherScript('192.0.2.53')
    expect(script).toContain("$r.Remove('g')")
    expect(script).not.toMatch(/ProfileName|\.Name\b.*profile/i)
    // The bus is the component id's first word: nothing after its backslash.
    expect(ETHER_INFO_SCRIPT).toContain("-split '\\\\')[0]")
    expect(ETHER_INFO_SCRIPT).not.toMatch(/PnPDeviceID|PermanentAddress|NetworkAddress/)
  })

  it('changes nothing: no Set- or Enable- or Disable- cmdlet anywhere', () => {
    for (const text of [etherScript('192.0.2.53'), ETHER_INFO_SCRIPT, ETHER_SOURCE])
      expect(text).not.toMatch(/\b(Set|Enable|Disable|Restart|Reset)-NetAdapter/)
  })

  it('keeps the sampler under Windows’ command-line limit, the C# going in its environment', () => {
    const script = samplerScript('1.1.1.1')
    expect(script.length).toBeLessThan(32_000)
    expect(script).not.toContain('class ElecdexEther')
  })
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

  it('names the default route’s interface', () => {
    expect(routeInterface('   route to: default\n  interface: en7\n')).toBe('en7')
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

  it('a port with no cable keeps its counters still', () => {
    const a = stubEthernet('unplugged', 0, 10_000).links[0]
    const b = stubEthernet('unplugged', 0, 50_000).links[0]
    expect(a?.counters).toEqual(b?.counters)
  })
})
