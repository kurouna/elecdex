import { billingMonthKey, CE_DEFAULT_CAP, GMD_CAPS, GMD_DEFAULT_CAP } from '@shared/aws/billing'
import { z } from 'zod'
import type { CostExplorerSettings } from './probes.js'

/**
 * What AWS STATUS keeps per account in `aws-billing.json` (aws.md §3.3, §5.6): the answer to
 * Cost Explorer's question with its frequency and monthly cap, this UTC month's paid requests,
 * the last answer it gave, and the cost QUOTA with the steps already said this month. Shared by
 * every pane on the account; main is its only writer.
 *
 * RESOURCES added (aws.md §14.4, §14.4a): GetMetricData's setting (ON unless turned off, user
 * decision 2026-11-08), its monthly cap in metrics and this month's count, and the metered-tiny
 * calls' count this month. An older file has neither and reads with the defaults.
 */

const freshGmd = (month: string) => ({
  on: true,
  cap: GMD_DEFAULT_CAP,
  month,
  used: 0,
  capReached: false,
  readAt: null,
})

const GmdSchema = z.object({
  on: z.boolean(),
  cap: z.number().refine((n) => (GMD_CAPS as readonly number[]).includes(n)),
  month: z.string(),
  used: z.number().int().min(0),
  capReached: z.boolean(),
  readAt: z.number().nullable(),
})

const AccountSchema = z.object({
  ce: z.object({
    state: z.enum(['unasked', 'on', 'off', 'later', 'refused']),
    every: z.enum(['manual', 'day', '12h']),
    cap: z.number().int().min(1).max(1000),
    answeredAt: z.number().nullable(),
    month: z.string(),
    used: z.number().int().min(0),
    lastReadAt: z.number().nullable(),
    failedAt: z.number().nullable().default(null),
    refusedWhy: z.string().nullable(),
    services: z.array(z.object({ name: z.string(), usd: z.number() })).nullable(),
    forecast: z.number().nullable(),
  }),
  quota: z.object({
    usd: z.number().min(0),
    steps: z.enum(['80-100', '100']),
    month: z.string(),
    said: z.array(z.number()),
  }),
  gmd: GmdSchema.default(freshGmd('')),
  /** Metered-tiny requests this UTC month, by probe. */
  tiny: z
    .object({ month: z.string(), used: z.record(z.string(), z.number()) })
    .default({ month: '', used: {} }),
})
export type AccountBilling = z.infer<typeof AccountSchema>

export const BillingFileSchema = z.record(z.string(), AccountSchema)
export type BillingFile = z.infer<typeof BillingFileSchema>

export const freshAccount = (now: number): AccountBilling => ({
  ce: {
    state: 'unasked',
    every: 'day',
    cap: CE_DEFAULT_CAP,
    answeredAt: null,
    month: billingMonthKey(now),
    used: 0,
    lastReadAt: null,
    failedAt: null,
    refusedWhy: null,
    services: null,
    forecast: null,
  },
  quota: { usd: 0, steps: '80-100', month: billingMonthKey(now), said: [] },
  gmd: freshGmd(billingMonthKey(now)),
  tiny: { month: billingMonthKey(now), used: {} },
})

/** The account brought to this UTC month: the paid counts and the said steps start again. */
export function rolled(account: AccountBilling, now: number): AccountBilling {
  const month = billingMonthKey(now)
  return {
    ce: account.ce.month === month ? account.ce : { ...account.ce, month, used: 0 },
    quota: account.quota.month === month ? account.quota : { ...account.quota, month, said: [] },
    gmd:
      account.gmd.month === month
        ? account.gmd
        : { ...account.gmd, month, used: 0, capReached: false },
    tiny: account.tiny.month === month ? account.tiny : { month, used: {} },
  }
}

export interface BillingStore {
  get(account: string): AccountBilling
  update(account: string, change: (current: AccountBilling) => AccountBilling): AccountBilling
}

export function billingStore(
  file: { load(): BillingFile; save(value: BillingFile): void },
  now: () => number,
): BillingStore {
  let all: BillingFile | null = null
  const load = () => {
    all ??= file.load()
    return all
  }
  return {
    get: (account) => rolled(load()[account] ?? freshAccount(now()), now()),
    update: (account, change) => {
      const data = load()
      const next = change(rolled(data[account] ?? freshAccount(now()), now()))
      data[account] = next
      file.save(data)
      return next
    },
  }
}

/** What the probe needs of it. */
export const ceSettings = (account: AccountBilling): CostExplorerSettings => ({
  state: account.ce.state,
  every: account.ce.every,
  cap: account.ce.cap,
  used: account.ce.used,
  lastReadAt: account.ce.lastReadAt,
  failedAt: account.ce.failedAt,
})

const DAY = 86_400_000

/**
 * Whether Cost Explorer's question shows for this account (aws.md §3.3): never answered; or
 * LATER, once elecdex has started again since, and at most once a day.
 */
export function asksNow(account: AccountBilling, startedAt: number, now: number): boolean {
  if (account.ce.state === 'unasked') return true
  if (account.ce.state !== 'later' || account.ce.answeredAt === null) return false
  return startedAt > account.ce.answeredAt && now - account.ce.answeredAt >= DAY
}
