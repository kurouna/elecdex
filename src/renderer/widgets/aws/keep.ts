import type { ForgottenRow } from '@shared/aws/types'
import { afterBlink } from '../../lib/blink.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import { keptToast } from './resources-view.ts'

/**
 * KEEP (aws.md §14.3), pressed on a LOOKS FORGOTTEN row or on its third step: the press blinks
 * first (lib/blink.ts), since the answer changes what is shown, then main marks the row by its
 * key and a kept row says so in a toast. `done` runs once main took it. Apart from
 * resources-view.ts, which stays pure for its unit tests.
 */
export function keepRow(
  button: HTMLElement,
  boardKey: string,
  row: ForgottenRow,
  on: boolean,
  masked: boolean,
  done: () => void = () => {},
): void {
  afterBlink(button, () => {
    void window.elecdex.aws.keep(boardKey, row.key, on).then((taken) => {
      if (!taken) return
      sfx.play('folder')
      if (on) toasts.show({ ...keptToast(row, masked), tone: 'ok' })
      done()
    })
  })
}
