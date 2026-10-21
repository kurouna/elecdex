/**
 * Response bodies read only up to a size. What main fetches from services it does not control -
 * feeds, earthquakes and tsunamis, forecasts, the update check - stops at a limit instead of
 * holding whatever a broken or hostile answer sends in memory (issue 32). Each limit is far
 * above what its service sends.
 */
export const READ_LIMITS = {
  /** USGS's week of earthquakes is about 2 MB; JMA's and NOAA's lists far less. */
  quakes: 16 * 1024 * 1024,
  /** A JMA office's forecast is tens of kilobytes, its area list a few hundred, NWS's alike. */
  weather: 8 * 1024 * 1024,
  /** One release's JSON from GitHub. */
  updates: 2 * 1024 * 1024,
  /** The tests' stand-in for the markets. */
  markets: 4 * 1024 * 1024,
} as const

/** The body's bytes, cut off with `message` past `maxBytes`: the rest is never read. */
export async function readLimited(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  message = 'response too large',
): Promise<Uint8Array> {
  if (body === null) return new Uint8Array()
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new Error(message)
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/** A response's body as UTF-8 text, at most `maxBytes` of it. */
export async function readTextLimited(
  response: { body: ReadableStream<Uint8Array> | null },
  maxBytes: number,
): Promise<string> {
  return new TextDecoder().decode(await readLimited(response.body, maxBytes))
}

/** A response's body parsed as JSON, refused past `maxBytes` before it is parsed. */
export async function readJsonLimited(
  response: { body: ReadableStream<Uint8Array> | null },
  maxBytes: number,
): Promise<unknown> {
  return JSON.parse(await readTextLimited(response, maxBytes))
}
