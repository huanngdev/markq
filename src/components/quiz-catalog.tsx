"use client";

import type { ReactNode } from "react";

import { QuizCatalogView } from "@/features/catalog/components/quiz-catalog-view";
import { useQuizCatalog } from "@/features/catalog/hooks/use-quiz-catalog";
import type { CatalogTab } from "@/features/catalog/navigation";
import type { QuizAttemptStat } from "@/lib/attempts/types";
import type { KnowledgeDocumentSummary } from "@/lib/knowledge/types";
import type { QuizSummary } from "@/lib/quizzes/types";

export function QuizCatalog({ quizzes, stats, knowledge, initialTab, errors, knowledgeErrors, analytics }: {
  quizzes: QuizSummary[];
  stats: Record<string, QuizAttemptStat>;
  knowledge: KnowledgeDocumentSummary[];
  initialTab: CatalogTab;
  errors: string[];
  knowledgeErrors: string[];
  analytics: ReactNode;
}) {
  const { tab, changeTab } = useQuizCatalog(initialTab);
  return (
    <QuizCatalogView
      quizzes={quizzes}
      stats={stats}
      knowledge={knowledge}
      tab={tab}
      errors={errors}
      knowledgeErrors={knowledgeErrors}
      analytics={analytics}
      onTabChange={changeTab}
    />
  );
}
