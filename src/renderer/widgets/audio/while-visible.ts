/**
 * Runs `start` while `element` is on screen and its cleanup when it is not: a
 * pane in a background tab (display: none), scrolled out, or unmounted. The audio
 * panes subscribe this way, so capture and mixer polling run only for what is seen.
 */
export function whileVisible(element: Element, start: () => () => void): () => void {
  let stop: (() => void) | null = null
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting)
    if (visible && stop === null) stop = start()
    else if (!visible && stop !== null) {
      stop()
      stop = null
    }
  })
  observer.observe(element)
  return () => {
    observer.disconnect()
    stop?.()
    stop = null
  }
}
