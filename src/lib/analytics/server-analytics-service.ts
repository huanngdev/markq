import "server-only";

import { readKnowledgeCatalog } from "@/lib/knowledge/repository";
import { readQuizCatalog } from "@/lib/quizzes/repository";

import { buildAnalyticsReport } from "./application";
import { readOwnedAnalyticsAnswers } from "./repository";

export function getOwnedAnalyticsReport(userId: string) {
  const quizCatalog = readQuizCatalog();
  const fallbackTopicIds = new Map<string, string>();
  for (const quiz of quizCatalog.quizzes) {
    for (const question of quiz.questions) {
      if (question.topicId) fallbackTopicIds.set(`${quiz.id}:${question.id}`, question.topicId);
    }
  }

  const knowledgeCatalog = readKnowledgeCatalog();
  return buildAnalyticsReport(
    readOwnedAnalyticsAnswers(userId),
    knowledgeCatalog.topics,
    fallbackTopicIds,
    knowledgeCatalog.errors.map((error) => error.message),
  );
}
