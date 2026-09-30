import { describe, expect, it, vi } from 'vitest'
import { looksLikeImage, prepare } from '../../src/renderer/widgets/aichat/attach'
import { jpeg, png } from './attach-bytes'

/**
 * What the page makes of a file before main sees it (widgets/aichat/attach.ts): a picture is
 * drawn again whatever it is called, so none goes as it came, with what the camera wrote in it.
 */
describe('a picture the system does not name as one', () => {
  it('is known by its first bytes', async () => {
    expect(await looksLikeImage(new File([png(10, 10)], 'photo'))).toBe(true)
    expect(
      await looksLikeImage(new File([jpeg(10, 10)], 'photo.dat', { type: 'image/pjpeg' })),
    ).toBe(true)
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
    expect(await looksLikeImage(new File([webp], 'x'))).toBe(true)
    expect(await looksLikeImage(new File(['# notes'], 'notes.md'))).toBe(false)
    // What begins some text as well: a CSV's header, a note about a car, a word.
    expect(await looksLikeImage(new File(['BMI,age,height\n22,30,170\n'], 'data'))).toBe(false)
    expect(await looksLikeImage(new File(['BMW service log'], 'car'))).toBe(false)
    expect(await looksLikeImage(new File(['GIF8 is not a word'], 'x'))).toBe(false)
  })

  it('is drawn again; one that does not decode goes as its bytes, for main to judge', async () => {
    // No decoder that works here: which files were tried is what is looked at.
    const tried: string[] = []
    vi.stubGlobal('createImageBitmap', async (file: File) => {
      tried.push(file.name)
      throw new Error('cannot decode')
    })
    try {
      // Named a picture by the system: refused when it does not decode.
      const typed = await prepare(new File([jpeg(40, 30)], 'a.jpg', { type: 'image/jpeg' }))
      expect(typed).toMatchObject({ ok: false, detail: 'the image could not be read' })
      // A picture by its bytes alone: tried, and then sent as bytes - main refuses one that
      // still carries a camera's data (carriesMetadata).
      const untyped = await prepare(new File([jpeg(40, 30)], 'IMG_0001', { type: '' }))
      expect(untyped).toMatchObject({ name: 'IMG_0001' })
      expect(untyped).toHaveProperty('bytes')
      // Text is never tried.
      const text = await prepare(new File(['# notes'], 'notes.md', { type: 'text/markdown' }))
      expect(text).toMatchObject({ name: 'notes.md' })
      expect(tried).toEqual(['a.jpg', 'IMG_0001'])
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('a text file too long is refused before it is read', async () => {
    const long = new File(['x'.repeat(300 * 1024)], 'huge.log', { type: 'text/plain' })
    expect(await prepare(long)).toMatchObject({ ok: false, code: 'too large' })
  })
})
