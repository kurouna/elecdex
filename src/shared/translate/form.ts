import type { Form } from './pfml3.js'

/**
 * The form a Japanese text is written in, by how its sentences end: です・ます (polite) or
 * だ・である (plain). ROUND TRIP puts a block back into Japanese in the source's own form: put
 * back into です・ます, a plain source scored half what it would (隣の客はよく柿食う客だ: 22
 * against 55, user's report 2026-11-06), since chrF counts the endings' characters.
 *
 * Only endings that say a form are counted: a heading or a noun phrase says neither. With none,
 * or as many of each, it is polite, as before.
 */

const POLITE =
  /(?:です|ます|でした|ました|ません|でしょう|ましょう|ください|下さい|ございます)[かねよなわ]*$/u
const PLAIN =
  /(?:だ|である|だった|だろう|ではない|じゃない|[っ]?た|[うくぐすつぬぶむる]|い|[てで]いる|の|んだ)[かねよなわぞさ]*$/u

/** A list item (・, -, •, 1.), whose noun or verb ending says nothing of the text's form. */
const LIST_ITEM = /^\s*(?:[・•●◦\-*＊]|\d+[.)．、）])/u

/**
 * A sentence's last word: closing marks and quotes taken off, and a closing parenthetical with
 * them (私は学生だ（大学院）).
 */
function ending(sentence: string): string {
  return sentence
    .replace(/\s*[（(][^（）()]*[）)]\s*$/u, '')
    .replace(/[\s「」『』（）()【】"'“”‘’…・、。．.！!？?〜~ー-]+$/u, '')
}

/** Nouns ending in い (お願い, 違い, はい): no form of their own. */
const NOUN_I =
  /(?:^は|願|違|扱|思|誓|祝|伺|争|戦|行|払|伝|笑|迷|集|商|占|狙|味|匂|勢|幸|会|合|舞|見|手)い$/u

export function formOf(text: string): Form {
  // What is quoted is the speaker's form, not the text's (先生は「…だ。」とおっしゃいました).
  const own = text.replace(/「[^「」]*」|『[^『』]*』/gu, '「」')
  let polite = 0
  let plain = 0
  for (const line of own.split('\n')) {
    if (LIST_ITEM.test(line)) continue
    for (const sentence of line.split(/[。．！!？?]+/u)) {
      const end = ending(sentence)
      if (end === '') continue
      if (POLITE.test(end)) polite++
      else if (PLAIN.test(end) && !NOUN_I.test(end)) plain++
    }
  }
  return plain > polite ? 'plain' : 'polite'
}
