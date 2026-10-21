export function archiveIds(programs: Record<string, unknown>): string[]
export function checkSha256(file: string, expected: string): void
export function fetchChecked(file: string, expected: string, download: (to: string) => void): void
