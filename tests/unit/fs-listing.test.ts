import path from 'node:path'
import { isNetworkPath } from '@shared/fs'
import { describe, expect, it } from 'vitest'
import { validatePath } from '../../src/main/fs/listing.js'

/**
 * What the file pane may ask main to list or watch. It follows a terminal's folder, which any
 * printed text can name, so a network share is refused: listing one makes Windows offer the
 * user's NTLM hash to its host (found in a security review).
 */

const SHARES = [
  '\\\\server\\share',
  '\\\\attacker.example@SSL\\s',
  '\\\\?\\UNC\\server\\share',
  '\\\\.\\pipe\\x',
  '//server/share',
  '/\\server\\share',
  '\\/server/share',
]

describe('validatePath', () => {
  it('takes an absolute path, normalised', () => {
    const dir = path.resolve('/work/app')
    expect(validatePath(dir)).toBe(dir)
    expect(validatePath(path.join(dir, '..', 'app'))).toBe(dir)
  })

  it('refuses what is not a plain absolute path', () => {
    for (const raw of [42, '', 'relative', 'a\0b', `/${'x'.repeat(5000)}`]) {
      expect(validatePath(raw)).toBeNull()
    }
  })

  it.each(SHARES)('refuses the network share %s', (share) => {
    expect(isNetworkPath(share)).toBe(true)
    expect(validatePath(share)).toBeNull()
  })

  it('takes a drive or a root, which are not shares', () => {
    for (const local of ['C:\\Users', 'C:/Users', '/home/me', '/']) {
      expect(isNetworkPath(local)).toBe(false)
    }
  })
})
