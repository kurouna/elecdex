import { type AwsReadings, type Certificate, everywhere } from './readings.js'
import type { AttentionItem, AwsService, Weight } from './types.js'

/**
 * ATTENTION (aws.md §4.1): what the account's readings say needs someone, heaviest first. Pure;
 * the limits have names, and each row's card says the one it met.
 */

export const AWS_LIMITS = {
  /** A certificate or domain in use this close to its end is danger, then warn. */
  expiryDangerDays: 7,
  expiryWarnDays: 30,
  /** Access keys older than this. */
  keyAgeDays: 90,
  /** Standard support ending this soon (EKS). */
  supportWarnDays: 90,
  /** A stopped instance's EBS goes on billing: warn after this many days stopped. */
  stoppedDays: 30,
  /** The root user signed in this recently. */
  rootUseHours: 24,
  /** Budgets: actual over this share of the limit. */
  budgetActual: 0.8,
  /** The new plan's credits end this soon; the legacy free tier is this used. */
  planDays: 30,
  freeTierShare: 0.85,
  /** The same refused operation this many times in 15 minutes. */
  deniedBurst: 10,
} as const

const DAY = 86_400_000

/**
 * Lambda runtimes past their deprecation (the Lambda runtimes page; only dates already passed, so
 * a date that moves later cannot make a false warning).
 */
export const DEPRECATED_RUNTIMES: Record<string, string> = {
  'python3.7': '2023-12-04',
  'python3.8': '2024-10-14',
  'python3.9': '2025-12-15',
  'nodejs12.x': '2023-03-31',
  'nodejs14.x': '2023-12-04',
  'nodejs16.x': '2024-06-12',
  'nodejs18.x': '2025-09-01',
  'go1.x': '2024-01-08',
  java8: '2024-01-08',
  dotnet6: '2024-12-20',
  'ruby2.7': '2023-12-07',
}

const ORDER: Record<Weight, number> = { danger: 0, warn: 1, info: 2, quiet: 3 }

type Finding = Omit<AttentionItem, 'region' | 'item'> & {
  region?: string | null
  item?: { service: AwsService; id: string } | null
}

const finding = (f: Finding): AttentionItem => ({ region: null, item: null, ...f })

const days = (ms: number) => Math.floor(ms / DAY)

function alarmFindings(r: AwsReadings): AttentionItem[] {
  return Object.entries(r.alarms).flatMap(([region, alarms]) => [
    ...(alarms?.metric ?? []).map((alarm) =>
      finding({
        id: `alarm:${region}:${alarm.name}`,
        weight: 'danger',
        tag: 'ALARM',
        title: alarm.name,
        region,
        item: { service: 'alarms', id: alarm.name },
        since: alarm.since ?? r.now,
        why: `In ALARM${alarm.namespace ? ` · ${alarm.namespace}` : ''} (describe-alarms --state-value ALARM).`,
      }),
    ),
    ...(alarms?.composite ?? []).map((alarm) =>
      finding({
        id: `alarm:${region}:${alarm.name}`,
        weight: 'danger',
        tag: 'ALARM',
        title: `${alarm.name} (composite)`,
        region,
        item: { service: 'alarms', id: alarm.name },
        since: alarm.since ?? r.now,
        why: 'A composite alarm in ALARM.',
      }),
    ),
  ])
}

function healthFindings(r: AwsReadings): AttentionItem[] {
  const names = new Map(everywhere(r.instances).map((i) => [i.id, i.name ?? i.id]))
  const impaired = Object.entries(r.impaired).flatMap(([region, ids]) =>
    (ids ?? []).map((id) =>
      finding({
        id: `health:${region}:${id}`,
        weight: 'danger',
        tag: 'HEALTH',
        title: `${names.get(id) ?? id} failed its status check`,
        region,
        item: { service: 'ec2', id },
        since: r.now,
        why: 'The instance status check is impaired (describe-instance-status).',
      }),
    ),
  )
  const backups = everywhere(r.backups).map((job) =>
    finding({
      id: `backup:${job.region}:${job.id}`,
      weight: 'warn',
      tag: 'HEALTH',
      title: `A backup failed${job.type ? ` · ${job.type}` : ''}`,
      region: job.region,
      since: job.at ?? r.now,
      why: 'AWS Backup: a job FAILED in the last 24 hours.',
    }),
  )
  return [...impaired, ...backups]
}

