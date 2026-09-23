import { z } from 'zod'
import { PLUGIN_METRIC_SOURCE_IDS } from './metrics.js'
import type { Block, ButtonIcon, SettingValue } from './plugin-api.js'
import { SLUG_ID } from './validate.js'

/**
 * Plugins: what main, the renderer's host and the settings share (docs/plugins.md).
 *
 * Everything that crosses from a plugin - its descriptor, the blocks it renders, the
 * messages its worker posts - is untrusted and passes through a schema here before the
 * host acts on it. The author-facing types live in plugin-api.ts.
 */

export const PLUGIN_API_VERSION = 1

/** A plugin id, also its storage file name and session partition: no path characters. */
export const PLUGIN_ID = SLUG_ID
const SETTING_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/

/**
 * What came of installing a plugin from a folder (main/plugins/install.ts).
 *
 * The page never names a path: it asks main to ask the user, and main answers
 * with what happened. 'cancelled' is the dialog being closed, which is not a
 * failure and says nothing on screen.
 */
export type PluginInstalled =
  | { status: 'installed'; name: string; files: number }
  | { status: 'cancelled' }
  | { status: 'refused'; reason: string }

export const PLUGIN_LIMITS = {
  /** Source read for one plugin, all files together. */
  sourceBytes: 1024 * 1024,
  files: 64,
  depth: 4,
  blocks: 200,
  text: 2000,
  sparkPoints: 512,
  chartSeries: 8,
  chartPoints: 1024,
  rows: 200,
  /** ctx.storage as JSON, all keys together. */
  storageBytes: 1024 * 1024,
  /** A pane's ctx.state as JSON. */
  stateBytes: 64 * 1024,
  responseBytes: 1024 * 1024,
  fetchTimeoutMs: 15_000,
  redirects: 3,
  /** Token bucket for ctx.fetch: burst, and requests per minute. */
  fetchBurst: 5,
  fetchPerMinute: 30,
  notifyPerMinute: 6,
} as const

/** What main hands the renderer for one plugin found in the folder. */
export interface PluginSource {
  /** The file or folder name in the plugins folder. */
  key: string
  /** Changes whenever any of its files changes. */
  hash: string
  /**
   * The module table as a JavaScript expression, `{"index.ts": function (module, exports,
   * require) {...}}`, with `entry` naming the module to load. Null when it could not be read.
   */
  code: string | null
  entry: string | null
  error: string | null
}

export interface PluginCatalog {
  /** Absolute path of the plugins folder. */
  folder: string
  plugins: PluginSource[]
}

/**
 * A ctx.storage key: plain characters only, and never a name an object already gives a
 * meaning to, so a stored object cannot be given another prototype.
 */
export function isStorageKey(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[A-Za-z0-9_.:-]{1,100}$/.test(value) &&
    !['__proto__', 'constructor', 'prototype'].includes(value)
  )
}

/*
 * Hosts.
 */

const LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?'
const HOST_NAME = new RegExp(`^(?:${LABEL}\\.)+${LABEL}$`)

/**
 * A host a plugin may name: a lower-case DNS name with at least one dot, whose last label
 * is not all digits. That rules out localhost, IPv4 and IPv6 literals and wildcards, so a
 * plugin cannot be granted the user's own machine or network by address.
 */
export function isPluginHost(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 253 &&
    HOST_NAME.test(value) &&
    !/^\d+$/.test(value.slice(value.lastIndexOf('.') + 1))
  )
}

const HostSchema = z.string().refine(isPluginHost, 'not a host name')

/*
 * Descriptor.
 */

const unique = <T>(list: readonly T[]) => new Set(list).size === list.length

export const PermissionsSchema = z
  .object({
    // Not every reading: `net.sockets` is deliberately out (shared/metrics.ts).
    metrics: z
      .array(z.enum(PLUGIN_METRIC_SOURCE_IDS))
      .max(PLUGIN_METRIC_SOURCE_IDS.length)
      .default([]),
    hosts: z.array(HostSchema).max(16).refine(unique, 'hosts repeat').default([]),
    session: z.array(HostSchema).max(4).refine(unique, 'session hosts repeat').default([]),
    background: z.boolean().default(false),
    notify: z.boolean().default(false),
  })
  .refine((p) => p.session.every((h) => p.hosts.includes(h)), 'a session host must be in hosts')
