import {
  binEdge,
  binsFromFft,
  demoBins,
  pumpSpectrum,
  SPECTRUM_BINS,
  SPECTRUM_FFT_SIZE,
  SPECTRUM_SMOOTHING,
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
 * capture the real system and need no permission; `?stub=demo` moves like music,
 * for the README screenshots; `?stub=tracks` plays the WAV main hands over through
 * the same analyser as a capture, and aloud only when main says so (the recorded demos).
 */

interface CaptureBridge {
  frame(bins: number[]): void
  status(status: 'running' | 'failed', message: string | null): void
  track(listener: (track: { wav: Uint8Array; heard: boolean } | null) => void): void
}

declare global {
  interface Window {
    readonly elecdexCapture: CaptureBridge
  }
}

const bridge = window.elecdexCapture

const pump = (read: () => number[]): void => {
  pumpSpectrum(read, (bins) => bridge.frame(bins))
}

/** An analyser set as the spectrum reads one, and a way to read it as bins. */
function analyserOf(context: AudioContext): { analyser: AnalyserNode; read: () => number[] } {
  const analyser = context.createAnalyser()
  analyser.fftSize = SPECTRUM_FFT_SIZE
  analyser.smoothingTimeConstant = SPECTRUM_SMOOTHING
  const fft = new Float32Array(analyser.frequencyBinCount)
  return {
    analyser,
    read: () => {
      analyser.getFloatFrequencyData(fft)
      return binsFromFft(fft, context.sampleRate)
    },
  }
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
  const { analyser, read } = analyserOf(context)
  context.createMediaStreamSource(new MediaStream([audio])).connect(analyser)
  audio.addEventListener('ended', () => bridge.status('failed', 'system audio capture ended'))
  bridge.status('running', null)
  pump(read)
}

/**
 * The `tracks` stand-in: each WAV main hands over, from its start, into the analyser (and
 * to the speakers when it is to be heard); silence when handed nothing. A track handed over
 * while the one before is still being decoded wins.
 */
function tracks(): void {
  const context = new AudioContext()
  const { analyser, read } = analyserOf(context)
  let source: AudioBufferSourceNode | null = null
  let latest = 0
  bridge.track((track) => {
    const turn = ++latest
    source?.stop()
    source?.disconnect()
    source = null
    if (track === null) return
    const bytes = track.wav.slice().buffer
    context
      .decodeAudioData(bytes)
      .then((buffer) => {
        if (turn !== latest) return
        source = context.createBufferSource()
        source.buffer = buffer
        source.connect(analyser)
        if (track.heard) source.connect(context.destination)
        source.start()
      })
      .catch((error: unknown) => bridge.status('failed', `track: ${String(error)}`))
  })
  bridge.status('running', null)
  pump(read)
}

function tone(): void {
  const bins = Array.from({ length: SPECTRUM_BINS }, (_, i) =>
    binEdge(i) <= 1000 && 1000 < binEdge(i + 1) ? 0.9 : 0,
  )
  bridge.status('running', null)
  pump(() => bins)
}

function demo(): void {
  bridge.status('running', null)
  pump(() => demoBins(performance.now()))
}

const stub = new URLSearchParams(location.search).get('stub')
if (stub === 'tone') {
  tone()
} else if (stub === 'demo') {
  demo()
} else if (stub === 'tracks') {
  tracks()
} else {
  capture().catch((error: unknown) => {
    bridge.status(
      'failed',
      error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    )
  })
}
