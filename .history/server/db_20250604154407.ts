import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool, { schema });