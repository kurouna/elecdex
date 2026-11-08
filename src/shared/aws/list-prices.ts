/**
 * The unit prices ACTIVE's estimates use, shipped with elecdex (aws.md §5.0; user decision
 * 2026-11-08: a table rather than the Price List API, whose cost was not found stated).
 *
 * US East (N. Virginia) On-Demand list prices, Linux, shared tenancy, in USD, as the services'
 * public pricing pages give them (`PRICES_AS_OF` is the table's date; checked against the pages
 * with each release). Another region is the same price times its usual ratio (`REGION_RATIO`) - an
 * approximation, which every figure says with its `≈`. Savings Plans, reservations, the free
 * tier, discounts, requests and data transfer are left out. A type not in the table is counted,
 * not priced; so is what has no list price to look up (Bedrock's Provisioned Throughput, a
 * SageMaker endpoint, whose instance its list does not say, Fargate tasks; aws.md §14.3).
 */

export const PRICES_AS_OF = '2026-11'

/** EC2, USD an hour. */
const EC2: Record<string, number> = {
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  't2.large': 0.0928,
  't3.nano': 0.0052,
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  't3.xlarge': 0.1664,
  't3.2xlarge': 0.3328,
  't3a.micro': 0.0094,
  't3a.small': 0.0188,
  't3a.medium': 0.0376,
  't3a.large': 0.0752,
  't3a.xlarge': 0.1504,
  't4g.nano': 0.0042,
  't4g.micro': 0.0084,
  't4g.small': 0.0168,
  't4g.medium': 0.0336,
  't4g.large': 0.0672,
  't4g.xlarge': 0.1344,
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
  'm5.2xlarge': 0.384,
  'm5.4xlarge': 0.768,
  'm6i.large': 0.096,
  'm6i.xlarge': 0.192,
  'm6i.2xlarge': 0.384,
  'm6i.4xlarge': 0.768,
  'm6g.large': 0.077,
  'm6g.xlarge': 0.154,
  'm7i.large': 0.1008,
  'm7i.xlarge': 0.2016,
  'm7i.2xlarge': 0.4032,
  'm7g.large': 0.0816,
  'm7g.xlarge': 0.1632,
  'c5.large': 0.085,
  'c5.xlarge': 0.17,
  'c5.2xlarge': 0.34,
  'c6i.large': 0.085,
  'c6i.xlarge': 0.17,
  'c6i.2xlarge': 0.34,
  'c7g.large': 0.0725,
  'c7g.xlarge': 0.145,
  'r5.large': 0.126,
  'r5.xlarge': 0.252,
  'r5.2xlarge': 0.504,
  'r6i.large': 0.126,
  'r6i.xlarge': 0.252,
  'r6g.large': 0.1008,
  'r6g.xlarge': 0.2016,
  'g4dn.xlarge': 0.526,
  'g5.xlarge': 1.006,
}

/** RDS for PostgreSQL or MySQL, single-AZ, USD an hour (Multi-AZ is twice). */
const RDS: Record<string, number> = {
  'db.t3.micro': 0.018,
  'db.t3.small': 0.036,
  'db.t3.medium': 0.072,
  'db.t3.large': 0.145,
  'db.t4g.micro': 0.016,
  'db.t4g.small': 0.032,
  'db.t4g.medium': 0.065,
  'db.t4g.large': 0.129,
  'db.m5.large': 0.178,
  'db.m5.xlarge': 0.356,
  'db.m6g.large': 0.159,
  'db.m6i.large': 0.178,
  'db.m7g.large': 0.168,
  'db.r5.large': 0.25,
  'db.r6g.large': 0.225,
  'db.r6i.large': 0.25,
}

/** EBS, USD a GB-month; io1 and io2 add a provisioned IOPS-month. */
const EBS: Record<string, number> = {
  gp3: 0.08,
  gp2: 0.1,
  io1: 0.125,
  io2: 0.125,
  st1: 0.045,
  sc1: 0.015,
  standard: 0.05,
}
const PIOPS_MONTH = 0.065

/** S3 by CloudWatch's StorageType, USD a GB-month. */
const S3: Record<string, number> = {
  StandardStorage: 0.023,
  IntelligentTieringFAStorage: 0.023,
  IntelligentTieringIAStorage: 0.0125,
  IntelligentTieringAAStorage: 0.004,
  IntelligentTieringAIAStorage: 0.004,
  IntelligentTieringDAAStorage: 0.00099,
  StandardIAStorage: 0.0125,
  OneZoneIAStorage: 0.01,
  GlacierInstantRetrievalStorage: 0.004,
  GlacierStorage: 0.0036,
  DeepArchiveStorage: 0.00099,
  ReducedRedundancyStorage: 0.024,
}

/** USD an hour. */
const HOURLY = {
  nat: 0.045,
  /** Every public IPv4 address, attached or not, since 2024-02. */
  ipv4: 0.005,
  alb: 0.0225,
  nlb: 0.0225,
  gwlb: 0.0125,
  clb: 0.025,
  eks: 0.1,
  eksExtended: 0.6,
  /** A VPC interface endpoint, per Availability Zone it is in. */
  vpceAz: 0.01,
  tgwAttachment: 0.05,
  vpn: 0.05,
  /** Kinesis Data Streams: a provisioned shard, or an on-demand stream. */
  kinesisShard: 0.015,
  kinesisOnDemand: 0.04,
  /** Transfer Family: a server, per protocol it serves (one is counted). */
  transfer: 0.3,
  /** OpenSearch Serverless: one OCU (indexing or search). */
  aossOcu: 0.24,
  /** DynamoDB provisioned capacity: one read or write capacity unit. */
  ddbRcu: 0.00013,
  ddbWcu: 0.00065,
}

