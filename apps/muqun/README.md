# Mobile Dev for Muqun Desktop

Install the package tarball in Settings → Plugins. The native panel discovers devices, analyzes the active React Native workspace, and lists the upstream server's MCP tools. The catalog is informational. Device streaming and interactive MCP Apps views require a persistent panel transport.

Install the upstream Mobile Dev distribution and Node.js 22.19 or newer. The adapter discovers a local Codex marketplace installation or reads MOBILE_DEV_ROOT, the directory containing dist/server.mjs. Android discovery needs Android platform-tools. iOS discovery requires an Apple Silicon Mac and Xcode. Each explicit action connects to the upstream stdio server and closes its client afterward.

For local development link @muqun/desktop and install the MCP SDK dependency, then run bun main.ts. To package the adapter run bun pm pack in this directory. The upstream server and its existing telemetry configuration manage backend instrumentation.

## Interactive device panel

Choose **Open interactive device panel**. Desktop opens a terminal tab and launches the session-owned page in your browser. Alternatively, in a Muqun terminal run `bun panel.ts` from this directory and open the printed loopback URL. The upstream panel owns device selection, mirroring, logs and performance controls. Keep the terminal running while using the panel, then press Enter to stop its MCP server. The link is private to the session. Hardware support follows the upstream runtime and OS.

The optional standalone tarball includes the version-matched upstream backend and notices. It works without a Codex plugin installation. From a source checkout run `bun pack-runtime.ts /path/to/prebuilt/mobile-dev` to create it under release/. The bundled upstream native helpers retain their original platform requirements.
