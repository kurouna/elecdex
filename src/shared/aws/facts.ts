/**
 * The named limits AWS STATUS judges by, and the small facts read from a reading, shared by
 * ATTENTION, ACTIVE and RESOURCES (aws.md §4.1, §5.0, §14.3) so the three say the same. Pure,
 * and importing nothing, so every judgement can take it without a cycle.
 */

export const AWS_LIMITS = {
  /** A certificate or domain in use this close to its end is danger, then warn. */
  expiryDangerDays: 7,
  expiryWarnDays: 30,
  /** Access keys older than this. */
  keyAgeDays: 90,
  /** Standard support ending this soon (EKS). */
  supportWarnDays: 90,
  /** A stopped instance's EBS goes on billing: it looks forgotten after this many days. */
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
  /** RESOURCES (aws.md §14.2, §14.3): a forgotten row is danger from this ≈ $ a month. */
  forgottenDangerUsd: 500,
  /** A tile's frame warns when its forgotten ones come to this ≈ $ a month. */
  tileWarnUsd: 50,
  /** Quiet means this many days by default; a window shorter than it ranks lower. */
  quietDays: 30,
  /** Trusted Advisor's low utilization: this many days of the fourteen under both limits. */
  lowUseDays: 4,
  lowUseCpuPercent: 10,
  lowUseNetworkBytes: 5 * 1024 * 1024,
  /** A bucket whose size has not moved this long, mostly in STANDARD. */
  unchangedDays: 90,
  /** An image no instance launched from, a repository nobody pulled from, this long. */
  unusedImageDays: 90,
  /** A SageMaker notebook, and a Studio app, left InService this long. */
  notebookDays: 7,
  studioAppDays: 1,
  /** A VPN whose tunnels have all been down this long. */
  tunnelDownDays: 30,
  /** KEEP is taken off when the ≈ $ a month grows past this many times its amount when marked. */
  keepReshow: 2,
} as const

/** When a stopped instance stopped, from its transition reason ("User initiated (2026-10-01 …)"). */
export function stoppedAt(reason: string | null | undefined): number | null {
  const match = /\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) GMT\)/.exec(reason ?? '')
  return match ? Date.parse(`${match[1]?.replace(' ', 'T')}Z`) : null
}

/** An EKS cluster billed at the extended price: its version past standard support. */
export const onExtendedSupport = (
  cluster: { support: string | null; standardEnds: number | null },
  now: number,
) => cluster.support === 'EXTENDED' && cluster.standardEnds !== null && cluster.standardEnds < now
