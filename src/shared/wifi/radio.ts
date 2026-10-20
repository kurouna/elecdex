import type { WifiBand, WifiStandard } from './types.js'

// ---------------------------------------------------------------------------
// The radio
// ---------------------------------------------------------------------------

/** The band a centre frequency falls in. */
export function bandOf(freqMhz: number | null): WifiBand | null {
  if (freqMhz === null) return null
  if (freqMhz >= 2400 && freqMhz < 2500) return '2.4'
  if (freqMhz >= 5925 && freqMhz <= 7125) return '6'
  if (freqMhz >= 5150 && freqMhz < 5925) return '5'
  return null
}

/** The channel number of a 20 MHz centre frequency (802.11 channel numbering). */
export function channelOf(freqMhz: number | null): number | null {
  if (freqMhz === null) return null
  if (freqMhz === 2484) return 14
  const band = bandOf(freqMhz)
  if (band === '2.4') return Math.round((freqMhz - 2407) / 5)
  if (band === '5') return Math.round((freqMhz - 5000) / 5)
  if (band === '6') return freqMhz === 5935 ? 2 : Math.round((freqMhz - 5950) / 5)
  return null
}

/** The centre frequency of a channel on a band. */
export function freqOf(channel: number, band: WifiBand): number {
  if (band === '2.4') return channel === 14 ? 2484 : 2407 + channel * 5
  if (band === '5') return 5000 + channel * 5
  return 5950 + channel * 5
}

/**
 * 5 GHz channels under Dynamic Frequency Selection: an access point on one
 * must leave it when it hears radar, which clients feel as a drop or a stall.
 */
export function isDfs(channel: number | null, band: WifiBand | null): boolean {
  return band === '5' && channel !== null && channel >= 52 && channel <= 144
}

/** DOT11_PHY_TYPE, as Windows numbers it. */
const PHY_TYPES: Record<number, WifiStandard> = {
  4: 'a',
  5: 'b',
  6: 'g',
  7: 'n',
  8: 'ac',
  9: 'ad',
  10: 'ax',
  11: 'be',
}

export function standardOfPhy(phyType: number | null): WifiStandard | null {
  return phyType === null ? null : (PHY_TYPES[phyType] ?? null)
}

/** "Wi-Fi 6E", "Wi-Fi 5", "802.11g": the marketing name where there is one. */
export function standardLabel(standard: WifiStandard | null, band: WifiBand | null): string {
  switch (standard) {
    case null:
      return '—'
    case 'be':
      return 'Wi-Fi 7'
    case 'ax':
      return band === '6' ? 'Wi-Fi 6E' : 'Wi-Fi 6'
    case 'ac':
      return 'Wi-Fi 5'
    case 'n':
      return 'Wi-Fi 4'
    default:
      return `802.11${standard}`
  }
}

export type SignalGrade = 'excellent' | 'good' | 'fair' | 'weak' | 'none'

/**
 * How a signal reads for a call. -67 dBm is the level voice and video networks
 * are designed for; below -75 a call starts to break up.
 */
export function signalGrade(rssi: number | null): SignalGrade {
  if (rssi === null) return 'none'
  if (rssi >= -55) return 'excellent'
  if (rssi >= -67) return 'good'
  if (rssi >= -75) return 'fair'
  return 'weak'
}

/** 0-4 bars, as the taskbar would draw them. */
export function signalBars(rssi: number | null): number {
  if (rssi === null) return 0
  if (rssi >= -55) return 4
  if (rssi >= -67) return 3
  if (rssi >= -75) return 2
  if (rssi >= -85) return 1
  return 0
}

/** Where -90..-30 dBm puts a reading on a gauge, 0-1. */
export function signalFraction(rssi: number | null): number {
  if (rssi === null) return 0
  return Math.min(1, Math.max(0, (rssi + 90) / 60))
}

/** Windows' NetworkAuthenticationType names, as people know them. */
const AUTHENTICATION: Record<string, string> = {
  None: 'Open',
  Open80211: 'Open',
  SharedKey80211: 'WEP',
  Wpa: 'WPA-Enterprise',
  WpaPsk: 'WPA-Personal',
  WpaNone: 'WPA',
  Rsna: 'WPA2-Enterprise',
  RsnaPsk: 'WPA2-Personal',
  Ihv: 'Vendor',
  Wpa3: 'WPA3-Enterprise',
  Wpa3Enterprise192Bits: 'WPA3-Enterprise 192',
  Wpa3Enterprise: 'WPA3-Enterprise',
  Wpa3Sae: 'WPA3-Personal',
  Owe: 'Enhanced Open',
}

/** A security name from the platform's own spelling; unknown ones pass through. */
export function securityLabel(authentication: string | null): string | null {
  if (authentication === null || authentication === '' || authentication === 'Unknown') return null
  return AUTHENTICATION[authentication] ?? authentication
}

/** "Ccmp" -> "CCMP"; "None" stays readable. */
export function cipherLabel(cipher: string | null): string | null {
  if (cipher === null || cipher === '' || cipher === 'Unknown') return null
  if (cipher === 'None') return 'none'
  return cipher.toUpperCase()
}
