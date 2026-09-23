import { McpServer } from "@modelcontextprotocol/server";
import {
  mysqlQueryToolName,
  mysqlQueryToolConfig,
  mysqlQueryHandler,
} from "./tools/mysqlQuery.js";

/** Fresh `McpServer` per request (per SDK v2's stateless HTTP model) with the mysql_query tool wired in. */
export function createServer(): McpServer {
  const server = new McpServer({ name: "mysql-mcp-server", version: "0.1.0" });

  server.registerTool(
    mysqlQueryToolName,
    mysqlQueryToolConfig,
    mysqlQueryHandler,
  );

  return server;
}
