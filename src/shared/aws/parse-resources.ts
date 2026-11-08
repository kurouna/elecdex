import { z } from 'zod'

/**
 * What RESOURCES' probes read (aws.md §14.4, §14.4b), in the shape each `--query` gives and the
 * shape main keeps per account in `aws-inventory.json`. The same schema checks an answer as it
 * comes and a value read back from the disk, so a file edited by hand or left by an older
 * elecdex is a reading not taken, never a crash. Only what the `--query` kept is here: names,
 * ids, states, sizes, dates and counts - never a queue's URL, an SNS endpoint, a tag but Name,
 * a policy or a prompt (aws.md §14.6).
 */

const str = z.string().nullable().optional()
const num = z.number().nullable().optional()
const bool = z.boolean().nullable().optional()
/** A time as AWS CLI prints it: ISO text, or epoch seconds or milliseconds. */
const time = z.union([z.string(), z.number()]).nullable().optional()
const strings = z.array(z.string()).nullable().optional()

/** `s3api list-buckets --query Buckets[].[Name,CreationDate,BucketRegion]`. */
export const BucketListSchema = z.array(z.tuple([z.string(), time, str]))
export type BucketList = z.infer<typeof BucketListSchema>

/** `logs describe-log-groups --query logGroups[].[logGroupName,creationTime,retentionInDays,storedBytes,logGroupClass]`. */
export const LogGroupsSchema = z.array(z.tuple([z.string(), num, num, num, str]))
export type LogGroupRow = z.infer<typeof LogGroupsSchema>[number]

export const DdbTableSchema = z.object({
  n: z.string(),
  s: str,
  c: time,
  b: num,
  i: num,
  m: str,
  r: num,
  w: num,
  k: str,
})
export const DdbSchema = z.object({
  /** Every table listed; `tables` the ones described (fifty at most). */
  names: z.array(z.string()),
  tables: z.array(DdbTableSchema),
})
export type DdbReading = z.infer<typeof DdbSchema>

export const EcsClustersSchema = z.array(
  z.object({ n: z.string(), s: str, svc: num, run: num, pend: num }),
)
export const EcsServicesSchema = z.array(
  z.object({ n: z.string(), d: num, r: num, l: str, c: time }),
)
export const EcsSchema = z.object({
  clusters: EcsClustersSchema,
  services: z.array(z.object({ cl: z.string(), n: z.string(), d: num, r: num, l: str, c: time })),
})
export type EcsReading = z.infer<typeof EcsSchema>

export const EksNodesSchema = z.array(
  z.object({ cluster: z.string(), nodegroups: strings, fargate: strings }),
)
export type EksNodesReading = z.infer<typeof EksNodesSchema>

export const TargetGroupsSchema = z.array(
  z.object({ n: z.string(), arn: z.string(), lbs: strings }),
)
export const ClassicSchema = z.array(z.object({ n: z.string(), c: time, i: num, s: str }))
export const ElbTargetsSchema = z.object({
  /** Target groups: their name, the load balancers' ARN suffixes ("app/web/50dc…"), the count. */
  groups: z.array(z.object({ n: z.string(), lbs: z.array(z.string()), targets: num })),
  classic: ClassicSchema,
})
export type ElbTargetsReading = z.infer<typeof ElbTargetsSchema>

export const QueueAttributesSchema = z.object({ m: str, c: str, r: str })
export const SqsSchema = z.array(
  z.object({
    /** The queue's name only: its URL carries the account id and stays in main's call. */
    n: z.string(),
    m: num,
    c: num,
    /** The name of the queue its redrive policy sends to, when it has one. */
    dlq: str,
  }),
)
export type SqsReading = z.infer<typeof SqsSchema>

export const SnsSchema = z.object({
  topics: z.array(z.string()),
  /** Subscriptions per topic name: counted, never their endpoints (aws.md §14.4). */
  subs: z.record(z.string(), z.number()),
})
export type SnsReading = z.infer<typeof SnsSchema>

