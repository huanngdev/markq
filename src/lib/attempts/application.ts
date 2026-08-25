import type { Quiz, QuizQuestion } from "@/lib/quizzes/types";

import { gradeQuiz, type SubmittedAnswers } from "./grading";
import type { AttemptRepository, ProgressUpdate } from "./repository-port";
import type {
  Attempt,
  AttemptReview,
  AttemptSummary,
  AttemptWorkspace,
  QuizAttemptStat,
} from "./types";

export type AttemptErrorCode =
  | "ATTEMPT_LIMIT_REACHED"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_VERSION_CONFLICT"
  | "QUIZ_INCOMPLETE"
  | "REVIEW_DISABLED";

export class AttemptApplicationError extends Error {
  constructor(public readonly code: AttemptErrorCode, message: string) {
    super(message);
    this.name = "AttemptApplicationError";
  }
}

export type ApplicationDependencies = {
  repository: AttemptRepository;
  now: () => Date;
  random: () => number;
  createId: () => string;
};

function shuffle<T>(values: readonly T[], random: () => number) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function toWorkspace(attempt: Attempt): AttemptWorkspace {
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quizTitle,
    status: attempt.status,
    settings: attempt.settings,
    expiresAt: attempt.expiresAt,
    version: attempt.version,
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      questionOrder: answer.questionOrder,
      prompt: answer.prompt,
      options: answer.options,
      selectedOptions: answer.selectedOptions,
      selectionMode: answer.selectionMode,
      points: answer.points,
      isFlagged: answer.isFlagged,
    })),
  };
}

function toReview(attempt: Attempt): AttemptReview {
  return {
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
    answers: attempt.answers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionOrder: answer.questionOrder,
      prompt: answer.prompt,
      options: answer.options,
      selectedOptions: answer.selectedOptions,
      correctOptions: answer.correctOptions,
      selectionMode: answer.selectionMode,
      points: answer.points,
      earnedPoints: answer.earnedPoints,
      isCorrect: answer.isCorrect,
      isFlagged: answer.isFlagged,
      explanation: answer.explanation,
    })),
  };
}

function expiresAt(quiz: Quiz, startedAt: Date) {
  const minutes = quiz.settings.timeLimitMinutes;
  return minutes === null ? null : new Date(startedAt.getTime() + minutes * 60_000).toISOString();
}

function createDraftAttempt(
  userId: string,
  quiz: Quiz,
  dependencies: ApplicationDependencies,
): Attempt {
  const started = dependencies.now();
  const startedAt = started.toISOString();
  const orderedQuestions = quiz.settings.shuffleQuestions
    ? shuffle(quiz.questions, dependencies.random)
    : quiz.questions;

  return {
    id: dependencies.createId(),
    userId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    quizSchemaVersion: quiz.schemaVersion,
    status: "in_progress",
    settings: quiz.settings,
    questionOrder: orderedQuestions.map((question) => question.id),
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: orderedQuestions.length,
    totalQuestions: orderedQuestions.length,
    earnedPoints: 0,
    totalPoints: orderedQuestions.reduce((total, question) => total + question.points, 0),
    scorePercent: 0,
    passed: null,
    startedAt,
    expiresAt: expiresAt(quiz, started),
    updatedAt: startedAt,
    submittedAt: null,
    version: 1,
    answers: orderedQuestions.map((question, questionOrder) => ({
      id: dependencies.createId(),
      questionId: question.id,
      questionOrder,
      prompt: question.prompt,
      options: quiz.settings.shuffleOptions
        ? shuffle(question.options, dependencies.random)
        : question.options,
      selectedOptions: [],
      correctOptions: question.correctOptions,
      selectionMode: question.selectionMode,
      points: question.points,
      earnedPoints: 0,
      isCorrect: null,
      isFlagged: false,
      explanation: question.explanation,
      updatedAt: startedAt,
    })),
  };
}

function isExpired(attempt: Attempt, now: Date) {
  return attempt.expiresAt !== null && now.getTime() >= new Date(attempt.expiresAt).getTime();
}

