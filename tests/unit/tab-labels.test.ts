import { describe, expect, it } from 'vitest'
import { displayPath, tabLabels } from '../../src/renderer/layout/tab-labels.js'

describe('displayPath', () => {
  it('writes Windows paths with backslashes and leaves POSIX paths alone', () => {
    expect(displayPath('C:/Users/me/projects')).toBe('C:\\Users\\me\\projects')
    expect(displayPath('C:\\Users\\me')).toBe('C:\\Users\\me')
    expect(displayPath('//server/share/dir')).toBe('\\\\server\\share\\dir')
    expect(displayPath('/home/me/src')).toBe('/home/me/src')
  })
})

describe('tabLabels', () => {
  it('names a tab after its last folder, in its own case', () => {
    expect(tabLabels(['C:/Users/me/Projects/elecDEX', '/home/me/Documents'])).toEqual([
      'elecDEX',
      'Documents',
    ])
  })

  it('names the home folder by its name, not a bare ~', () => {
    expect(tabLabels(['C:/Users/Me', 'C:/Users/Me/work'])).toEqual(['Me', 'work'])
    expect(tabLabels(['/home/me'])).toEqual(['me'])
  })

  it('names roots by their root', () => {
    expect(tabLabels(['C:/', 'D:\\', '/'])).toEqual(['C:\\', 'D:\\', '/'])
  })

  it('gives no label to a tab without a path', () => {
    expect(tabLabels([undefined, null, '', '/tmp'])).toEqual([null, null, null, 'tmp'])
  })

  it('adds parent folders only to tabs that would read the same', () => {
    expect(tabLabels(['C:/work/api/src', 'C:/work/web/src', 'C:/work/api/tests'])).toEqual([
      'api\\src',
      'web\\src',
      'tests',
    ])
    expect(tabLabels(['/a/x/lib/src', '/b/x/lib/src', '/tmp'])).toEqual([
      'a/x/lib/src',
      'b/x/lib/src',
      'tmp',
    ])
  })

  it('stops at the whole path when one clashing path is shorter', () => {
    expect(tabLabels(['/src', '/home/src'])).toEqual(['/src', 'home/src'])
  })

  it('leaves tabs in the same folder with the same name, and ignores Windows case', () => {
    expect(tabLabels(['/home/me/src', '/home/me/src'])).toEqual(['src', 'src'])
    expect(tabLabels(['C:/Work/src', 'c:\\work\\src'])).toEqual(['src', 'src'])
  })

  it('tells the home folder apart from another folder of the same name', () => {
    expect(tabLabels(['/home/me', '/srv/me'])).toEqual(['home/me', 'srv/me'])
  })
})
