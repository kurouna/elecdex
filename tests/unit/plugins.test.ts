import { readFileSync } from 'node:fs'
import { METRIC_SOURCE_IDS } from '@shared/metrics'
import {
  checkPluginUrl,
  grantFor,
  isCovered,
  isPluginHost,
  NO_PERMISSIONS,
  PLUGIN_LIMITS,
  parseDescriptor,
  parseHostMap,
  pluginHeaders,
  readBlocks,
  settingValues,
  TokenBucket,
  WorkerMessageSchema,
} from '@shared/plugins'
import { applySettingsPatch, defaultSettings } from '@shared/settings'
import { describe, expect, it } from 'vitest'

const descriptor = (extra: Record<string, unknown> = {}) => ({
  apiVersion: 1,
  id: 'sample',
  title: 'sample',
  hasService: false,
  ...extra,
})

describe('plugin hosts', () => {
  it('are DNS names: never localhost, an address or a wildcard', () => {
    for (const host of ['claude.ai', 'api.example.com', 'status.claude.com', 'a-b.example.jp']) {
      expect(isPluginHost(host)).toBe(true)
    }
    for (const host of [
      'localhost',
      '127.0.0.1',
      '192.168.0.10',
      '[::1]',
      '*.example.com',
      'Example.com',
      'example.com.',
      'example.com:8080',
      'http://example.com',
      '',
    ]) {
      expect(isPluginHost(host), host).toBe(false)
    }
  })
})

describe('plugin descriptors', () => {
  it('fill in defaults for what a plugin leaves out', () => {
    const parsed = parseDescriptor(descriptor())
    expect(parsed.ok && parsed.descriptor).toMatchObject({
      permissions: NO_PERMISSIONS,
      settings: [],
      multiple: false,
      description: '',
    })
  })

  it('say a plugin needs a newer elecdex rather than that it is broken', () => {
    const parsed = parseDescriptor(descriptor({ apiVersion: 2 }))
    expect(parsed).toMatchObject({ ok: false, newer: true })
  })

  it('refuse ids that could name a path, and permissions that do not add up', () => {
    for (const id of ['../x', 'A', 'a/b', 'a'.repeat(41), '']) {
      expect(parseDescriptor(descriptor({ id })).ok, id).toBe(false)
    }
    const bad = [
      { hosts: ['localhost'] },
      { hosts: ['a.example.com', 'a.example.com'] },
      { session: ['claude.ai'] },
      { metrics: ['cpu.nope'] },
    ]
    for (const permissions of bad) {
      expect(parseDescriptor(descriptor({ permissions })).ok, JSON.stringify(permissions)).toBe(
        false,
      )
    }
    expect(
      parseDescriptor(descriptor({ permissions: { hosts: ['claude.ai'], session: ['claude.ai'] } }))
        .ok,
    ).toBe(true)
  })

  it('refuse settings with repeated keys', () => {
    const settings = [
      { key: 'a', type: 'boolean', label: 'A', default: true },
      { key: 'a', type: 'number', label: 'A', default: 1 },
    ]
    expect(parseDescriptor(descriptor({ settings })).ok).toBe(false)
  })
})

describe('plugin consent', () => {
  const asked = {
    ...NO_PERMISSIONS,
    metrics: ['cpu.load' as const],
    hosts: ['claude.ai'],
    session: ['claude.ai'],
    notify: true,
  }

  it('covers exactly what was agreed to, and no more', () => {
    expect(isCovered(asked, grantFor(asked))).toBe(true)
    expect(isCovered(NO_PERMISSIONS, NO_PERMISSIONS)).toBe(true)
    expect(isCovered(asked, NO_PERMISSIONS)).toBe(false)
    expect(
      isCovered({ ...asked, hosts: ['claude.ai', 'status.claude.com'] }, grantFor(asked)),
    ).toBe(false)
    expect(isCovered({ ...asked, background: true }, grantFor(asked))).toBe(false)
    // Asking for less than was agreed to keeps running.
    expect(isCovered({ ...asked, notify: false }, grantFor(asked))).toBe(true)
  })

  it('is kept per plugin in settings, and forgetting a plugin removes it', () => {
    const on = applySettingsPatch(defaultSettings(), {
      plugins: { pomodoro: { enabled: true, granted: grantFor(asked) } },
    })
    expect(on?.plugins.pomodoro).toMatchObject({ enabled: true, values: {} })
    const valued = on && applySettingsPatch(on, { plugins: { pomodoro: { values: { work: 30 } } } })
    expect(valued?.plugins.pomodoro).toMatchObject({ enabled: true, values: { work: 30 } })
    const forgotten = valued && applySettingsPatch(valued, { plugins: { pomodoro: null } })
    expect(forgotten?.plugins).toEqual({})
    expect(
      applySettingsPatch(defaultSettings(), { plugins: { '../evil': { enabled: true } } }),
    ).toBe(null)
  })
})

