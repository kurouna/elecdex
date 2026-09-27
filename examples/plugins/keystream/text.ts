/**
 * The few words that are sentences rather than the terminal's labels, in the app's
 * language. The labels (TRACK, SYNC, SIGNAL, ...) stay as they are in every language, as
 * the rest of elecdex's readouts do.
 */

export interface Words {
  connect: string
}

const EN: Words = {
  connect: 'CLICK HERE TO CONNECT THE KEYBOARD',
}

const JA: Words = {
  connect: 'クリックしてキーボードを接続',
}

export const wordsFor = (locale: string): Words => (locale.startsWith('ja') ? JA : EN)
