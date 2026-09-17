import { session } from 'electron'

/**
 * Chromium's own user agent, without the Electron and app tokens. Sign-in pages
 * and their bot checks refuse browsers that name themselves Electron; plugin
 * sign-ins and web panes both send this.
 */
export function browserUserAgent(): string {
  return session.defaultSession.getUserAgent().replace(/\s(?:elecdex|Electron)\/\S+/gi, '')
}
