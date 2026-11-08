import { GMD_CAPS } from '@shared/aws/billing'
import { memoryAfter } from '@shared/aws/inventory'
import type { Usage } from '@shared/aws/parse-resources'
import type { AwsReadings, PerRegion } from '@shared/aws/readings'
import { emptyResourceReadings, type ResourceReadings } from '@shared/aws/resource-readings'
import type { ForgottenRow } from '@shared/aws/types'
import type { z } from 'zod'
import type { BillingStore } from './billing-store.js'
import type { InventoryStore } from './inventory-store.js'
import { GLOBAL_KEY, type SharedReads, STORED } from './resource-probes.js'

/**
 * RESOURCES' side of main per account (aws.md §14.4): the readings every board of the account
 * shares (one board reads, the others take its answer), the readings put back together for a
 * board's regions, main's memory kept after each, KEEP, the sweep's switch and GetMetricData's
 * setting and cap. The boards come and go; this stays for the run.
 */

type StoredId = keyof typeof STORED
type StoredValue<K extends StoredId> = z.infer<(typeof STORED)[K]>

export class ResourceAccounts {
  readonly #inventory: InventoryStore
  readonly #billing: BillingStore
  readonly #now: () => number
  /** `account|probe|region` readings under way. */
  readonly #reading = new Set<string>()
  /**
   * Each account's changes counted, and the readings put together at a count: a board is built
   * after every probe, and putting the readings back checks every kept value against its schema.
   */
  readonly #version = new Map<string, number>()
  readonly #memo = new Map<string, { version: number; value: ResourceReadings }>()

