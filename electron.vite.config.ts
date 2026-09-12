import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Electron resolves `app.getVersion()` from the app directory's package.json.
// `out/` has none, so unpackaged runs would report the Electron version.
// Baking the real version in at build time keeps dev, test and prod identical.
const pkg = JSON.parse(readFileSync(r('package.json'), 'utf8')) as { version: string }
const define = { __APP_VERSION__: JSON.stringify(pkg.version) }

export default defineConfig({
  main: {
    define,
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': r('src/shared'),
        '@main': r('src/main'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: r('src/main/index.ts'),
        },
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': r('src/shared'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: r('src/preload/index.ts'),
        },
        // Preload runs in a sandboxed context: it must be a single CommonJS file.
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs',
        },
      },
    },
  },

  renderer: {
    root: r('src/renderer'),
    // The renderer root is not the project root, so point the plugin at the
    // shared svelte.config.js explicitly instead of letting it fall back.
    plugins: [svelte({ configFile: r('svelte.config.js') })],
    resolve: {
      alias: {
        '@shared': r('src/shared'),
        '@renderer': r('src/renderer'),
      },
    },
    build: {
      target: 'chrome140',
      rollupOptions: {
        input: {
          index: r('src/renderer/index.html'),
        },
      },
    },
  },
})
