import { describe, expect, it } from 'vitest'
import {
  dedupeByName,
  desktopExecArgv,
  idOf,
  isNoise,
  parseDesktopEntry,
  userEntries,
} from '../../src/main/launcher/catalog.js'

describe('launcher catalog', () => {
  it('filters uninstallers and other noise from the Start Menu', () => {
    expect(isNoise('Uninstall Foo')).toBe(true)
    expect(isNoise('Foo アンインストール')).toBe(true)
    expect(isNoise('Foo Readme')).toBe(true)
    expect(isNoise('Visual Studio Code')).toBe(false)
    expect(isNoise('Helper Tools')).toBe(false)
  })

  it('keeps the first of entries with the same name', () => {
    expect(dedupeByName([{ name: 'Code' }, { name: 'code' }, { name: 'Git' }])).toEqual([
      { name: 'Code' },
      { name: 'Git' },
    ])
  })

  it('keeps one of two user entries with the same target and arguments', () => {
    const list = userEntries([
      { name: 'A', target: '/bin/x' },
      { name: 'B', target: '/bin/x' },
    ])
    expect(list.map((e) => e.name)).toEqual(['A'])
  })

  it('gives user entries stable ids that differ by arguments', () => {
    const [a] = userEntries([{ name: 'A', target: '/bin/x', args: ['1'] }])
    const [b] = userEntries([{ name: 'B', target: '/bin/x', args: ['1'] }])
    const [c] = userEntries([{ name: 'A', target: '/bin/x', args: ['2'] }])
    expect(a?.id).toBe(b?.id)
    expect(a?.id).not.toBe(c?.id)
    expect(a?.source).toBe('user')
    expect(idOf('user', '/bin/x')).not.toBe(idOf('system', '/bin/x'))
  })

  it('parses a .desktop file', () => {
    const entry = parseDesktopEntry(
      [
        '[Desktop Entry]',
        'Type=Application',
        'Name=Text Editor',
        'Name[ja]=テキストエディター',
        'Exec=gedit %U',
        'Categories=Utility;TextEditor;',
        '[Desktop Action new-window]',
        'Name=New Window',
      ].join('\n'),
    )
    expect(entry).toEqual({
      name: 'Text Editor',
      exec: 'gedit %U',
      hidden: false,
      categories: ['Utility', 'TextEditor'],
    })
    expect(parseDesktopEntry('[Desktop Entry]\nType=Link\nName=x\nExec=y')).toBeNull()
    const hidden = parseDesktopEntry(
      '[Desktop Entry]\nType=Application\nName=x\nExec=y\nNoDisplay=true',
    )
    expect(hidden?.hidden).toBe(true)
  })

  it('turns an Exec line into argv without field codes', () => {
    expect(desktopExecArgv('gedit %U')).toEqual(['gedit'])
    expect(desktopExecArgv('"/opt/My App/app" --flag %f 100%%')).toEqual([
      '/opt/My App/app',
      '--flag',
      '100%',
    ])
  })
})
