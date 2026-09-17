import { webAppearance } from '@shared/web'
import type { Attachment } from 'svelte/attachments'
import { SvelteMap } from 'svelte/reactivity'
import { appearance } from './appearance.svelte.ts'

/**
 * What web panes need from the rest of the page (docs/architecture.md section 5.4).
 *
 * A web pane's page is a native view drawn over the workspace, so nothing of the
 * DOM can be seen on top of it. Elements that can overlap panes - notices, the
 * status bar, the fullscreen corner - register here, and a web pane whose
 * rectangle meets one of them while it is showing hides its view in favour of a
 * picture of it.
 */

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

const meets = (a: Box, b: DOMRect): boolean =>
  b.width > 0 &&
  b.height > 0 &&
  a.x < b.right &&
  b.left < a.x + a.width &&
  a.y < b.bottom &&
  b.top < a.y + a.height

class WebStore {
  /** Overlays, each with whether it is showing now. */
  private readonly covers = new SvelteMap<HTMLElement, () => boolean>()
  /** Bumped when an overlay may have moved or changed size, so panes measure again. */
  revision = $state(0)
  private panes = 0
  private stopAppearance: (() => void) | null = null

  /** Whether `box` meets an overlay that is showing. Reactive in the overlays and their revision. */
  covered(box: Box): boolean {
    void this.revision
    for (const [element, showing] of this.covers) {
      if (showing() && meets(box, element.getBoundingClientRect())) return true
    }
    return false
  }

  /**
   * Registers an overlay for as long as it is in the page. It is measured again
   * whenever it resizes or ends a transition, so one that slides in is judged
   * where it came to rest.
   */
  cover(showing: () => boolean = () => true): Attachment<HTMLElement> {
    return (element) => {
      this.covers.set(element, showing)
      const bump = (): void => {
        this.revision += 1
      }
      const observer = new ResizeObserver(bump)
      observer.observe(element)
      element.addEventListener('transitionend', bump)
      element.addEventListener('animationend', bump)
      return () => {
        observer.disconnect()
        element.removeEventListener('transitionend', bump)
        element.removeEventListener('animationend', bump)
        this.covers.delete(element)
      }
    }
  }

  /**
   * Keeps main's picture of the theme current while at least one web pane is
   * mounted: the tint, the colour scheme pages are asked for and their ground.
   */
  retain(): () => void {
    this.panes += 1
    if (this.panes === 1) {
      this.stopAppearance = $effect.root(() => {
        $effect(() => {
          window.elecdex.web.setAppearance(
            webAppearance(appearance.theme, appearance.settings.web.tint),
          )
        })
      })
    }
    let held = true
    return () => {
      if (!held) return
      held = false
      this.panes -= 1
      if (this.panes > 0) return
      this.stopAppearance?.()
      this.stopAppearance = null
    }
  }
}

export const web = new WebStore()

/** Marks an overlay web panes must not hide (see WebStore.cover). */
export const coverWeb = (showing?: () => boolean): Attachment<HTMLElement> => web.cover(showing)
