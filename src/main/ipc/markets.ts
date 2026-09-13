import { CH } from '@shared/channels'
import { isSymbol, type MarketUpdate } from '@shared/markets'
import { ipcMain, type WebContents } from 'electron'
import { MarketService } from '../markets/service.js'
import { stubProvider, yahooProvider } from '../markets/yahoo.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'

/**
 * Markets IPC: pages subscribe to symbols; main polls only what is watched.
 *
 * `ELECDEX_MARKETS_STUB_URL` swaps Yahoo for a local stub server; the end-to-end
 * tests point it at a closed port by default, so they never contact Yahoo.
 */
export function registerMarketsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
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
      for (const sender of registry.subscribers(update.symbol)) send(sender, update)
    },
  })

  const sync = (): void => {
    const active = new Set(registry.activeSources())
    for (const symbol of service.watching()) if (!active.has(symbol)) service.unwatch(symbol)
    for (const symbol of active) service.watch(symbol)
  }

  const track = (sender: WebContents): void => {
    if (tracked.has(sender)) return
    tracked.add(sender)
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) sync()
    }
    sender.once('destroyed', drop)
    sender.on('did-start-navigation', (details) => {
      if (details.isMainFrame && !details.isSameDocument) drop()
    })
  }

  ipcMain.on(CH.markets.subscribe, (event, raw: unknown) => {
    if (!isSymbol(raw)) return
    track(event.sender)
    send(event.sender, service.snapshot(raw))
    if (registry.subscribe(event.sender, raw)) sync()
  })

  ipcMain.on(CH.markets.unsubscribe, (event, raw: unknown) => {
    if (!isSymbol(raw)) return
    if (registry.unsubscribe(event.sender, raw)) sync()
  })

  ipcMain.handle(CH.markets.watching, () => service.watching())

  return {
    dispose: () => {
      service.dispose()
      ipcMain.removeAllListeners(CH.markets.subscribe)
      ipcMain.removeAllListeners(CH.markets.unsubscribe)
      ipcMain.removeHandler(CH.markets.watching)
    },
  }
}
