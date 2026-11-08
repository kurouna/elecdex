/**
 * What AWS STATUS's and GITHUB STATUS's services do alike with their boards (docs/cloud-cli.md
 * §3): how many stopped boards stay for a quick showing again, and the 30 s between two presses
 * of REFRESH (and of ELSEWHERE's "check other regions now").
 */

/** The least time between two presses that read again. */
export const REFRESH_GAP_MS = 30_000

/** The wait left before a press may read again, or 0 when it may now. */
export const gapLeft = (pressedAt: number, now: number): number =>
  Math.max(0, pressedAt + REFRESH_GAP_MS - now)

/**
 * Boards kept for a quick showing again: the stopped ones beyond a few go, oldest first, so a
 * pane whose key changes (regions, repositories) does not leave every old board in memory.
 */
const KEPT_BOARDS = 6

export function evictStopped(boards: Map<string, { scheduler: { active: boolean } }>): void {
  for (const [key, board] of boards) {
    if (boards.size <= KEPT_BOARDS) return
    if (!board.scheduler.active) boards.delete(key)
  }
}
