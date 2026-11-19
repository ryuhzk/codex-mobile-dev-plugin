import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  Button,
  Column,
  Heading,
  Text,
  TerminalButton,
  definePlugin,
  runPlugin,
} from "@muqun/desktop";
import { serverRoot, connectClient } from "./runtime.ts";

async function query(action: string, root: string): Promise<string> {
  const { client, transport } = connectClient(root);
  try {
    await client.connect(transport, { timeout: 4000 });
    if (action === "tools") {
      const names: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await client.listTools({ cursor });
        names.push(...page.tools.map((t) => t.title || t.name));
        cursor = page.nextCursor;
      } while (cursor);
      return names.join("\n");
    }
    const analyze = action === "analyze";
    const projectPath = process.env.MUQUN_WORKSPACE_CWD;
    if (analyze && !projectPath)
      return "Select a session with a project directory first.";
    const result = await client.callTool(
      {
        name: analyze
          ? "mobile_generate_app_intel"
          : action === "android"
            ? "mobile_list_android_devices"
            : "mobile_list_simulators",
        arguments: analyze ? { projectPath } : {},
      },
      undefined,
      { timeout: 9500 },
    );
    const data = result.structuredContent as
      Record<string, unknown> | undefined;
    const content = Array.isArray(result.content)
      ? result.content
          .flatMap((c) => (c.type === "text" ? [c.text] : []))
          .join("\n")
      : "";
    if (result.isError || data?.connected === false)
      throw new Error(
        String(data?.error || content || "Mobile Dev request failed."),
      );
    if (analyze && data && typeof data.files === "number")
      return [
        data.projectPath,
        data.screens + " screens",
        data.files + " files",
        data.packages + " packages",
      ].join("\n");
    if (data && Array.isArray(data.devices))
      return (
        data.devices
          .map((d) =>
            [d.name || d.model || d.id, d.state].filter(Boolean).join(" · "),
          )
          .join("\n") || "No devices found."
      );
    return content === "[]" ? "No devices found." : content || "No results.";
  } finally {
    await client.close();
  }
}

await runPlugin(
  definePlugin(async (action) => {
    const root = serverRoot();
    const actions = [
      ["android", "Android devices"],
      ...(process.platform === "darwin" && process.arch === "arm64"
        ? [["ios", "iOS simulators"]]
        : []),
      ["analyze", "Analyze current project"],
      ["tools", "Available MCP tools"],
    ];
    const selected = actions.find(([id]) => id === action);
    let result = "";
    if (!root || !existsSync(join(root, "dist/server.mjs")))
      result =
        "Install the upstream Mobile Dev runtime or set MOBILE_DEV_ROOT to its installation directory.";
    else if (selected) {
      try {
        result = await query(action, root);
      } catch (error) {
        result = error instanceof Error ? error.message : "Mobile Dev failed.";
      }
    }
    return Column({
      children: [
        Heading({ text: "Mobile Dev" }),
        ...(root
          ? [
              TerminalButton({
                label: "Open interactive device panel",
                entry: "panel.ts",
              }),
            ]
          : []),
        ...actions.map(([action, label]) => Button({ action, label })),
        ...(selected ? [Heading({ text: selected[1] })] : []),
        ...(result ? [Text({ text: result.slice(0, 12000) })] : []),
      ],
    });
  }),
);
