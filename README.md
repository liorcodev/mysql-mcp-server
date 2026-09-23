# MySQL Model Context Protocol (MCP) Server

A high-performance, lightweight **Model Context Protocol (MCP) Server** built with **Bun** and **TypeScript**. It provides a secure `mysql_query` tool allowing AI assistants (such as Claude, Cursor, VS Code Copilot, and custom MCP clients) to execute SQL queries against a MySQL database.

---

## Features

- ⚡ **Built on Bun**: Fast startup and lightweight footprint.
- 🔌 **Streamable HTTP Transport**: Implements standard MCP HTTP/SSE transport (`/mcp`).
- 🛡️ **Safe by Default**: Read-only query execution by default. Write (`INSERT`, `UPDATE`, `DELETE`) and DDL (`CREATE`, `ALTER`, `DROP`) operations require explicit configuration.
- 🔒 **File-Based Secrets (`_FILE`)**: Supports reading credentials from mounted files (`MYSQL_USER_FILE`, `MYSQL_PASSWORD_FILE`).
- ⚡ **Connection Pooling**: Uses `mysql2` with automatic connection management.

---

## Quick Start

### Basic `docker run`

Run the container by passing your MySQL database credentials:

```bash
docker run -d \
  --name mysql-mcp-server \
  -p 127.0.0.1:3000:3000 \
  -e MYSQL_HOST=your-mysql-host.example.com \
  -e MYSQL_PORT=3306 \
  -e MYSQL_DATABASE=my_database \
  -e MYSQL_USER=my_user \
  -e MYSQL_PASSWORD=my_password \
  liorcodev/mysql-mcp-server:latest
```

The MCP HTTP endpoint will be available at:
`http://localhost:3000/mcp`

---

## Connecting to MySQL on `localhost` / Host Machine

If your MySQL database runs directly on your host machine (outside Docker), standard `localhost` or `127.0.0.1` refers to the container itself. Use `host.docker.internal` instead:

```bash
docker run -d \
  --name mysql-mcp-server \
  -p 127.0.0.1:3000:3000 \
  -e MYSQL_HOST=host.docker.internal \
  -e MYSQL_DATABASE=my_database \
  -e MYSQL_USER=my_user \
  -e MYSQL_PASSWORD=my_password \
  liorcodev/mysql-mcp-server:latest
```

---

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MYSQL_HOST` | **Yes** | — | MySQL server hostname or IP address |
| `MYSQL_PORT` | No | `3306` | MySQL server port |
| `MYSQL_DATABASE` | **Yes** | — | Target database name |
| `MYSQL_USER` | **Yes**\* | — | MySQL username |
| `MYSQL_USER_FILE` | **Yes**\* | — | Path to file containing MySQL username (overrides `MYSQL_USER`) |
| `MYSQL_PASSWORD` | No | — | MySQL password |
| `MYSQL_PASSWORD_FILE` | No | — | Path to file containing MySQL password (overrides `MYSQL_PASSWORD`) |
| `MYSQL_CONNECTION_LIMIT` | No | `10` | Maximum connections in the pool |
| `MYSQL_ALLOW_WRITE_OPERATIONS` | No | `false` | Set to `true` to allow write queries (`INSERT`, `UPDATE`, `DELETE`, `REPLACE`, `CALL`, `LOAD`) |
| `MYSQL_ALLOW_DDL_OPERATIONS` | No | `false` | Set to `true` to allow DDL statements (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, etc.) |
| `HOST` | No | `0.0.0.0` | Container IP interface to bind to (leave as `0.0.0.0` so Docker port mapping works) |
| `PORT` | No | `3000` | Internal container port for HTTP server binding |

*\* Either `MYSQL_USER` or `MYSQL_USER_FILE` must be provided.*

---

## Reading Credentials from Files (`_FILE` Environment Variables)

To avoid passing raw credentials as plain-text environment variables, store your credentials in files, mount them into the container using volume mounts (`-v`), and reference their paths using `MYSQL_USER_FILE` and `MYSQL_PASSWORD_FILE`:

```bash
docker run -d \
  --name mysql-mcp-server \
  -p 127.0.0.1:3000:3000 \
  -v /path/to/secrets/user.txt:/run/secrets/mysql_user:ro \
  -v /path/to/secrets/password.txt:/run/secrets/mysql_password:ro \
  -e MYSQL_HOST=your-mysql-host.example.com \
  -e MYSQL_DATABASE=my_database \
  -e MYSQL_USER_FILE=/run/secrets/mysql_user \
  -e MYSQL_PASSWORD_FILE=/run/secrets/mysql_password \
  liorcodev/mysql-mcp-server:latest
```

*(Binding to `127.0.0.1` keeps the port off your LAN/public interfaces — only processes on the host machine can reach it.)*

*(Note: Native Docker Secrets `--secret` are supported by Docker Swarm and Docker Compose. For standalone `docker run`, volume mounting local files into `/run/secrets/` achieves the exact same security benefit for file-based secret reading).*

---

## Docker Compose

For repeatable local/production deployments, use the included `docker-compose.yml` (plain env vars) or `docker-compose-secret.yml` (file-based secrets via Docker's `secrets:` block, reading from `./secrets/mysql_user.txt` and `./secrets/mysql_password.txt` — see [secrets/README.md](secrets/README.md)):

```bash
# plain env vars (edit docker-compose.yml directly, or add MYSQL_USER/MYSQL_PASSWORD)
docker compose -f docker-compose.yml up -d --build

# file-based secrets
docker compose -f docker-compose-secret.yml up -d --build
```

Both compose files build the image locally from the repo's `Dockerfile` and publish it on `127.0.0.1:3000` only.

---

## Local Development

Requires [Bun](https://bun.sh).

```bash
bun install
cp .env.example .env   # fill in MYSQL_HOST / MYSQL_DATABASE / MYSQL_USER / MYSQL_PASSWORD etc.
bun run dev            # watch mode, http://localhost:3000/mcp
bun run start           # no watch
```

---

## MCP Tool Documentation

### `mysql_query`

Executes a SQL statement against the configured MySQL database.

#### Parameters:
- `sql` (string, required): SQL query to execute. Use `?` placeholders for parameterized queries.
- `params` (array, optional): Array of parameter values substituted into `?` placeholders.
- `maxRows` (number, optional): Max rows returned for `SELECT` queries (default: `500`, hard cap: `5000`).

#### Safety & Permissions:
- By default, only **read queries** (`SELECT`, `SHOW`, `EXPLAIN`, etc.) are permitted.
- Set `MYSQL_ALLOW_WRITE_OPERATIONS=true` to enable write operations.
- Set `MYSQL_ALLOW_DDL_OPERATIONS=true` to enable schema modifications.

---

## MCP Client Configuration Example

To connect an MCP client using Streamable HTTP transport:

```json
{
  "mcpServers": {
    "mysql": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```
