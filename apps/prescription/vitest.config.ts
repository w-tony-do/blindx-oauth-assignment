import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load environment variables before running tests
config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
