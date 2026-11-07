import { regionName } from './board.js'
import type { AwsService } from './types.js'

/**
 * The AWS console page of a resource (aws.md §7). Main builds it from its own last reading - the
 * page sends only an item's id - and opens it only on console.aws.amazon.com or a region's
 * `<region>.console.aws.amazon.com`. Signing in to the console is the browser's: the CLI's
 * credentials never go with it.
 */

const SAFE_ID = /^[A-Za-z0-9._:/@+=,-]{1,512}$/

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
    case 'elb':
      return `${host}/ec2/home?region=${r}#LoadBalancer:loadBalancerArn=${e}`
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
  }
}

/** The account's own pages. */
export const ACCOUNT_PAGES = {
  billing: 'https://console.aws.amazon.com/billing/home',
  costExplorer: 'https://console.aws.amazon.com/costmanagement/home#/cost-explorer',
  billingPreferences: 'https://console.aws.amazon.com/billing/home#/preferences',
  iam: 'https://console.aws.amazon.com/iam/home#/home',
} as const

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
