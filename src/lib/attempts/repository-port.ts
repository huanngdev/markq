import type { Attempt, AttemptStatus, AttemptSummary } from "./types";

export type ProgressUpdate = {
  questionId: string;
  selectedOptions?: string[];
  isFlagged?: boolean;
};

export type FinalAttemptUpdate = Pick<
  Attempt,
  | "status"
  | "correctCount"
  | "incorrectCount"
  | "unansweredCount"
  | "earnedPoints"
  | "scorePercent"
  | "passed"
  | "submittedAt"
  | "updatedAt"
> & {
  answers: Array<Pick<Attempt["answers"][number], "questionId" | "earnedPoints" | "isCorrect">>;
};

export interface AttemptRepository {
  ensureUser(userId: string, displayName: string, now: string): void;
  countFinalized(userId: string, quizId: string): number;
  findInProgress(userId: string, quizId: string): Attempt | null;
  findOwnedById(userId: string, attemptId: string): Attempt | null;
  create(attempt: Attempt): void;
  saveProgress(
    userId: string,
    attemptId: string,
    expectedVersion: number,
    updates: ProgressUpdate[],
    now: string,
  ): Attempt | null;
  finalize(
    userId: string,
    attemptId: string,
    expectedStatus: AttemptStatus,
    update: FinalAttemptUpdate,
  ): Attempt | null;
  listOwned(userId: string): AttemptSummary[];
}
