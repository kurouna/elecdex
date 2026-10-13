/**
 * What the keys named in shortcuts print on this keyboard (the system's layout map), for the
 * shortcuts' labels: a Japanese keyboard's Equal key prints "^". Read once at start; without a
 * layout map (another browser, a test) the labels are a US keyboard's.
 */

interface LayoutMapNavigator {
  keyboard?: { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> }
}

class KeyLabels {
  map = $state.raw<Readonly<Record<string, string>>>({})

  constructor() {
    if (typeof navigator === 'undefined') return
    void (navigator as LayoutMapNavigator).keyboard
      ?.getLayoutMap?.()
      .then((layout) => {
        this.map = Object.fromEntries(layout)
      })
      .catch(() => {})
  }
}

export const keyLabels = new KeyLabels()
