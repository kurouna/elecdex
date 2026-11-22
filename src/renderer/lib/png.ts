/**
 * RGBA pixels as PNG bytes, made by the page's own canvas (no network, no file): for a copy
 * or a save that main does (`utility.copy`, `elec16.savePng`). Null when the canvas makes none.
 */
export async function pngBytes(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
): Promise<Uint8Array | null> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.putImageData(new ImageData(data, width, height), 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob === null ? null : new Uint8Array(await blob.arrayBuffer())
}
