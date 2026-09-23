/**
 * The parts of satellite.js the ORBIT pane uses, taken from their own files.
 *
 * satellite.js 7's single entry also re-exports its WebAssembly build, which
 * holds a top-level await and imports node:worker_threads: Vite cannot put that
 * into a worker bundle, and the page has no use for it. Importing the plain
 * JavaScript files by path keeps it out, and keeps this the one place that
 * knows satellite.js's layout (a new version that moves them fails the build
 * here, loudly).
 */
export {
  json2satrec,
  twoline2satrec,
} from '../../../node_modules/satellite.js/dist/io.js'
export type { SatRec } from '../../../node_modules/satellite.js/dist/propagation/SatRec.js'
export { gstime, propagate } from '../../../node_modules/satellite.js/dist/propagation.js'
export {
  degreesLat,
  degreesLong,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
} from '../../../node_modules/satellite.js/dist/transforms.js'
