import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuizWorkspace } from "@/components/quiz-workspace";
import { getQuizById } from "@/lib/quizzes/repository";
import { toPublicQuiz } from "@/lib/quizzes/types";

type QuizPageProps = { params: Promise<{ quizId: string }> };

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = getQuizById(quizId);
  return { title: quiz?.title ?? "Quiz not found" };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  const quiz = getQuizById(quizId);
  if (!quiz) notFound();

  return <QuizWorkspace quiz={toPublicQuiz(quiz)} />;
}
