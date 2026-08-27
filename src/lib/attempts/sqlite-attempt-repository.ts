import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { attemptAnswers, attempts, users, type AttemptAnswerRow, type AttemptRow } from "@/db/schema";
import { getDatabase } from "@/lib/db";

import type {
  AttemptRepository,
  FinalAttemptUpdate,
  ProgressUpdate,
} from "./repository-port";
import type { Attempt, AttemptAnswer, AttemptSummary } from "./types";

const optionSchema = z.object({ id: z.string(), content: z.string() });
const stringArraySchema = z.array(z.string());
const optionArraySchema = z.array(optionSchema);
const settingsSchema = z.object({
  timeLimitMinutes: z.number().nullable(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  navigationMode: z.enum(["free", "sequential"]),
  allowUnanswered: z.boolean(),
  reviewMode: z.enum(["after-submit", "never"]),
  passingScore: z.number().nullable(),
  expireBehavior: z.enum(["auto-submit", "mark-expired"]),
  scoringMode: z.enum(["exact", "partial"]),
  incorrectPenalty: z.number(),
  attemptsAllowed: z.number().nullable(),
});

function parseJson<T>(raw: string, schema: z.ZodType<T>, columnName: string): T {
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    throw new Error(`Stored ${columnName} is invalid`);
  }
}

function mapAnswer(row: AttemptAnswerRow): AttemptAnswer {
  return {
    id: row.id,
    questionId: row.questionId,
    topicId: row.topicId || null,
    questionOrder: row.questionOrder,
    prompt: row.questionSnapshot,
    options: parseJson(row.optionsSnapshot, optionArraySchema, "options snapshot"),
    selectedOptions: parseJson(row.selectedOptions, stringArraySchema, "selected options"),
    correctOptions: parseJson(row.correctOptions, stringArraySchema, "correct options"),
    selectionMode: row.selectionMode,
    points: row.points,
    earnedPoints: row.earnedPoints,
    isCorrect: row.isCorrect,
    isFlagged: row.isFlagged,
    explanation: row.explanationSnapshot,
    updatedAt: row.updatedAt,
  };
}

function mapSummary(row: AttemptRow): AttemptSummary {
  const settings = parseJson(row.settingsSnapshot, settingsSchema, "settings snapshot");
  return {
    id: row.id,
    quizId: row.quizId,
    quizTitle: row.quizTitle,
    quizSchemaVersion: row.quizSchemaVersion === 2 ? 2 : 1,
    status: row.status,
    correctCount: row.correctCount,
    incorrectCount: row.incorrectCount,
    unansweredCount: row.unansweredCount,
    totalQuestions: row.totalQuestions,
    earnedPoints: row.earnedPoints,
    totalPoints: row.totalPoints,
    scorePercent: row.scorePercent,
    passed: row.passed,
    startedAt: row.startedAt,
    expiresAt: row.expiresAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt,
    version: row.version,
    reviewMode: settings.reviewMode,
  };
}

function loadAttempt(row: AttemptRow): Attempt {
  const answerRows = getDatabase()
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, row.id))
    .orderBy(attemptAnswers.questionOrder)
    .all();

  return {
    ...mapSummary(row),
    userId: row.userId,
    settings: parseJson(row.settingsSnapshot, settingsSchema, "settings snapshot"),
    questionOrder: parseJson(row.questionOrderSnapshot, stringArraySchema, "question order"),
    answers: answerRows.map(mapAnswer),
  };
}

