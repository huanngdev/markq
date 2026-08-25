"use client";

import { QuizCatalogView } from "@/features/catalog/components/quiz-catalog-view";
import { useQuizCatalog, type CatalogTab } from "@/features/catalog/hooks/use-quiz-catalog";
import type { QuizAttemptStat } from "@/lib/attempts/types";
import type { QuizSummary } from "@/lib/quizzes/types";

export function QuizCatalog({ quizzes, stats, initialTab, errors }: {
  quizzes: QuizSummary[];
  stats: Record<string, QuizAttemptStat>;
  initialTab: CatalogTab;
  errors: string[];
}) {
  const { tab, changeTab } = useQuizCatalog(initialTab);
  return <QuizCatalogView quizzes={quizzes} stats={stats} tab={tab} errors={errors} onTabChange={changeTab} />;
}
