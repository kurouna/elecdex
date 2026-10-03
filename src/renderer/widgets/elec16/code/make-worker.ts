/**
 * CODE's compile worker, started from a blob: URL in both builds, as the page's CSP allows
 * workers only from blob: (plugins run the same way). Built, the worker is inlined in the
 * page's code; Vite's dev server would start an inline worker from its own URL, which the CSP
 * refuses - there the blob only imports that URL, so `npm start` compiles as the app does.
 */

const NAME = 'elec16 code'

export async function makeCompileWorker(): Promise<Worker> {
  if (import.meta.env.DEV) {
    const { default: url } = await import('./compile.worker.ts?worker&url')
    // A static import of it fails to load from a blob where a dynamic one does; the messages
    // that arrive before it has loaded are held and handed on after.
    const at = JSON.stringify(new URL(url, location.href).href)
    const text = [
      'const held = []',
      'const hold = (e) => held.push(e.data)',
      "self.addEventListener('message', hold)",
      `import(${at}).then(() => {`,
      "  self.removeEventListener('message', hold)",
      "  for (const data of held) self.dispatchEvent(new MessageEvent('message', { data }))",
      '})',
    ].join('\n')
    const blob = new Blob([text], { type: 'text/javascript' })
    return new Worker(URL.createObjectURL(blob), { type: 'module', name: NAME })
  }
  const { default: CompileWorker } = await import('./compile.worker.ts?worker&inline')
  return new CompileWorker({ name: NAME })
}
