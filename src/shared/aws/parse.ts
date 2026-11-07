import { z } from 'zod'

/**
 * What each AWS STATUS probe reads, in the shape its `--query` gives (src/main/aws/probes.ts), and
 * the parsers that take nothing else. AWS CLI prints its times in the local zone with an offset
 * ("2026-11-04T09:00:00+09:00"): `Date.parse` reads both forms.
 */

export function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** A time as milliseconds, or null. */
export const ms = (raw: string | number | null | undefined): number | null => {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return raw > 1e12 ? raw : raw * 1000
  const at = Date.parse(raw)
  return Number.isFinite(at) ? at : null
}

const str = z.string().nullable().optional()
const num = z.number().nullable().optional()
const bool = z.boolean().nullable().optional()

/** Parses `text` with `schema`, or null. */
export function parseWith<T>(schema: z.ZodType<T>, text: string): T | null {
  const parsed = schema.safeParse(safeJson(text))
  return parsed.success ? parsed.data : null
}

export const IdentitySchema = z.object({ account: z.string(), arn: z.string() })
export type Identity = z.infer<typeof IdentitySchema>

export const SummarySchema = z.object({ mfa: num, keys: num, users: num, roles: num })
export type Summary = z.infer<typeof SummarySchema>

export const PointsSchema = z.array(z.tuple([z.string(), z.number()]))

export const BillingMetricsSchema = z.array(
  z.array(z.object({ Name: z.string(), Value: z.string() })),
)

export const BudgetsSchema = z.array(
  z.object({ n: z.string(), limit: str, actual: str, forecast: str }),
)

export const PlanStateSchema = z.object({
  accountPlanType: str,
  accountPlanStatus: str,
  accountPlanRemainingCredits: z.object({ amount: num }).nullable().optional(),
  accountPlanExpirationDate: z.union([z.string(), z.number()]).nullable().optional(),
})

export const FreeTierSchema = z.array(z.object({ s: str, u: str, a: num, l: num }))

export const DomainsSchema = z.array(
  z.object({
    n: z.string(),
    auto: bool,
    exp: z.union([z.string(), z.number()]).nullable().optional(),
  }),
)

export const SavingsSchema = z.array(z.object({ id: z.string(), end: str, type: str }))

export const AlarmsSchema = z.object({
  m: z.array(z.object({ n: z.string(), s: str, ns: str, metric: str, dim: str })).nullable(),
  c: z.array(z.object({ n: z.string(), s: str })).nullable(),
})

export const IdsSchema = z.array(z.string())

export const StacksSchema = z.array(
  z.object({ n: z.string(), s: z.string(), t: str, d: str, why: str }),
)

export const TrailSchema = z.array(
  z.object({
    id: z.string(),
    t: z.union([z.string(), z.number()]),
    n: z.string(),
    s: str,
    u: str,
    e: str,
  }),
)

/** The few fields kept from a CloudTrail event's own JSON (aws.md §4.2); the rest is dropped. */
export const TrailInnerSchema = z.object({
  userIdentity: z
    .object({ type: str, userName: str, sessionContext: z.unknown().optional() })
    .nullable()
    .optional(),
  awsRegion: str,
  errorCode: str,
  responseElements: z.object({ ConsoleLogin: str }).passthrough().nullable().optional(),
  additionalEventData: z.object({ MFAUsed: str }).passthrough().nullable().optional(),
})

export const InstancesSchema = z.array(
  z.object({
    id: z.string(),
    type: z.string(),
    state: z.string(),
    launch: str,
    az: str,
    life: str,
    name: str,
    platform: str,
    reason: str,
    vols: z.array(z.string()).nullable().optional(),
    sgs: z.array(z.string()).nullable().optional(),
    vpc: str,
    subnet: str,
    ip: str,
    pub: str,
    imds: str,
  }),
)
export type Instance = z.infer<typeof InstancesSchema>[number]

export const VolumesSchema = z.array(
  z.object({
    id: z.string(),
    size: z.number(),
    type: z.string(),
    state: z.string(),
    iops: num,
    at: str,
    created: str,
    name: str,
  }),
)
export type Volume = z.infer<typeof VolumesSchema>[number]