export const RestApisSchema = z.array(z.object({ id: z.string(), n: str, c: time }))
export const ApisV2Schema = z.array(z.object({ id: z.string(), n: str, p: str, c: time }))
export const ApisSchema = z.object({ rest: RestApisSchema, v2: ApisV2Schema })
export type ApisReading = z.infer<typeof ApisSchema>

/** `cloudfront list-distributions --query DistributionList.Items[].[Id,Enabled,Status,LastModifiedTime,Aliases.Items[0]]`. */
export const DistributionsSchema = z.array(z.tuple([z.string(), bool, str, time, str]))
export type DistributionRow = z.infer<typeof DistributionsSchema>[number]

export const PtSchema = z.array(
  z.object({
    n: str,
    a: z.string(),
    m: str,
    f: str,
    s: str,
    u: num,
    d: str,
    e: time,
    c: time,
  }),
)
export const BedrockSchema = z.object({
  offered: z.boolean(),
  /** Provisioned Throughput: its id (the ARN's last part), the model it serves and its base. */
  pts: z.array(
    z.object({
      id: z.string(),
      n: str,
      m: str,
      f: str,
      s: str,
      u: num,
      d: str,
      e: time,
      c: time,
    }),
  ),
  custom: z.array(z.object({ id: z.string(), n: z.string(), b: str, c: time })),
  imported: z.array(z.object({ id: z.string(), n: z.string(), c: time })),
  guardrails: z.array(z.object({ id: z.string(), n: str, s: str, c: time })),
  agents: z.array(z.object({ id: z.string(), n: str, s: str, u: time })),
  kbs: z.array(z.object({ id: z.string(), n: str, s: str, u: time, store: str, collection: str })),
  runtimes: z.array(z.object({ id: z.string(), n: str, s: str, u: time })),
  /** Application inference profiles: their id and the model ids they route to. */
  profiles: z.array(z.object({ id: z.string(), n: str, s: str, m: z.array(z.string()) })),
})
export type BedrockReading = z.infer<typeof BedrockSchema>

/** Display names: foundation models and the system inference profiles, by id. */
export const BedrockNamesSchema = z.object({
  models: z.record(z.string(), z.string()),
  profiles: z.record(z.string(), z.string()),
})
export type BedrockNames = z.infer<typeof BedrockNamesSchema>

export const AossSchema = z.object({
  offered: z.boolean(),
  collections: z.array(
    z.object({ id: z.string(), n: z.string(), t: str, s: str, c: time, k: str }),
  ),
})
export type AossReading = z.infer<typeof AossSchema>

export const VpceSchema = z.array(
  z.object({ id: z.string(), svc: str, s: str, azs: num, c: time, vpc: str, name: str }),
)
export type VpceRow = z.infer<typeof VpceSchema>[number]

export const TgwSchema = z.array(z.object({ id: z.string(), tgw: str, t: str, s: str, c: time }))

export const VpnSchema = z.array(
  z.object({
    id: z.string(),
    s: str,
    st: strings,
    ch: z.array(time).nullable().optional(),
    name: str,
  }),
)

export const SagemakerSchema = z.object({
  endpoints: z.array(z.object({ n: z.string(), s: str, c: time, m: time })),
  notebooks: z.array(z.object({ n: z.string(), s: str, t: str, c: time, m: time })),
  apps: z.array(
    z.object({ d: str, u: str, sp: str, t: str, n: z.string(), s: str, c: time, it: str }),
  ),
})
export type SagemakerReading = z.infer<typeof SagemakerSchema>

export const ImagesSchema = z.object({
  snapshots: z.array(z.object({ id: z.string(), v: str, g: num, c: time, t: str })),
  images: z.array(
    z.object({
      id: z.string(),
      n: str,
      c: time,
      l: time,
      s: z.array(z.string().nullable()).nullable().optional(),
      st: str,
    }),
  ),
})
export type ImagesReading = z.infer<typeof ImagesSchema>

export const EcrSchema = z.array(
  z.object({
    n: z.string(),
    c: time,
    /** The images' bytes, the last push and pull, and how many: from describe-images. */
    b: num,
    p: time,
    l: time,
    k: num,
  }),
)

