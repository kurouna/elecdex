import { type ChildProcess, spawn } from 'node:child_process'
import { ART_EDGE, LARGE_ART_EDGE, type NowPlayingAction } from '@shared/now-playing'
import { powerShellStart } from '../launcher/windows-icons.js'
import type { NowPlayingBackend, NowPlayingReading, ReaderArt } from './watcher.js'

/**
 * Windows' media sessions (System Media Transport Controls: what the volume
 * flyout shows) through one long-lived PowerShell, as the mixer and the metrics
 * sampler do - never a process per reading.
 *
 * It answers one JSON line for each line it is sent: "read", or a press
 * ("playPause", "next", "previous", "seek <seconds>") followed by a reading. The
 * session is the one Windows itself calls current, else the first one playing.
 * The art is read and made small twice (JPEGs, `ART_EDGE` and `LARGE_ART_EDGE`
 * on the longer side: the plate's and the card's) only when the track changes -
 * or its thumbnail arrives, as a browser's does a moment after the title - and
 * sent once. It ends when stdin closes, so it cannot outlive elecdex.
 *
 * Nothing here needs the location consent, and nothing is written: the script
 * holds the session manager and the last track's key, no more.
 */
export const NOW_PLAYING_SCRIPT = `$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*'
} | Select-Object -First 1
function Await($op, [Type]$type) {
  $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  if (-not $task.Wait(3000)) { throw 'the media session did not answer' }
  $task.Result
}
$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]
$streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType]
# PowerShell 5.1 sees the WinRT stream as a bare COM object: the conversion is called
# through reflection, which casts it.
$asStream = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [Type[]]@([Windows.Storage.Streams.IInputStream]))
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$quality = New-Object System.Drawing.Imaging.EncoderParameters 1
$quality.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L
$artKey = $null

function Session {
  $all = @($manager.GetSessions())
  $current = $manager.GetCurrentSession()
  if ($null -eq $current) {
    $current = $all | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq 'Playing' } | Select-Object -First 1
    if ($null -eq $current) { $current = $all | Select-Object -First 1 }
  }
  return @{ session = $current; count = $all.Count }
}

# The image made at most edge pixels on its longer side, as base64 of a JPEG.
function Shrunk($image, $edge) {
  # 1.0, not 1: with an integer PowerShell picks Math.Min(int, int) and rounds the scale to 0.
  $scale = [Math]::Min(1.0, $edge / [double][Math]::Max($image.Width, $image.Height))
  $w = [Math]::Max(1, [int]($image.Width * $scale)); $h = [Math]::Max(1, [int]($image.Height * $scale))
  $small = New-Object System.Drawing.Bitmap $w, $h
  try {
    $g = [System.Drawing.Graphics]::FromImage($small)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.DrawImage($image, 0, 0, $w, $h)
    $g.Dispose()
    $out = New-Object System.IO.MemoryStream
    $small.Save($out, $jpeg, $quality)
    return [Convert]::ToBase64String($out.ToArray())
  } finally {
    $small.Dispose()
  }
}

# The art twice: small for the pane's plate, larger for its card, and the size it came in.
function Art($thumbnail) {
  if ($null -eq $thumbnail) { return $null }
  $stream = Await ($thumbnail.OpenReadAsync()) $streamType
  if ($stream.Size -gt 8MB) { return $null }
  $image = $null
  try {
    $source = $asStream.Invoke($null, @($stream))
    $buffer = New-Object System.IO.MemoryStream
    $source.CopyTo($buffer)
    $source.Dispose()
    $buffer.Position = 0
    $image = [System.Drawing.Image]::FromStream($buffer)
    return @{ small = (Shrunk $image ${ART_EDGE}); large = (Shrunk $image ${LARGE_ART_EDGE}); width = $image.Width; height = $image.Height }
  } finally {
    if ($image) { $image.Dispose() }
  }
}

function Reading {
  $found = Session
  $s = $found.session
  if ($null -eq $s) { $script:artKey = $null; return @{ session = $null } }
  $p = Await ($s.TryGetMediaPropertiesAsync()) $propsType
  $info = $s.GetPlaybackInfo()
  $line = $s.GetTimelineProperties()
  $c = $info.Controls
  $key = @($s.SourceAppUserModelId, $p.Title, $p.Artist, $p.AlbumTitle, ($null -ne $p.Thumbnail)) -join '|'
  $reading = @{
    session = @{
      app = $s.SourceAppUserModelId
      title = $p.Title; artist = $p.Artist; album = $p.AlbumTitle
      status = $info.PlaybackStatus.ToString()
      rate = $info.PlaybackRate
      position = $line.Position.TotalSeconds
      start = $line.StartTime.TotalSeconds
      end = $line.EndTime.TotalSeconds
      at = $line.LastUpdatedTime.ToUnixTimeMilliseconds()
      playPause = $c.IsPlayPauseToggleEnabled; next = $c.IsNextEnabled; previous = $c.IsPreviousEnabled
      seek = $c.IsPlaybackPositionEnabled
      others = $found.count - 1
    }
  }
  if ($key -ne $script:artKey) {
    $art = $null
    try { $art = Art $p.Thumbnail } catch {}
    $reading.art = $art
    $script:artKey = $key
  }
  return $reading
}

function Press($action, $argument) {
  $s = (Session).session
  if ($null -eq $s) { return $false }
  $op = switch ($action) {
    'playPause' { $s.TryTogglePlayPauseAsync() }
    'next' { $s.TrySkipNextAsync() }
    'previous' { $s.TrySkipPreviousAsync() }
    'seek' {
      # Seconds from the track's start, as ticks on the player's timeline.
      $to = [double]::Parse($argument, [Globalization.CultureInfo]::InvariantCulture)
      $s.TryChangePlaybackPositionAsync([long]($s.GetTimelineProperties().StartTime.Ticks + $to * 10000000))
    }
  }
  if ($null -eq $op) { return $false }
  return [bool](Await $op ([bool]))
}

while ($true) {
  $request = [Console]::In.ReadLine()
  if ($null -eq $request) { break }
  try {
    $done = $null
    $words = $request.Split(' ')
    if ($words[0] -ne 'read') { $done = Press $words[0] $words[1] }
    $out = Reading
    if ($null -ne $done) { $out.done = $done }
  } catch {
    $out = @{ error = $_.Exception.Message }
  }
  [Console]::Out.WriteLine(($out | ConvertTo-Json -Compress -Depth 4))
  [Console]::Out.Flush()
}
`