export type Permissions = z.infer<typeof PermissionsSchema>

export const NO_PERMISSIONS: Permissions = {
  metrics: [],
  hosts: [],
  session: [],
  background: false,
  notify: false,
}

const label = z.string().min(1).max(80)
const SelectOptionSchema = z.object({ value: z.string().max(200), label: z.string().max(200) })

const settingBase = {
  key: z.string().regex(SETTING_KEY),
  label,
  description: z.string().max(300).optional(),
}

export const SettingSchema = z.discriminatedUnion('type', [
  z.object({
    ...settingBase,
    type: z.literal('string'),
    default: z.string().max(PLUGIN_LIMITS.text),
    placeholder: z.string().max(200).optional(),
    secret: z.boolean().optional(),
  }),
  z.object({
    ...settingBase,
    type: z.literal('number'),
    default: z.number(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
  }),
  z.object({ ...settingBase, type: z.literal('boolean'), default: z.boolean() }),
  z.object({
    ...settingBase,
    type: z.literal('select'),
    default: z.string().max(200),
    options: z.array(SelectOptionSchema).max(100).optional(),
  }),
])

export type SettingDef = z.infer<typeof SettingSchema>

export const DescriptorSchema = z.object({
  apiVersion: z.literal(PLUGIN_API_VERSION),
  id: z.string().regex(PLUGIN_ID),
  title: z.string().min(1).max(40),
  description: z.string().max(300).default(''),
  permissions: PermissionsSchema.default(NO_PERMISSIONS),
  settings: z
    .array(SettingSchema)
    .max(32)
    .refine((list) => unique(list.map((s) => s.key)), 'setting keys repeat')
    .default([]),
  minSize: z.object({ w: z.number().min(0).max(4000), h: z.number().min(0).max(4000) }).optional(),
  // How the pane is brought to the front of the workspace, if at all: a plugin
  // that says nothing is not offered the button, as a built-in widget is not.
  zoom: z.enum(['full', 'panel']).optional(),
  multiple: z.boolean().default(false),
  hasService: z.boolean(),
})
export type PluginDescriptor = z.infer<typeof DescriptorSchema>

/** Reads what a worker reported about its plugin, or says in one line why it cannot be used. */
export function parseDescriptor(
  raw: unknown,
): { ok: true; descriptor: PluginDescriptor } | { ok: false; error: string; newer?: boolean } {
  const version = (raw as { apiVersion?: unknown } | null)?.apiVersion
  if (typeof version === 'number' && version > PLUGIN_API_VERSION) {
    return { ok: false, newer: true, error: `needs a newer elecdex (plugin API ${version})` }
  }
  const parsed = DescriptorSchema.safeParse(raw)
  if (parsed.success) return { ok: true, descriptor: parsed.data }
  return { ok: false, error: issues(parsed.error) }
}

function issues(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((i) => (i.path.length > 0 ? `${i.path.join('.')}: ${i.message}` : i.message))
    .join('; ')
}

/*
 * Consent and settings.
 */

/** What the user agreed to, per plugin, in settings.json. */
export const GrantSchema = z.object({
  metrics: z.array(z.string().max(40)).max(64).default([]),
  hosts: z.array(z.string().max(253)).max(32).default([]),
  session: z.array(z.string().max(253)).max(8).default([]),
  background: z.boolean().default(false),
  notify: z.boolean().default(false),
})
export type Grant = z.infer<typeof GrantSchema>

export const PluginSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  /**
   * The file or folder the user agreed to. Another file claiming the same id is asked about
   * again, so a plugin cannot take over the permissions of one it replaces by name.
   */
  key: z.string().max(255).nullable().default(null),
  granted: GrantSchema.default(NO_PERMISSIONS),
  values: z
    .record(
      z.string().regex(SETTING_KEY),
      z.union([z.string().max(PLUGIN_LIMITS.text), z.number(), z.boolean()]),
    )
    .refine((v) => Object.keys(v).length <= 32, 'too many values')
    .default({}),
})
export type PluginSettings = z.infer<typeof PluginSettingsSchema>

