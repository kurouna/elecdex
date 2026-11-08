import { classifyCliError } from '@shared/cloud-cli/errors'
import type { CliCall, CliResult } from '@shared/cloud-cli/probe'

/**
 * Whether a board's calls reach AWS in each region (aws.md §14.4). A region without Bedrock or
 * OpenSearch Serverless answers `Could not connect to the endpoint URL` - the very words AWS CLI
 * says offline - so those words mean "not offered" only while another call in the same region
 * has just been answered, and none has failed for the network since. Otherwise it is the
 * network, and nothing is kept as "not offered" for hours.
 */
export class RegionReach {
  /** Calls counted in the order they ended: what came last, whatever the clock says. */
  #count = 0
  /** Per region: the last call answered (when, and its place), and the last that could not reach. */
  readonly #answered = new Map<string, { at: number; n: number }>()
  readonly #unreached = new Map<string, number>()

  note(call: CliCall, result: CliResult, now: number): void {
    if (call.tool !== 'aws') return
    const at = call.argv.indexOf('--region')
    const region = at < 0 ? undefined : call.argv[at + 1]
    if (region === undefined) return
    this.#count += 1
    if (result.ok) {
      this.#answered.set(region, { at: now, n: this.#count })
      return
    }
    const kind = classifyCliError('aws', result).kind
    // A refusal or a throttle is AWS answering; a region's missing service says nothing either way.
    if (kind === 'denied' || kind === 'throttled')
      this.#answered.set(region, { at: now, n: this.#count })
    else if (kind === 'offline' || kind === 'timeout') this.#unreached.set(region, this.#count)
  }

  /** Answered within `window` ms, and no call failed for the network after it. */
  reached(region: string, now: number, window: number): boolean {
    const answered = this.#answered.get(region)
    if (answered === undefined || now - answered.at > window) return false
    return (this.#unreached.get(region) ?? 0) < answered.n
  }
}
