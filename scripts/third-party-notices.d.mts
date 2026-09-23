/** Types for third-party-notices.mjs, which the build config and a unit test import. */

import type { Plugin } from 'vite'

export interface LicenceText {
  file: string
  text: string
}

export interface NoticePackage {
  name: string
  version: string
  license: string
  url: string
  repository: string | null
  author: string
  texts: LicenceText[]
  /** The package whose licence text was borrowed, when this one carries none. */
  borrowed: string | null
}

export interface DataSource {
  name: string
  use: string
  licence: string
  credit: string
}

export const BUNDLED_DIR: string
export const DATA_SOURCES: readonly DataSource[]
export const DATA_PACKAGES: readonly string[]
export function packageRootOf(id: string): string | null
export function bundledPackages(target: string): Plugin
export function readPackage(root: string): NoticePackage
export function withBorrowedTexts(packages: readonly NoticePackage[]): NoticePackage[]
export function renderNotices(
  packages: readonly NoticePackage[],
  extra?: readonly { title: string; text: string }[],
): string
export function shippedPackages(root: string): string[]
