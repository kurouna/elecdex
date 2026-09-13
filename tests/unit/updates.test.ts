import { describe, expect, it } from 'vitest'
import { compareVersions, parseRelease } from '../../src/shared/updates.js'

describe('compareVersions', () => {
  it('orders versions as semver does', () => {
    expect(compareVersions('0.1.0', '0.0.9')).toBeGreaterThan(0)
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0)
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0-beta.2', '1.0.0')).toBeLessThan(0)
    expect(compareVersions('1.0.0-beta.10', '1.0.0-beta.2')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0)
    expect(compareVersions('nonsense', '1.0.0')).toBe(0)
  })
})

describe('parseRelease', () => {
  const release = {
    tag_name: 'v0.2.0',
    html_url: 'https://github.com/kurouna/elecdex/releases/tag/v0.2.0',
    draft: false,
    prerelease: false,
  }

  it('reads a published release of this repository', () => {
    expect(parseRelease(release)).toEqual({
      version: '0.2.0',
      url: 'https://github.com/kurouna/elecdex/releases/tag/v0.2.0',
    })
  })

  it('ignores drafts, pre-releases, odd tags and pages elsewhere', () => {
    expect(parseRelease({ ...release, draft: true })).toBeNull()
    expect(parseRelease({ ...release, prerelease: true })).toBeNull()
    expect(parseRelease({ ...release, tag_name: 'latest' })).toBeNull()
    expect(parseRelease({ ...release, html_url: 'https://evil.example/elecdex' })).toBeNull()
    expect(parseRelease(null)).toBeNull()
  })
})
