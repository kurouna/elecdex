import { describe, expect, it } from 'vitest'
import { cssColorToHex, titleBarColors } from '../../src/shared/title-bar.js'

describe('title bar colours', () => {
  it('accepts only #rrggbb pairs', () => {
    expect(titleBarColors({ background: '#05080d', symbols: '#8FE3EA' })).toEqual({
      background: '#05080d',
      symbols: '#8FE3EA',
    })
    expect(titleBarColors({ background: 'red', symbols: '#000000' })).toBeNull()
    expect(titleBarColors({ background: '#000000' })).toBeNull()
    expect(titleBarColors('#000000')).toBeNull()
  })

  it('converts computed colours', () => {
    expect(cssColorToHex('rgb(5, 8, 13)')).toBe('#05080d')
    expect(cssColorToHex('rgba(143, 227, 234, 0.5)')).toBe('#8fe3ea')
    expect(cssColorToHex('hsl(0 0% 0%)')).toBeNull()
  })
})
