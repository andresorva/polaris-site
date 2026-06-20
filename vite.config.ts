import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    // 'hidden' emits sourcemaps (so Sentry can upload + symbolicate) but does
    // NOT append the //# sourceMappingURL comment to bundles -> maps are not
    // referenced publicly. Avoids leaking source via the deployed assets.
    sourcemap: 'hidden',
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