function stackFindings(r: AwsReadings): AttentionItem[] {
  return everywhere(r.stacks)
    .filter((stack) => /_FAILED$/.test(stack.status))
    .map((stack) =>
      finding({
        id: `stack:${stack.region}:${stack.name}`,
        weight: 'danger',
        tag: 'STACK',
        title: `${stack.name} · ${stack.status}`,
        region: stack.region,
        item: { service: 'stacks', id: stack.name },
        since: stack.at ?? r.now,
        why: 'A CloudFormation stack in a *_FAILED state.',
      }),
    )
}

function rootFindings(r: AwsReadings): AttentionItem[] {
  const out: AttentionItem[] = []
  if (r.summary?.mfa === 0)
    out.push(
      finding({
        id: 'security:root-mfa',
        weight: 'danger',
        tag: 'SECURITY',
        title: 'The root user has no MFA',
        since: r.now,
        why: 'iam get-account-summary: AccountMFAEnabled is 0.',
      }),
    )
  if ((r.summary?.keys ?? 0) > 0)
    out.push(
      finding({
        id: 'security:root-keys',
        weight: 'danger',
        tag: 'SECURITY',
        title: 'The root user has access keys',
        since: r.now,
        why: 'iam get-account-summary: AccountAccessKeysPresent.',
      }),
    )
  const root = r.credentials?.find((row) => row.user === '<root_account>')
  if (root?.passwordUsed != null && r.now - root.passwordUsed < AWS_LIMITS.rootUseHours * 3_600_000)
    out.push(
      finding({
        id: `security:root-used:${root.passwordUsed}`,
        weight: 'danger',
        tag: 'SECURITY',
        title: 'The root user signed in',
        since: root.passwordUsed,
        why: `In the last ${AWS_LIMITS.rootUseHours} hours (the credential report).`,
      }),
    )
  return out
}

const guarddutyFindings = (r: AwsReadings): AttentionItem[] =>
  Object.entries(r.guardduty).flatMap(([region, counts]) =>
    (counts?.high ?? 0) > 0
      ? [
          finding({
            id: `security:guardduty:${region}`,
            weight: 'danger',
            tag: 'SECURITY',
            title: `GuardDuty: ${counts?.high} high-severity finding${counts?.high === 1 ? '' : 's'}`,
            region,
            since: r.now,
            why: 'Severity 7 or more (get-findings-statistics --group-by SEVERITY).',
          }),
        ]
      : [],
  )

function openGroupFindings(r: AwsReadings): AttentionItem[] {
  const used = new Set(everywhere(r.instances).flatMap((i) => i.sgs ?? []))
  return everywhere(r.openGroups)
    .filter((group) => used.has(group.id) && group.ports.length > 0)
    .map((group) =>
      finding({
        id: `security:sg:${group.region}:${group.id}`,
        weight: 'danger',
        tag: 'SECURITY',
        title: `${group.name ?? group.id} opens ${group.ports.map((p) => p.toUpperCase()).join(', ')} to the world`,
        region: group.region,
        since: r.now,
        why: '0.0.0.0/0 or ::/0 on port 22, 3389 or every port, on a group an instance uses.',
      }),
    )
}

const noMfaFindings = (r: AwsReadings): AttentionItem[] =>
  (r.credentials ?? [])
    .filter((row) => row.user !== '<root_account>' && row.password && !row.mfa)
    .map((row) =>
      finding({
        id: `security:nomfa:${row.user}`,
        weight: 'warn',
        tag: 'SECURITY',
        title: `${row.user} signs in to the console without MFA`,
        since: r.now,
        why: 'The credential report: password enabled, MFA not active.',
      }),
    )

const securityFindings = (r: AwsReadings): AttentionItem[] => [
  ...rootFindings(r),
  ...guarddutyFindings(r),
  ...openGroupFindings(r),
  ...noMfaFindings(r),
  ...deniedBursts(r),
]

