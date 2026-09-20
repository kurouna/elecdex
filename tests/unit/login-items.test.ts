import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { isPackaged: false, getLoginItemSettings: () => ({}), setLoginItemSettings: () => {} },
}))

const { desktopEntry, parseDesktopEntry, quoteExecArg } = await import(
  '../../src/main/background/login/desktop-entry.js'
)
const { autostartDir, linuxLoginBackend } = await import('../../src/main/background/login/linux.js')
const { darwinLoginBackend } = await import('../../src/main/background/login/darwin.js')

/**
 * The sign-in entry on the platforms that are not Windows.
 *
 * Every one of them keeps it somewhere else - a macOS login service, a
 * freedesktop autostart file - so what is worth testing is that elecdex reads
 * the platform's own answer back rather than remembering what it asked for, and
 * that the file it writes says what a desktop will read.
 */

describe('an Exec line', () => {
  it('leaves an ordinary path alone', () => {
    expect(quoteExecArg('/opt/elecdex/elecdex')).toBe('/opt/elecdex/elecdex')
    expect(quoteExecArg('--hidden')).toBe('--hidden')
  })

  it('quotes what the spec reserves', () => {
    expect(quoteExecArg('/home/Ana María/elecdex')).toBe('"/home/Ana María/elecdex"')
    expect(quoteExecArg('a;b')).toBe('"a;b"')
    expect(quoteExecArg('a$b')).toBe('"a\\$b"')
    expect(quoteExecArg('a"b')).toBe('"a\\"b"')
  })

  it('reads back exactly what it wrote', () => {
    for (const args of [[], ['--hidden'], ['--a b', '--c"d'], ['$HOME']]) {
      const text = desktopEntry({ exec: '/opt/my app/elecdex', args, disabled: false })
      expect(parseDesktopEntry(text)?.args, args.join('|')).toEqual(args)
    }
  })
})

describe('an autostart file', () => {
  it('says what a desktop reads, both ways round', () => {
    const on = desktopEntry({ exec: '/opt/elecdex/elecdex', args: [], disabled: false })
    expect(on).toContain('[Desktop Entry]')
    expect(on).toContain('Exec=/opt/elecdex/elecdex')
    expect(on).toContain('Hidden=false')
    expect(on).toContain('X-GNOME-Autostart-enabled=true')
    const off = desktopEntry({ exec: '/opt/elecdex/elecdex', args: [], disabled: true })
    expect(off).toContain('Hidden=true')
    expect(off).toContain('X-GNOME-Autostart-enabled=false')
  })

  it('reads a desktop having turned the entry off, in either spelling', () => {
    const base = 'Exec=/opt/elecdex/elecdex'
    expect(parseDesktopEntry(base)?.disabled).toBe(false)
    expect(parseDesktopEntry(`${base}\nHidden=true`)?.disabled).toBe(true)
    expect(parseDesktopEntry(`${base}\nX-GNOME-Autostart-enabled=false`)?.disabled).toBe(true)
  })

  it('is not read as an entry at all without an Exec line', () => {
    expect(parseDesktopEntry('[Desktop Entry]\nType=Application')).toBeNull()
    expect(parseDesktopEntry('')).toBeNull()
    expect(parseDesktopEntry('{ "not": "a desktop entry" }')).toBeNull()
  })

  it('ignores comments and takes the first value of a repeated key', () => {
    const text = '[Desktop Entry]\n# Exec=/wrong\nExec=/right\nHidden=true\nHidden=false'
    expect(parseDesktopEntry(text)?.args).toEqual([])
    expect(parseDesktopEntry(text)?.disabled).toBe(true)
  })

  it('goes where the spec says, XDG_CONFIG_HOME first', () => {
    expect(autostartDir({ XDG_CONFIG_HOME: '/custom/config' }, '/home/a')).toBe(
      path.join('/custom/config', 'autostart'),
    )
    expect(autostartDir({}, '/home/a')).toBe(path.join('/home/a', '.config', 'autostart'))
    // A relative value is not a path the spec allows; the fallback stands.
    expect(autostartDir({ XDG_CONFIG_HOME: 'config' }, '/home/a')).toBe(
      path.join('/home/a', '.config', 'autostart'),
    )
  })
})

