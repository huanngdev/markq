import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quizId: text("quiz_id").notNull(),
    quizTitle: text("quiz_title").notNull(),
    quizSchemaVersion: integer("quiz_schema_version").notNull(),
    status: text("status", { enum: ["in_progress", "submitted", "expired"] }).notNull(),
    settingsSnapshot: text("settings_snapshot").notNull(),
    questionOrderSnapshot: text("question_order_snapshot").notNull(),
    correctCount: integer("correct_count").notNull().default(0),
    incorrectCount: integer("incorrect_count").notNull().default(0),
    unansweredCount: integer("unanswered_count").notNull().default(0),
    totalQuestions: integer("total_questions").notNull(),
    earnedPoints: real("earned_points").notNull().default(0),
    totalPoints: real("total_points").notNull(),
    scorePercent: integer("score_percent").notNull().default(0),
    passed: integer("passed", { mode: "boolean" }),
    startedAt: text("started_at").notNull(),
    expiresAt: text("expires_at"),
    updatedAt: text("updated_at").notNull(),
    submittedAt: text("submitted_at"),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    index("attempts_user_updated_idx").on(table.userId, table.updatedAt),
    index("attempts_user_quiz_status_idx").on(table.userId, table.quizId, table.status),
    index("attempts_quiz_submitted_idx").on(table.quizId, table.submittedAt),
  ],
);

export const attemptAnswers = sqliteTable(
  "attempt_answers",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    questionOrder: integer("question_order").notNull(),
    questionSnapshot: text("question_snapshot").notNull(),
    optionsSnapshot: text("options_snapshot").notNull(),
    selectedOptions: text("selected_options").notNull().default("[]"),
    correctOptions: text("correct_options").notNull(),
    selectionMode: text("selection_mode", { enum: ["single", "multiple"] }).notNull(),
    points: real("points").notNull(),
    earnedPoints: real("earned_points").notNull().default(0),
    isCorrect: integer("is_correct", { mode: "boolean" }),
    isFlagged: integer("is_flagged", { mode: "boolean" }).notNull().default(false),
    explanationSnapshot: text("explanation_snapshot").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("attempt_answers_attempt_order_idx").on(table.attemptId, table.questionOrder),
    uniqueIndex("attempt_answers_attempt_question_idx").on(table.attemptId, table.questionId),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type AttemptRow = typeof attempts.$inferSelect;
export type AttemptAnswerRow = typeof attemptAnswers.$inferSelect;
