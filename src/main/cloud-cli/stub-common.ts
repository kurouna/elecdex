import type { CliResult } from '@shared/cloud-cli/probe'

/**
 * What the stand-in CLIs share (stub-aws.ts, stub-aws-resources.ts, stub-github.ts): the made-up
 * account, the units of time, and an answer in the runner's shape. No real account, no network.
 */

/** The made-up AWS account acme-prod. */
export const ACCOUNT = '482913507216'
export const HOUR = 3_600_000
export const DAY = 24 * HOUR

/** A CLI's answer: AWS CLI ends a failure with 254, gh with 1. */
export const result = (
  ok: boolean,
  stdout: string,
  stderr = '',
  code = ok ? 0 : 254,
): CliResult => ({
  ok,
  code,
  stdout,
  stderr,
  missing: false,
  timedOut: false,
  tooLarge: false,
})

/** A JSON answer, as `--query` leaves it. */
export const ok = (value: unknown): CliResult => result(true, JSON.stringify(value))

export const iso = (at: number): string => new Date(at).toISOString()
