import xtermCss from '@xterm/xterm/css/xterm.css?inline'

/**
 * Adopts xterm's stylesheet, once, on first import.
 *
 * xterm ships its CSS as a package file. The renderer CSP is `style-src 'self'`,
 * which permits a bundled stylesheet but not a `<style>` element injected at
 * runtime - so the CSS is imported as text and installed through a constructed
 * stylesheet, which CSP does not treat as inline style.
 *
 * This lives in its own module so the work happens exactly once at import time,
 * rather than being guarded by a flag inside a component.
 */
const sheet = new CSSStyleSheet()
sheet.replaceSync(xtermCss)
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
