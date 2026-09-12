import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    alias: {
      '@shared': r('src/shared'),
      '@main': r('src/main'),
      '@renderer': r('src/renderer'),
    },
  },
  test: {
    globals: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
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
