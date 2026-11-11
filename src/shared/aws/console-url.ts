import { regionName } from './board.js'
import type { AwsService } from './types.js'

/**
 * The AWS console page of a resource (aws.md §7). Main builds it from its own last reading - the
 * page sends only an item's id - and opens it only on console.aws.amazon.com or a region's
 * `<region>.console.aws.amazon.com`. Signing in to the console is the browser's: the CLI's
 * credentials never go with it.
 */

/**
 * Any printable id: every id goes into the URL encoded and the host is fixed, so what an id may
 * hold is AWS's to say. Alarm names take spaces and parentheses ("CPU high (prod)"), and a
 * narrower set left ↗ CONSOLE doing nothing for them. Control characters and a very long id
 * (no resource's) are still refused.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what it refuses.
const SAFE_ID = /^[^\u0000-\u001f\u007f]{1,1024}$/

const GLOBAL_CONSOLE = 'https://console.aws.amazon.com'

/** The part after RESOURCES' kind prefix ("pt:abc" → ["pt", "abc"]). */
const split = (id: string): [string, string] => {
  const at = id.indexOf(':')
  return at < 0 ? ['', id] : [id.slice(0, at), id.slice(at + 1)]
}

/** CloudWatch's console encodes a log group's slashes twice (`/` → `$252F`). */
const logGroupPart = (name: string) => encodeURIComponent(name).replace(/%/g, '$25')

const BEDROCK_PAGE: Record<string, string> = {
  pt: 'provisioned-throughput',
  custom: 'custom-models',
  imported: 'imported-models',
  kb: 'knowledge-bases',
  agent: 'agents',
  guardrail: 'guardrails',
  profile: 'inference-profiles',
}

/** RESOURCES' kinds (aws.md §14.5): a resource's page, or its list where the page needs the account. */
function resourceUrl(service: AwsService, r: string, id: string): string | null {
  const e = encodeURIComponent(id)
  const host = `https://${r}.console.aws.amazon.com`
  const [kind, rest] = split(id)
  const name = encodeURIComponent(rest)
  switch (service) {
    case 'ecs': {
      const [cluster, svc] = id.split('/')
      return svc === undefined
        ? `${host}/ecs/v2/clusters/${encodeURIComponent(cluster ?? id)}/services?region=${r}`
        : `${host}/ecs/v2/clusters/${encodeURIComponent(cluster ?? '')}/services/${encodeURIComponent(svc)}/health?region=${r}`
    }
    case 'dynamodb':
      return `${host}/dynamodbv2/home?region=${r}#table?name=${e}`
    case 'sqs':
      return `${host}/sqs/v3/home?region=${r}#/queues`
    case 'sns':
      return `${host}/sns/v3/home?region=${r}#/topics`
    case 'apigw':
      return `${host}/apigateway/main/api-detail?api=${e}&region=${r}`
    case 'cloudfront':
      return `${GLOBAL_CONSOLE}/cloudfront/v4/home#/distributions/${e}`
    case 'bedrock':
      return kind === 'runtime'
        ? `${host}/bedrock-agentcore/home?region=${r}#/agents`
        : `${host}/bedrock/home?region=${r}#/${BEDROCK_PAGE[kind] ?? 'overview'}${kind === 'agent' ? `/${name}` : ''}`
    case 'aoss':
      return `${host}/aos/home?region=${r}#opensearch/collections`
    case 'logs':
      return `${host}/cloudwatch/home?region=${r}#logsV2:log-groups/log-group/${logGroupPart(id)}`
    default:
      return networkUrl(service, r, id) ?? dataUrl(service, r, id)
  }
}

function networkUrl(service: AwsService, r: string, id: string): string | null {
  const e = encodeURIComponent(id)
  const host = `https://${r}.console.aws.amazon.com`
  switch (service) {
    case 'vpce':
      return `${host}/vpcconsole/home?region=${r}#EndpointDetails:vpcEndpointId=${e}`
    case 'tgw':
      return `${host}/vpcconsole/home?region=${r}#TransitGatewayAttachmentDetails:transitGatewayAttachmentId=${e}`
    case 'vpn':
      return `${host}/vpcconsole/home?region=${r}#VpnConnectionDetails:VpnConnectionId=${e}`
    case 'vpc':
      return `${host}/vpcconsole/home?region=${r}#VpcDetails:VpcId=${e}`
    case 'snapshots':
      return `${host}/ec2/home?region=${r}#SnapshotDetails:snapshotId=${e}`
    case 'amis':
      return `${host}/ec2/home?region=${r}#ImageDetails:imageId=${e}`
    case 'route53':
      return `${GLOBAL_CONSOLE}/route53/v2/hostedzones#ListRecordSets/${e}`
    case 'kms':
      return `${host}/kms/home?region=${r}#/kms/keys/${e}`
    case 'transfer':
      return `${host}/transfer/home?region=${r}#/servers/${e}`
    default:
      return null
  }
}