function quizFromAttempt(attempt: Attempt): Quiz {
  return {
    schemaVersion: attempt.quizSchemaVersion,
    id: attempt.quizId,
    title: attempt.quizTitle,
    description: "",
    tags: [],
    published: false,
    visibility: "private",
    settings: attempt.settings,
    questions: attempt.answers.map((answer): QuizQuestion => ({
      id: answer.questionId,
      prompt: answer.prompt,
      options: answer.options,
      correctOptions: answer.correctOptions,
      selectionMode: answer.selectionMode,
      points: answer.points,
      explanation: answer.explanation,
    })),
    sourceFile: "attempt-snapshot",
  };
}

function answersFromAttempt(attempt: Attempt): SubmittedAnswers {
  return Object.fromEntries(attempt.answers.map((answer) => [answer.questionId, answer.selectedOptions]));
}

function finalizeAttempt(
  attempt: Attempt,
  status: "submitted" | "expired",
  dependencies: ApplicationDependencies,
) {
  if (attempt.status !== "in_progress") return attempt;

  const result = gradeQuiz(quizFromAttempt(attempt), answersFromAttempt(attempt));
  const now = dependencies.now().toISOString();
  const passingScore = attempt.settings.passingScore;
  const finalized = dependencies.repository.finalize(attempt.userId, attempt.id, "in_progress", {
    status,
    correctCount: result.correctCount,
    incorrectCount: result.incorrectCount,
    unansweredCount: result.unansweredCount,
    earnedPoints: result.earnedPoints,
    scorePercent: result.scorePercent,
    passed: passingScore === null ? null : result.scorePercent >= passingScore,
    submittedAt: now,
    updatedAt: now,
    answers: result.answers.map((answer) => ({
      questionId: answer.question.id,
      earnedPoints: answer.earnedPoints,
      isCorrect: answer.isCorrect,
    })),
  });
  if (!finalized) {
    throw new AttemptApplicationError("ATTEMPT_NOT_FOUND", "The attempt no longer exists.");
  }
  return finalized;
}

function expireIfNeeded(attempt: Attempt, dependencies: ApplicationDependencies) {
  if (!isExpired(attempt, dependencies.now())) return attempt;
  const status = attempt.settings.expireBehavior === "auto-submit" ? "submitted" : "expired";
  return finalizeAttempt(attempt, status, dependencies);
}

function validateProgress(attempt: Attempt, updates: ProgressUpdate[]) {
  const updatedAnswers = new Map(
    attempt.answers.map((answer) => [answer.questionId, answer.selectedOptions]),
  );
  for (const update of updates) {
    if (!updatedAnswers.has(update.questionId)) {
      throw new Error(`Question does not exist: ${update.questionId}`);
    }
    if (update.selectedOptions !== undefined) updatedAnswers.set(update.questionId, update.selectedOptions);
  }

  gradeQuiz(quizFromAttempt(attempt), Object.fromEntries(updatedAnswers));

  if (attempt.settings.navigationMode === "sequential") {
    for (const update of updates) {
      const answer = attempt.answers.find((item) => item.questionId === update.questionId);
      if (!answer) continue;
      const hasUnansweredBefore = attempt.answers
        .slice(0, answer.questionOrder)
        .some((item) => (updatedAnswers.get(item.questionId)?.length ?? 0) === 0);
      if (hasUnansweredBefore) {
        throw new Error("Sequential quizzes must be answered in order.");
      }
    }
  }
}

export function startOrResumeAttempt(
  userId: string,
  quiz: Quiz,
  dependencies: ApplicationDependencies,
) {
  const now = dependencies.now().toISOString();
  dependencies.repository.ensureUser(userId, "Guest", now);
  const existing = dependencies.repository.findInProgress(userId, quiz.id);
  if (existing) {
    const current = expireIfNeeded(existing, dependencies);
    if (current.status === "in_progress") return toWorkspace(current);
  }

  const limit = quiz.settings.attemptsAllowed;
  if (limit !== null && dependencies.repository.countFinalized(userId, quiz.id) >= limit) {
    throw new AttemptApplicationError(
      "ATTEMPT_LIMIT_REACHED",
      `This quiz allows at most ${limit} attempt${limit === 1 ? "" : "s"}.`,
    );
  }

  const draft = createDraftAttempt(userId, quiz, dependencies);
  dependencies.repository.create(draft);
  return toWorkspace(draft);
}