export class SqliteAttemptRepository implements AttemptRepository {
  ensureUser(userId: string, displayName: string, now: string) {
    getDatabase()
      .insert(users)
      .values({ id: userId, displayName, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({ target: users.id, set: { updatedAt: now } })
      .run();
  }

  countFinalized(userId: string, quizId: string) {
    return getDatabase()
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.quizId, quizId), ne(attempts.status, "in_progress")))
      .all().length;
  }

  findInProgress(userId: string, quizId: string) {
    const row = getDatabase()
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.quizId, quizId), eq(attempts.status, "in_progress")))
      .orderBy(desc(attempts.updatedAt))
      .get();
    return row ? loadAttempt(row) : null;
  }

  findOwnedById(userId: string, attemptId: string) {
    const row = getDatabase()
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
      .get();
    return row ? loadAttempt(row) : null;
  }

  create(attempt: Attempt) {
    const database = getDatabase();
    database.transaction((transaction) => {
      transaction.insert(attempts).values({
        id: attempt.id,
        userId: attempt.userId,
        quizId: attempt.quizId,
        quizTitle: attempt.quizTitle,
        quizSchemaVersion: attempt.quizSchemaVersion,
        status: attempt.status,
        settingsSnapshot: JSON.stringify(attempt.settings),
        questionOrderSnapshot: JSON.stringify(attempt.questionOrder),
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        totalQuestions: attempt.totalQuestions,
        earnedPoints: attempt.earnedPoints,
        totalPoints: attempt.totalPoints,
        scorePercent: attempt.scorePercent,
        passed: attempt.passed,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        updatedAt: attempt.updatedAt,
        submittedAt: attempt.submittedAt,
        version: attempt.version,
      }).run();

      transaction.insert(attemptAnswers).values(attempt.answers.map((answer) => ({
        id: answer.id,
        attemptId: attempt.id,
        questionId: answer.questionId,
        topicId: answer.topicId ?? "",
        questionOrder: answer.questionOrder,
        questionSnapshot: answer.prompt,
        optionsSnapshot: JSON.stringify(answer.options),
        selectedOptions: JSON.stringify(answer.selectedOptions),
        correctOptions: JSON.stringify(answer.correctOptions),
        selectionMode: answer.selectionMode,
        points: answer.points,
        earnedPoints: answer.earnedPoints,
        isCorrect: answer.isCorrect,
        isFlagged: answer.isFlagged,
        explanationSnapshot: answer.explanation,
        updatedAt: answer.updatedAt,
      }))).run();
    });
  }

  saveProgress(
    userId: string,
    attemptId: string,
    expectedVersion: number,
    updates: ProgressUpdate[],
    now: string,
  ) {
    const database = getDatabase();
    database.transaction((transaction) => {
      for (const update of updates) {
        const values: Partial<typeof attemptAnswers.$inferInsert> = { updatedAt: now };
        if (update.selectedOptions !== undefined) {
          values.selectedOptions = JSON.stringify(update.selectedOptions);
        }
        if (update.isFlagged !== undefined) values.isFlagged = update.isFlagged;

        transaction.update(attemptAnswers).set(values).where(and(
          eq(attemptAnswers.attemptId, attemptId),
          eq(attemptAnswers.questionId, update.questionId),
        )).run();
      }

      const updated = transaction.update(attempts).set({
        updatedAt: now,
        version: expectedVersion + 1,
      }).where(and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, userId),
        eq(attempts.status, "in_progress"),
        eq(attempts.version, expectedVersion),
      )).returning({ id: attempts.id }).get();
      if (!updated) throw new Error("ATTEMPT_VERSION_CONFLICT");
    });

    return this.findOwnedById(userId, attemptId);
  }

  finalize(
    userId: string,
    attemptId: string,
    expectedStatus: Attempt["status"],
    update: FinalAttemptUpdate,
  ) {
    const database = getDatabase();
    database.transaction((transaction) => {
      for (const answer of update.answers) {
        transaction.update(attemptAnswers).set({
          earnedPoints: answer.earnedPoints,
          isCorrect: answer.isCorrect,
          updatedAt: update.updatedAt,
        }).where(and(
          eq(attemptAnswers.attemptId, attemptId),
          eq(attemptAnswers.questionId, answer.questionId),
        )).run();
      }

      transaction.update(attempts).set({
        status: update.status,
        correctCount: update.correctCount,
        incorrectCount: update.incorrectCount,
        unansweredCount: update.unansweredCount,
        earnedPoints: update.earnedPoints,
        scorePercent: update.scorePercent,
        passed: update.passed,
        submittedAt: update.submittedAt,
        updatedAt: update.updatedAt,
      }).where(and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, userId),
        eq(attempts.status, expectedStatus),
      )).run();
    });

    return this.findOwnedById(userId, attemptId);
  }

  listOwned(userId: string) {
    return getDatabase()
      .select()
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.updatedAt))
      .all()
      .map(mapSummary);
  }
}

export const sqliteAttemptRepository = new SqliteAttemptRepository();
