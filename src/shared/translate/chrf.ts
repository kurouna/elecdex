/**
 * chrF (Popović 2015): how much two texts share, by character n-grams of one to six, recall
 * weighted twice (β = 2), white space left out as sacreBLEU's default does. ROUND TRIP compares
 * the source with what came back (docs/translate.md §6.4, Q6): 0 to 100, under the warning line
 * of the source's language is said.
 *
 * Both texts are normalised first: NFKC (full-width letters and digits as half-width), and
 * numbers in kanji as digits (六歳 and 6歳, 一日三回 and 1日3回 are the same thing written two
 * ways; the model writes either, and each cost a good round trip 15 to 30 points, measured
 * 2026-11-06).
 */

const MAX_N = 6
const BETA = 2

const KANJI_DIGIT: Record<string, number> = {
  〇: 0,
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  // Chinese 两 (兩), two before a counter: 两本 and 2本.
  两: 2,
  兩: 2,
}
const KANJI_UNIT: Record<string, number> = { 十: 10, 百: 100, 千: 1000 }

/**
 * A number below 万 in kanji, digits or both, as digits: 十二 → 12, 百 → 100, 二〇二六 → 2026,
 * 五千 → 5000, 5千 → 5000. Digits written one by one (二〇二六, 2026) keep their places.
 */
function belowMan(part: string): string {
  const chars = [...part]
  const digitOf = (ch: string): number | undefined =>
    ch in KANJI_DIGIT ? KANJI_DIGIT[ch] : /[0-9]/.test(ch) ? Number(ch) : undefined
  if (chars.every((ch) => digitOf(ch) !== undefined)) return chars.map(digitOf).join('')
  let total = 0
  let digits = ''
  for (const ch of chars) {
    const digit = digitOf(ch)
    if (digit !== undefined) digits += String(digit)
    else {
      total += (digits === '' ? 1 : Number(digits)) * (KANJI_UNIT[ch] ?? 1)
      digits = ''
    }
  }
  return String(total + (digits === '' ? 0 : Number(digits)))
}

/**
 * A number in kanji or kanji and digits, the way the model writes it: the part below 万 as
 * digits, 万 and 億 kept as units (三万五千 → 3万5000, 五千万 → 5000万, 3万 → 3万). Spelt out in
 * zeros, a tenfold change (五千万 against 五百万) would share most of its characters and be
 * hidden; and digits before a 万 are part of the number, never a number of their own.
 */
export function kanjiNumber(run: string): string {
  return run.replace(/[^万億]+/gu, belowMan)
}

/**
 * The text as it is compared: NFKC (full-width digits as half-width first), then every number
 * written with kanji numerals as the model writes it in digits. A run with no kanji is left as is.
 */
export function normalizeForScore(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[0-9〇零一二三四五六七八九两兩十百千万億]+/gu, (run) =>
      /[〇零一二三四五六七八九两兩十百千万億]/u.test(run) && /[^万億]/u.test(run)
        ? kanjiNumber(run)
        : run,
    )
}

const NUMERAL = '〇零一二三四五六七八九两兩十百千万億'
/** What follows a number written in kanji, so that it is one: a counter or a unit. */
const COUNTER = /^[人回つ個年月日時歳倍台枚本冊件匹頭杯番階歩秒週点度円%％ヶ名種支只张張位]/u
/** English numbers in words, read as digits, so that "two" and 2 are one number. */
const WORDS: Record<string, string> = {
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
}

/** The numbers of a text: sure ones, and lone kanji numerals that may be numbers (第三章, 五分). */
function numberReading(text: string): { sure: string[]; maybe: string[] } {
  const plain = text
    .normalize('NFKC')
    .replace(
      /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/giu,
      (w) => WORDS[w.toLowerCase()] ?? w,
    )
  const sure: string[] = []
  const maybe: string[] = []
  for (const match of plain.matchAll(new RegExp(`[0-9${NUMERAL}][0-9.,${NUMERAL}]*`, 'gu'))) {
    const run = match[0]
    const after = plain.slice((match.index ?? 0) + run.length)
    const kanjiOnly = !/[0-9]/u.test(run)
    if (kanjiOnly && /^[万億]/u.test(run)) continue
    const number = normalizeForScore(run)
      .replace(/[.,]+$/u, '')
      .replace(/,/gu, '')
    if (number === '1') continue
    // A lone numeral with no counter after it may be part of a word (一般, 十分): it counts only
    // against the same number written in digits on the other side.
    if (kanjiOnly && [...run].length < 2 && !COUNTER.test(after)) maybe.push(number)
    else sure.push(number)
  }
  return { sure: sure.sort(), maybe }
}

