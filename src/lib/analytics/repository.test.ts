import { expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

it("reads only the current user's submitted/expired answers from real SQLite", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "markq-analytics-test-"));
  try {
    // Separate process: the database singleton and server-only mock cannot leak
    // into app data or other tests. Only the Next.js marker is mocked, not SQLite.
    const result = Bun.spawnSync([process.execPath, "-e", `
      import { mock } from "bun:test";
      import { strict as assert } from "node:assert";
      mock.module("server-only", () => ({}));
      const { getDatabase } = await import("./src/lib/db-core.ts");
      const { users, attempts, attemptAnswers } = await import("./src/db/schema.ts");
      const { readOwnedAnalyticsAnswers } = await import("./src/lib/analytics/repository.ts");
      const { buildAnalyticsReport } = await import("./src/lib/analytics/application.ts");
      const db = getDatabase();
      const now = "2026-01-01T00:00:00.000Z";
      const topic = { id: "networks-routing", subject: "networks", subjectTitle: "Networks", title: "Routing", content: "Lesson", sourceFile: "test.md" };
      const knowledge = new Map([[topic.id, topic]]);
      assert.deepEqual(buildAnalyticsReport(readOwnedAnalyticsAnswers("owner"), knowledge, new Map()).subjects, []);
      for (const id of ["owner", "other"]) {
        db.insert(users).values({ id, displayName: id, createdAt: now, updatedAt: now }).run();
      }
      const cases = [
        ["owner-submitted", "owner", "submitted", ["B"], false],
        ["owner-expired", "owner", "expired", [], false],
        ["owner-correct", "owner", "submitted", ["A"], true],
        ["owner-draft", "owner", "in_progress", ["B"], false],
        ["other-submitted", "other", "submitted", ["B"], false],
      ];
      for (const [id, userId, status, selected, isCorrect] of cases) {
        db.insert(attempts).values({
          id, userId, status, quizId: "quiz", quizTitle: "Quiz", quizSchemaVersion: 2,
          settingsSnapshot: "{}", questionOrderSnapshot: '["one"]', totalQuestions: 1,
          totalPoints: 1, startedAt: now, updatedAt: now,
        }).run();
        db.insert(attemptAnswers).values({
          id: id + "-answer", attemptId: id, questionId: "one", topicId: topic.id,
          questionOrder: 0, questionSnapshot: "Question", optionsSnapshot: "[]",
          selectedOptions: JSON.stringify(selected), correctOptions: '["A"]',
          selectionMode: "single", points: 1, isCorrect, explanationSnapshot: "Explanation", updatedAt: now,
        }).run();
      }
      const records = readOwnedAnalyticsAnswers("owner");
      assert.deepEqual(records.map(row => row.attemptId).sort(), ["owner-correct", "owner-expired", "owner-submitted"]);
      const report = buildAnalyticsReport(records, knowledge, new Map());
      assert.equal(report.correctCount, 1);
      assert.equal(report.incorrectCount, 1);
      assert.equal(report.unansweredCount, 1);
      assert.equal(report.attemptCount, 3);
      assert.equal(report.accuracyPercent, 33);
      assert.deepEqual(report.subjects.map(row => row.subject), ["networks"]);
      assert.equal(readOwnedAnalyticsAnswers("other").length, 1);
      assert.deepEqual(readOwnedAnalyticsAnswers("new-user"), []);
      db.$client.close();
    `], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: path.join(directory, "test.db") },
      stdout: "pipe", stderr: "pipe",
    });
    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
