import type { z } from 'zod'
import type {
  AlarmsAllSchema,
  AossReading,
  ApisReading,
  BedrockNames,
  BedrockReading,
  BucketList,
  CachesReading,
  DdbReading,
  DistributionRow,
  EcrSchema,
  EcsReading,
  EksNodesReading,
  ElbTargetsReading,
  ImagesReading,
  KinesisSchema,
  KmsSchema,
  LogGroupRow,
  OsDomainsSchema,
  Presence,
  RedshiftReading,
  SagemakerReading,
  SnsReading,
  SqsReading,
  SweepRegion,
  TgwSchema,
  TransferSchema,
  Usage,
  VpceRow,
  VpcsSchema,
  VpnSchema,
  ZonesSchema,
} from './parse-resources.js'

/**
 * What RESOURCES reads (aws.md §14), as the readings carry it: per region like the rest, a
 * region null until it answered. Main keeps these per account (`aws-inventory.json`), so two
 * panes on one account and a restart read nothing again before its period; and with them what
 * only main can remember from day to day (`InventoryMemory`).
 */

type PerRegion<T> = Record<string, T | null>

/** What main remembers of an account between readings (aws.md §14.2, §14.3). */
export interface InventoryMemory {
  /** When each kind was first read for the account: that day's resources are not "new". */
  firstAt: Record<string, number>
  /** Each resource's key (`kind:region:id`) and when main first saw it. */
  seen: Record<string, number>
  /** Resources no longer listed, and when they went (forgotten after 30 days). */
  gone: Record<string, { at: number; name: string }>
  /** When main first saw a volume or an address unattached. */
  unattached: Record<string, number>
  /** The last day a resource's metric was in list-metrics, by series key. */
  lastMetric: Record<string, number>
  /** A bucket's size and the day it last changed. */
  s3: Record<string, { bytes: number; since: number }>
  /** KEEP: marked as meant to stay, with the day and the ≈ $ a month then. */
  keep: Record<string, { at: number; usd: number; name: string }>
}

export interface GmdState {
  on: boolean
  /** Metrics a month at most. */
  cap: number
  /** Metrics asked for this UTC month. */
  used: number
  /** The cap stopped a reading this month: the judgement fell back to the free means. */
  capReached: boolean
  readAt: number | null
}

export interface ResourceReadings {
  buckets: BucketList | null
  logGroups: PerRegion<LogGroupRow[]>
  ddb: PerRegion<DdbReading>
  ecs: PerRegion<EcsReading>
  eksNodes: PerRegion<EksNodesReading>
  elbTargets: PerRegion<ElbTargetsReading>
  sqs: PerRegion<SqsReading>
  sns: PerRegion<SnsReading>
  apis: PerRegion<ApisReading>
  distributions: DistributionRow[] | null
  bedrock: PerRegion<BedrockReading>
  bedrockNames: BedrockNames | null
  aoss: PerRegion<AossReading>
  vpce: PerRegion<VpceRow[]>
  tgw: PerRegion<z.infer<typeof TgwSchema>>
  vpn: PerRegion<z.infer<typeof VpnSchema>>
  sagemaker: PerRegion<SagemakerReading>
  images: PerRegion<ImagesReading>
  ecr: PerRegion<z.infer<typeof EcrSchema>>
  caches: PerRegion<CachesReading>
  osDomains: PerRegion<z.infer<typeof OsDomainsSchema>>
  redshift: PerRegion<RedshiftReading>
  kinesis: PerRegion<z.infer<typeof KinesisSchema>>
  transfer: PerRegion<z.infer<typeof TransferSchema>>
  kms: PerRegion<z.infer<typeof KmsSchema>>
  zones: z.infer<typeof ZonesSchema> | null
  vpcs: PerRegion<z.infer<typeof VpcsSchema>>
  alarmsAll: PerRegion<z.infer<typeof AlarmsAllSchema>>
  /** list-metrics per region; CloudFront's in us-east-1 is under `cloudfront`. */
  presence: PerRegion<Presence>
  cloudfrontPresence: Presence | null
  /** Model ids with Bedrock Invocations in the last 14 days, in every enabled region. */
  bedrockUse: PerRegion<string[]>
  /** Daily values read per region (GetMetricData, or statistics as the fallback). */
  usage: PerRegion<Usage>
  /** The regions outside the pane's, from the weekly sweep. */
  sweep: PerRegion<SweepRegion>
  sweepAt: number | null
  sweepOn: boolean
  memory: InventoryMemory
  gmd: GmdState
  /** The judgement's first reading is still to come for some region (B says "judging…"). */
  judging: boolean
}

export const emptyMemory = (): InventoryMemory => ({
  firstAt: {},
  seen: {},
  gone: {},
  unattached: {},
  lastMetric: {},
  s3: {},
  keep: {},
})

export const emptyResourceReadings = (): ResourceReadings => ({
  buckets: null,
  logGroups: {},
  ddb: {},
  ecs: {},
  eksNodes: {},
  elbTargets: {},
  sqs: {},
  sns: {},
  apis: {},
  distributions: null,
  bedrock: {},
  bedrockNames: null,
  aoss: {},
  vpce: {},
  tgw: {},
  vpn: {},
  sagemaker: {},
  images: {},
  ecr: {},
  caches: {},
  osDomains: {},
  redshift: {},
  kinesis: {},
  transfer: {},
  kms: {},
  zones: null,
  vpcs: {},
  alarmsAll: {},
  presence: {},
  cloudfrontPresence: null,
  bedrockUse: {},
  usage: {},
  sweep: {},
  sweepAt: null,
  sweepOn: true,
  memory: emptyMemory(),
  gmd: { on: true, cap: 100_000, used: 0, capReached: false, readAt: null },
  judging: true,
})