/** An autostart file in memory, so no test writes into a real home folder. */
class FakeFile {
  available = true
  path = '/home/a/.config/autostart/elecdex.desktop'
  text: string | null = null
  writes = 0

  read(): string | null {
    return this.text
  }

  write(text: string): void {
    this.writes += 1
    this.text = text
  }

  remove(): void {
    this.text = null
  }
}

describe('the sign-in entry on Linux', () => {
  let file: FakeFile

  beforeEach(() => {
    file = new FakeFile()
  })

  const backend = () => linuxLoginBackend(true, file, '/opt/elecdex/elecdex')

  it('is not registered until it is written', () => {
    expect(backend().state()).toEqual({ available: true, registered: false, disabledByOs: false })
  })

  it('writes the entry, with the start option as an argument', () => {
    backend().set(true, true)
    expect(file.text).toContain('Exec=/opt/elecdex/elecdex --hidden')
    expect(backend().state()).toEqual({ available: true, registered: true, disabledByOs: false })
  })

  it('removes the file rather than leaving a disabled entry behind', () => {
    backend().set(true, false)
    backend().set(false, false)
    expect(file.text).toBeNull()
    expect(backend().state().registered).toBe(false)
  })

  it('reports the desktop having switched it off, and turns it back on when asked again', () => {
    backend().set(true, false)
    file.text = (file.text ?? '').replace('Hidden=false', 'Hidden=true')
    expect(backend().state().disabledByOs).toBe(true)
    backend().set(true, false)
    expect(backend().state().disabledByOs).toBe(false)
  })

  it('rewrites the arguments for a changed start option, keeping that switch-off', () => {
    backend().set(true, false)
    file.text = (file.text ?? '').replace('Hidden=false', 'Hidden=true')
    backend().sync(true)
    expect(file.text).toContain('--hidden')
    expect(backend().state().disabledByOs).toBe(true)
  })

  it('writes nothing at all when there is no entry to sync', () => {
    const before = file.writes
    backend().sync(true)
    expect(file.writes).toBe(before)
  })

  it('does nothing where it cannot be written (a development run)', () => {
    file.available = false
    const dev = linuxLoginBackend(false, file, '/opt/elecdex/elecdex')
    dev.set(true, true)
    expect(file.text).toBeNull()
    expect(dev.state()).toEqual({ available: false, registered: false, disabledByOs: false })
  })
})

describe('the sign-in entry on macOS', () => {
  const service = (read: { openAtLogin: boolean; status: string }) => {
    const calls: boolean[] = []
    return {
      calls,
      port: {
        available: true,
        read: () => read,
        write: (on: boolean) => {
          calls.push(on)
        },
      },
    }
  }

  it('is registered when macOS says the service is', () => {
    const { port } = service({ openAtLogin: true, status: 'enabled' })
    expect(darwinLoginBackend(true, port).state()).toEqual({
      available: true,
      registered: true,
      disabledByOs: false,
    })
  })

  it('reports a service waiting for approval as the OS having turned it off', () => {
    // The same thing to the user as Task Manager's switch on Windows: the entry
    // is there, and it is not running at login until they allow it.
    const { port } = service({ openAtLogin: false, status: 'requires-approval' })
    expect(darwinLoginBackend(true, port).state()).toEqual({
      available: true,
      registered: true,
      disabledByOs: true,
    })
  })

  it('is not registered when macOS has nothing', () => {
    const { port } = service({ openAtLogin: false, status: 'not-registered' })
    expect(darwinLoginBackend(true, port).state().registered).toBe(false)
  })

  it('adds and removes it, and has nothing to sync', () => {
    const { port, calls } = service({ openAtLogin: false, status: 'not-registered' })
    const backend = darwinLoginBackend(true, port)
    backend.set(true, true)
    backend.set(false, false)
    backend.sync(true)
    // The entry is the app itself: no arguments, so the start option cannot be
    // written into it and sync has nothing to do.
    expect(calls).toEqual([true, false])
  })

  it('does nothing where it cannot be written (a development run)', () => {
    const backend = darwinLoginBackend(false, {
      available: false,
      read: () => ({ openAtLogin: true, status: 'enabled' }),
      write: () => {
        throw new Error('must not be called')
      },
    })
    expect(backend.state()).toEqual({ available: false, registered: false, disabledByOs: false })
    expect(() => backend.set(true, false)).not.toThrow()
  })
})