export const AddressesSchema = z.array(
  z.object({ ip: z.string(), alloc: str, assoc: str, inst: str, eni: str, domain: str }),
)
export type Address = z.infer<typeof AddressesSchema>[number]

export const NatsSchema = z.array(
  z.object({ id: z.string(), state: z.string(), vpc: str, conn: str, name: str }),
)

export const BalancersSchema = z.array(
  z.object({ arn: z.string(), name: z.string(), type: str, scheme: str, state: str, created: str }),
)

export const OpenGroupsSchema = z.array(
  z.object({
    id: z.string(),
    name: str,
    perms: z.array(z.object({ p: str, f: num, t: num })).nullable(),
  }),
)

export const DbInstancesSchema = z.array(
  z.object({
    id: z.string(),
    engine: z.string(),
    version: str,
    class: z.string(),
    state: z.string(),
    multi: bool,
    storage: num,
    support: str,
    created: str,
  }),
)
export type DbInstance = z.infer<typeof DbInstancesSchema>[number]

export const FunctionsSchema = z.array(z.object({ n: z.string(), r: str, m: num, t: str }))

export const ClusterSchema = z.object({
  v: str,
  s: str,
  p: str,
  c: z.union([z.string(), z.number()]).nullable().optional(),
})
export const ClusterVersionsSchema = z.array(
  z.object({
    v: z.string(),
    end: z.union([z.string(), z.number()]).nullable().optional(),
    ext: z.union([z.string(), z.number()]).nullable().optional(),
    s: str,
  }),
)

export const CertificatesSchema = z.array(
  z.object({
    arn: z.string(),
    d: str,
    t: str,
    exp: z.union([z.string(), z.number()]).nullable().optional(),
    use: bool,
    k: str,
    s: str,
  }),
)

export const BackupJobsSchema = z.array(
  z.object({
    id: z.string(),
    r: str,
    t: z.union([z.string(), z.number()]).nullable().optional(),
    type: str,
  }),
)

export const StatPointsSchema = z.array(z.object({ t: z.string(), avg: num, max: num }))

export const SeveritySchema = z.array(z.object({ s: z.number(), c: z.number() }))

export const ReservedSchema = z.array(z.object({ id: z.string(), end: str, type: str, n: num }))

export const CostServicesSchema = z.object({
  ResultsByTime: z.array(
    z.object({
      Groups: z
        .array(
          z.object({
            Keys: z.array(z.string()),
            Metrics: z.record(z.string(), z.object({ Amount: z.string() })),
          }),
        )
        .optional(),
    }),
  ),
})

export const ForecastSchema = z.object({ Total: z.object({ Amount: z.string() }).optional() })

/**
 * The credential report's CSV (base64 in `Content`), reduced to what ACCOUNT shows: per user,
 * whether it signs in with a password and MFA, and its active keys' ages. The root row says
 * whether the root has MFA, keys, and when it last signed in.
 */
export interface CredentialRow {
  user: string
  password: boolean
  mfa: boolean
  keys: { active: boolean; rotated: number | null }[]
  passwordUsed: number | null
}

export function parseCredentialReport(csv: string): CredentialRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '')
  const head = (lines[0] ?? '').split(',')
  const at = (name: string) => head.indexOf(name)
  const col = {
    user: at('user'),
    password: at('password_enabled'),
    used: at('password_last_used'),
    mfa: at('mfa_active'),
    k1: at('access_key_1_active'),
    r1: at('access_key_1_last_rotated'),
    k2: at('access_key_2_active'),
    r2: at('access_key_2_last_rotated'),
  }
  if (col.user < 0 || col.mfa < 0) return []
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const cell = (i: number) => (i < 0 ? '' : (cells[i] ?? ''))
    return {
      user: cell(col.user),
      password: cell(col.password) === 'true',
      mfa: cell(col.mfa) === 'true',
      keys: [
        { active: cell(col.k1) === 'true', rotated: ms(cell(col.r1)) },
        { active: cell(col.k2) === 'true', rotated: ms(cell(col.r2)) },
      ],
      passwordUsed: ms(cell(col.used)),
    }
  })
}
