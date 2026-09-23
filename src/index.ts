import {
  createMcpHandler,
  hostHeaderValidationResponse,
  originValidationResponse,
  localhostAllowedHostnames,
  localhostAllowedOrigins,
} from "@modelcontextprotocol/server";
import { createServer } from "./server.js";

const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const handler = createMcpHandler(createServer);

const allowedHostnames = localhostAllowedHostnames();
const allowedOrigins = localhostAllowedOrigins();

Bun.serve({
  hostname,
  port,
  async fetch(request) {
    // Blocks DNS-rebinding attacks before any request reaches the MCP handler.
    const rejected =
      hostHeaderValidationResponse(request, allowedHostnames) ??
      originValidationResponse(request, allowedOrigins);
    return rejected ?? handler.fetch(request);
  },
});

// console.info(`MySQL MCP server listening on port ${port}`);

process.on("SIGINT", async () => {
  await handler.close();
  process.exit(0);
});