function dataUrl(service: AwsService, r: string, id: string): string | null {
  const e = encodeURIComponent(id)
  const host = `https://${r}.console.aws.amazon.com`
  const [kind, rest] = split(id)
  const name = encodeURIComponent(rest)
  switch (service) {
    case 'sagemaker':
      return kind === 'endpoint'
        ? `${host}/sagemaker/home?region=${r}#/endpoints/${name}`
        : kind === 'notebook'
          ? `${host}/sagemaker/home?region=${r}#/notebook-instances/${name}`
          : `${host}/sagemaker/home?region=${r}#/studio`
    case 'ecr':
      return `${host}/ecr/private-registry/repositories?region=${r}`
    case 'elasticache':
      return kind === 'serverless'
        ? `${host}/elasticache/home?region=${r}#/serverless/${name}`
        : `${host}/elasticache/home?region=${r}#/redis/${e}`
    case 'opensearch':
      return `${host}/aos/home?region=${r}#opensearch/domains/${e}`
    case 'redshift':
      return kind === 'workgroup'
        ? `${host}/redshiftv2/home?region=${r}#serverless-dashboard`
        : `${host}/redshiftv2/home?region=${r}#cluster-details?cluster=${e}`
    case 'kinesis':
      return `${host}/kinesis/home?region=${r}#/streams/details/${e}/monitoring`
    default:
      return null
  }
}

export function consoleUrl(service: AwsService, region: string, id: string): string | null {
  const r = regionName(region)
  if (r === null || !SAFE_ID.test(id)) return null
  const e = encodeURIComponent(id)
  const host = `https://${r}.console.aws.amazon.com`
  switch (service) {
    case 'ec2':
      return `${host}/ec2/home?region=${r}#InstanceDetails:instanceId=${e}`
    case 'ebs':
      return `${host}/ec2/home?region=${r}#VolumeDetails:volumeId=${e}`
    case 'eip':
      return `${host}/ec2/home?region=${r}#Addresses:search=${e}`
    case 's3':
      return `https://s3.console.aws.amazon.com/s3/buckets/${e}?region=${r}`
    case 'nat':
      return `${host}/vpcconsole/home?region=${r}#NatGatewayDetails:natGatewayId=${e}`
    // A classic load balancer has no ARN in the list: it is found by its name.
    case 'elb':
      return id.startsWith('arn:')
        ? `${host}/ec2/home?region=${r}#LoadBalancer:loadBalancerArn=${e}`
        : `${host}/ec2/home?region=${r}#LoadBalancers:search=${e}`
    case 'rds':
      return `${host}/rds/home?region=${r}#database:id=${e}`
    case 'eks':
      return `${host}/eks/home?region=${r}#/clusters/${e}`
    case 'lambda':
      return `${host}/lambda/home?region=${r}#/functions/${e}`
    case 'stacks':
      return `${host}/cloudformation/home?region=${r}#/stacks?filteringText=${e}`
    case 'acm': {
      const certificate = /certificate\/([0-9a-f-]{36})$/.exec(id)?.[1]
      return certificate ? `${host}/acm/home?region=${r}#/certificates/${certificate}` : null
    }
    case 'alarms':
      return `${host}/cloudwatch/home?region=${r}#alarmsV2:alarm/${e}`
    default:
      return resourceUrl(service, r, id)
  }
}

/** The account's own pages. */
export const ACCOUNT_PAGES = {
  billing: 'https://console.aws.amazon.com/billing/home',
  costExplorer: 'https://console.aws.amazon.com/costmanagement/home#/cost-explorer',
  billingPreferences: 'https://console.aws.amazon.com/billing/home#/preferences',
  iam: 'https://console.aws.amazon.com/iam/home#/home',
} as const

/**
 * PARTIAL's ↗ IAM: the permissions page of who the profile signs in as, from its ARN, where
 * COPY POLICY's policy is pasted. An IAM user's own page; an assumed role's; IAM Identity Center
 * for its `AWSReservedSSO_` roles, whose permission sets IAM cannot change; IAM's home for the root
 * or anything else.
 */
export function permissionsUrl(arn: string): string {
  const iam = 'https://console.aws.amazon.com/iam/home#'
  const user = /^arn:aws[\w-]*:iam::\d{12}:user\/(?:.+\/)?([\w+=,.@-]{1,64})$/.exec(arn)?.[1]
  if (user !== undefined)
    return `${iam}/users/details/${encodeURIComponent(user)}?section=permissions`
  const role = /^arn:aws[\w-]*:sts::\d{12}:assumed-role\/([\w+=,.@-]{1,64})\/[^/]+$/.exec(arn)?.[1]
  if (role?.startsWith('AWSReservedSSO_')) return 'https://console.aws.amazon.com/singlesignon/home'
  if (role !== undefined)
    return `${iam}/roles/details/${encodeURIComponent(role)}?section=permissions`
  return ACCOUNT_PAGES.iam
}

/**
 * The top row's CONSOLE: the console's home in a region the pane shows, or the console's own home
 * (the region the browser last used) when there is none.
 */
export function consoleHomeUrl(region: string | null): string {
  if (region === null) return 'https://console.aws.amazon.com/console/home'
  return `https://${region}.console.aws.amazon.com/console/home?region=${region}`
}

/** Whether main may open a URL as the console: https on the console's own hosts only. */
export function isConsoleUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '')
    return false
  const host = url.hostname
  return (
    host === 'console.aws.amazon.com' ||
    host === 's3.console.aws.amazon.com' ||
    /^[a-z]{2}(-gov)?-[a-z]+-\d{1,2}\.console\.aws\.amazon\.com$/.test(host) ||
    host === 'health.aws.amazon.com'
  )
}
