import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { attemptAnswers, attempts } from "@/db/schema";
import { getDatabase } from "@/lib/db";

import type { AnalyticsAnswerRecord } from "./types";

const selectedOptionsSchema = z.array(z.string());

export function readOwnedAnalyticsAnswers(userId: string): AnalyticsAnswerRecord[] {
  const rows = getDatabase()
    .select({
      attemptId: attempts.id,
      quizId: attempts.quizId,
      questionId: attemptAnswers.questionId,
      prompt: attemptAnswers.questionSnapshot,
      topicId: attemptAnswers.topicId,
      selectedOptions: attemptAnswers.selectedOptions,
      isCorrect: attemptAnswers.isCorrect,
    })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
    .where(and(
      eq(attempts.userId, userId),
      inArray(attempts.status, ["submitted", "expired"]),
    ))
    .all();

  return rows.map((row) => ({
    ...row,
    topicId: row.topicId || null,
    selectedOptions: selectedOptionsSchema.parse(JSON.parse(row.selectedOptions)),
    isCorrect: row.isCorrect === true,
  }));
}
