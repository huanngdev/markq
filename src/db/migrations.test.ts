import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Database } from "bun:sqlite";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function applyMigration(database: Database, filename: string) {
  const sql = fs.readFileSync(path.join(process.cwd(), "drizzle", filename), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) database.run(statement);
  }
}

describe("SQLite migrations", () => {
  it("preserves legacy submitted attempts while migrating to the lifecycle schema", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "markq-migration-"));
    temporaryDirectories.push(directory);
    const database = new Database(path.join(directory, "markq.db"));
    applyMigration(database, "0000_unknown_magik.sql");

    database.run(`
      INSERT INTO attempts (
        id, quiz_id, quiz_title, correct_count, incorrect_count,
        unanswered_count, total_questions, score_percent, submitted_at
      ) VALUES ('attempt-1', 'quiz-1', 'Legacy quiz', 1, 0, 0, 1, 100, '2026-01-01T00:00:00.000Z')
    `);
    database.run(`
      INSERT INTO attempt_answers (
        id, attempt_id, question_id, question_order, question_snapshot,
        options_snapshot, selected_option, correct_option, is_correct,
        explanation_snapshot
      ) VALUES (
        'answer-1', 'attempt-1', 'q1', 0, 'Question?',
        '[{"id":"A","content":"Yes"},{"id":"B","content":"No"}]',
        'A', 'A', 1, 'Because A.'
      )
    `);

    applyMigration(database, "0001_late_beast.sql");

    const attempt = database.query<{
      status: string;
      user_id: string;
      total_points: number;
    }, []>("SELECT status, user_id, total_points FROM attempts WHERE id = 'attempt-1'").get();
    const answer = database.query<{
      selected_options: string;
      correct_options: string;
      selection_mode: string;
    }, []>("SELECT selected_options, correct_options, selection_mode FROM attempt_answers WHERE id = 'answer-1'").get();
    expect(attempt).not.toBeNull();
    expect(answer).not.toBeNull();
    if (!attempt || !answer) throw new Error("Migrated fixtures were not found");
    expect(attempt.status).toBe("submitted");
    expect(attempt.user_id).toBe("legacy-user");
    expect(attempt.total_points).toBe(1);
    expect(answer.selected_options).toBe('["A"]');
    expect(answer.correct_options).toBe('["A"]');
    expect(answer.selection_mode).toBe("single");
    database.close();
  });
});