describe('plugin setting values', () => {
  const defs = [
    { key: 'work', type: 'number' as const, label: 'w', default: 25, min: 1, max: 120 },
    { key: 'auto', type: 'boolean' as const, label: 'a', default: false },
    { key: 'org', type: 'select' as const, label: 'o', default: '' },
    {
      key: 'size',
      type: 'select' as const,
      label: 's',
      default: 'm',
      options: [
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
      ],
    },
  ]

  it('take defaults for missing or mistyped values and clamp numbers', () => {
    expect(settingValues(defs, {})).toEqual({ work: 25, auto: false, org: '', size: 'm' })
    expect(settingValues(defs, { work: 500, auto: 'yes', size: 'xl' })).toMatchObject({
      work: 120,
      auto: false,
      size: 'm',
    })
  })

  it('keep a select value while its choices have not arrived, and check it once they have', () => {
    expect(settingValues(defs, { org: 'abc' }).org).toBe('abc')
    expect(settingValues(defs, { org: 'abc' }, { org: [{ value: 'xyz' }] }).org).toBe('')
    expect(settingValues(defs, { org: 'xyz' }, { org: [{ value: 'xyz' }] }).org).toBe('xyz')
  })
})

describe('plugin blocks', () => {
  it('drop a bad block with its reason and draw the rest', () => {
    const { blocks, problems } = readBlocks([
      { t: 'big', value: '25:00' },
      { t: 'bar', value: 'full' },
      { t: 'script', src: 'x' },
      { t: 'text', text: 'ok' },
    ])
    expect(blocks.map((b) => b.t)).toEqual(['big', 'text'])
    expect(problems).toHaveLength(2)
    expect(readBlocks('nope').problems).toEqual(['render() takes an array of blocks'])
  })

  it('clip long text and long lists instead of refusing them', () => {
    const { blocks, problems } = readBlocks([
      { t: 'text', text: 'x'.repeat(5000) },
      { t: 'spark', values: Array.from({ length: 2000 }, (_, i) => i) },
      { t: 'bar', value: 7 },
    ])
    expect(problems).toEqual([])
    expect(blocks[0]).toMatchObject({ text: 'x'.repeat(PLUGIN_LIMITS.text) })
    expect(blocks[1]).toMatchObject({ values: { length: PLUGIN_LIMITS.sparkPoints } })
    expect(blocks[2]).toMatchObject({ value: 1 })
  })

  it('say when there are more blocks than are shown', () => {
    const many = Array.from({ length: PLUGIN_LIMITS.blocks + 5 }, () => ({ t: 'divider' }))
    const { blocks, problems } = readBlocks(many)
    expect(blocks).toHaveLength(PLUGIN_LIMITS.blocks)
    expect(problems[0]).toMatch(/only the first/)
  })

  it('refuse a link whose text names another site than it opens', () => {
    const link = (text: string, href: string) => readBlocks([{ t: 'link', text, href }]).blocks
    for (const text of [
      'https://github.com/login',
      'github.com',
      'github.com/login',
      'http://github.com',
    ]) {
      expect(link(text, 'https://evil.example.com/'), text).toEqual([])
    }
    for (const text of ['https://github.com/login', 'github.com', 'Sign in', 'v1.2 notes']) {
      expect(link(text, 'https://github.com/login'), text).toHaveLength(1)
    }
  })

  it('open only https links, and sign in only to a host name', () => {
    expect(readBlocks([{ t: 'link', text: 'x', href: 'javascript:alert(1)' }]).blocks).toEqual([])
    expect(readBlocks([{ t: 'link', text: 'x', href: 'http://example.com' }]).blocks).toEqual([])
    expect(
      readBlocks([{ t: 'link', text: 'x', href: 'https://example.com/a' }]).blocks,
    ).toHaveLength(1)
    expect(readBlocks([{ t: 'signin', host: '127.0.0.1' }]).blocks).toEqual([])
    expect(readBlocks([{ t: 'signin', host: 'claude.ai' }]).blocks).toHaveLength(1)
  })

  it('accept infinite or missing numbers nowhere', () => {
    expect(readBlocks([{ t: 'bar', value: Number.NaN }]).blocks).toEqual([])
    expect(
      readBlocks([{ t: 'chart', x: { min: 0, max: Infinity }, y: { min: 0, max: 1 }, series: [] }])
        .blocks,
    ).toEqual([])
  })
})

