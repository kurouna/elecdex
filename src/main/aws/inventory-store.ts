import { emptyMemory, type InventoryMemory } from '@shared/aws/resource-readings'
import { z } from 'zod'

/**
 * What RESOURCES keeps per account in `aws-inventory.json` (aws.md §14.4): the daily and
 * six-hourly readings with their time, so two panes on one account and a restart read nothing
 * again before its period; and main's memory of the account (first seen, gone, unattached since,
 * the buckets' size history, the last listing of each metric, KEEP, the sweep's switch). Main is
 * its only writer; a reading is checked against its probe's schema when it is taken back.
 */

const MemorySchema = z.object({
  firstAt: z.record(z.string(), z.number()),
  seen: z.record(z.string(), z.number()),
  gone: z.record(z.string(), z.object({ at: z.number(), name: z.string() })),
  unattached: z.record(z.string(), z.number()),
  lastMetric: z.record(z.string(), z.number()),
  s3: z.record(z.string(), z.object({ bytes: z.number(), since: z.number() })),
  keep: z.record(z.string(), z.object({ at: z.number(), usd: z.number(), name: z.string() })),
})

const AccountSchema = z.object({
  reads: z.record(
    z.string(),
    z.record(z.string(), z.object({ at: z.number(), value: z.unknown() })),
  ),
  memory: MemorySchema,
  sweepOn: z.boolean(),
  /** A "check other regions now" press, read by the sweep once. */
  sweepAsked: z.number().nullable(),
})
export type AccountInventory = z.infer<typeof AccountSchema>

export const InventoryFileSchema = z.record(z.string(), AccountSchema)
export type InventoryFile = z.infer<typeof InventoryFileSchema>

const fresh = (): AccountInventory => ({
  reads: {},
  memory: emptyMemory(),
  sweepOn: true,
  sweepAsked: null,
})

export interface InventoryStore {
  /** A reading kept for the account, checked by `schema`; null when absent or not valid. */
  read<T>(
    account: string,
    probe: string,
    region: string,
    schema: z.ZodType<T>,
  ): { at: number; value: T } | null
  write(account: string, probe: string, region: string, value: unknown, at: number): void
  get(account: string): AccountInventory
  update(account: string, change: (current: AccountInventory) => AccountInventory): void
  /** Writes what waits (the store writes a little after a change, not per reading). */
  flush(): void
}

/**
 * A store on a cache file, written two seconds after the last change: a first reading makes a
 * few hundred changes, each would otherwise rewrite the file.
 */
export function inventoryStore(
  file: { load(): InventoryFile; save(value: InventoryFile): void },
  timers: { setTimer(fn: () => void, ms: number): unknown; clearTimer(handle: unknown): void },
): InventoryStore {
  let all: InventoryFile | null = null
  let pending: unknown = null
  const load = () => {
    all ??= file.load()
    return all
  }
  const flush = () => {
    if (pending !== null) timers.clearTimer(pending)
    pending = null
    if (all !== null) file.save(all)
  }
  const changed = () => {
    if (pending !== null) return
    pending = timers.setTimer(() => {
      pending = null
      if (all !== null) file.save(all)
    }, 2000)
  }
  const account = (id: string) => {
    const data = load()
    data[id] ??= fresh()
    return data[id]
  }
  return {
    read: (id, probe, region, schema) => {
      const kept = load()[id]?.reads[probe]?.[region]
      if (kept === undefined) return null
      const parsed = schema.safeParse(kept.value)
      return parsed.success ? { at: kept.at, value: parsed.data } : null
    },
    write: (id, probe, region, value, at) => {
      const entry = account(id)
      entry.reads[probe] = { ...entry.reads[probe], [region]: { at, value } }
      changed()
    },
    get: (id) => load()[id] ?? fresh(),
    update: (id, change) => {
      load()[id] = change(account(id))
      changed()
    },
    flush,
  }
}

/** An in-memory store, for tests and for a board before main has its file. */
export const memoryInventory = (): InventoryStore => {
  let data: InventoryFile = {}
  return inventoryStore(
    { load: () => data, save: (next) => (data = next) },
    {
      setTimer: (fn) => {
        fn()
        return null
      },
      clearTimer: () => {},
    },
  )
}

export type { InventoryMemory }
