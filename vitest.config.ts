import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts: the engine has no DOM and the tests need no
// React plugin, so the test run shares nothing with the app build.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
