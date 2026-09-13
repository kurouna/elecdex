/**
 * Frees the GPU contexts of the WebGL canvases under `root`, for a widget that
 * is going away.
 *
 * Disposing a renderer (xterm's WebGL addon, three.js) frees its buffers but
 * leaves the context itself alive until the canvas is garbage collected, and
 * Chromium keeps only about 16 live contexts - past that it drops the oldest,
 * which may belong to a pane still on screen. Losing the context on purpose
 * returns it at once.
 *
 * Call it before the canvases are removed. `getContext` returns a canvas's
 * existing context, and null for a canvas already holding a 2D one, so this
 * never replaces a context; a canvas with none yet gets one only to lose it.
 */
export function releaseWebglContexts(root: ParentNode): number {
  let released = 0
  for (const canvas of root.querySelectorAll('canvas')) {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (gl === null || gl.isContextLost()) continue
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    released += 1
  }
  return released
}
