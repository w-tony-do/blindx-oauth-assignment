/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/__tests__/**",
    "!src/main.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "json", "html"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          skipLibCheck: true,
        },
      },
    ],
    "^.+\\.js$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          skipLibCheck: true,
          allowJs: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(@repo|@ts-rest)/)"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
};
