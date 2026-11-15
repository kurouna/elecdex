/**
 * Article pictures as the page holds them: data URLs main fetched (main/feeds/images.ts), asked
 * for once per picture however many cards show it, and kept for the page's life up to KEPT.
 * A picture main would not or could not give stays null, and the card draws its plate instead.
 */

const KEPT = 80
const asked = new Map<string, Promise<string | null>>()

export function feedImage(url: string): Promise<string | null> {
  const known = asked.get(url)
  if (known !== undefined) return known
  const job = window.elecdex.feeds.image(url).catch(() => null)
  asked.set(url, job)
  while (asked.size > KEPT) {
    const oldest = asked.keys().next().value
    if (oldest === undefined) break
    asked.delete(oldest)
  }
  return job
}
