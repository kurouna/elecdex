/**
 * chrF (Popović 2015): how much two texts share, by character n-grams of one to six, recall
 * weighted twice (β = 2), white space left out as sacreBLEU's default does. ROUND TRIP compares
 * the source with what came back (docs/translate.md §6.4, Q6): 0 to 100, under 70 is said.
 */

const MAX_N = 6
const BETA = 2

function grams(text: string, n: number): Map<string, number> {
  const chars = [...text.replace(/\s+/gu, '')]
  const counts = new Map<string, number>()
  for (let i = 0; i + n <= chars.length; i++) {
    const gram = chars.slice(i, i + n).join('')
    counts.set(gram, (counts.get(gram) ?? 0) + 1)
  }
  return counts
}

/** chrF of `hypothesis` against `reference`, 0 to 100. */
export function chrF(reference: string, hypothesis: string): number {
  let precision = 0
  let recall = 0
  let orders = 0
  for (let n = 1; n <= MAX_N; n++) {
    const ref = grams(reference, n)
    const hyp = grams(hypothesis, n)
    const refTotal = [...ref.values()].reduce((a, b) => a + b, 0)
    const hypTotal = [...hyp.values()].reduce((a, b) => a + b, 0)
    if (refTotal === 0 || hypTotal === 0) continue
    let match = 0
    for (const [gram, count] of hyp) match += Math.min(count, ref.get(gram) ?? 0)
    precision += match / hypTotal
    recall += match / refTotal
    orders++
  }
  if (orders === 0) return reference.trim() === hypothesis.trim() ? 100 : 0
  const p = precision / orders
  const r = recall / orders
  if (p === 0 && r === 0) return 0
  return (100 * ((1 + BETA ** 2) * p * r)) / (BETA ** 2 * p + r)
}

/** Under this a round trip is said in the warning colour (Q6). */
export const CHRF_WARN = 70