/** USD a month. */
const MONTHLY = {
  /** A KMS customer managed key (AWS managed keys are free). */
  kmsKey: 1,
  /** A Route 53 hosted zone (the first 25). */
  route53Zone: 0.5,
  /** A CloudWatch alarm (standard resolution; the first ten are free). */
  alarm: 0.1,
  /** A Bedrock custom model's storage. */
  customModel: 1.95,
}

/** USD a GB-month (or a GB, for ingestion). */
const PER_GB = {
  ecr: 0.1,
  snapshot: 0.05,
  snapshotArchive: 0.0125,
  logsStored: 0.03,
  /** CloudWatch Logs ingestion, Standard class; Infrequent Access is half. */
  logsIngested: 0.5,
  ddbStandard: 0.25,
  ddbIa: 0.1,
}

/** ElastiCache nodes (Redis OSS / Valkey list price), USD an hour. */
const CACHE: Record<string, number> = {
  'cache.t3.micro': 0.017,
  'cache.t3.small': 0.034,
  'cache.t3.medium': 0.068,
  'cache.t4g.micro': 0.016,
  'cache.t4g.small': 0.032,
  'cache.t4g.medium': 0.065,
  'cache.m5.large': 0.156,
  'cache.m6g.large': 0.149,
  'cache.m7g.large': 0.158,
  'cache.r5.large': 0.216,
  'cache.r6g.large': 0.206,
  'cache.r7g.large': 0.219,
}

/** OpenSearch Service domain instances, USD an hour. */
const SEARCH: Record<string, number> = {
  't3.small.search': 0.036,
  't3.medium.search': 0.073,
  'm5.large.search': 0.142,
  'm6g.large.search': 0.128,
  'c6g.large.search': 0.113,
  'r6g.large.search': 0.167,
}

/** Redshift provisioned nodes, USD an hour. */
const REDSHIFT: Record<string, number> = {
  'dc2.large': 0.25,
  'ra3.large': 0.543,
  'ra3.xlplus': 1.086,
  'ra3.4xlarge': 3.26,
}

/** SageMaker notebook and Studio instances, USD an hour. */
const SAGEMAKER: Record<string, number> = {
  'ml.t2.medium': 0.0464,
  'ml.t3.medium': 0.05,
  'ml.t3.large': 0.1,
  'ml.t3.xlarge': 0.2,
  'ml.m5.large': 0.115,
  'ml.m5.xlarge': 0.23,
  'ml.g4dn.xlarge': 0.7364,
  'ml.g5.xlarge': 1.408,
}

/** A region's prices as a share of US East's: the usual ratio, not each price. */
const REGION_RATIO: Record<string, number> = {
  'us-east-1': 1,
  'us-east-2': 1,
  'us-west-2': 1,
  'us-west-1': 1.17,
  'ca-central-1': 1.1,
  'eu-west-1': 1.1,
  'eu-west-2': 1.16,
  'eu-central-1': 1.16,
  'eu-north-1': 1.06,
  'ap-northeast-1': 1.27,
  'ap-northeast-3': 1.27,
  'ap-northeast-2': 1.22,
  'ap-southeast-1': 1.2,
  'ap-southeast-2': 1.22,
  'ap-south-1': 1.08,
  'sa-east-1': 1.55,
}
const OTHER_REGION = 1.2

export const HOURS_A_MONTH = 730

const ratio = (region: string) => REGION_RATIO[region] ?? OTHER_REGION

const NODE_TABLES = { cache: CACHE, search: SEARCH, redshift: REDSHIFT, sagemaker: SAGEMAKER }

export const prices = {
  ec2Hour: (type: string, region: string): number | null => {
    const base = EC2[type]
    return base === undefined ? null : base * ratio(region)
  },
  rdsHour: (cls: string, region: string, multiAz: boolean): number | null => {
    const base = RDS[cls]
    return base === undefined ? null : base * ratio(region) * (multiAz ? 2 : 1)
  },
  ebsMonth: (type: string, gib: number, iops: number | null, region: string): number | null => {
    const base = EBS[type]
    if (base === undefined) return null
    const provisioned = type === 'io1' || type === 'io2' ? (iops ?? 0) * PIOPS_MONTH : 0
    return (base * gib + provisioned) * ratio(region)
  },
  s3Month: (storageType: string, bytes: number, region: string): number | null => {
    const base = S3[storageType]
    return base === undefined ? null : ((base * bytes) / 1024 ** 3) * ratio(region)
  },
  hour: (what: keyof typeof HOURLY, region: string): number => HOURLY[what] * ratio(region),
  month: (what: keyof typeof MONTHLY, region: string): number => MONTHLY[what] * ratio(region),
  perGb: (what: keyof typeof PER_GB, gb: number, region: string): number =>
    PER_GB[what] * gb * ratio(region),
  /** A node type of a table (ElastiCache, OpenSearch, Redshift, SageMaker), or null. */
  nodeHour: (
    table: 'cache' | 'search' | 'redshift' | 'sagemaker',
    type: string | null | undefined,
    region: string,
  ): number | null => {
    const base = type ? NODE_TABLES[table][type] : undefined
    return base === undefined ? null : base * ratio(region)
  },
}