  #bump(account: string): void {
    this.#version.set(account, (this.#version.get(account) ?? 0) + 1)
  }

  constructor(deps: { inventory: InventoryStore; billing: BillingStore; now: () => number }) {
    this.#inventory = deps.inventory
    this.#billing = deps.billing
    this.#now = deps.now
  }

  /** The per-account readings a board's probes go through. */
  shared(account: string, changed: () => void): SharedReads {
    const inventory = this.#inventory
    const billing = this.#billing
    const now = this.#now
    const claimKey = (probe: string, region: string) => `${account}|${probe}|${region}`
    return {
      get: (probe, region, schema) => inventory.read(account, probe, region, schema),
      claim: (probe, region) => {
        const key = claimKey(probe, region)
        if (this.#reading.has(key)) return false
        this.#reading.add(key)
        return true
      },
      put: (probe, region, value) => {
        inventory.write(account, probe, region, value, now())
        this.#bump(account)
        changed()
      },
      release: (probe, region) => {
        this.#reading.delete(claimKey(probe, region))
      },
      sweep: () => {
        const entry = inventory.get(account)
        return { on: entry.sweepOn, asked: entry.sweepAsked }
      },
      gmdAvailable: () => {
        const gmd = billing.get(account).gmd
        return gmd.on && !gmd.capReached && gmd.used < gmd.cap
      },
      gmdAllows: (n) => {
        const gmd = billing.get(account).gmd
        return gmd.on && gmd.used + n <= gmd.cap
      },
      gmdSpent: (n) => {
        this.#bump(account)
        billing.update(account, (current) => ({
          ...current,
          gmd: { ...current.gmd, used: current.gmd.used + n, readAt: now() },
        }))
      },
      gmdCapReached: () => {
        this.#bump(account)
        billing.update(account, (current) => ({
          ...current,
          gmd: { ...current.gmd, capReached: true },
        }))
      },
      tiny: (probe, cap) => {
        const used = billing.get(account).tiny.used[probe] ?? 0
        if (used >= cap) return false
        billing.update(account, (current) => ({
          ...current,
          tiny: { ...current.tiny, used: { ...current.tiny.used, [probe]: used + 1 } },
        }))
        return true
      },
    }
  }

  #value<K extends StoredId>(account: string, probe: K, region: string): StoredValue<K> | null {
    return (
      this.#inventory.read(
        account,
        probe,
        region,
        STORED[probe] as unknown as z.ZodType<StoredValue<K>>,
      )?.value ?? null
    )
  }

  #perRegion<K extends StoredId>(
    account: string,
    probe: K,
    regions: readonly string[],
  ): PerRegion<StoredValue<K>> {
    return Object.fromEntries(
      regions.map((region) => [region, this.#value(account, probe, region)]),
    )
  }

  /** Every region a probe has a reading kept for (Bedrock's use, the sweep). */
  #keptRegions(account: string, probe: StoredId): string[] {
    return Object.keys(this.#inventory.get(account).reads[probe] ?? {})
  }

  /** The usage series of a region: GetMetricData's and the statistics', the newer one winning. */
  #usage(account: string, region: string): Usage | null {
    const gmd = this.#inventory.read(account, 'res-gmd', region, STORED['res-gmd'])
    const stat = this.#inventory.read(account, 'res-lastuse', region, STORED['res-lastuse'])
    if (gmd === null && stat === null) return null
    const [older, newer] = (gmd?.at ?? 0) >= (stat?.at ?? 0) ? [stat, gmd] : [gmd, stat]
    return { ...(older?.value ?? {}), ...(newer?.value ?? {}) }
  }

  /** A board's RESOURCES readings, from the account's store (aws.md §14.4). */
  readings(account: string | null, regions: readonly string[], judging: boolean): ResourceReadings {
    if (account === null) return emptyResourceReadings()
    const key = `${account}|${regions.join(',')}|${judging}`
    const version = this.#version.get(account) ?? 0
    const kept = this.#memo.get(key)
    if (kept?.version === version) return kept.value
    const value = this.#build(account, regions, judging)
    this.#memo.set(key, { version, value })
    return value
  }

  #build(account: string, regions: readonly string[], judging: boolean): ResourceReadings {
    const empty = emptyResourceReadings()
    const per = <K extends StoredId>(probe: K) => this.#perRegion(account, probe, regions)
    const bedrock = per('res-bedrock')
    const pts = per('res-bedrock-pt')
    for (const region of regions) {
      const placed = bedrock[region]
      const hourly = pts[region]
      // The hourly PT list is the newer word on what bills by the hour.
      if (placed && hourly) bedrock[region] = { ...placed, pts: hourly }
    }
    const useRegions = this.#keptRegions(account, 'res-bedrockuse')
    const sweepRegions = this.#keptRegions(account, 'res-sweep').filter((r) => !regions.includes(r))
    const stored = this.#inventory.get(account)
    const gmd = this.#billing.get(account).gmd
    return {
      ...empty,
      buckets: this.#value(account, 'res-buckets', GLOBAL_KEY),
      logGroups: per('res-logs'),
      ddb: per('res-ddb'),
      ecs: per('res-ecs'),
      eksNodes: per('res-eks'),
      elbTargets: per('res-elb'),
      sqs: per('res-sqs'),
      sns: per('res-sns'),
      apis: per('res-apis'),
      distributions: this.#value(account, 'res-cloudfront', GLOBAL_KEY),
      bedrock,
      bedrockNames: this.#value(account, 'res-bedrock-names', GLOBAL_KEY),
      aoss: per('res-aoss'),
      vpce: per('res-vpce'),
      tgw: per('res-tgw'),
      vpn: per('res-vpn'),
      sagemaker: per('res-sagemaker'),
      images: per('res-images'),
      ecr: per('res-ecr'),
      caches: per('res-caches'),
      osDomains: per('res-osdomains'),
      redshift: per('res-redshift'),
      kinesis: per('res-kinesis'),
      transfer: per('res-transfer'),
      kms: per('res-kms'),
      zones: this.#value(account, 'res-zones', GLOBAL_KEY),
      vpcs: per('res-vpcs'),
      alarmsAll: per('res-alarms'),
      presence: per('res-quiet'),
      cloudfrontPresence: this.#value(account, 'res-cf-quiet', GLOBAL_KEY),
      bedrockUse: this.#perRegion(account, 'res-bedrockuse', useRegions),
      usage: Object.fromEntries(
        [...new Set([...regions, ...useRegions])].map((r) => [r, this.#usage(account, r)]),
      ),
      sweep: stored.sweepOn ? this.#perRegion(account, 'res-sweep', sweepRegions) : {},
      sweepAt:
        Math.max(0, ...sweepRegions.map((r) => stored.reads['res-sweep']?.[r]?.at ?? 0)) || null,
      sweepOn: stored.sweepOn,
      memory: stored.memory,
      gmd: {
        on: gmd.on,
        cap: gmd.cap,
        used: gmd.used,
        capReached: gmd.capReached,
        readAt: gmd.readAt,
      },
      judging,
    }
  }

  /**
   * Main's memory after a reading (first seen, gone, unattached since, sizes, last listings),
   * and the KEEP marks whose amount more than doubled taken off (aws.md §14.3).
   */
  remember(account: string, r: AwsReadings, released: readonly string[]): void {
    const next = memoryAfter(r, r.res.memory)
    for (const key of released) delete next.keep[key]
    if (JSON.stringify(next) === JSON.stringify(r.res.memory)) return
    this.#inventory.update(account, (current) => ({ ...current, memory: next }))
    this.#bump(account)
  }

  /**
   * KEEP (aws.md §14.3): marks a row of the board's last forgotten list as meant to stay, with
   * the day and its ≈ $ then; takes a mark off by its key. Anything else is refused.
   */
  keep(account: string, key: string, on: boolean, rows: readonly ForgottenRow[]): boolean {
    this.#bump(account)
    const memory = this.#inventory.get(account).memory
    if (!on) {
      if (memory.keep[key] === undefined) return false
      this.#inventory.update(account, (current) => {
        const keep = { ...current.memory.keep }
        delete keep[key]
        return { ...current, memory: { ...current.memory, keep } }
      })
      return true
    }
    const row = rows.find((r) => r.key === key)
    if (row === undefined) return false
    this.#inventory.update(account, (current) => ({
      ...current,
      memory: {
        ...current.memory,
        keep: {
          ...current.memory.keep,
          [key]: { at: this.#now(), usd: row.monthly ?? 0, name: row.name },
        },
      },
    }))
    return true
  }

  /** The sweep: its switch, or a press that reads every other region again. */
  sweep(account: string, what: 'now' | 'on' | 'off'): void {
    this.#bump(account)
    this.#inventory.update(account, (current) =>
      what === 'now'
        ? { ...current, sweepOn: true, sweepAsked: this.#now() }
        : { ...current, sweepOn: what === 'on' },
    )
  }

  /** GetMetricData's setting for the account: ON or OFF, and a cap of those offered. */
  setMetricData(account: string, answer: unknown): boolean {
    if (typeof answer !== 'object' || answer === null) return false
    const { on, cap } = answer as Record<string, unknown>
    if (typeof on !== 'boolean') return false
    if (cap !== undefined && !(GMD_CAPS as readonly unknown[]).includes(cap)) return false
    this.#bump(account)
    this.#billing.update(account, (current) => ({
      ...current,
      gmd: {
        ...current.gmd,
        on,
        ...(cap === undefined ? {} : { cap: cap as number }),
        // A higher cap lets this month go on; the same or lower one keeps what was reached.
        capReached:
          cap !== undefined && (cap as number) > current.gmd.used ? false : current.gmd.capReached,
      },
    }))
    return true
  }

  flush(): void {
    this.#inventory.flush()
  }
}