describe('plugin worker messages', () => {
  it('are one of the known kinds, and nothing else', () => {
    expect(WorkerMessageSchema.safeParse({ t: 'pong', n: 1 }).success).toBe(true)
    expect(WorkerMessageSchema.safeParse({ t: 'ipc', channel: 'pty:create' }).success).toBe(false)
    expect(
      WorkerMessageSchema.safeParse({ t: 'fetch', id: 1, url: 'x'.repeat(3000) }).success,
    ).toBe(false)
  })

  it('name only plain storage keys', () => {
    const store = (key: string) =>
      WorkerMessageSchema.safeParse({ t: 'storage', key, value: 1 }).success
    expect(store('timer')).toBe(true)
    expect(store('history.session:v2')).toBe(true)
    for (const key of ['__proto__', 'constructor', 'prototype', '', 'a/b', 'x'.repeat(101)]) {
      expect(store(key), key).toBe(false)
    }
  })
})

describe('plugin requests', () => {
  it('pass on only the headers a plugin may set', () => {
    expect(
      pluginHeaders({
        Accept: 'application/json',
        Authorization: 'Bearer t',
        'X-Api-Key': 'k',
        Cookie: 'session=1',
        Host: 'evil.example',
        Origin: 'https://evil.example',
        'x-split': 'a\r\nCookie: b',
      }),
    ).toEqual({ accept: 'application/json', authorization: 'Bearer t', 'x-api-key': 'k' })
  })

  it('go only to granted hosts over https, without a port or credentials', () => {
    const granted = ['api.example.com']
    expect(checkPluginUrl('https://api.example.com/v1?q=1', granted).ok).toBe(true)
    for (const url of [
      'http://api.example.com/',
      'https://api.example.com:8443/',
      'https://user:pw@api.example.com/',
      'https://other.example.com/',
      'https://api.example.com.evil.net/',
      'file:///etc/passwd',
      'not a url',
    ]) {
      expect(checkPluginUrl(url, granted).ok, url).toBe(false)
    }
  })

  it('map a test host only to a local port', () => {
    const map = parseHostMap(
      'api.example.test=127.0.0.1:8123,evil.test=10.0.0.1:80,bad=127.0.0.1:1',
    )
    expect([...map]).toEqual([['api.example.test', '127.0.0.1:8123']])
    expect(parseHostMap(undefined).size).toBe(0)
  })

  it('are limited by a token bucket that refills over time', () => {
    const bucket = new TokenBucket(2, 60, 0)
    expect([bucket.take(0), bucket.take(0), bucket.take(0)]).toEqual([true, true, false])
    expect(bucket.take(999)).toBe(false)
    expect(bucket.take(1000)).toBe(true)
  })
})

describe('the plugin API file', () => {
  const source = readFileSync(new URL('../../src/shared/plugin-api.ts', import.meta.url), 'utf8')

  it('holds types only, so that it is a declaration file as it stands', () => {
    expect(source).not.toMatch(/^export (const|let|var|function|class|enum|default)\b/m)
    expect(source).not.toMatch(/^import /m)
  })

  it('names every metric source the host has', () => {
    const union = source.slice(source.indexOf('export type MetricId'), source.indexOf('/** What'))
    const named = [...union.matchAll(/'([a-z.]+)'/g)].map((m) => m[1])
    expect(named).toEqual([...METRIC_SOURCE_IDS])
  })
})
