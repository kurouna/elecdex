import type { MixerUpdate, SpectrumUpdate } from '@shared/audio'
import { CH } from '@shared/channels'
import { ipcMain, type WebContents } from 'electron'
import { type CaptureWindow, openCaptureWindow } from '../audio/capture-window.js'
import { mixerBackend } from '../audio/mixer-backends.js'
import { MixerService } from '../audio/mixer-service.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'

/**
 * The audio panes' IPC: the spectrum of the system's output and the system mixer.
 *
 * Both run only while a pane showing them is subscribed, and each page's
 * subscriptions go when it reloads or closes. The spectrum's capture window
 * opens with the first subscriber and is destroyed with the last; frames go to
 * subscribers only. The mixer's backend likewise starts and stops, and every
 * command a page sends is checked against the channels the backend reported.
 *
 * `ELECDEX_AUDIO_STUB=1` swaps both for stand-ins - a steady tone, a mixer with
 * two made-up apps - so the end-to-end tests never capture the machine's sound
 * nor change its volume.
 */
const SPECTRUM = 'spectrum'
const MIXER = 'mixer'

export function registerAudioIpc(): { dispose: () => void } {
  const stub = process.env.ELECDEX_AUDIO_STUB === '1'
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()

  const send = (source: string, channel: string, update: unknown): void => {
    for (const contents of registry.subscribers(source)) {
      if (!contents.isDestroyed()) contents.send(channel, update)
    }
  }

  /* ---- spectrum ---- */
  let capture: CaptureWindow | null = null
  let status: SpectrumUpdate = { t: 'status', status: 'starting', message: null }

  const syncSpectrum = (): void => {
    const wanted = registry.subscribers(SPECTRUM).size > 0
    if (wanted && capture === null) {
      status = { t: 'status', status: 'starting', message: null }
      capture = openCaptureWindow({
        stub,
        onUpdate: (update) => {
          if (update.t === 'status') status = update
          send(SPECTRUM, CH.audio.spectrum, update)
        },
      })
    } else if (!wanted && capture !== null) {
      capture.close()
      capture = null
    }
  }

  /* ---- mixer ---- */
  const mixer = new MixerService({
    backend: mixerBackend(stub),
    publish: (update: MixerUpdate) => send(MIXER, CH.audio.mixer, update),
  })

  const syncMixer = (): void => {
    if (registry.subscribers(MIXER).size > 0) mixer.start()
    else mixer.stop()
  }

  const sync = (): void => {
    syncSpectrum()
    syncMixer()
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

  ipcMain.on(CH.audio.spectrumSubscribe, (event) => {
    track(event.sender)
    if (registry.subscribe(event.sender, SPECTRUM)) syncSpectrum()
    // The newcomer hears where capture stands at once.
    event.sender.send(CH.audio.spectrum, status)
  })
  ipcMain.on(CH.audio.spectrumUnsubscribe, (event) => {
    if (registry.unsubscribe(event.sender, SPECTRUM)) syncSpectrum()
  })

  ipcMain.on(CH.audio.mixerSubscribe, (event) => {
    track(event.sender)
    if (registry.subscribe(event.sender, MIXER)) syncMixer()
    event.sender.send(CH.audio.mixer, { t: 'state', state: mixer.state() } satisfies MixerUpdate)
  })
  ipcMain.on(CH.audio.mixerUnsubscribe, (event) => {
    if (registry.unsubscribe(event.sender, MIXER)) syncMixer()
  })
  ipcMain.on(CH.audio.mixerCommand, (event, raw: unknown) => {
    // Only a page showing the mixer may change the volume.
    if (!registry.subscribers(MIXER).has(event.sender)) return
    mixer.command(raw)
  })

  return {
    dispose: () => {
      capture?.close()
      capture = null
      mixer.stop()
      for (const channel of [
        CH.audio.spectrumSubscribe,
        CH.audio.spectrumUnsubscribe,
        CH.audio.mixerSubscribe,
        CH.audio.mixerUnsubscribe,
        CH.audio.mixerCommand,
      ]) {
        ipcMain.removeAllListeners(channel)
      }
    },
  }
}
