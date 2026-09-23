import mysql from "mysql2/promise";
import { readSecret } from "./secrets.js";

let pool: mysql.Pool | undefined;

/** Lazily creates a single shared connection pool from `MYSQL_*` env vars (or `_FILE` secrets), reused across requests. */
export function getPool(): mysql.Pool {
  if (pool) return pool;

  const host = process.env.MYSQL_HOST;
  const user = readSecret("MYSQL_USER");
  const password = readSecret("MYSQL_PASSWORD") ?? "";
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !database) {
    throw new Error(
      "MySQL is not configured: set MYSQL_HOST, MYSQL_USER (or MYSQL_USER_FILE) and MYSQL_DATABASE env vars (MYSQL_PASSWORD may be empty).",
    );
  }

  pool = mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user,
    password,
    database,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
  });
  return pool;
}
