import { CH } from '@shared/channels'
import { chartKey, type MarketUpdate, parseChartKey } from '@shared/markets'
import { ipcMain, type WebContents } from 'electron'
import { MarketService } from '../markets/service.js'
import { stubProvider, yahooProvider } from '../markets/yahoo.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { whenPageGoes } from './page-gone.js'

/**
 * Markets IPC: pages subscribe to charts - a symbol over a range, keyed
 * "symbol|range" - and main polls only what is watched.
 *
 * `ELECDEX_MARKETS_STUB_URL` swaps Yahoo for a local stub server; the end-to-end
 * tests point it at a closed port by default, so they never contact Yahoo.
 */
export function registerMarketsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const stub = process.env.ELECDEX_MARKETS_STUB_URL

  const send = (sender: WebContents, update: MarketUpdate): void => {
    if (!sender.isDestroyed()) sender.send(CH.markets.update, update)
  }

  const service = new MarketService({
    provider: stub ? stubProvider(stub.replace(/\/$/, '')) : yahooProvider(),
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (update) => {
      for (const sender of registry.subscribers(update.key)) send(sender, update)
    },
  })

  const sync = (): void => {
    const active = new Set(registry.activeSources())
    for (const key of service.watchingCharts()) {
      const chart = parseChartKey(key)
      if (chart && !active.has(key)) service.unwatch(chart.symbol, chart.range)
    }
    for (const key of active) {
      const chart = parseChartKey(key)
      if (chart) service.watch(chart.symbol, chart.range)
    }
  }

  const track = (sender: WebContents): void => {
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) sync()
    }
    whenPageGoes(sender, registry, drop)
  }

  ipcMain.on(CH.markets.subscribe, (event, raw: unknown) => {
    const chart = parseChartKey(raw)
    if (!chart) return
    // Keyed as main spells it, so a subscription and its updates always match.
    const key = chartKey(chart.symbol, chart.range)
    track(event.sender)
    send(event.sender, service.snapshot(chart.symbol, chart.range))
    if (registry.subscribe(event.sender, key)) sync()
  })

  ipcMain.on(CH.markets.unsubscribe, (event, raw: unknown) => {
    const chart = parseChartKey(raw)
    if (!chart) return
    if (registry.unsubscribe(event.sender, chartKey(chart.symbol, chart.range))) sync()
  })

  ipcMain.handle(CH.markets.watching, () => service.watching())
  ipcMain.handle(CH.markets.charts, () => service.watchingCharts())

  return {
    dispose: () => {
      service.dispose()
      ipcMain.removeAllListeners(CH.markets.subscribe)
      ipcMain.removeAllListeners(CH.markets.unsubscribe)
      ipcMain.removeHandler(CH.markets.watching)
      ipcMain.removeHandler(CH.markets.charts)
    },
  }
}
