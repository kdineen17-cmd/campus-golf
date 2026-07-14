import { execSync } from "node:child_process";
import path from "node:path";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/campus_golf_test";

export async function setup() {
  execSync("npx prisma db push --skip-generate --force-reset --accept-data-loss", {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
