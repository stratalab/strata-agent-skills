// Skill content contract (requirements F5): the bundled skills exist, carry
// portable spec-only frontmatter with pinned provenance, and their generated
// sections are present. Freshness against the pinned strata-core rev is CI's
// job (skills-freshness runs the generator in --check mode); these tests need
// no checkout.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { installSkills, removeSkills, checkSkills } from "../dist/skills.js";
import { surfaceById } from "../dist/surfaces.js";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = path.join(repoRoot, "skills");
const pin = readFileSync(path.join(repoRoot, "STRATA_CORE_REV"), "utf8").trim();

const EXPECTED_SKILLS = ["strata", "strata-branching", "strata-time-travel"];

// The Agent Skills interchange spec's frontmatter fields — the portable
// intersection every consumer (Claude Code, claude.ai upload, skills CLI)
// accepts. Anything else is a hard error in at least one of them.
const SPEC_FIELDS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);

// Minimal frontmatter reader for the subset these skills use: scalar fields,
// one `>-` folded block (description), and one flat `metadata:` map.
function parseFrontmatter(markdown, label) {
  const lines = markdown.split("\n");
  assert.equal(lines[0], "---", `${label}: frontmatter opens the file`);
  const end = lines.indexOf("---", 1);
  assert.notEqual(end, -1, `${label}: frontmatter closes`);
  const fields = {};
  let current;
  let inMetadata = false;
  for (const line of lines.slice(1, end)) {
    const top = line.match(/^([a-z-]+):(.*)$/);
    if (top !== null) {
      current = top[1];
      inMetadata = current === "metadata";
      if (inMetadata) {
        fields.metadata = {};
      } else {
        fields[current] = top[2].trim() === ">-" ? "" : top[2].trim();
      }
      continue;
    }
    if (inMetadata) {
      const entry = line.match(/^\s+([a-z-]+):\s*"?([^"]*)"?\s*$/);
      assert.notEqual(entry, null, `${label}: metadata line parses: ${line}`);
      fields.metadata[entry[1]] = entry[2];
      continue;
    }
    // Folded-block continuation of the current scalar field.
    assert.match(line, /^\s+\S/, `${label}: unexpected frontmatter line: ${line}`);
    fields[current] = `${fields[current]} ${line.trim()}`.trim();
  }
  return { fields, body: lines.slice(end + 1).join("\n") };
}

test("the committed skill set is exactly the three required skills", () => {
  const found = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(found, [...EXPECTED_SKILLS].sort());
});

for (const name of EXPECTED_SKILLS) {
  test(`skill ${name}: frontmatter is portable and pinned; body is within limits`, () => {
    const skillPath = path.join(skillsDir, name, "SKILL.md");
    const markdown = readFileSync(skillPath, "utf8");
    const { fields, body } = parseFrontmatter(markdown, name);

    for (const key of Object.keys(fields)) {
      assert.ok(SPEC_FIELDS.has(key), `${name}: frontmatter field ${key} is spec-portable`);
    }
    assert.equal(fields.name, name, "name matches the directory (spec requirement)");
    assert.ok(fields.description.length > 0, "description is non-empty");
    assert.ok(fields.description.length <= 1024, `description ≤1024 chars (${fields.description.length})`);
    assert.equal(fields.metadata["strata-core-rev"], pin, "provenance matches STRATA_CORE_REV");
    assert.ok(fields.metadata["cli-version-range"], "CLI version range declared (F5.2)");

    assert.ok(markdown.split("\n").length < 500, "SKILL.md under 500 lines (spec guidance)");

    // Generated sections: markers pair up, never nest, and are non-empty —
    // an empty region means the generator has not run.
    let open = null;
    let regionLines = 0;
    for (const line of body.split("\n")) {
      const begin = line.match(/^<!-- generated:begin ([a-z-]+) -->$/);
      const end = line.match(/^<!-- generated:end ([a-z-]+) -->$/);
      if (begin !== null) {
        assert.equal(open, null, `${name}: nested generated section ${begin[1]}`);
        open = begin[1];
        regionLines = 0;
      } else if (end !== null) {
        assert.equal(open, end[1], `${name}: mismatched generated:end ${end[1]}`);
        assert.ok(regionLines > 0, `${name}: generated section ${open} is empty — run skills:gen`);
        open = null;
      } else if (open !== null) {
        regionLines += 1;
      }
    }
    assert.equal(open, null, `${name}: generated section ${open} never closed`);

    // Relative links resolve within the skill directory.
    for (const match of body.matchAll(/\]\((?!https?:)([^)#]+)\)/g)) {
      assert.ok(
        existsSync(path.join(skillsDir, name, match[1])),
        `${name}: relative link ${match[1]} resolves`,
      );
    }
  });
}

test("reference files carry their generated content", () => {
  for (const ref of ["commands.md", "errors.md"]) {
    const content = readFileSync(path.join(skillsDir, "strata", "references", ref), "utf8");
    const region = content.match(/<!-- generated:begin [a-z-]+ -->\n([\s\S]+?)\n<!-- generated:end/);
    assert.notEqual(region, null, `${ref} has a generated region`);
    assert.ok(region[1].split("\n").length > 20, `${ref} generated region is substantial`);
  }
});

test("install → check → tamper → remove round-trip", () => {
  const root = mkdtempSync(path.join(tmpdir(), "strata-skills-"));
  try {
    const installed = installSkills(root, true);
    assert.equal(installed.action, "installed");
    assert.deepEqual(installed.skills, EXPECTED_SKILLS);

    // Installing skills must not flip Claude Code surface detection on —
    // otherwise init's second run registers a surface its first did not.
    assert.equal(surfaceById("claude-code").detect(root), false);

    assert.deepEqual(
      checkSkills(root).map((skill) => skill.state),
      ["current", "current", "current"],
    );

    writeFileSync(path.join(root, ".claude", "skills", "strata", "SKILL.md"), "tampered");
    const afterTamper = checkSkills(root);
    assert.equal(afterTamper.find((skill) => skill.name === "strata").state, "stale");

    const refreshed = installSkills(root, true);
    assert.equal(refreshed.action, "refreshed");
    assert.deepEqual(
      checkSkills(root).map((skill) => skill.state),
      ["current", "current", "current"],
    );

    const removed = removeSkills(root);
    assert.equal(removed.action, "removed");
    assert.deepEqual(removed.skills, EXPECTED_SKILLS);
    assert.deepEqual(
      checkSkills(root).map((skill) => skill.state),
      ["missing", "missing", "missing"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
