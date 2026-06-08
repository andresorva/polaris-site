import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    globals: true,
    // Retry/timeout tests in client.test.ts wait real exponential-backoff
    // sleeps (~3s each). Default 5s testTimeout trips intermittently under
    // CI load -> flaky failures that gate the Pages deploy. Give them slack.
    testTimeout: 20000,
  },
})
