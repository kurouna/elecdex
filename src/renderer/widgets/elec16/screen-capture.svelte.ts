import type { Model } from '@shared/elec16/map'
import type { Elec16State } from '@shared/elec16/state'
import type { Elec16PngSave } from '@shared/elec16-units'
import type { UtilityCopy } from '@shared/utility'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import type { LcdColours } from './lcd-painter.ts'
import { type LcdLook, type ScreenImage, screenImage } from './screen-image.ts'
import { copyText, screenLines } from './screen-text.ts'

/**
 * TUNE's SCREEN (docs/elec16.md section 7): COPY TEXT, COPY IMAGE and SAVE PNG, one at a time.
 * What a press takes - the model, the screen - is read when it is pressed, so a machine that
 * changes while the PNG is made or the save dialog is open changes nothing about it. A press
 * says so for a moment (`flag`) or says why it did nothing (`note`); once the pane is gone it
 * does and says nothing more.
 */

/** What is taken from: the model, its state, and how to read its dots. */
export interface Capturable {
  readonly model: Model
  readonly state: Elec16State
  pixels(): Uint8Array
}

/** How the pane draws the LCD: its picture is drawn the same. */
export interface CaptureLook {
  colours: LcdColours
  paneContrast: number
  lcd: LcdLook
}

/** What a capture needs of the page: main's copy and save, a PNG made, a sound when done. */
export interface CaptureDeps {
  copy(what: UtilityCopy): Promise<boolean>
  savePng(png: Uint8Array, model: Model['id']): Promise<Elec16PngSave>
  png(image: ScreenImage): Promise<Uint8Array | null>
  done(): void
}

export type CaptureKind = 'text' | 'image' | 'png'

export class ScreenCapture {
  /** A capture is under way: the buttons wait for it. */
  busy = $state(false)
  /** Why the last press did nothing, until the next or `clearNote`. */
  note = $state('')
  /** The button that just did its work, while it says so. */
  readonly flag = new CopyFlag()

  readonly #deps: CaptureDeps
  #gone = false

  constructor(deps: CaptureDeps) {
    this.#deps = deps
  }

  async take(what: CaptureKind, machine: Capturable, look: CaptureLook): Promise<void> {
    if (this.busy || this.#gone) return
    this.busy = true
    this.note = ''
    // Read now: the model and the screen as they are at the press.
    const model = machine.model
    try {
      const note =
        what === 'text'
          ? await this.#text(copyText(screenLines(model, machine.state)))
          : await this.#picture(
              what,
              model.id,
              screenImage(
                model,
                machine.state,
                () => machine.pixels(),
                look.colours,
                look.paneContrast,
                look.lcd,
              ),
            )
      if (this.#gone) return
      if (note === null) this.#deps.done()
      else this.note = note
    } finally {
      if (!this.#gone) this.busy = false
    }
  }

  clearNote(): void {
    if (this.note !== '') this.note = ''
  }

  dispose(): void {
    this.#gone = true
    this.flag.dispose()
  }

  /** COPY TEXT: null when it is on the clipboard, else why not. */
  async #text(text: string): Promise<string | null> {
    if (text === '') return 'there is no text on the screen'
    const done = await this.flag.through('text', () => this.#deps.copy({ kind: 'text', text }))
    return done ? null : 'the clipboard could not be written'
  }

  /** COPY IMAGE or SAVE PNG: null when done, else why not ('' when the save was called off). */
  async #picture(
    what: 'image' | 'png',
    model: Model['id'],
    image: ScreenImage,
  ): Promise<string | null> {
    const data = await this.#deps.png(image)
    if (data === null) return 'the picture could not be made'
    if (this.#gone) return ''
    if (what === 'image') {
      const done = await this.flag.through('image', () => this.#deps.copy({ kind: 'png', data }))
      return done ? null : 'the clipboard could not be written'
    }
    let saved = 'failed' as Elec16PngSave
    await this.flag.through('png', async () => {
      saved = await this.#deps.savePng(data, model)
      return saved === 'saved'
    })
    if (saved === 'failed') return 'the picture could not be saved'
    return saved === 'saved' ? null : ''
  }
}
