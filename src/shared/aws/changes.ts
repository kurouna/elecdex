import { type AwsReadings, everywhere } from './readings.js'
import type { AwsService, ChangeLine } from './types.js'

/**
 * What came and went since the day's first reading (aws.md §4.3): the ids main saw first today,
 * against the ids now. No call of its own. Pure.
 */

export type IdSets = Partial<Record<AwsService, Record<string, string>>>

/** The ids (to their names) the changes line compares: what runs or bills. */
export function idSets(r: AwsReadings): IdSets {
  // Keyed by region and id: a database or a NAT of one name in two regions is two, and one of
  // them going is a change (keyed by id alone, the other one hid it).
  const named = <T extends { region: string }>(
    rows: T[],
    id: (row: T) => string,
    name: (row: T) => string,
  ) => Object.fromEntries(rows.map((row) => [`${row.region}:${id(row)}`, name(row)]))
  return {
    ec2: named(
      everywhere(r.instances).filter((i) => i.state === 'running'),
      (i) => i.id,
      (i) => i.name ?? i.id,
    ),
    ebs: named(
      everywhere(r.volumes).filter((v) => v.state === 'available'),
      (v) => v.id,
      (v) => v.name ?? v.id,
    ),
    nat: named(
      everywhere(r.nats),
      (n) => n.id,
      (n) => n.name ?? n.id,
    ),
    elb: named(
      everywhere(r.balancers),
      (b) => b.arn,
      (b) => b.name,
    ),
    rds: named(
      everywhere(r.databases),
      (d) => d.id,
      (d) => d.id,
    ),
    eip: named(
      everywhere(r.addresses),
      (a) => a.ip,
      (a) => a.ip,
    ),
  }
}

/**
 * The line: "+2 EC2 (web-3, web-4) · −1 NAT". The first set of a service counts only once that
 * service has been read (an empty set from before a reading is not "everything removed").
 */
export function changesSince(first: IdSets, now: IdSets, since: number): ChangeLine | null {
  const parts: ChangeLine['parts'] = []
  for (const service of Object.keys(now) as AwsService[]) {
    const before = first[service]
    const after = now[service]
    if (before === undefined || after === undefined) continue
    const added = Object.keys(after)
      .filter((id) => !(id in before))
      .map((id) => after[id] ?? id)
    const removed = Object.keys(before)
      .filter((id) => !(id in after))
      .map((id) => before[id] ?? id)
    if (added.length > 0 || removed.length > 0) parts.push({ service, added, removed })
  }
  return parts.length === 0 ? null : { since, parts }
}
