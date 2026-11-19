import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { serverRoot, connectClient } from "./runtime.ts";

const root = serverRoot();
if (!root)
  throw new Error("Set MOBILE_DEV_ROOT to the installed upstream runtime.");
const { client, transport } = connectClient(root, true);
const input = createInterface({ input: process.stdin, output: process.stdout });
try {
  await client.connect(transport);
  const result = await client.callTool(
    { name: "mobile_open_simulator", arguments: {} },
    undefined,
    { timeout: 30000 },
  );
  const data = result.structuredContent as
    { browserPanel?: { url?: string } } | undefined;
  const panel = data?.browserPanel;
  if (!panel?.url)
    throw new Error("The installed server did not return a browser panel.");
  const url = new URL(panel.url);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1")
    throw new Error("Expected a loopback panel.");
  console.log(url.href);
  if (process.stdin.isTTY && ["linux", "darwin"].includes(process.platform)) {
    const opener = spawn(
      process.platform === "darwin" ? "open" : "xdg-open",
      [url.href],
      { stdio: "ignore" },
    );
    opener.on("error", () =>
      console.error("Open the printed link in your browser."),
    );
    opener.unref();
  }
  await input.question(
    "Open the link above. Press Enter here to close the device panel.\n",
  );
} finally {
  input.close();
  await client.close();
}
