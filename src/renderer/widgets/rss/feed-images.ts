/**
 * Article pictures as the page holds them: data URLs main fetched (main/feeds/images.ts), asked
 * for once per picture however many cards show it, and kept for the page's life up to KEPT.
 * A picture main would not or could not give is null, and the card draws its plate instead. A
 * null is not kept: the next draw asks main again, and main, which remembers its failures,
 * decides - a refusal stays one, a passing failure is tried again after IMAGE_RETRY_MS. Kept
 * here, a picture missed while offline stayed missing for the page's life (found in review).
 */

const KEPT = 80
const asked = new Map<string, Promise<string | null>>()

export function feedImage(url: string): Promise<string | null> {
  const known = asked.get(url)
  if (known !== undefined) return known
  const job = window.elecdex.feeds
    .image(url)
    .catch(() => null)
    .then((data) => {
      if (data === null && asked.get(url) === job) asked.delete(url)
      return data
    })
  asked.set(url, job)
  while (asked.size > KEPT) {
    const oldest = asked.keys().next().value
    if (oldest === undefined) break
    asked.delete(oldest)
  }
  return job
}