/** The same operation refused again and again within 15 minutes, from ACTIVITY. */
function deniedBursts(r: AwsReadings): AttentionItem[] {
  const denied = everywhere(r.trail)
    .filter((event) => event.error !== null && /AccessDenied|Unauthorized/i.test(event.error))
    .sort((a, b) => a.at - b.at)
  const byName = new Map<string, number[]>()
  for (const event of denied) byName.set(event.name, [...(byName.get(event.name) ?? []), event.at])
  const out: AttentionItem[] = []
  for (const [name, times] of byName) {
    const burst = times.some(
      (at, i) =>
        (times[i + AWS_LIMITS.deniedBurst - 1] ?? Number.POSITIVE_INFINITY) - at <= 15 * 60_000,
    )
    if (burst)
      out.push(
        finding({
          id: `security:denied:${name}`,
          weight: 'warn',
          tag: 'SECURITY',
          title: `${name} refused ${times.length} times`,
          since: times[0] ?? r.now,
          why: `${AWS_LIMITS.deniedBurst} or more AccessDenied for one operation within 15 minutes (CloudTrail).`,
        }),
      )
  }
  return out
}

function certificateFinding(
  cert: Certificate & { region: string },
  now: number,
): AttentionItem | null {
  if (cert.expires === null || !cert.inUse) return null
  const left = days(cert.expires - now)
  if (left > AWS_LIMITS.expiryWarnDays) return null
  return finding({
    id: `expiry:cert:${cert.arn}`,
    weight: left <= AWS_LIMITS.expiryDangerDays ? 'danger' : 'warn',
    tag: 'EXPIRY',
    title: `${cert.domain ?? 'A certificate'} ${left < 0 ? `expired ${-left}d ago` : `expires in ${left}d`}`,
    region: cert.region,
    item: { service: 'acm', id: cert.arn },
    since: now,
    why:
      cert.type === 'IMPORTED'
        ? 'An imported certificate is never renewed by ACM.'
        : 'ACM renews its own 60 days before: this one has not been.',
  })
}

function domainFinding(
  domain: { name: string; auto: boolean; expires: number | null },
  now: number,
): AttentionItem[] {
  if (domain.expires === null) return []
  const left = days(domain.expires - now)
  const danger = left <= AWS_LIMITS.expiryDangerDays
  if (!danger && (left > AWS_LIMITS.expiryWarnDays || domain.auto)) return []
  return [
    finding({
      id: `expiry:domain:${domain.name}`,
      weight: danger ? 'danger' : 'warn',
      tag: 'EXPIRY',
      title: `${domain.name} expires in ${left}d${domain.auto ? '' : ' · auto-renew off'}`,
      since: now,
      why: 'Route 53 Domains: the registration ends.',
    }),
  ]
}

function commitmentFindings(r: AwsReadings): AttentionItem[] {
  const commitments = [
    ...(r.savings ?? []).map((plan) => ({
      id: plan.id,
      end: plan.end,
      what: 'Savings Plan',
      region: null,
    })),
    ...everywhere(r.reserved).map((ri) => ({
      id: ri.id,
      end: ri.end,
      what: `Reserved ${ri.type ?? 'instance'}`,
      region: ri.region,
    })),
  ]
  return commitments.flatMap((c) => {
    const left = c.end === null ? -1 : days(c.end - r.now)
    if (left < 0 || left > AWS_LIMITS.expiryWarnDays) return []
    return [
      finding({
        id: `expiry:commit:${c.id}`,
        weight: 'warn',
        tag: 'EXPIRY',
        title: `${c.what} ends in ${left}d`,
        region: c.region,
        since: r.now,
        why: 'After it ends the usage it covered bills On-Demand.',
      }),
    ]
  })
}

const keyFindings = (r: AwsReadings): AttentionItem[] =>
  (r.credentials ?? []).flatMap((row) =>
    row.keys
      .filter(
        (key) =>
          key.active && key.rotated !== null && days(r.now - key.rotated) > AWS_LIMITS.keyAgeDays,
      )
      .map((key) =>
        finding({
          id: `expiry:key:${row.user}:${key.rotated}`,
          weight: 'warn',
          tag: 'EXPIRY',
          title: `${row.user === '<root_account>' ? 'root' : row.user}'s access key is ${days(r.now - (key.rotated ?? r.now))} days old`,
          since: key.rotated ?? r.now,
          why: `Older than ${AWS_LIMITS.keyAgeDays} days.`,
        }),
      ),
  )

