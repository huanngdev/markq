import "server-only";

import {
  getOwnedAttemptReview,
  getOwnedAttemptWorkspace,
} from "@/lib/attempts/server-attempt-service";
import {
  questionChatContextFromReview,
  questionChatContextFromWorkspace,
} from "@/lib/question-chat/application";
import type { QuestionChatContextRequest } from "@/lib/question-chat/contracts";

export function getOwnedQuestionChatContext(
  userId: string,
  request: QuestionChatContextRequest,
) {
  if (request.mode === "review") {
    const attempt = getOwnedAttemptReview(userId, request.attemptId);
    return attempt ? questionChatContextFromReview(attempt, request) : null;
  }

  const attempt = getOwnedAttemptWorkspace(userId, request.attemptId);
  return attempt ? questionChatContextFromWorkspace(attempt, request) : null;
}