/** Whether everything a plugin asks for has been granted. */
export function isCovered(requested: Permissions, granted: Grant): boolean {
  const within = (want: readonly string[], have: readonly string[]) =>
    want.every((w) => have.includes(w))
  return (
    within(requested.metrics, granted.metrics) &&
    within(requested.hosts, granted.hosts) &&
    within(requested.session, granted.session) &&
    (!requested.background || granted.background) &&
    (!requested.notify || granted.notify)
  )
}

/** The grant that agrees to exactly what a plugin asks for. */
export const grantFor = (requested: Permissions): Grant => ({
  metrics: [...requested.metrics],
  hosts: [...requested.hosts],
  session: [...requested.session],
  background: requested.background,
  notify: requested.notify,
})

/** A setting's stored value if it suits the definition, otherwise its default. */
export function settingValue(
  def: SettingDef,
  stored: SettingValue | undefined,
  options?: readonly { value: string }[],
): SettingValue {
  switch (def.type) {
    case 'string':
      return typeof stored === 'string' ? stored : def.default
    case 'boolean':
      return typeof stored === 'boolean' ? stored : def.default
    case 'number':
      return typeof stored === 'number' && Number.isFinite(stored)
        ? Math.min(def.max ?? Number.POSITIVE_INFINITY, Math.max(def.min ?? -Infinity, stored))
        : def.default
    case 'select':
      return selectValue(def.default, stored, options ?? def.options)
  }
}

function selectValue(
  fallback: string,
  stored: SettingValue | undefined,
  choices: readonly { value: string }[] | undefined,
): string {
  if (typeof stored !== 'string') return fallback
  // Choices the service has not supplied yet: keep the value rather than lose it.
  return choices === undefined || choices.some((o) => o.value === stored) ? stored : fallback
}

export function settingValues(
  defs: readonly SettingDef[],
  stored: Readonly<Record<string, SettingValue>>,
  options: Readonly<Record<string, readonly { value: string }[]>> = {},
): Record<string, SettingValue> {
  return Object.fromEntries(
    defs.map((d) => [d.key, settingValue(d, stored[d.key], options[d.key])]),
  )
}

/*
 * Blocks.
 */

/** A string clipped to the text limit rather than refused. */
const text = z.string().transform((s) => s.slice(0, PLUGIN_LIMITS.text))
const short = z.string().transform((s) => s.slice(0, 200))
/** An array cut to `max` entries before its items are checked. */
const capped = <T extends z.ZodType>(item: T, max: number) =>
  z.preprocess((v) => (Array.isArray(v) ? v.slice(0, max) : v), z.array(item))

export const BUTTON_ICONS = [
  'refresh',
  'play',
  'pause',
  'stop',
  'skip',
  'reset',
  'add',
  'remove',
  'settings',
  'open',
] as const satisfies readonly ButtonIcon[]

const ToneSchema = z.enum(['ok', 'warn', 'danger', 'dim', 'accent'])
const tone = ToneSchema.optional()
const point = z.tuple([z.number(), z.number()])

const BlockSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('heading'), text }),
  z.object({ t: z.literal('text'), text, tone, size: z.enum(['sm', 'md', 'lg']).optional() }),
  z.object({
    t: z.literal('big'),
    value: short,
    unit: short.optional(),
    label: short.optional(),
    tone,
  }),
  z.object({
    t: z.literal('rows'),
    rows: capped(z.object({ label: short, value: text, tone }), PLUGIN_LIMITS.rows),
  }),
  z.object({
    t: z.literal('bar'),
    value: z.number().transform((v) => Math.min(1, Math.max(0, v))),
    label: short.optional(),
    text: short.optional(),
    tone,
    segments: z.int().min(2).max(64).optional(),
  }),
  z.object({
    t: z.literal('steps'),
    count: z.int().min(1).max(32),
    done: z.int().min(0).max(32),
    label: short.optional(),
    tone,
  }),
  z.object({
    t: z.literal('spark'),
    values: capped(z.number(), PLUGIN_LIMITS.sparkPoints),
    min: z.number().optional(),
    max: z.number().optional(),
    label: short.optional(),
  }),
  z.object({
    t: z.literal('chart'),
    height: z.number().min(40).max(400).optional(),
    x: z.object({ min: z.number(), max: z.number(), time: z.boolean().optional() }),
    y: z.object({ min: z.number(), max: z.number(), unit: short.optional() }),
    series: capped(
      z.object({
        points: capped(point, PLUGIN_LIMITS.chartPoints),
        line: z.enum(['solid', 'dashed', 'dotted']).optional(),
        tone,
        fill: z.boolean().optional(),
      }),
      PLUGIN_LIMITS.chartSeries,
    ),
    rules: capped(
      z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        label: short.optional(),
        tone,
      }),
      16,
    ).optional(),
    labels: capped(z.object({ x: z.number(), y: z.number(), text: short, tone }), 16).optional(),
  }),
  z.object({
    t: z.literal('time'),
    at: z.number(),
    style: z.enum(['relative', 'countdown', 'clock', 'date']),
    label: short.optional(),
    tone,
    size: z.enum(['md', 'lg']).optional(),
  }),
  z.object({
    t: z.literal('table'),
    columns: capped(short, 12),
    rows: capped(capped(text, 12), PLUGIN_LIMITS.rows),
    align: capped(z.enum(['left', 'right']), 12).optional(),
  }),
  z.object({
    t: z.literal('list'),
    items: capped(z.object({ id: short, text, sub: text.optional(), tone }), PLUGIN_LIMITS.rows),
    action: short.optional(),
  }),
  z.object({
    t: z.literal('buttons'),
    items: capped(
      z.object({
        action: short,
        text: short,
        icon: z.enum(BUTTON_ICONS).optional(),
        busy: z.boolean().optional(),
        primary: z.boolean().optional(),
        disabled: z.boolean().optional(),
      }),
      8,
    ),
  }),
  z
    .object({ t: z.literal('link'), text: short, href: z.url({ protocol: /^https$/ }).max(2048) })
    .refine(
      (b) => [null, new URL(b.href).hostname].includes(linkTextHost(b.text)),
      'link text that names a site must name the site it opens',
    ),
  z.object({ t: z.literal('signin'), host: HostSchema, text: short.optional() }),
  z.object({ t: z.literal('notice'), text, tone }),
  z.object({ t: z.literal('divider') }),
])

/** The host a link's text names, when the text looks like an address; otherwise null. */
export function linkTextHost(text: string): string | null {
  const match = /^\s*(?:[a-z][a-z0-9+.-]*:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?:[/:?#]|\s*$)/i.exec(
    text,
  )
  return match?.[1]?.toLowerCase() ?? null
}

/**
 * The blocks a view rendered, each checked on its own: a bad block is dropped with its
 * reason, the rest are drawn. Past the block limit the rest are dropped too.
 */
export function readBlocks(raw: unknown): { blocks: Block[]; problems: string[] } {
  if (!Array.isArray(raw)) return { blocks: [], problems: ['render() takes an array of blocks'] }
  const problems: string[] = []
  if (raw.length > PLUGIN_LIMITS.blocks) {
    problems.push(`only the first ${PLUGIN_LIMITS.blocks} of ${raw.length} blocks are shown`)
  }
  const blocks: Block[] = []
  raw.slice(0, PLUGIN_LIMITS.blocks).forEach((item, index) => {
    const parsed = BlockSchema.safeParse(item)
    if (parsed.success) blocks.push(parsed.data as Block)
    else if (problems.length < 5) problems.push(`block ${index}: ${issues(parsed.error)}`)
  })
  return { blocks, problems }
}

/*
 * Worker messages.
 */

const pane = z.string().min(1).max(128)

/** Everything a plugin worker may post to the host. Anything else is ignored. */
export const WorkerMessageSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('descriptor'), descriptor: z.unknown() }),
  z.object({ t: z.literal('render'), pane, blocks: z.unknown() }),
  z.object({ t: z.literal('subtitle'), pane, text: short.nullable() }),
  z.object({ t: z.literal('badge'), pane, text: z.string().max(16).nullable(), tone }),
  z.object({ t: z.literal('state'), pane, value: z.unknown() }),
  z.object({
    t: z.literal('fetch'),
    id: z.int().nonnegative(),
    url: z.string().max(2048),
    headers: z.record(z.string().max(64), z.string().max(4096)).optional(),
  }),
  z.object({
    t: z.literal('storage'),
    key: z.string().refine(isStorageKey, 'not a storage key'),
    value: z.unknown(),
    remove: z.boolean().optional(),
  }),
  z.object({ t: z.literal('metrics'), id: z.string().max(40), on: z.boolean() }),
  z.object({
    t: z.literal('notify'),
    title: short,
    body: text.optional(),
    sound: z.boolean().optional(),
  }),
  z.object({
    t: z.literal('options'),
    key: z.string().regex(SETTING_KEY),
    options: capped(SelectOptionSchema, 100),
  }),
  z.object({ t: z.literal('log'), level: z.enum(['log', 'error']), text }),
  z.object({ t: z.literal('error'), pane: pane.nullable(), message: text, fatal: z.boolean() }),
  z.object({ t: z.literal('pong'), n: z.int() }),
  z.object({ t: z.literal('signin-close') }),
])
export type WorkerMessage = z.infer<typeof WorkerMessageSchema>

