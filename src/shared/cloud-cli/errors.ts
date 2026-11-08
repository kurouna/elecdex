import type { CliResult, CliTool } from './probe.js'

/**
 * What went wrong with a CLI call, in the words the panes show (docs/cloud-cli.md §4).
 *
 * A CLI's standard error is never shown, sent to the page, toasted or logged as it is: AWS's
 * denials name the caller's ARN and account ("User: arn:aws:iam::4829…:user/x is not authorized to
 * perform: …"). Only the kind and what is taken out of it in a fixed form cross IPC; anything not
 * recognised goes through `redactCliText` first.
 */
export type CliProblem =
  | { kind: 'no-cli' }
  | { kind: 'signed-out'; via: 'login' | 'sso' | 'mfa' | 'keys' | 'gh' }
  | { kind: 'denied'; action: string | null }
  | { kind: 'throttled' }
  | { kind: 'offline' }
  /**
   * A service with no endpoint in that region (Bedrock, OpenSearch Serverless…; aws.md §14.4): not
   * the network, so never OFFLINE, nor a denial for PARTIAL. Only the service's label is kept.
   */
  | { kind: 'not-offered'; service: string }
  | { kind: 'timeout' }
  | { kind: 'error'; text: string }

const AWS_MFA = /Enter MFA code|mfa_serial|MFA token/i
const AWS_LOGIN = /Unable to refresh login credentials|aws login\b|login session/i
const AWS_SSO =
  /Token has expired and refresh failed|SSO session .*(expired|invalid)|UnauthorizedSSOToken|Error loading SSO Token|aws sso login/i
const AWS_KEYS =
  /Unable to locate credentials|ExpiredToken|security token included in the request is (expired|invalid)|InvalidClientTokenId|SignatureDoesNotMatch/i
const DENIED =
  /AccessDenied|not authorized to perform|UnauthorizedOperation|AuthorizationError|Resource not accessible|HTTP 403/i
const DENIED_ACTION = /perform: ([\w-]+:[\w*]+)/
const THROTTLED =
  /Throttling|ThrottlingException|Rate exceeded|TooManyRequests|RequestLimitExceeded|API rate limit exceeded|secondary rate limit|HTTP 429/i
const OFFLINE =
  /Could not connect to the endpoint URL|EndpointConnectionError|getaddrinfo|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|error connecting to|dial tcp|no such host|Connection was closed/i
/**
 * The services some regions do not offer (aws.md §14.4), by their endpoint's first label: there
 * AWS CLI says `Could not connect to the endpoint URL: "https://bedrock.<region>.amazonaws.com/…"`
 * just as it does offline. Every other service is in every region the pane reads, so the same
 * words from it still mean the network.
 */
const NOT_EVERYWHERE =
  /Could not connect to the endpoint URL: "https:\/\/(bedrock|bedrock-agent|bedrock-agentcore-control|aoss|redshift-serverless|transfer|api\.sagemaker)\.[a-z0-9-]+\.amazonaws\.com/
const GH_SIGNED_OUT =
  /gh auth login|not logged in|HTTP 401|Bad credentials|authentication token|token in \S+ is invalid|no oauth token/i

/** How a CLI said its sign-in is gone, or null. */
const SIGNED_OUT: Record<CliTool, readonly [RegExp, 'login' | 'sso' | 'mfa' | 'keys' | 'gh'][]> = {
  aws: [
    [AWS_MFA, 'mfa'],
    [AWS_LOGIN, 'login'],
    [AWS_SSO, 'sso'],
    [AWS_KEYS, 'keys'],
  ],
  gh: [[GH_SIGNED_OUT, 'gh']],
}

export function classifyCliError(tool: CliTool, result: CliResult): CliProblem {
  if (result.missing) return { kind: 'no-cli' }
  if (result.timedOut) return { kind: 'timeout' }
  const text = result.stderr
  const via = SIGNED_OUT[tool].find(([pattern]) => pattern.test(text))?.[1]
  if (via !== undefined) return { kind: 'signed-out', via }
  if (THROTTLED.test(text)) return { kind: 'throttled' }
  if (DENIED.test(text)) return { kind: 'denied', action: DENIED_ACTION.exec(text)?.[1] ?? null }
  const notOffered = tool === 'aws' ? NOT_EVERYWHERE.exec(text)?.[1] : undefined
  if (notOffered !== undefined) return { kind: 'not-offered', service: notOffered }
  if (OFFLINE.test(text)) return { kind: 'offline' }
  return { kind: 'error', text: firstLine(redactCliText(text)) }
}

/**
 * Hides what a CLI's text can carry about the account: ARNs, 12-digit account ids, e-mail
 * addresses, AWS access key ids and GitHub tokens. Always applied, MASK or not: COPY DETAILS
 * copies a toast as it is.
 */
export function redactCliText(text: string): string {
  return text
    .replace(/arn:aws[\w-]*:[^\s"',)]+/g, 'arn:…')
    .replace(/\b\d{12}\b/g, '••••••••••••')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '•••@•••')
    .replace(/\b(AKIA|ASIA)[A-Z0-9]{12,}\b/g, '$1••••')
    .replace(/\b(gh[pousr]_|github_pat_)[A-Za-z0-9_]{10,}\b/g, '$1••••')
}

/** The first line that says something, at most 120 characters, without the CLI's own prefix. */
function firstLine(text: string): string {
  const line =
    text
      .split(/\r?\n/)
      .map((part) => part.trim())
      .find((part) => part !== '') ?? ''
  return line.replace(/^(aws: \[ERROR\]: |gh: |error: )/i, '').slice(0, 120)
}

/** The command a signed-out profile or host is told to run in a shell (never run by the pane). */
export function signInCommand(problem: CliProblem, profileOrHost: string): string | null {
  if (problem.kind !== 'signed-out') return null
  switch (problem.via) {
    case 'login':
      return `aws login --profile=${profileOrHost}`
    case 'sso':
      return `aws sso login --profile=${profileOrHost}`
    case 'mfa':
    case 'keys':
      return `aws sts get-caller-identity --profile=${profileOrHost}`
    case 'gh':
      return 'gh auth login'
  }
}
