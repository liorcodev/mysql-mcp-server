/// <reference types="bun" />

await Bun.build({
  entrypoints: ["./src/index.ts"],
  compile: {
    /*
    outfile: "./mysql-mcp-server.exe",
    windows: {
      hideConsole: true,
      title: "MySQL MCP Server",
      publisher: "liorcodev",
      version: "0.1.0",
      description: "MySQL MCP Server",
      copyright: "Copyright 2026 Lior Cohen",
    },
    */
  },
});
export {};
