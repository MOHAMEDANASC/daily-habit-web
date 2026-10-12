import { execSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  // Make sure the test database has the latest schema before the server starts.
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "../../../backend"),
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
}
