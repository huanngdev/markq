"use client";

import { QuizWorkspaceView } from "@/features/quiz/components/quiz-workspace-view";
import { useQuizAttempt } from "@/features/quiz/hooks/use-quiz-attempt";

export function QuizWorkspace({ quizId, quizTitle }: { quizId: string; quizTitle: string }) {
  const { viewModel, commands } = useQuizAttempt(quizId);
  return <QuizWorkspaceView quizTitle={quizTitle} viewModel={viewModel} commands={commands} />;
}