/**
 * The numbers a text holds, sorted: what a round trip must keep. Digits always; a run of kanji
 * numerals when it is plainly a number - two numerals or more (十二, 五千万) or a counter after
 * it (一回, 三人) - and a lone one (一般, 十分, 第三章) only as a maybe (numbersDiffer). 1 is not
 * counted: it is "one", "a", 一つ or nothing at all in one language or the other.
 */
export function numbersOf(text: string): string[] {
  return numberReading(text).sure
}

/** `numbers` less each one found in `maybe`, once each. */
function less(numbers: readonly string[], maybe: readonly string[]): string[] {
  const left = [...maybe]
  return numbers.filter((n) => {
    const at = left.indexOf(n)
    if (at < 0) return true
    left.splice(at, 1)
    return false
  })
}

/**
 * Whether a round trip changed the numbers: both texts hold some, and not the same ones, a lone
 * kanji numeral on one side (第三章) answering the same number in digits on the other (第3章).
 * chrF cannot see it: 5000万 and 500万 differ by one character and score 74. A text with numbers
 * only on one side (twelve against 12) is not judged.
 */
export function numbersDiffer(source: string, back: string): boolean {
  const ours = numberReading(source)
  const theirs = numberReading(back)
  const left = less(ours.sure, theirs.maybe)
  const right = less(theirs.sure, ours.maybe)
  if (left.length === 0 || right.length === 0) return false
  return left.join(' ') !== right.join(' ')
}

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
  const ref0 = normalizeForScore(reference)
  const hyp0 = normalizeForScore(hypothesis)
  let precision = 0
  let recall = 0
  let orders = 0
  for (let n = 1; n <= MAX_N; n++) {
    const ref = grams(ref0, n)
    const hyp = grams(hyp0, n)
    const refTotal = [...ref.values()].reduce((a, b) => a + b, 0)
    const hypTotal = [...hyp.values()].reduce((a, b) => a + b, 0)
    // An order neither text is long enough for is left out; one only the answer lacks is an order
    // with nothing matched (sacreBLEU), so a short or empty answer does not score as a close one.
    if (refTotal === 0 && hypTotal === 0) continue
    let match = 0
    for (const [gram, count] of hyp) match += Math.min(count, ref.get(gram) ?? 0)
    precision += hypTotal > 0 ? match / hypTotal : 0
    recall += refTotal > 0 ? match / refTotal : 0
    orders++
  }
  if (orders === 0) return ref0.trim() === hyp0.trim() ? 100 : 0
  const p = precision / orders
  const r = recall / orders
  if (p === 0 && r === 0) return 0
  return (100 * ((1 + BETA ** 2) * p * r)) / (BETA ** 2 * p + r)
}

/**
 * Languages written without spaces between words: a character carries more, a paraphrase changes
 * more of the 2- to 6-character grams, and a good round trip scores lower.
 */
const UNSPACED = new Set(['ja', 'zh-hans', 'zh-hant', 'th', 'km', 'my'])

/**
 * Under this a round trip is said in the warning colour (Q6), by the language it came back in.
 * Measured with PLaMo 3 Translate 2B on this PC (2026-11-06, docs/decisions.md): good round trips
 * scored 51 to 100 in English and 8 to 100 in Japanese (median 82 and 68); another sentence's
 * meaning 10 to 22 and 1 to 20; half the translation left out 18 to 89 and 4 to 64 (median 45
 * and 23). 50 and 30 say every unrelated meaning and most halves, and of good ones only those
 * whose style changed (classical Japanese put back modern).
 */
export function tripWarnLine(lang: string): number {
  return UNSPACED.has(lang) ? 30 : 50
}
