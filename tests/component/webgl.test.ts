import { describe, expect, it, vi } from 'vitest'
import { releaseWebglContexts } from '../../src/renderer/lib/webgl.ts'

/** A canvas whose getContext answers like a browser's for a canvas holding `kind`. */
function canvasWith(kind: 'webgl2' | 'webgl' | '2d' | 'lost') {
  const canvas = document.createElement('canvas')
  const loseContext = vi.fn()
  const gl = {
    isContextLost: () => kind === 'lost',
    getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null),
  }
  canvas.getContext = ((type: string) => {
    if (kind === '2d') return null
    if (kind === 'webgl' && type === 'webgl2') return null
    return gl
  }) as HTMLCanvasElement['getContext']
  return { canvas, loseContext }
}

describe('releaseWebglContexts', () => {
  it('loses the context of every WebGL canvas under the root, and leaves the rest', () => {
    const root = document.createElement('div')
    const webgl2 = canvasWith('webgl2')
    const webgl = canvasWith('webgl')
    const flat = canvasWith('2d')
    const lost = canvasWith('lost')
    const nested = document.createElement('section')
    nested.append(webgl.canvas)
    root.append(webgl2.canvas, nested, flat.canvas, lost.canvas)

    expect(releaseWebglContexts(root)).toBe(2)
    expect(webgl2.loseContext).toHaveBeenCalledTimes(1)
    expect(webgl.loseContext).toHaveBeenCalledTimes(1)
    expect(flat.loseContext).not.toHaveBeenCalled()
    expect(lost.loseContext).not.toHaveBeenCalled()
  })

  it('does nothing without canvases', () => {
    expect(releaseWebglContexts(document.createElement('div'))).toBe(0)
  })
})
