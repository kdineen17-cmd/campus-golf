const { execSync } = require("node:child_process");

// Keeps the deployed schema in sync with prisma/schema.prisma with zero
// manual steps: Vercel runs `npm install` on every build, which triggers
// this. Skips quietly when no database is configured yet (e.g. a fresh
// clone, or a Vercel deploy before the Postgres integration is connected).
if (!process.env.DATABASE_URL) {
  console.log("[postinstall] DATABASE_URL not set, skipping prisma db push.");
  process.exit(0);
}

try {
  execSync("npx prisma db push --accept-data-loss --skip-generate", { stdio: "inherit" });
} catch (err) {
  console.error("[postinstall] prisma db push failed:", err.message);
  process.exit(1);
}
