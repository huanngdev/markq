"use client";

import type { ReactNode } from "react";

import { QuizCatalogView } from "@/features/catalog/components/quiz-catalog-view";
import { useQuizCatalog } from "@/features/catalog/hooks/use-quiz-catalog";
import type { CatalogTab } from "@/features/catalog/navigation";
import type { QuizAttemptStat } from "@/lib/attempts/types";
import type { QuizSummary } from "@/lib/quizzes/types";

export function QuizCatalog({ quizzes, stats, initialTab, errors, analytics }: {
  quizzes: QuizSummary[];
  stats: Record<string, QuizAttemptStat>;
  initialTab: CatalogTab;
  errors: string[];
  analytics: ReactNode;
}) {
  const { tab, changeTab } = useQuizCatalog(initialTab);
  return <QuizCatalogView quizzes={quizzes} stats={stats} tab={tab} errors={errors} analytics={analytics} onTabChange={changeTab} />;
}