export const CachesSchema = z.object({
  clusters: z.array(z.object({ id: z.string(), t: str, e: str, s: str, n: num, c: time, g: str })),
  serverless: z.array(z.object({ n: z.string(), e: str, s: str, c: time })),
})
export type CachesReading = z.infer<typeof CachesSchema>

export const OsDomainsSchema = z.array(
  z.object({ n: z.string(), t: str, k: num, e: str, d: bool, cr: bool }),
)

export const RedshiftSchema = z.object({
  clusters: z.array(z.object({ id: z.string(), t: str, n: num, s: str, c: time })),
  workgroups: z.array(z.object({ n: z.string(), s: str, b: num, c: time })),
})
export type RedshiftReading = z.infer<typeof RedshiftSchema>

export const KinesisSchema = z.array(z.object({ n: z.string(), s: str, m: str, c: time, sh: num }))

export const TransferSchema = z.array(z.object({ id: z.string(), s: str, e: str, u: num }))

export const KmsSchema = z.array(
  z.object({ id: z.string(), m: str, s: str, c: time, d: time, sp: str }),
)

export const ZonesSchema = z.array(z.object({ id: z.string(), n: str, c: num, p: bool }))

export const VpcsSchema = z.array(z.object({ id: z.string(), d: bool }))

/** Every alarm, every state: its name, state and first dimension (for "watches what is gone"). */
export const AlarmsAllSchema = z.array(z.object({ n: z.string(), s: str, ns: str, d: str, v: str }))

export const RegionListSchema = z.array(z.string())

/** One region outside the pane's, from the weekly sweep (describe only, aws.md §14.2 D). */
export const SweepRegionSchema = z.object({
  instances: z.array(z.object({ id: z.string(), type: z.string(), s: z.string(), l: time })),
  volumes: z.array(z.object({ id: z.string(), g: z.number(), t: str, s: z.string() })),
  nats: z.array(z.object({ id: z.string(), s: z.string() })),
  addresses: z.array(z.object({ id: z.string(), assoc: z.boolean() })),
})
export type SweepRegion = z.infer<typeof SweepRegionSchema>

export const DimensionsSchema = z.array(z.array(z.object({ Name: z.string(), Value: z.string() })))
export type Dimensions = z.infer<typeof DimensionsSchema>

/** What list-metrics found per "namespace metric": the metrics with data in the last 14 days. */
export const PresenceSchema = z.record(z.string(), DimensionsSchema)
export type Presence = z.infer<typeof PresenceSchema>

/** Daily values read for one series (oldest first), over `d` days, by GetMetricData or a statistic. */
export const SeriesSchema = z.object({
  v: z.array(z.number()),
  d: z.number(),
  via: z.enum(['gmd', 'stat']),
})
export type Series = z.infer<typeof SeriesSchema>
export const UsageSchema = z.record(z.string(), SeriesSchema)
export type Usage = z.infer<typeof UsageSchema>

/** `cloudwatch get-metric-data --query MetricDataResults[].{id:Id,t:Timestamps,v:Values}`. */
export const MetricDataSchema = z.array(
  z.object({
    id: z.string(),
    t: z.array(z.string()).nullable().optional(),
    v: z.array(z.number()).nullable().optional(),
  }),
)

/** The last part of an ARN or a URL: the resource's own name, without the account (aws.md §14.6). */
export function lastPart(raw: string): string {
  const cut = raw.replace(/\/+$/, '')
  const slash = cut.lastIndexOf('/')
  const colon = cut.lastIndexOf(':')
  return cut.slice(Math.max(slash, colon) + 1)
}

/** A foundation model's id from its ARN (`arn:aws:bedrock:…::foundation-model/anthropic.claude…`). */
export function modelIdOf(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === '') return null
  const match =
    /(?:foundation-model|inference-profile|custom-model|imported-model|provisioned-model)\/(.+)$/.exec(
      raw,
    )
  return match?.[1] ?? (raw.startsWith('arn:') ? lastPart(raw) : raw)
}
