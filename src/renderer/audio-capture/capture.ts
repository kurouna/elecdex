import {
  binEdge,
  binsFromFft,
  isSilent,
  SPECTRUM_BINS,
  SPECTRUM_FPS,
  SPECTRUM_TAIL_MS,
} from '@shared/audio'

/**
 * Listens to what the computer is playing and sends its spectrum to main.
 *
 * Runs in the hidden capture window, never in the workspace: capturing the
 * system's sound goes through screen capture (getDisplayMedia with loopback
 * audio), and a page holding a screen capture is one the workspace should not be.
 * The video track that comes with it is stopped at once, unread; the audio goes
 * only into an analyser, and only its levels leave this page.
 *
 * `?stub=tone` plays a steady 1 kHz tone into the spectrum instead, so tests never
 * capture the real system and need no permission.
 */

interface CaptureBridge {
  frame(bins: number[]): void
  status(status: 'running' | 'failed', message: string | null): void
}

declare global {
  interface Window {
    readonly elecdexCapture: CaptureBridge
  }
}

const bridge = window.elecdexCapture

/** FFT size: at 48 kHz, bins 12 Hz apart, fine enough for the lowest bands. */
const FFT_SIZE = 4096

/** How often the analyser is read once the sound has stopped: enough to notice it start again. */
const QUIET_READS_PER_SECOND = 10

/**
 * Sends frames while there is sound, and for a tail after it stops so the bars
 * can fall on screen; then nothing, and the analyser is read less often, until
 * the sound returns.
 */
function pump(read: () => number[]): void {
  let quietSince: number | null = null
  const tick = (): void => {
    const bins = read()
    const now = performance.now()
    let quiet = false
    if (isSilent(bins)) {
      quietSince ??= now
      quiet = now - quietSince > SPECTRUM_TAIL_MS
    } else {
      quietSince = null
    }
    if (!quiet) bridge.frame(bins)
    setTimeout(tick, 1000 / (quiet ? QUIET_READS_PER_SECOND : SPECTRUM_FPS))
  }
  tick()
}

async function capture(): Promise<void> {
  // The window's display-media handler grants the screen with loopback audio;
  // Electron will not grant audio alone.
  const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
  for (const track of stream.getVideoTracks()) track.stop()
  const [audio] = stream.getAudioTracks()
  if (audio === undefined) {
    bridge.status('failed', 'no system audio was offered')
    return
  }
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = FFT_SIZE
  // Quick to follow, as a car display was; the panes add their own fall.
  analyser.smoothingTimeConstant = 0.35
  context.createMediaStreamSource(new MediaStream([audio])).connect(analyser)
  audio.addEventListener('ended', () => bridge.status('failed', 'system audio capture ended'))
  const fft = new Float32Array(analyser.frequencyBinCount)
  bridge.status('running', null)
  pump(() => {
    analyser.getFloatFrequencyData(fft)
    return binsFromFft(fft, context.sampleRate)
  })
}

function tone(): void {
  const bins = Array.from({ length: SPECTRUM_BINS }, (_, i) =>
    binEdge(i) <= 1000 && 1000 < binEdge(i + 1) ? 0.9 : 0,
  )
  bridge.status('running', null)
  pump(() => bins)
}

if (new URLSearchParams(location.search).get('stub') === 'tone') {
  tone()
} else {
  capture().catch((error: unknown) => {
    bridge.status(
      'failed',
      error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    )
  })
}
