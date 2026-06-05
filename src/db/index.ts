import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export * from "./schema";
