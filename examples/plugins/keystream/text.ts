/**
 * The few words that are sentences rather than the terminal's labels, in the app's
 * language. The labels (TRACK, SYNC, SIGNAL, ...) stay as they are in every language, as
 * the rest of elecdex's readouts do.
 */

export interface Words {
  connect: string
  /** Keys play by where they are, whatever the keyboard prints on them. */
  layout: string
}

const EN: Words = {
  connect: 'CLICK HERE TO CONNECT THE KEYBOARD',
  layout:
    'A KEY PLAYS BY ITS PLACE, NOT ITS LETTER: THE HOME ROW IS THE WHITE KEYS, THE ROW ABOVE THE BLACK',
}

const JA: Words = {
  connect: 'クリックしてキーボードを接続',
  layout: '音はキーの文字でなく位置で決まる：ホーム段が白鍵、その上の段が黒鍵',
}

export const wordsFor = (locale: string): Words => (locale.startsWith('ja') ? JA : EN)
