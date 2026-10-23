import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HANDLER_ONLY, IPC_REASONS, IPC_ROWS, NO_ARGUMENT } from '../e2e/contracts/ipc-table.js'

/**
 * The IPC contract (tests/e2e/contracts/ipc.spec.ts) calls every method of `window.elecdex` that
 * takes an argument with arguments main must refuse. Its table is written by hand, so this holds
 * it to src/shared/api.ts, read as text: every method is a row, or listed as taking no argument
 * (and really taking none), or as taking only the page's handler (and really only that), or given
 * a reason it is not called - and the table names no method api.ts does not have.
 */

const API = readFileSync(new URL('../../src/shared/api.ts', import.meta.url), 'utf8')

/** Comments out, so a parenthesis in one does not count. */
const uncommented = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

/** The text after `open` at `start` up to its matching `close` (`start` is just past `open`). */
function until(text: string, start: number, open: string, close: string): string {
  let i = start
  for (let depth = 1; depth > 0; i += 1) {
    if (text[i] === open) depth += 1
    else if (text[i] === close) depth -= 1
  }
  return text.slice(start, i - 1)
}

/** The text between the braces that open at `from`. */
const braced = (text: string, from: number): string =>
  until(text, text.indexOf('{', from) + 1, '{', '}')

/** The methods of a member that is not one: an object type written in place, or another Api. */
function nested(rest: string, indent: number, prefix: string, out: Map<string, string>): void {
  if (rest.startsWith('{')) {
    methods(braced(rest, 0), indent + 2, prefix, out)
    return
  }
  const type = /^(\w+Api)\b/.exec(rest)?.[1]
  if (type !== undefined) methods(interfaceBody(type), 2, prefix, out)
}

function interfaceBody(name: string): string {
  const at = API.indexOf(`export interface ${name} {`)
  if (at < 0) throw new Error(`no interface ${name} in api.ts`)
  return uncommented(braced(API, at))
}

/** Each method under `prefix`, with its parameter list as written. */
function methods(body: string, indent: number, prefix: string, out: Map<string, string>): void {
  const member = new RegExp(`^ {${indent}}(readonly )?(\\w+)(<[^(]*>)?(\\(|: )`, 'gm')
  for (let m = member.exec(body); m !== null; m = member.exec(body)) {
    const name = m[2] ?? ''
    const after = m.index + m[0].length
    if (m[4] === '(') {
      out.set(`${prefix}${name}`, until(body, after, '(', ')').replace(/\s+/g, ' ').trim())
    } else if (m[1] === undefined) {
      nested(body.slice(after), indent, `${prefix}${name}.`, out)
    }
  }
}

/** Every method of `window.elecdex`, by path, with its parameters. */
function surface(): Map<string, string> {
  const out = new Map<string, string>()
  for (const [, ns, type] of interfaceBody('ElecdexApi').matchAll(/^ {2}(\w+): (\w+)/gm)) {
    methods(interfaceBody(type ?? ''), 2, `${ns}.`, out)
  }
  return out
}

describe('the e2e IPC table', () => {
  const api = surface()
  const rows = new Set(IPC_ROWS.map((r) => r.method))
  const reasons = new Set(IPC_REASONS.map((r) => r.method))

  it('reads the whole surface of api.ts', () => {
    expect(api.size).toBeGreaterThan(200)
    expect(api.get('layout.saved.apply')).toBe('id: string')
    expect(api.get('utility.awake.set')).toBe('request: AwakeRequest')
  })

  it('has every method of window.elecdex once: a row, no argument, a handler only, or a reason', () => {
    const placed = [...new Set([...rows]), ...NO_ARGUMENT, ...HANDLER_ONLY, ...reasons]
    expect(placed.filter((m, i) => placed.indexOf(m) !== i)).toEqual([])
    expect([...api.keys()].filter((m) => !placed.includes(m))).toEqual([])
    expect(placed.filter((m) => !api.has(m))).toEqual([])
  })

  it('lists as taking no argument only methods that take none', () => {
    expect(NO_ARGUMENT.filter((m) => api.get(m) !== '')).toEqual([])
  })

  it('lists as taking a handler only methods whose one parameter is the handler', () => {
    expect(HANDLER_ONLY.filter((m) => !/^handler: [^,]*$/.test(api.get(m) ?? ''))).toEqual([])
  })

  it('gives every row arguments to call with, and every reason words', () => {
    for (const row of IPC_ROWS) {
      expect(row.bad.length, row.method).toBeGreaterThan(0)
      // A subscription row is a method whose last parameter is its handler, and only those.
      expect(row.subscribes === true, row.method).toBe(
        /handler: [^,]*$/.test(api.get(row.method) ?? ''),
      )
    }
    for (const r of IPC_REASONS) expect(r.reason.length, r.method).toBeGreaterThan(20)
  })
})
