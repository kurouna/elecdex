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

/**
 * The `--dimensions` of a CloudWatch call, as AWS CLI reads them: the JSON list the probes send
 * (a value may hold a comma or an equals sign), or the `Name=…,Value=…` shorthand.
 */
export function dimensionsOf(argv: readonly string[]): { Name: string; Value: string }[] {
  const at = argv.indexOf('--dimensions')
  const first = at < 0 ? undefined : argv[at + 1]
  if (first?.startsWith('[') === true) {
    try {
      return JSON.parse(first) as { Name: string; Value: string }[]
    } catch {
      return []
    }
  }
  return argv
    .filter((a) => a.startsWith('Name='))
    .map((a) => ({ Name: a.slice(5, a.indexOf(',')), Value: a.slice(a.indexOf('Value=') + 6) }))
}
