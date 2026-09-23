import { audioStubFrom, type MixerUpdate } from '@shared/audio'
import { CH } from '@shared/channels'
import { ipcMain, type WebContents } from 'electron'
import { openCaptureWindow } from '../audio/capture-window.js'
import { mixerBackend, output } from '../audio/mixer-backends.js'
import { MixerService } from '../audio/mixer-service.js'
import { openPulseCapture } from '../audio/pulse-capture.js'
import { readMonitorLevel, restoreMonitor } from '../audio/pulse-monitor.js'
import { SpectrumCapture } from '../audio/spectrum-capture.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { whenPageGoes } from './page-gone.js'

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
 * nor change its volume. `ELECDEX_AUDIO_STUB=demo` plays music-like movement
 * instead of the tone, for the README screenshots.
 */
const SPECTRUM = 'spectrum'
const MIXER = 'mixer'

export function registerAudioIpc(): { dispose: () => void } {
  const stub = audioStubFrom(process.env.ELECDEX_AUDIO_STUB)
  const registry = new SubscriptionRegistry<WebContents>()

  const send = (source: string, channel: string, update: unknown): void => {
    for (const contents of registry.subscribers(source)) {
      if (!contents.isDestroyed()) contents.send(channel, update)
    }
  }

  /* ---- spectrum ---- */
  // Linux has no loopback capture through Electron; parec records the output there.
  const pulse = stub === null && process.platform === 'linux'
  const capture = new SpectrumCapture({
    open: (onUpdate) =>
      pulse
        ? openPulseCapture(onUpdate, { readMonitor: () => readMonitorLevel(output) })
        : openCaptureWindow({ stub, onUpdate }),
    publish: (update) => send(SPECTRUM, CH.audio.spectrum, update),
  })
  const syncSpectrum = (): void => capture.subscribers(registry.subscribers(SPECTRUM).size)

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
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) sync()
    }
    whenPageGoes(sender, registry, drop)
  }

  ipcMain.on(CH.audio.spectrumSubscribe, (event) => {
    track(event.sender)
    if (registry.subscribe(event.sender, SPECTRUM)) syncSpectrum()
    // The newcomer hears where capture stands at once (and a failed capture is retried).
    event.sender.send(CH.audio.spectrum, capture.joined())
  })
  ipcMain.on(CH.audio.spectrumUnsubscribe, (event) => {
    if (registry.unsubscribe(event.sender, SPECTRUM)) syncSpectrum()
  })

  ipcMain.on(CH.audio.restoreMonitor, (event) => {
    // Only a page showing a spectrum may ask, and only where parec records a monitor.
    if (!pulse || !registry.subscribers(SPECTRUM).has(event.sender)) return
    restoreMonitor(output).catch((error: unknown) => {
      console.warn('[elecdex] could not restore the audio monitor:', error)
    })
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
      capture.dispose()
      mixer.stop()
      for (const channel of [
        CH.audio.spectrumSubscribe,
        CH.audio.spectrumUnsubscribe,
        CH.audio.restoreMonitor,
        CH.audio.mixerSubscribe,
        CH.audio.mixerUnsubscribe,
        CH.audio.mixerCommand,
      ]) {
        ipcMain.removeAllListeners(channel)
      }
    },
  }
}
