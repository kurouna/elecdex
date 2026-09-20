import {
  type BackgroundCapabilities,
  type BackgroundState,
  backgroundCapabilities,
} from '@shared/background'

/**
 * What running in the background means on this machine, as main found it.
 *
 * The page cannot work it out for itself: whether a tray icon can be shown at
 * all is something main has to try, and whether the session would swallow a
 * system-wide shortcut is read from the environment main was started in. So it
 * is asked once and followed, and both the settings and the fullscreen corner
 * read it from here rather than each keeping their own copy.
 *
 * Until the answer arrives the capabilities are the ones this platform has at
 * best, which keeps the settings from flickering a section into view - and
 * nothing acts on them before main has spoken anyway.
 */
class BackgroundStore {
  state = $state.raw<BackgroundState | null>(null)

  /**
   * What this platform has at best, until main says what it found. Read when it
   * is asked for rather than when the store is made: the store is a module, and
   * the bridge it would read is not there yet in a component test.
   */
  private assumed(): BackgroundCapabilities {
    const platform = globalThis.window?.elecdex?.system.platform
    // No bridge at all: offer nothing rather than guess.
    return backgroundCapabilities({ platform: platform ?? ('unknown' as NodeJS.Platform) })
  }

  /**
   * A getter rather than a `$derived`: what is assumed depends on the bridge,
   * which is not something the runes can watch, and a memoised answer from
   * before main replied would be kept for good.
   */
  get capabilities(): BackgroundCapabilities {
    return this.state?.capabilities ?? this.assumed()
  }

  private started = false

  /** Reads the state once and follows it. Safe to call more than once. */
  init(): void {
    if (this.started) return
    this.started = true
    void this.refresh()
    window.elecdex.background.onChange((next) => {
      this.state = next
    })
  }

  async refresh(): Promise<void> {
    this.state = await window.elecdex.background.state()
  }

  /** Adds or removes the sign-in entry, and takes the state back. */
  async setLaunchAtLogin(on: boolean): Promise<void> {
    this.state = await window.elecdex.background.setLaunchAtLogin(on)
  }
}

export const background = new BackgroundStore()
