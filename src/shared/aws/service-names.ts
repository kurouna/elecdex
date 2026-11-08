import type { AwsService } from './types.js'

/**
 * BILLED, NOT LISTED (aws.md §14.2 E): the billing metric's `ServiceName` against RESOURCES'
 * tiles. A name here bills for the tiles it lists; a name in `NOT_READ` is one the pane chose
 * not to read (the trail, taxes, Cost Explorer itself, Secrets Manager, data transfer…) and is
 * never called "not listed". Any other name billing $1 or more this month is a service the pane
 * does not read, and the line says so. The names are AWS's product codes as the metric carries
 * them (checked against the billing metrics of AWS's documents, 2026-11-08).
 */

export const SERVICE_TILES: Record<string, readonly AwsService[]> = {
  AmazonEC2: ['ec2', 'ebs', 'nat', 'eip', 'snapshots', 'amis', 'elb', 'vpce', 'tgw', 'vpn'],
  AWSELB: ['elb'],
  AmazonVPC: ['eip', 'vpce', 'nat', 'tgw', 'vpn'],
  AmazonS3: ['s3'],
  AmazonRDS: ['rds'],
  AmazonEKS: ['eks'],
  AmazonECS: ['ecs'],
  AWSLambda: ['lambda'],
  AmazonDynamoDB: ['dynamodb'],
  AWSQueueService: ['sqs'],
  AmazonSNS: ['sns'],
  AmazonApiGateway: ['apigw'],
  AmazonCloudFront: ['cloudfront'],
  AmazonBedrock: ['bedrock'],
  AmazonBedrockService: ['bedrock'],
  AmazonOpenSearchServerless: ['aoss'],
  AmazonES: ['opensearch', 'aoss'],
  AmazonCloudWatch: ['logs', 'alarms'],
  AmazonSageMaker: ['sagemaker'],
  AmazonECR: ['ecr'],
  AmazonElastiCache: ['elasticache'],
  AmazonRedshift: ['redshift'],
  AmazonKinesis: ['kinesis'],
  AWSTransfer: ['transfer'],
  awskms: ['kms'],
  AmazonRoute53: ['route53'],
  AWSCertificateManager: ['acm'],
  AWSCloudFormation: ['stacks'],
}

/** Billed, and not read here on purpose. */
export const NOT_READ: readonly (string | RegExp)[] = [
  'AWSCloudTrail',
  'AWSConfig',
  'AWSCostExplorer',
  'AWSDataTransfer',
  'AWSSecretsManager',
  'AWSSystemsManager',
  'AmazonGuardDuty',
  'AWSSecurityHub',
  'AWSBackup',
  'AWSBudgets',
  'Tax',
  /^AWSSupport/,
  /^AWSDeveloperSupport$/,
]

/** Below this a month's amount is not said (aws.md §14.2 E). */
export const NOT_LISTED_MIN_USD = 1

export const isNotRead = (name: string): boolean =>
  NOT_READ.some((entry) => (typeof entry === 'string' ? entry === name : entry.test(name)))

/**
 * The names billing this month that no tile lists: not in the map, not read on purpose; or in
 * the map, yet none of its tiles has anything (in the pane's regions or the sweep's).
 */
export function billedNotListed(
  services: readonly { name: string; usd: number }[] | null,
  present: ReadonlySet<AwsService>,
): { name: string; usd: number }[] {
  return (services ?? [])
    .filter((s) => s.usd >= NOT_LISTED_MIN_USD && !isNotRead(s.name))
    .filter((s) => {
      const tiles = SERVICE_TILES[s.name]
      return tiles === undefined || !tiles.some((t) => present.has(t))
    })
    .sort((a, b) => b.usd - a.usd)
}

/** The name as people read it: "AmazonKinesis" → "Amazon Kinesis". */
export const serviceNameText = (name: string): string =>
  name.replace(/^(Amazon|AWS)(?=[A-Z])/, '$1 ')
