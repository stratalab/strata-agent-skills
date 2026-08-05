// Fixture-driven contract tests (requirements N4, §3.2): the fixtures are the
// shared artifact the VS Code extension vendors — whatever passes here defines
// "byte-identical" for both writers.

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { register, remove, check } from "../dist/registration.js";
import { surfaceById } from "../dist/surfaces.js";
import { stripJsonComments } from "../dist/json-config.js";
import { findDatabases } from "../dist/workspace.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, "..", "fixtures", "registration");

const BIN = "/resolved/bin/strata";
const DB = "/work/project/.strata";

function substitute(value) {
  return JSON.parse(
    JSON.stringify(value).replaceAll("__STRATA_BIN__", BIN).replaceAll("__DB_PATH__", DB),
  );
}

function workspace() {
  return mkdtempSync(path.join(tmpdir(), "strata-init-test-"));
}

function seed(root, surface, content) {
  const configPath = surface.configPath(root);
  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(content, null, 2)}\n`);
}

for (const name of readdirSync(fixturesDir).filter((f) => f.endsWith(".json"))) {
  const fixture = JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8"));
  const surface = surfaceById(fixture.surface);

  test(`fixture ${name}: init converges to the expected bytes`, () => {
    const root = workspace();
    if (fixture.before !== null) seed(root, surface, substitute(fixture.before));

    const first = register(surface, root, BIN, DB);
    assert.notEqual(first.action, "failed", JSON.stringify(first));
    const written = JSON.parse(readFileSync(surface.configPath(root), "utf8"));
    assert.deepEqual(written, substitute(fixture.after), "converged to fixture bytes");

    // Idempotence: a second run changes nothing.
    const second = register(surface, root, BIN, DB);
    assert.equal(second.action, "unchanged");

    // Check sees a current registration.
    const state = check(surface, root, BIN, DB);
    assert.equal(state.registered, true);
    assert.equal(state.current, true);
  });

  test(`fixture ${name}: remove restores the original`, () => {
    const root = workspace();
    if (fixture.before !== null) seed(root, surface, substitute(fixture.before));
    register(surface, root, BIN, DB);

    const removed = remove(surface, root);
    assert.equal(removed.action, "removed");
    if (fixture.before === null) {
      assert.equal(existsSync(surface.configPath(root)), false, "fresh file is deleted");
    } else {
      const restored = JSON.parse(readFileSync(surface.configPath(root), "utf8"));
      const expected = substitute(fixture.before);
      // A pre-existing strata entry was ours to manage; its removal is correct.
      if (expected.mcpServers?.strata !== undefined) delete expected.mcpServers.strata;
      if (expected.servers?.strata !== undefined) delete expected.servers.strata;
      assert.deepEqual(restored, expected, "foreign content untouched");
    }
    // Removing again is a clean no-op.
    assert.equal(remove(surface, root).action, "absent");
  });
}

test("a commented config is never rewritten", () => {
  const root = workspace();
  const surface = surfaceById("vscode");
  const configPath = surface.configPath(root);
  mkdirSync(path.dirname(configPath), { recursive: true });
  const original = `{\n  // my precious comment\n  "servers": {}\n}\n`;
  writeFileSync(configPath, original);

  const result = register(surface, root, BIN, DB);
  assert.equal(result.action, "skipped");
  assert.match(result.reason, /comments/);
  assert.equal(readFileSync(configPath, "utf8"), original, "file untouched");
});

test("a malformed config fails loudly and changes nothing", () => {
  const root = workspace();
  const surface = surfaceById("cursor");
  const configPath = surface.configPath(root);
  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(configPath, "{ not json");

  const result = register(surface, root, BIN, DB);
  assert.equal(result.action, "failed");
  assert.match(result.reason, /malformed JSON/);
  assert.equal(readFileSync(configPath, "utf8"), "{ not json");
});

test("indentation of an existing config survives the edit", () => {
  const root = workspace();
  const surface = surfaceById("claude-code");
  const configPath = surface.configPath(root);
  writeFileSync(
    configPath,
    `{\n    "mcpServers": {\n        "other": {\n            "command": "x"\n        }\n    }\n}\n`,
  );
  register(surface, root, BIN, DB);
  const text = readFileSync(configPath, "utf8");
  assert.match(text, /^ {4}"mcpServers"/m, "four-space indent preserved");
  assert.match(text, /"strata"/);
});

test("jsonc comment stripping does not eat comment-like strings", () => {
  const { out, hadComments } = stripJsonComments('{"url": "https://x", "note": "a//b"}');
  assert.equal(hadComments, false);
  assert.deepEqual(JSON.parse(out), { url: "https://x", note: "a//b" });
});

test("workspace discovery finds marker directories and skips noise", () => {
  const root = workspace();
  mkdirSync(path.join(root, "app", "data.strata", "locks"), { recursive: true });
  mkdirSync(path.join(root, "app", "data.strata", "manifest"), { recursive: true });
  mkdirSync(path.join(root, "node_modules", "junk", "locks"), { recursive: true });
  mkdirSync(path.join(root, "node_modules", "junk", "manifest"), { recursive: true });
  mkdirSync(path.join(root, "app", "locks-only", "locks"), { recursive: true });

  const found = findDatabases(root);
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.match(found[0], /app\/data\.strata$/);
});
