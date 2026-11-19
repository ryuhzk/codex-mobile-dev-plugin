import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export function serverRoot(): string | undefined {
  if (process.env.MOBILE_DEV_ROOT) return resolve(process.env.MOBILE_DEV_ROOT);
  const bundled = fileURLToPath(new URL("./backend/", import.meta.url));
  if (existsSync(join(bundled, "dist/server.mjs"))) return bundled;
  const cache = join(
    process.env.CODEX_HOME || join(homedir(), ".codex"),
    "plugins",
    "cache",
  );
  for (const channel of ["mobile-dev", "openai-curated-remote"]) {
    const dir = join(cache, channel, "mobile-dev");
    if (!existsSync(dir)) continue;
    const versions = readdirSync(dir)
      .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
      .sort((a, b) => b.localeCompare(a, "en", { numeric: true }));
    for (const version of versions) {
      const root = join(dir, version);
      if (existsSync(join(root, "dist/server.mjs"))) return root;
    }
  }
}

export function connectClient(root: string, browser = false) {
  const env: Record<string, string> = {};
  for (const key of [
    "HOME",
    "PATH",
    "ANDROID_HOME",
    "ANDROID_SDK_ROOT",
    "DEVELOPER_DIR",
    "TMPDIR",
    "MOBILE_DEV_TELEMETRY",
  ]) {
    const value = process.env[key];
    if (value) env[key] = value;
  }
  if (browser) env.MOBILE_DEV_PANEL = "browser";
  const transport = new StdioClientTransport({
    command: "node",
    args: [join(root, "dist/server.mjs")],
    cwd: root,
    stderr: "ignore",
    env,
  });
  const client = new Client({ name: "muqun-desktop", version: "0.1.0" });
  return { client, transport };
}
