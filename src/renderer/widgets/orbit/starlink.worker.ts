import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  type SatRec,
  twoline2satrec,
} from '../../lib/sgp4.ts'

/**
 * Where the Starlink satellites are, worked out off the page's thread.
 *
 * Ten thousand SGP4 runs take a few tens of milliseconds - a visible hitch if
 * the page did them - so this worker holds the satellites' records and answers
 * each request with their positions packed two floats apart (latitude,
 * longitude), handed over rather than copied. It is inlined as a blob, the only
 * kind of worker the page's CSP allows.
 */

type Request = { kind: 'load'; tles: [string, string][] } | { kind: 'at'; time: number }

let records: SatRec[] = []

self.onmessage = (event: MessageEvent<Request>) => {
  const request = event.data
  if (request.kind === 'load') {
    records = []
    for (const [one, two] of request.tles) {
      try {
        records.push(twoline2satrec(one, two))
      } catch {
        // A record SGP4 cannot use is left out; the rest still draw.
      }
    }
    return
  }
  const at = new Date(request.time)
  const gmst = gstime(at)
  const out = new Float32Array(records.length * 2)
  let n = 0
  for (const satrec of records) {
    const r = propagate(satrec, at)?.position
    if (!r || typeof r === 'boolean') continue
    const geo = eciToGeodetic(r, gmst)
    out[n++] = degreesLat(geo.latitude)
    out[n++] = degreesLong(geo.longitude)
  }
  const positions = out.slice(0, n)
  ;(self as unknown as Worker).postMessage({ time: request.time, positions }, [positions.buffer])
}
