import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isLicencePage, LICENCE_PAGES, PLAMO_LICENSE_URL } from '../../src/shared/translate/board'
import { ENGINE_BUILD, ENGINE_COMMIT, LICENSE_URL } from '../../src/shared/translate/engines'

/**
 * The licences TRANSLATE keeps and shows (docs/translate.md §4.1, §3): llama.cpp's, bundled for
 * the build elecdex fetches and written beside it; and the pages SETUP and ENGINE may open.
 */

const bundled = readFileSync(
  path.join(__dirname, '../../resources/translate/llama.cpp-licenses.txt'),
  'utf8',
)

describe('the llama.cpp licences elecdex bundles', () => {
  it('are those of the build it fetches: run gen:llama-licenses when the build changes', () => {
    expect(bundled.split('\n')[0]).toBe(
      `llama.cpp ${ENGINE_BUILD} (https://github.com/ggml-org/llama.cpp, commit ${ENGINE_COMMIT})`,
    )
    expect(LICENSE_URL).toContain(ENGINE_COMMIT)
  })

  it('hold llama.cpp’s MIT licence in full, and the code built into llama-server', () => {
    expect(bundled).toContain('MIT License')
    expect(bundled).toContain('Copyright (c) 2023-2026 The ggml authors')
    expect(bundled).toContain('Permission is hereby granted, free of charge')
    for (const part of [
      'nlohmann/json',
      'cpp-httplib',
      'xxHash',
      'miniaudio',
      'stb_image',
      'subprocess.h',
    ]) {
      expect(bundled).toContain(part)
    }
  })
})

describe('the licence pages', () => {
  it('opens only the fixed pages, by name', () => {
    expect(LICENCE_PAGES.plamo).toBe(PLAMO_LICENSE_URL)
    expect(isLicencePage('plamo')).toBe(true)
    expect(isLicencePage('register')).toBe(true)
    expect(isLicencePage('llama')).toBe(true)
    for (const raw of ['toString', 'https://example.com', '', 1, null, undefined]) {
      expect(isLicencePage(raw)).toBe(false)
    }
  })
})
