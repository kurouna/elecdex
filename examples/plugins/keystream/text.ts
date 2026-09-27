import type { Level } from './chart'

/**
 * The few words that are sentences rather than the terminal's labels, in the app's
 * language. The labels (TRACK, SYNC, SIGNAL, ...) stay as they are in every language, as
 * the rest of elecdex's readouts do.
 */

export interface Words {
  connect: string
  /** Keys play by where they are, whatever the keyboard prints on them. */
  layout: string
  /** What FREE PLAY is, beside its row in the menu. */
  free: string
  /** What each level asks, beside its chip in the menu. */
  levels: Readonly<Record<Level, string>>
}

const EN: Words = {
  connect: 'CLICK HERE TO CONNECT THE KEYBOARD',
  layout:
    'A KEY PLAYS BY ITS PLACE, NOT ITS LETTER: THE HOME ROW IS THE WHITE KEYS, THE ROW ABOVE THE BLACK',
  free: "THE KEYBOARD ALONE, OR OVER ANY TRACK'S BAND",
  levels: {
    easy: 'THE NOTES ON THE BEAT; THE REST IS PLAYED FOR YOU',
    normal: 'EVERY NOTE OF THE MELODY',
    hard: 'WINDOWS AT THREE QUARTERS; NO CARRIER WHEN THE SIGNAL RUNS OUT',
  },
}

const JA: Words = {
  connect: 'クリックしてキーボードを接続',
  layout: '音はキーの文字でなく位置で決まる：ホーム段が白鍵、その上の段が黒鍵',
  free: 'キーボードだけで、または好きな曲の伴奏に合わせて',
  levels: {
    easy: '拍頭の音だけを打つ。残りはゲームが弾く',
    normal: '旋律のすべての音を打つ',
    hard: '判定幅が 3/4 に。SIGNAL が尽きると NO CARRIER',
  },
}

export const wordsFor = (locale: string): Words => (locale.startsWith('ja') ? JA : EN)