export function saveAttemptProgress(
  userId: string,
  attemptId: string,
  expectedVersion: number,
  updates: ProgressUpdate[],
  dependencies: ApplicationDependencies,
) {
  const stored = dependencies.repository.findOwnedById(userId, attemptId);
  if (!stored) throw new AttemptApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found.");
  const attempt = expireIfNeeded(stored, dependencies);
  if (attempt.status !== "in_progress") return toWorkspace(attempt);

  validateProgress(attempt, updates);
  let saved: Attempt | null;
  try {
    saved = dependencies.repository.saveProgress(
      userId,
      attemptId,
      expectedVersion,
      updates,
      dependencies.now().toISOString(),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ATTEMPT_VERSION_CONFLICT") {
      throw new AttemptApplicationError(
        "ATTEMPT_VERSION_CONFLICT",
        "This attempt was updated in another tab. Reload to continue.",
      );
    }
    throw error;
  }
  if (!saved) throw new AttemptApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found.");
  return toWorkspace(saved);
}

export function submitAttempt(
  userId: string,
  attemptId: string,
  dependencies: ApplicationDependencies,
) {
  const stored = dependencies.repository.findOwnedById(userId, attemptId);
  if (!stored) throw new AttemptApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found.");
  const attempt = expireIfNeeded(stored, dependencies);
  if (attempt.status !== "in_progress") return toReview(attempt);
  if (!attempt.settings.allowUnanswered && attempt.answers.some((answer) => answer.selectedOptions.length === 0)) {
    throw new AttemptApplicationError("QUIZ_INCOMPLETE", "Answer every question before submitting.");
  }
  return toReview(finalizeAttempt(attempt, "submitted", dependencies));
}

export function getOwnedAttemptWorkspace(
  userId: string,
  attemptId: string,
  dependencies: ApplicationDependencies,
) {
  const stored = dependencies.repository.findOwnedById(userId, attemptId);
  if (!stored) return null;
  return toWorkspace(expireIfNeeded(stored, dependencies));
}

export function getOwnedAttemptReview(
  userId: string,
  attemptId: string,
  dependencies: ApplicationDependencies,
) {
  const stored = dependencies.repository.findOwnedById(userId, attemptId);
  if (!stored) return null;
  const attempt = expireIfNeeded(stored, dependencies);
  if (attempt.status === "in_progress") return null;
  if (attempt.settings.reviewMode === "never") {
    throw new AttemptApplicationError("REVIEW_DISABLED", "Review is disabled for this quiz.");
  }
  return toReview(attempt);
}

export function listOwnedAttempts(
  userId: string,
  dependencies: ApplicationDependencies,
): AttemptSummary[] {
  return dependencies.repository.listOwned(userId).filter((attempt) => attempt.status !== "in_progress");
}

export function getOwnedQuizAttemptStats(
  userId: string,
  dependencies: ApplicationDependencies,
): Record<string, QuizAttemptStat> {
  const stats: Record<string, QuizAttemptStat> = {};
  for (const attempt of dependencies.repository.listOwned(userId)) {
    const current = stats[attempt.quizId];
    if (!current) {
      stats[attempt.quizId] = {
        attemptCount: attempt.status === "in_progress" ? 0 : 1,
        latestScore: attempt.scorePercent,
        bestScore: attempt.scorePercent,
        latestAttemptId: attempt.status === "in_progress" ? "" : attempt.id,
        inProgressAttemptId: attempt.status === "in_progress" ? attempt.id : null,
        latestReviewAvailable: attempt.status !== "in_progress" && attempt.reviewMode === "after-submit",
      };
      continue;
    }
    if (attempt.status === "in_progress") {
      current.inProgressAttemptId ??= attempt.id;
      continue;
    }
    current.attemptCount += 1;
    current.bestScore = Math.max(current.bestScore, attempt.scorePercent);
    if (!current.latestAttemptId) {
      current.latestAttemptId = attempt.id;
      current.latestScore = attempt.scorePercent;
      current.latestReviewAvailable = attempt.reviewMode === "after-submit";
    }
  }
  return stats;
}
