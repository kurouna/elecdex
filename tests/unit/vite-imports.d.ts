/**
 * What Vite imports beyond TypeScript, for the unit tests' typecheck (the page's own config
 * has vite/client): a stylesheet imported for its side effect, and a file imported as its URL.
 */
declare module '*.css'
declare module '*?url' {
  const url: string
  export default url
}
