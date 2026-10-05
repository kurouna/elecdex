import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@shared': r('src/shared'),
      '@main': r('src/main'),
      '@renderer': r('src/renderer'),
      '@calc': r('src/shared/calc/vendor'),
    },
  },
  test: {
    globals: false,
    // Half the cores: the games' tests run the machine for minutes of play each, and with a
    // worker on every core short tests beside them went past their 5 s (measured 2026-10-05:
    // three timeouts on 12 cores, none with 6; the suite took no longer).
    maxWorkers: '50%',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          // The vendored calculator brings its own tests; they run here unchanged,
          // which is how a sync says whether anything moved underneath us.
          include: ['tests/unit/**/*.test.ts', 'src/shared/calc/vendor/**/*.test.ts'],
        },
      },
      {
        extends: true,
        // Without this, Svelte resolves to its server build and `mount()` throws.
        resolve: { conditions: ['browser'] },
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.ts'],
          setupFiles: ['tests/component/setup.ts'],
        },
      },
    ],
  },
})
