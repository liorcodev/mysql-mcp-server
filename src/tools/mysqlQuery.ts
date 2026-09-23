import * as z from "zod/v4";
import type { CallToolResult } from "@modelcontextprotocol/server";
import type { ResultSetHeader } from "mysql2/promise";
import { getPool } from "./lib/mysqlPool.js";

const DEFAULT_MAX_ROWS = 500;
const HARD_MAX_ROWS = 5000;
const WRITE_OPERATIONS = new Set([
  "INSERT",
  "UPDATE",
  "DELETE",
  "REPLACE",
  "CALL",
  "LOAD",
]);
const DDL_OPERATIONS = new Set([
  "CREATE",
  "ALTER",
  "DROP",
  "TRUNCATE",
  "RENAME",
  "GRANT",
  "REVOKE",
]);

function envFlag(name: string): boolean {
  return ["1", "true", "yes", "on"].includes(
    (process.env[name] ?? "").trim().toLowerCase(),
  );
}

function firstSqlKeyword(sql: string): string {
  return (
    sql
      .replace(
        /^(?:\s|\/\*[\s\S]*?\*\/|--[^\r\n]*(?:\r?\n|$)|#[^\r\n]*(?:\r?\n|$))+/g,
        "",
      )
      .match(/^[A-Za-z]+/)?.[0]
      ?.toUpperCase() ?? ""
  );
}

function getOperationError(sql: string): string | undefined {
  let keyword = firstSqlKeyword(sql);
  if (
    keyword === "WITH" &&
    /\b(?:INSERT|UPDATE|DELETE|REPLACE|CALL|LOAD)\b/i.test(sql)
  ) {
    keyword = "WRITE";
  }
  const allowWrites = envFlag("MYSQL_ALLOW_WRITE_OPERATIONS");
  const allowDdl = envFlag("MYSQL_ALLOW_DDL_OPERATIONS");

  if (DDL_OPERATIONS.has(keyword) && !allowDdl) {
    return `DDL operation ${keyword} is disabled. Set MYSQL_ALLOW_DDL_OPERATIONS=true to enable it.`;
  }
  if ((WRITE_OPERATIONS.has(keyword) || keyword === "WRITE") && !allowWrites) {
    return `Write operation ${keyword} is disabled. Set MYSQL_ALLOW_WRITE_OPERATIONS=true to enable it.`;
  }
  return undefined;
}

export const mysqlQueryToolName = "mysql_query";

export const mysqlQueryToolConfig = {
  title: "MySQL Query",
  description:
    "Runs a SQL statement against the configured MySQL database. Supports SELECT and write/DDL statements. " +
    'Prefer the "params" array with "?" placeholders in "sql" for any user-supplied values, instead of concatenating them into the SQL string.',
  inputSchema: z.object({
    sql: z
      .string()
      .describe(
        'SQL statement to execute, using "?" placeholders for any values in "params"',
      ),
    // z.any() items keep the JSON schema a plain array (some MCP clients choke on array-of-anyOf shapes)
    params: z
      .array(z.any())
      .optional()
      .describe('Values substituted for "?" placeholders in "sql", in order'),
    maxRows: z
      .number()
      .int()
      .positive()
      .max(HARD_MAX_ROWS)
      .optional()
      .describe(
        `Max rows to return for SELECT-like queries (default ${DEFAULT_MAX_ROWS}, capped at ${HARD_MAX_ROWS})`,
      ),
  }),
};

export async function mysqlQueryHandler({
  sql,
  params,
  maxRows,
}: {
  sql: string;
  params?: unknown[];
  maxRows?: number;
}): Promise<CallToolResult> {
  try {
    const operationError = getOperationError(sql);
    if (operationError) {
      return {
        isError: true,
        content: [{ type: "text", text: operationError }],
      };
    }

    const pool = getPool();
    const [result] = await pool.query(sql, params ?? []);

    if (Array.isArray(result)) {
      const limit = maxRows ?? DEFAULT_MAX_ROWS;
      const truncated = result.length > limit;
      const rows = truncated ? result.slice(0, limit) : result;
      const text =
        `${result.length} row(s)${truncated ? ` (showing first ${limit})` : ""}:\n` +
        JSON.stringify(rows, null, 2);
      return { content: [{ type: "text", text }] };
    }

    const header = result as ResultSetHeader;
    const text = `OK. affectedRows=${header.affectedRows}, insertId=${header.insertId}, changedRows=${header.changedRows ?? 0}`;
    return { content: [{ type: "text", text }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: "text", text: `MySQL error: ${message}` }],
    };
  }
}
