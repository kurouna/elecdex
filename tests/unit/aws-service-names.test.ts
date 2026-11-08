import { describe, expect, it } from 'vitest'
import { resourcesView } from '../../src/shared/aws/inventory'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import { emptyResourceReadings } from '../../src/shared/aws/resource-readings'
import { SERVICES } from '../../src/shared/aws/resources'
import {
  billedNotListed,
  isNotRead,
  SERVICE_TILES,
  serviceNameText,
} from '../../src/shared/aws/service-names'

/** The billing metric's ServiceName against RESOURCES' tiles (aws.md §14.2 E). */

const NOW = Date.UTC(2026, 10, 8, 3)
const R = 'ap-northeast-1'
const readings = (over: Partial<Omit<AwsReadings, 'res'>> = {}): AwsReadings => ({
  ...emptyReadings(NOW, [R]),
  ...over,
  res: emptyResourceReadings(),
})
const view = (r: AwsReadings) => resourcesView(r, { denied: [], perMetricUsd: 0.00001 })

describe('BILLED, NOT LISTED', () => {
  it('maps the billing names to tiles, leaves out what is not read on purpose and under $1', () => {
    for (const tiles of Object.values(SERVICE_TILES))
      for (const tile of tiles) expect(SERVICES).toContain(tile)
    expect(isNotRead('AWSCloudTrail')).toBe(true)
    expect(isNotRead('AWSSupportBusiness')).toBe(true)
    expect(isNotRead('AmazonKinesis')).toBe(false)
    const billed = [
      { name: 'AmazonEC2', usd: 300 },
      { name: 'AWSGlue', usd: 3.1 },
      { name: 'AmazonKinesis', usd: 41.2 },
      { name: 'AWSCloudTrail', usd: 9 },
      { name: 'AmazonAthena', usd: 0.4 },
    ]
    expect(billedNotListed(billed, new Set(['ec2']))).toEqual([
      { name: 'AmazonKinesis', usd: 41.2 },
      { name: 'AWSGlue', usd: 3.1 },
    ])
    expect(serviceNameText('AmazonKinesis')).toBe('Amazon Kinesis')
    const r = readings({ billingThere: true, billingServices: billed })
    expect(view(r).billedNotListed.map((b) => b.name)).toEqual([
      'AmazonEC2',
      'AmazonKinesis',
      'AWSGlue',
    ])
    expect(view({ ...r, billingThere: false }).billedNotListed).toEqual([])
  })
})
