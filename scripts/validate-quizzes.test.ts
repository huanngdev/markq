import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const validator = path.join(import.meta.dir, "validate-quizzes.ts");
const temporaryDirectories: string[] = [];
const knowledge = `---
subject: iq
title: Reasoning
---
## iq-counting | Counting

Count each distinct pair once.
`;

function workspace() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "markq-validator-"));
  temporaryDirectories.push(directory);
  fs.mkdirSync(path.join(directory, "content/quizzes"), { recursive: true });
  fs.mkdirSync(path.join(directory, "content/knowledge"), { recursive: true });
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe("quiz validator with an empty catalog", () => {
  it("accepts zero quizzes and still validates knowledge", () => {
    const directory = workspace();
    fs.writeFileSync(path.join(directory, "content/knowledge/iq.md"), knowledge);
    const result = spawnSync(process.execPath, [validator], { cwd: directory, encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No quizzes to validate");
    expect(result.stdout).toContain("iq.md: 1 knowledge topics");
  });

  it("does not hide invalid knowledge when there are no quizzes", () => {
    const directory = workspace();
    fs.writeFileSync(path.join(directory, "content/knowledge/iq.md"), `${knowledge}\n## iq-counting | Duplicate\n\nText.`);
    const result = spawnSync(process.execPath, [validator], { cwd: directory, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("duplicate");
  });

  it("continues to reject malformed quiz files", () => {
    const directory = workspace();
    fs.writeFileSync(path.join(directory, "content/quizzes/broken.md"), "Not a quiz");
    const result = spawnSync(process.execPath, [validator], { cwd: directory, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("broken.md");
  });
});
