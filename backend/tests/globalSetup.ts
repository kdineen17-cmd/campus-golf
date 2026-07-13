import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.join(__dirname, "../prisma/test.db");

export async function setup() {
  for (const suffix of ["", "-journal"]) {
    const file = TEST_DB_PATH + suffix;
    if (existsSync(file)) rmSync(file);
  }

  execSync("npx prisma db push --skip-generate", {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}

export async function teardown() {
  for (const suffix of ["", "-journal"]) {
    const file = TEST_DB_PATH + suffix;
    if (existsSync(file)) rmSync(file);
  }
}
