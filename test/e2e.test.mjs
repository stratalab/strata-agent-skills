// End-to-end lane (requirements N4): a real CLI, a real init run, and a real
// MCP handshake through the entry init wrote. Runs only when STRATA_BIN points
// at a strata binary; CI wires it to a build at the pinned rev.

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, existsSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const STRATA_BIN = process.env.STRATA_BIN;
const here = path.dirname(fileURLToPath(import.meta.url));
const initBin = path.join(here, "..", "dist", "index.js");

function runInit(cwd, args) {
  return spawnSync(process.execPath, [initBin, "init", ...args], {
    cwd,
    encoding: "utf8",
    timeout: 60_000,
  });
}

test("e2e: init registers a real database and the MCP entry answers a handshake", { skip: STRATA_BIN === undefined ? "set STRATA_BIN to run" : false }, async () => {
  // realpath: macOS tmpdir is a symlink, and the child process's cwd resolves
  // it — compare like with like.
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "strata-e2e-")));
  mkdirSync(path.join(root, ".vscode"));
  mkdirSync(path.join(root, ".cursor"));

  // Seed a real durable database (a one-shot creates it).
  const db = path.join(root, "data.strata");
  const put = spawnSync(STRATA_BIN, ["--db", db, "--json", "kv", "put", "hello", "world"], {
    encoding: "utf8",
    timeout: 60_000,
  });
  assert.equal(put.status, 0, put.stderr);

  // init with --yes and --json (the agent-operability contract, AR-5).
  const result = runInit(root, ["--yes", "--json", "--binary", STRATA_BIN]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.database, db, "the discovered database is the seeded one");
  assert.equal(report.surfaces.length, 2, "vscode + cursor detected");
  for (const surface of report.surfaces) {
    assert.equal(surface.action, "registered", JSON.stringify(surface));
  }
  assert.match(report.handoff, /get started with Strata/);

  // The written entry, exactly as an agent host would use it.
  const vscode = JSON.parse(readFileSync(path.join(root, ".vscode", "mcp.json"), "utf8"));
  const entry = vscode.servers.strata;
  assert.equal(entry.type, "stdio");
  assert.deepEqual(entry.args, ["--db", db, "mcp", "serve"]);
  assert.ok(existsSync(entry.command), "command is an absolute existing binary");

  // Speak MCP through it: initialize → expect a JSON-RPC result.
  const server = spawn(entry.command, entry.args, { stdio: ["pipe", "pipe", "ignore"] });
  const response = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("no MCP response within 20s")), 20_000);
    let buffer = "";
    server.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const line = buffer.split("\n").find((l) => l.trim().startsWith("{"));
      if (line !== undefined) {
        clearTimeout(timer);
        resolve(JSON.parse(line));
      }
    });
    server.on("error", reject);
    server.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "strata-init-e2e", version: "0.0.0" },
        },
      })}\n`,
    );
  });
  server.kill();
  assert.equal(response.id, 1);
  assert.ok(response.result, `initialize succeeded: ${JSON.stringify(response)}`);
  assert.ok(response.result.serverInfo, "server introduced itself");

  // Idempotence end-to-end, then removal end-to-end.
  const again = runInit(root, ["--yes", "--json", "--binary", STRATA_BIN]);
  for (const surface of JSON.parse(again.stdout).surfaces) {
    assert.equal(surface.action, "unchanged");
  }
  const removed = runInit(root, ["--remove", "--json"]);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(existsSync(path.join(root, ".vscode", "mcp.json")), false, "fresh config deleted");
});
