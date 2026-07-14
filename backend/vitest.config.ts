import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/campus_golf_test";

export default defineConfig({
  test: {
    globalSetup: ["./tests/globalSetup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-secret-key-for-vitest-only",
    },
    fileParallelism: false,
  },
});
