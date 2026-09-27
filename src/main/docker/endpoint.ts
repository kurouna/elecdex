import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  contextHost,
  contextName,
  defaultEndpoints,
  type EndpointAnswer,
  parseDockerHost,
} from '@shared/docker'

/** What of the process environment decides where the engine is. */
export interface EndpointEnv {
  DOCKER_HOST?: string | undefined
  DOCKER_CONTEXT?: string | undefined
  DOCKER_CONFIG?: string | undefined
  DOCKER_TLS_VERIFY?: string | undefined
  XDG_RUNTIME_DIR?: string | undefined
}

export interface EndpointFiles {
  exists(file: string): boolean
  /** The file's JSON, or undefined when it is missing or not JSON. */
  readJson(file: string): unknown
}

const realFiles: EndpointFiles = {
  exists: (file) => existsSync(file),
  readJson: (file) => {
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as unknown
    } catch {
      return undefined
    }
  },
}

/**
 * Where the engine is, found as the Docker CLI finds it - `DOCKER_HOST`, then
 * the current context (`DOCKER_CONTEXT`, or the config's `currentContext`, whose
 * address is in `contexts/meta/<sha256 of its name>/meta.json`), then where
 * Docker usually puts its socket - but by reading those files, never by running
 * the CLI. So colima, OrbStack, Docker Desktop on Linux and rootless Docker are
 * reached as the user's own `docker` reaches them. Nothing here is the page's to
 * change: the address follows this process's environment and the user's files.
 *
 * Asked again at each attempt to link, so a context switched meanwhile is followed.
 */
export function findEndpoint(
  env: EndpointEnv,
  platform: string,
  home: string,
  files: EndpointFiles = realFiles,
): EndpointAnswer {
  const tlsWanted = (env.DOCKER_TLS_VERIFY ?? '') !== ''
  const host = env.DOCKER_HOST?.trim()
  if (host) return parseDockerHost(host, host, tlsWanted)

  const configDir = env.DOCKER_CONFIG?.trim() || path.join(home, '.docker')
  const name = contextName(env.DOCKER_CONTEXT, files.readJson(path.join(configDir, 'config.json')))
  if (name !== null) {
    const digest = createHash('sha256').update(name).digest('hex')
    const address = contextHost(
      files.readJson(path.join(configDir, 'contexts', 'meta', digest, 'meta.json')),
    )
    if (address === null) return { unsupported: `the context "${name}" has no engine address` }
    const tls = tlsWanted || files.exists(path.join(configDir, 'contexts', 'tls', digest, 'docker'))
    return parseDockerHost(address, `context ${name}`, tls)
  }

  const candidates = defaultEndpoints(platform, home, env.XDG_RUNTIME_DIR?.trim() || null)
  const first = candidates[0]
  if (first === undefined) return { unsupported: 'no engine address for this system' }
  if (platform === 'win32') return { endpoint: first }
  const present = candidates.find(
    (candidate) => candidate.kind === 'socket' && files.exists(candidate.path),
  )
  return { endpoint: present ?? first }
}
