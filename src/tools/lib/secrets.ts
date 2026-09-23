import { readFileSync } from "node:fs";

/** Reads `<name>_FILE` (Docker/K8s secrets file path) if set, else falls back to the plain `<name>` env var. */
export function readSecret(name: string): string | undefined {
  const filePath = process.env[`${name}_FILE`];
  if (filePath) return readFileSync(filePath, "utf8").trim();
  return process.env[name];
}
