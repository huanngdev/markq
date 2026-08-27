import "server-only";

import {
  getOwnedAttemptReview as getOwnedAttemptReviewUseCase,
  getOwnedAttemptWorkspace as getOwnedAttemptWorkspaceUseCase,
  getOwnedQuizAttemptStats as getOwnedQuizAttemptStatsUseCase,
  listOwnedAttempts as listOwnedAttemptsUseCase,
  saveAttemptProgress as saveAttemptProgressUseCase,
  startOrResumeAttempt as startOrResumeAttemptUseCase,
  submitAttempt as submitAttemptUseCase,
} from "./application";
import type { ProgressUpdate } from "./repository-port";
import { sqliteAttemptRepository } from "./sqlite-attempt-repository";
import type { Quiz } from "@/lib/quizzes/types";

const dependencies = {
  repository: sqliteAttemptRepository,
  now: () => new Date(),
  random: Math.random,
  createId: () => crypto.randomUUID(),
};

export function startOrResumeAttempt(userId: string, quiz: Quiz) {
  return startOrResumeAttemptUseCase(userId, quiz, dependencies);
}

export function saveAttemptProgress(
  userId: string,
  attemptId: string,
  expectedVersion: number,
  updates: ProgressUpdate[],
) {
  return saveAttemptProgressUseCase(userId, attemptId, expectedVersion, updates, dependencies);
}

export function submitAttempt(userId: string, attemptId: string) {
  return submitAttemptUseCase(userId, attemptId, dependencies);
}

export function getOwnedAttemptWorkspace(userId: string, attemptId: string) {
  return getOwnedAttemptWorkspaceUseCase(userId, attemptId, dependencies);
}

export function getOwnedAttemptReview(userId: string, attemptId: string) {
  return getOwnedAttemptReviewUseCase(userId, attemptId, dependencies);
}

export function listOwnedAttempts(userId: string) {
  return listOwnedAttemptsUseCase(userId, dependencies);
}

export function getOwnedQuizAttemptStats(userId: string) {
  return getOwnedQuizAttemptStatsUseCase(userId, dependencies);
}
