/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/prescription/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "prescription/src/**/*.ts",
    "!prescription/src/**/*.test.ts",
    "!prescription/src/**/__tests__/**",
    "!prescription/src/main.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "json", "html"],
  setupFilesAfterEnv: ["<rootDir>/prescription/src/__tests__/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@contract$": "<rootDir>/shared/contract.ts",
  },
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
