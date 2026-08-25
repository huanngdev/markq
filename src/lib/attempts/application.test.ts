import { describe, expect, it } from "bun:test";

import { defaultQuizSettings, type Quiz } from "@/lib/quizzes/types";

import {
  AttemptApplicationError,
  getOwnedAttemptReview,
  saveAttemptProgress,
  startOrResumeAttempt,
  submitAttempt,
  type ApplicationDependencies,
} from "./application";
import type { AttemptRepository, FinalAttemptUpdate, ProgressUpdate } from "./repository-port";
import type { Attempt, AttemptSummary } from "./types";

class MemoryAttemptRepository implements AttemptRepository {
  readonly attempts = new Map<string, Attempt>();

  ensureUser() {}

  countFinalized(userId: string, quizId: string) {
    return [...this.attempts.values()].filter(
      (attempt) => attempt.userId === userId && attempt.quizId === quizId && attempt.status !== "in_progress",
    ).length;
  }

  findInProgress(userId: string, quizId: string) {
    return this.clone([...this.attempts.values()].find(
      (attempt) => attempt.userId === userId && attempt.quizId === quizId && attempt.status === "in_progress",
    ) ?? null);
  }

  findOwnedById(userId: string, attemptId: string) {
    const attempt = this.attempts.get(attemptId);
    return this.clone(attempt?.userId === userId ? attempt : null);
  }

  create(attempt: Attempt) {
    this.attempts.set(attempt.id, structuredClone(attempt));
  }

  saveProgress(
    userId: string,
    attemptId: string,
    expectedVersion: number,
    updates: ProgressUpdate[],
    now: string,
  ) {
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.userId !== userId) return null;
    if (attempt.version !== expectedVersion) throw new Error("ATTEMPT_VERSION_CONFLICT");
    for (const update of updates) {
      const answer = attempt.answers.find((item) => item.questionId === update.questionId);
      if (!answer) continue;
      if (update.selectedOptions !== undefined) answer.selectedOptions = [...update.selectedOptions];
      if (update.isFlagged !== undefined) answer.isFlagged = update.isFlagged;
      answer.updatedAt = now;
    }
    attempt.version += 1;
    attempt.updatedAt = now;
    return this.clone(attempt);
  }

  finalize(
    userId: string,
    attemptId: string,
    expectedStatus: Attempt["status"],
    update: FinalAttemptUpdate,
  ) {
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.userId !== userId || attempt.status !== expectedStatus) return null;
    Object.assign(attempt, {
      status: update.status,
      correctCount: update.correctCount,
      incorrectCount: update.incorrectCount,
      unansweredCount: update.unansweredCount,
      earnedPoints: update.earnedPoints,
      scorePercent: update.scorePercent,
      passed: update.passed,
      submittedAt: update.submittedAt,
      updatedAt: update.updatedAt,
    });
    for (const result of update.answers) {
      const answer = attempt.answers.find((item) => item.questionId === result.questionId);
      if (answer) Object.assign(answer, result);
    }
    return this.clone(attempt);
  }

  listOwned(userId: string): AttemptSummary[] {
    return [...this.attempts.values()]
      .filter((attempt) => attempt.userId === userId)
      .map((attempt) => ({
        id: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quizTitle,
        quizSchemaVersion: attempt.quizSchemaVersion,
        status: attempt.status,
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
        reviewMode: attempt.settings.reviewMode,
      }));
  }

  private clone(attempt: Attempt | null) {
    return attempt ? structuredClone(attempt) : null;
  }
}

const quiz: Quiz = {
  schemaVersion: 2,
  id: "application-test",
  title: "Application test",
  description: "",
  tags: [],
  published: true,
  visibility: "public",
  settings: defaultQuizSettings,
  sourceFile: "test.md",
  questions: [
    {
      id: "q1",
      prompt: "First",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOptions: ["A"],
      selectionMode: "single",
      points: 1,
      explanation: "A",
    },
    {
      id: "q2",
      prompt: "Second",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOptions: ["A", "B"],
      selectionMode: "multiple",
      points: 2,
      explanation: "A and B",
    },
  ],
};

function harness(start = "2026-01-01T00:00:00.000Z") {
  const repository = new MemoryAttemptRepository();
  let now = new Date(start);
  let sequence = 0;
  const dependencies: ApplicationDependencies = {
    repository,
    now: () => now,
    random: () => 0,
    createId: () => `id-${sequence += 1}`,
  };
  return { repository, dependencies, setNow: (value: string) => { now = new Date(value); } };
}

describe("attempt application", () => {
  it("starts once, persists shuffled order, and resumes the same attempt", () => {
    const { dependencies } = harness();
    const shuffledQuiz = {
      ...quiz,
      settings: { ...quiz.settings, shuffleQuestions: true, shuffleOptions: true },
    };
    const started = startOrResumeAttempt("user-1", shuffledQuiz, dependencies);
    const resumed = startOrResumeAttempt("user-1", shuffledQuiz, dependencies);

    expect(resumed.id).toBe(started.id);
    expect(started.answers.map((answer) => answer.questionId)).toEqual(["q2", "q1"]);
    expect(started.answers[0].options.map((option) => option.id)).toEqual(["B", "A"]);
  });

  it("autosaves selections and flags with optimistic versioning", () => {
    const { dependencies } = harness();
    const started = startOrResumeAttempt("user-1", quiz, dependencies);
    const saved = saveAttemptProgress("user-1", started.id, started.version, [
      { questionId: "q1", selectedOptions: ["A"], isFlagged: true },
    ], dependencies);

    expect(saved.version).toBe(2);
    expect(saved.answers[0]).toMatchObject({ selectedOptions: ["A"], isFlagged: true });
    expect(() => saveAttemptProgress("user-1", started.id, 1, [
      { questionId: "q1", selectedOptions: ["B"] },
    ], dependencies)).toThrow(AttemptApplicationError);
  });

  it("submits idempotently and calculates passing status on the server", () => {
    const { dependencies } = harness();
    const passingQuiz = { ...quiz, settings: { ...quiz.settings, passingScore: 60 } };
    const started = startOrResumeAttempt("user-1", passingQuiz, dependencies);
    saveAttemptProgress("user-1", started.id, 1, [
      { questionId: "q1", selectedOptions: ["A"] },
      { questionId: "q2", selectedOptions: ["A", "B"] },
    ], dependencies);

    const submitted = submitAttempt("user-1", started.id, dependencies);
    const repeated = submitAttempt("user-1", started.id, dependencies);
    expect(submitted).toMatchObject({ status: "submitted", scorePercent: 100, passed: true });
    expect(repeated.submittedAt).toBe(submitted.submittedAt);
  });

  it("enforces deadlines, attempt limits, ownership, and disabled review", () => {
    const { dependencies, setNow } = harness();
    const restrictedQuiz = {
      ...quiz,
      settings: {
        ...quiz.settings,
        timeLimitMinutes: 1,
        expireBehavior: "mark-expired" as const,
        attemptsAllowed: 1,
        reviewMode: "never" as const,
      },
    };
    const started = startOrResumeAttempt("user-1", restrictedQuiz, dependencies);
    setNow("2026-01-01T00:02:00.000Z");
    const expired = submitAttempt("user-1", started.id, dependencies);

    expect(expired.status).toBe("expired");
    expect(() => startOrResumeAttempt("user-1", restrictedQuiz, dependencies)).toThrow(/at most 1/);
    expect(getOwnedAttemptReview("user-2", started.id, dependencies)).toBeNull();
    expect(() => getOwnedAttemptReview("user-1", started.id, dependencies)).toThrow(/disabled/);
  });
});