/** The first answer waits for PowerShell to start and load WinRT; later ones take milliseconds. */
const FIRST_ANSWER_MS = 15_000
const ANSWER_MS = 5_000
/** After the reader fails, how long before it is started again. */
const RESTART_MS = 5_000

interface Waiting {
  resolve(reading: NowPlayingReading): void
  reject(error: Error): void
  timer: ReturnType<typeof setTimeout>
}

/** The art the reader made, or null; its images are checked again by main (`artUrl`). */
function readerArt(value: unknown): ReaderArt | null {
  if (typeof value !== 'object' || value === null) return null
  const art = value as Record<string, unknown>
  if (typeof art.small !== 'string' || typeof art.large !== 'string') return null
  const width = typeof art.width === 'number' ? art.width : 0
  const height = typeof art.height === 'number' ? art.height : 0
  return { small: art.small, large: art.large, width, height }
}

/** One line of the reader's output, as a reading; an error line throws. */
export function parseReaderLine(line: string): NowPlayingReading {
  const parsed = JSON.parse(line) as Record<string, unknown>
  if (typeof parsed.error === 'string')
    throw new Error(`the media session could not be read (${parsed.error.slice(0, 160)})`)
  return {
    session: parsed.session ?? null,
    ...('art' in parsed ? { art: readerArt(parsed.art) } : {}),
    ...(typeof parsed.done === 'boolean' ? { done: parsed.done } : {}),
  }
}

export function windowsNowPlayingBackend(): NowPlayingBackend {
  let child: ChildProcess | null = null
  let answered = false
  let failedAt = Number.NEGATIVE_INFINITY
  const waiting: Waiting[] = []

  const failAll = (error: Error): void => {
    for (const w of waiting.splice(0)) {
      clearTimeout(w.timer)
      w.reject(error)
    }
  }

  /** Each line answers the oldest request: the reader answers them in order. */
  const answer = (line: string): void => {
    const w = waiting.shift()
    if (w === undefined) return
    clearTimeout(w.timer)
    answered = true
    try {
      w.resolve(parseReaderLine(line))
    } catch (error) {
      w.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  const end = (proc: ChildProcess): void => {
    proc.stdin?.end()
    proc.kill()
  }

  const launch = (): ChildProcess => {
    const start = powerShellStart(NOW_PLAYING_SCRIPT, process.env)
    const proc = spawn('powershell.exe', start.args, { env: start.env, windowsHide: true })
    child = proc
    answered = false
    let buffer = ''
    let stderr = ''
    proc.stdout?.setEncoding('utf8')
    proc.stdout?.on('data', (chunk: string) => {
      buffer += chunk
      let newline = buffer.indexOf('\n')
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
        if (line !== '') answer(line)
      }
    })
    proc.stderr?.setEncoding('utf8')
    proc.stderr?.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-400)
    })
    proc.on('error', () => {})
    proc.on('close', (code) => {
      if (child !== proc) return
      child = null
      failedAt = Date.now()
      const why = stderr.trim().split('\n').pop()?.trim() || `code ${code}`
      failAll(new Error(`the media reader stopped (${why})`))
    })
    return proc
  }

  const ask = (request: string): Promise<NowPlayingReading> =>
    new Promise((resolve, reject) => {
      if (child === null && Date.now() - failedAt < RESTART_MS) {
        reject(new Error('the media reader is starting again'))
        return
      }
      const proc = child ?? launch()
      const timer = setTimeout(
        () => {
          // A reader that does not answer is ended; the next look starts another.
          if (child === proc) {
            child = null
            failedAt = Date.now()
            end(proc)
          }
          failAll(new Error('the media session did not answer'))
        },
        answered ? ANSWER_MS : FIRST_ANSWER_MS,
      )
      waiting.push({ resolve, reject, timer })
      proc.stdin?.write(`${request}\n`)
    })

  return {
    read: () => ask('read'),
    control: (action: NowPlayingAction) => ask(action),
    // A number printed by JavaScript: the script reads it with the invariant culture.
    seek: (seconds: number) => ask(`seek ${seconds.toFixed(3)}`),
    close: () => {
      const proc = child
      child = null
      failAll(new Error('the media reader was closed'))
      if (proc !== null) end(proc)
    },
  }
}
