"use client";

import { QuizManagerView } from "@/features/manage/components/quiz-manager-view";
import { useQuizManager } from "@/features/manage/hooks/use-quiz-manager";

export function QuizManager({ isEnabled }: { isEnabled: boolean }) {
  const { viewModel, commands } = useQuizManager();
  return <QuizManagerView isEnabled={isEnabled} viewModel={viewModel} commands={commands} />;
}