/** What the host posts to a plugin worker (see plugin-runtime.ts). */
export type HostMessage =
  | { t: 'probe' }
  | {
      t: 'start'
      settings: Record<string, SettingValue>
      locale: string
      storage: Record<string, unknown>
      service: boolean
    }
  | {
      t: 'mount'
      pane: string
      size: { w: number; h: number }
      visible: boolean
      state: unknown
    }
  | { t: 'unmount'; pane: string }
  | { t: 'size'; pane: string; size: { w: number; h: number } }
  | { t: 'visible'; pane: string; visible: boolean }
  | { t: 'settings'; settings: Record<string, SettingValue> }
  | { t: 'action'; pane: string; action: string; item?: string }
  | { t: 'metric'; id: string; value: unknown }
  | {
      t: 'fetched'
      id: number
      response?: { status: number; headers: Record<string, string>; body: string }
      error?: string
    }
  | { t: 'session' }
  | { t: 'ping'; n: number }
  | { t: 'stop' }

/*
 * Network.
 */

/** Request headers a plugin may set. Everything else (cookies, origin, host) is the host's. */
export function pluginHeaders(
  raw: Readonly<Record<string, string>> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, value] of Object.entries(raw ?? {})) {
    const lower = name.toLowerCase()
    const allowed =
      lower === 'accept' ||
      lower === 'accept-language' ||
      lower === 'authorization' ||
      /^x-[a-z0-9-]{1,60}$/.test(lower)
    if (allowed && !/[\r\n]/.test(value)) out[lower] = value
  }
  return out
}

/**
 * Whether a URL may be fetched for a plugin: https, no port or credentials, on a granted
 * host. Returns the parsed URL, or why not.
 */
export function checkPluginUrl(
  raw: string,
  granted: readonly string[],
): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, error: 'not a URL' }
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'only https URLs can be fetched' }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, error: 'credentials in URLs are not allowed' }
  }
  if (url.port !== '' || !granted.includes(url.hostname)) {
    return { ok: false, error: `${url.host} is not among the plugin's granted hosts` }
  }
  return { ok: true, url }
}

/**
 * Test runs only: ELECDEX_PLUGIN_HOST_MAP="api.example.test=127.0.0.1:8123,..." sends https
 * requests for a named host to a local http stub, so the grant checks run unchanged.
 */
export function parseHostMap(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>()
  for (const pair of (raw ?? '').split(',')) {
    const [host, target] = pair.split('=')
    if (host && target && isPluginHost(host) && /^127\.0\.0\.1:\d{1,5}$/.test(target)) {
      map.set(host, target)
    }
  }
  return map
}

/** A token bucket: `take` answers whether one more request fits now. */
export class TokenBucket {
  private tokens: number
  private last: number
  private readonly capacity: number
  private readonly perMs: number

  constructor(capacity: number, perMinute: number, now: number) {
    this.capacity = capacity
    this.tokens = capacity
    this.perMs = perMinute / 60_000
    this.last = now
  }

  take(now: number): boolean {
    this.tokens = Math.min(this.capacity, this.tokens + Math.max(0, now - this.last) * this.perMs)
    this.last = now
    if (this.tokens < 1) return false
    this.tokens -= 1
    return true
  }
}
