import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id").notNull(),
    quizTitle: text("quiz_title").notNull(),
    correctCount: integer("correct_count").notNull(),
    incorrectCount: integer("incorrect_count").notNull(),
    unansweredCount: integer("unanswered_count").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    scorePercent: integer("score_percent").notNull(),
    submittedAt: text("submitted_at").notNull(),
  },
  (table) => [index("attempts_quiz_submitted_idx").on(table.quizId, table.submittedAt)],
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
    selectedOption: text("selected_option"),
    correctOption: text("correct_option").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    explanationSnapshot: text("explanation_snapshot").notNull(),
  },
  (table) => [
    index("attempt_answers_attempt_order_idx").on(table.attemptId, table.questionOrder),
    uniqueIndex("attempt_answers_attempt_question_idx").on(table.attemptId, table.questionId),
  ],
);

export type AttemptRow = typeof attempts.$inferSelect;
export type AttemptAnswerRow = typeof attemptAnswers.$inferSelect;