const expiryFindings = (r: AwsReadings): AttentionItem[] => [
  ...everywhere(r.certificates).flatMap((cert) => certificateFinding(cert, r.now) ?? []),
  ...(r.domains ?? []).flatMap((domain) => domainFinding(domain, r.now)),
  ...commitmentFindings(r),
  ...keyFindings(r),
]

function supportFindings(r: AwsReadings): AttentionItem[] {
  const out: AttentionItem[] = []
  for (const cluster of everywhere(r.clusters)) {
    if (cluster.standardEnds === null) continue
    const left = days(cluster.standardEnds - r.now)
    if (left > AWS_LIMITS.supportWarnDays) continue
    out.push(
      finding({
        id: `support:eks:${cluster.region}:${cluster.name}`,
        weight: 'warn',
        tag: 'SUPPORT',
        title:
          left < 0
            ? `EKS ${cluster.name} ${cluster.version ?? ''} is past standard support`
            : `EKS ${cluster.name} ${cluster.version ?? ''}: standard support ends in ${left}d`,
        region: cluster.region,
        item: { service: 'eks', id: cluster.name },
        since: r.now,
        why: 'describe-cluster-versions: endOfStandardSupportDate. Extended support costs six times as much.',
      }),
    )
  }
  for (const fn of everywhere(r.functions)) {
    const since = fn.runtime === null ? undefined : DEPRECATED_RUNTIMES[fn.runtime]
    if (since === undefined) continue
    out.push(
      finding({
        id: `support:lambda:${fn.region}:${fn.name}`,
        weight: 'warn',
        tag: 'SUPPORT',
        title: `${fn.name} runs ${fn.runtime}, deprecated ${since}`,
        region: fn.region,
        item: { service: 'lambda', id: fn.name },
        since: Date.parse(since),
        why: 'A deprecated runtime gets no security patches (the table shipped with elecdex).',
      }),
    )
  }
  return out
}

/** When a stopped instance stopped, from its transition reason ("User initiated (2026-10-01 …)"). */
export function stoppedAt(reason: string | null | undefined): number | null {
  const match = /\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) GMT\)/.exec(reason ?? '')
  return match ? Date.parse(`${match[1]?.replace(' ', 'T')}Z`) : null
}

const unattachedFindings = (r: AwsReadings): AttentionItem[] => [
  ...everywhere(r.volumes)
    .filter((volume) => volume.state === 'available')
    .map((volume) =>
      finding({
        id: `cost:volume:${volume.region}:${volume.id}`,
        weight: 'warn',
        tag: 'COST',
        title: `${volume.name ?? volume.id} · ${volume.size} GiB attached to nothing`,
        region: volume.region,
        item: { service: 'ebs', id: volume.id },
        since: Date.parse(volume.created ?? '') || r.now,
        why: 'An unattached volume bills its GiB every month.',
      }),
    ),
  ...everywhere(r.addresses)
    .filter((address) => !address.associated)
    .map((address) =>
      finding({
        id: `cost:eip:${address.region}:${address.ip}`,
        weight: 'warn',
        tag: 'COST',
        title: `Elastic IP ${address.ip} attached to nothing`,
        region: address.region,
        item: { service: 'eip', id: address.ip },
        since: r.now,
        why: 'Every public IPv4 address bills by the hour, attached or not.',
      }),
    ),
]

const stoppedFindings = (r: AwsReadings): AttentionItem[] =>
  everywhere(r.instances).flatMap((instance) => {
    const at = instance.state === 'stopped' ? stoppedAt(instance.reason) : null
    if (at === null || days(r.now - at) <= AWS_LIMITS.stoppedDays) return []
    return [
      finding({
        id: `cost:stopped:${instance.region}:${instance.id}`,
        weight: 'warn',
        tag: 'COST',
        title: `${instance.name ?? instance.id} stopped ${days(r.now - at)} days ago`,
        region: instance.region,
        item: { service: 'ec2', id: instance.id },
        since: at,
        why: `Stopped over ${AWS_LIMITS.stoppedDays} days: its EBS volumes go on billing.`,
      }),
    ]
  })

/** An EKS cluster billed at the extended price: its version past standard support. */
export const onExtendedSupport = (
  cluster: { support: string | null; standardEnds: number | null },
  now: number,
) => cluster.support === 'EXTENDED' && cluster.standardEnds !== null && cluster.standardEnds < now

