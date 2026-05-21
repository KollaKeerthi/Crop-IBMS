import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!migrationUrl) {
  throw new Error("DATABASE_URL_DIRECT (or DATABASE_URL) is not set. Add it to .env.local.");
}
const isLocal = migrationUrl.includes("localhost") || migrationUrl.includes("127.0.0.1");

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  },
});
