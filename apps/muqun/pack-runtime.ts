/** Pack a prebuilt upstream release and its third-party notices alongside the native adapter. */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { serverRoot } from "./runtime.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = join(root, "release");
const runtime = process.argv[2] ? resolve(process.argv[2]) : serverRoot();
if (!runtime || !existsSync(join(runtime, "dist/server.mjs")))
  throw new Error("Pass the upstream prebuilt plugin directory.");
const version = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
).version;
const manifest = JSON.parse(
  readFileSync(join(runtime, ".codex-plugin/plugin.json"), "utf8"),
);
if (manifest.version !== version)
  throw new Error("The backend version must match the upstream checkout.");
mkdirSync(out, { recursive: true });
const staging = mkdtempSync(join(out, ".muqun-pack-"));
try {
  const pkg = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));
  execFileSync("bun", ["pm", "pack", "--destination", staging], { cwd: here });
  execFileSync("tar", [
    "-xzf",
    join(staging, pkg.name + "-" + pkg.version + ".tgz"),
    "-C",
    staging,
  ]);
  const dest = join(staging, "package", "backend");
  mkdirSync(dest);
  for (const name of [
    "dist",
    "assets",
    "scripts",
    "LICENSE",
    "PRIVACY.md",
    "TERMS.md",
    "THIRD_PARTY_NOTICES.md",
    ".codex-plugin",
  ]) {
    cpSync(join(runtime, name), join(dest, name), {
      recursive: true,
      verbatimSymlinks: true,
    });
  }
  const target = join(out, pkg.name + "-" + pkg.version + "-with-runtime.tgz");
  execFileSync("tar", ["-czf", target, "-C", staging, "package"]);
  console.log(target);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
