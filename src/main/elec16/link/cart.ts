import { CART_HEADER } from '@shared/elec16/cartridge'
import type { LinkAnswer, LinkRequest } from '@shared/elec16/link'
import { LINK_SERVICE, LINK_STATUS } from '@shared/elec16/link-services'
import type { LinkContext, LinkService } from './hub.js'

/**
 * CART, LINK's service 1 (docs/elec16-play.md section 7): what is in a unit's slot. INFO
 * answers the game's 64-byte header; LOAD the same, and brings the game itself - its image,
 * its hash and the save RAM the unit kept for it - for the page to hand to the machine's slot.
 * Nothing leaves main but for the unit whose page asked; nothing goes to the network.
 */

export interface CartDeps {
  /** Whether the unit's model has a slot; null for no such unit. */
  hasSlot(unit: string): boolean | null
  /** The game in the unit's slot, by id; null for none. */
  inSlot(unit: string): string | null
  /** A game on the shelf, with its hash; null when it is not there. */
  image(game: string): { image: Uint8Array; digest: Uint8Array } | null
  /** The save RAM the unit keeps for the game. */
  saveOf(unit: string, game: string): Uint8Array | undefined
}

export const CART_TYPE = { info: 0, load: 1 } as const

export class CartLinkService implements LinkService {
  readonly service = LINK_SERVICE.cart
  readonly #deps: CartDeps

  constructor(deps: CartDeps) {
    this.#deps = deps
  }

  async ask(request: LinkRequest, { unit }: LinkContext): Promise<LinkAnswer> {
    if (this.#deps.hasSlot(unit) !== true)
      return { status: LINK_STATUS.failed, note: 'no cartridge slot' }
    const game = this.#deps.inSlot(unit)
    if (game === null) return { status: LINK_STATUS.failed, note: 'no cartridge' }
    const held = this.#deps.image(game)
    if (held === null) return { status: LINK_STATUS.failed, note: `${game} is not on the shelf` }
    const header = held.image.slice(0, CART_HEADER)
    if (request.type !== CART_TYPE.load) return { status: LINK_STATUS.ready, data: header }
    const save = this.#deps.saveOf(unit, game)
    return {
      status: LINK_STATUS.ready,
      data: header,
      cart: { image: held.image, digest: held.digest, ...(save !== undefined ? { save } : {}) },
    }
  }

  /** It keeps nothing for a unit between requests. */
  forget(): void {}
}
