import type { Phase } from './timer'

/** The pane's words, in English and Japanese; any other language reads English. */
const EN = {
  work: 'focus',
  short: 'short break',
  long: 'long break',
  paused: 'paused',
  ready: 'ready',
  round: 'round',
  today: 'today',
  ends: 'ends',
  next: 'next',
  start: 'start',
  pause: 'pause',
  resume: 'resume',
  skip: 'skip',
  reset: 'reset',
  doneTitle: (phase: Phase): string => (phase === 'work' ? 'Focus session done' : 'Break over'),
  doneBody: (next: Phase): string =>
    next === 'work' ? 'Back to focus when you are ready.' : `Time for a ${EN[next]}.`,
}

const JA: typeof EN = {
  work: '集中',
  short: '小休憩',
  long: '長休憩',
  paused: '一時停止中',
  ready: '待機',
  round: 'ラウンド',
  today: '今日',
  ends: '終了',
  next: '次',
  start: '開始',
  pause: '一時停止',
  resume: '再開',
  skip: 'スキップ',
  reset: 'リセット',
  doneTitle: (phase) => (phase === 'work' ? '集中おわり' : '休憩おわり'),
  doneBody: (next) =>
    next === 'work' ? '準備ができたら集中を始めましょう。' : `${JA[next]}の時間です。`,
}

export const text = (locale: string): typeof EN => (locale.startsWith('ja') ? JA : EN)