const extendedFindings = (r: AwsReadings): AttentionItem[] =>
  everywhere(r.clusters)
    .filter((cluster) => onExtendedSupport(cluster, r.now))
    .map((cluster) =>
      finding({
        id: `cost:eks-extended:${cluster.region}:${cluster.name}`,
        weight: 'warn',
        tag: 'COST',
        title: `EKS ${cluster.name} bills extended support`,
        region: cluster.region,
        item: { service: 'eks', id: cluster.name },
        since: cluster.standardEnds ?? r.now,
        why: 'About six times the standard hourly price until it is upgraded.',
      }),
    )

const costFindings = (r: AwsReadings): AttentionItem[] => [
  ...unattachedFindings(r),
  ...stoppedFindings(r),
  ...extendedFindings(r),
]

const budgetFindings = (r: AwsReadings): AttentionItem[] =>
  (r.budgets ?? []).flatMap((budget) => {
    const over = budget.limit > 0 && budget.forecast !== null && budget.forecast > budget.limit
    const near = budget.limit > 0 && budget.actual > budget.limit * AWS_LIMITS.budgetActual
    if (!over && !near) return []
    return [
      finding({
        id: `budget:${budget.name}`,
        weight: 'warn',
        tag: 'BUDGET',
        title: over
          ? `${budget.name}: forecast $${Math.round(budget.forecast ?? 0)} over $${Math.round(budget.limit)}`
          : `${budget.name}: $${Math.round(budget.actual)} of $${Math.round(budget.limit)} spent`,
        since: r.now,
        why: `AWS Budgets: the forecast over 100%, or the actual over ${AWS_LIMITS.budgetActual * 100}%.`,
      }),
    ]
  })

function planFindings(r: AwsReadings): AttentionItem[] {
  const plan = r.plan
  if (plan?.kind === 'credits') {
    const left = plan.expires === null ? null : days(plan.expires - r.now)
    return left !== null && left <= AWS_LIMITS.planDays
      ? [
          finding({
            id: 'plan:credits',
            weight: 'warn',
            tag: 'PLAN',
            title: `The free plan's credits end in ${left}d`,
            since: r.now,
            why: 'freetier get-account-plan-state.',
          }),
        ]
      : []
  }
  return (plan?.items ?? [])
    .filter((item) => item.share > AWS_LIMITS.freeTierShare)
    .map((item) =>
      finding({
        id: `plan:${item.service}:${item.usage}`,
        weight: 'warn',
        tag: 'PLAN',
        title: `${item.service} free tier ${Math.round(item.share * 100)}% used`,
        since: r.now,
        why: `Over ${AWS_LIMITS.freeTierShare * 100}% of this month's free tier (get-free-tier-usage).`,
      }),
    )
}

const moneyFindings = (r: AwsReadings): AttentionItem[] => [
  ...budgetFindings(r),
  ...planFindings(r),
]

/**
 * Every finding, heaviest first, then by tag, then the oldest: a reading again never reorders
 * what stays (cloud-cli.md §7).
 */
export function attention(r: AwsReadings): AttentionItem[] {
  const byId = new Map<string, AttentionItem>()
  for (const item of [
    ...alarmFindings(r),
    ...healthFindings(r),
    ...stackFindings(r),
    ...securityFindings(r),
    ...expiryFindings(r),
    ...supportFindings(r),
    ...costFindings(r),
    ...moneyFindings(r),
  ])
    if (!byId.has(item.id)) byId.set(item.id, item)
  return [...byId.values()].sort(
    (a, b) =>
      ORDER[a.weight] - ORDER[b.weight] ||
      a.tag.localeCompare(b.tag) ||
      a.since - b.since ||
      a.id.localeCompare(b.id),
  )
}

/** How many checks the readings answered, for "nothing needs attention · 31 checks across 3 regions". */
export function checksRun(r: AwsReadings): number {
  const global = [r.summary, r.credentials, r.budgets, r.plan, r.domains, r.savings].filter(
    (x) => x !== null,
  ).length
  const regional = [
    r.alarms,
    r.impaired,
    r.stacks,
    r.volumes,
    r.addresses,
    r.instances,
    r.openGroups,
    r.functions,
    r.clusters,
    r.certificates,
    r.backups,
    r.guardduty,
    r.reserved,
  ].reduce((n, per) => n + Object.values(per).filter((v) => v !== null).length, 0)
  return global + regional
}
