import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuizWorkspace } from "@/components/quiz-workspace";
import { getQuizById } from "@/lib/quizzes/repository";

type QuizPageProps = { params: Promise<{ quizId: string }> };

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = getQuizById(quizId);
  if (!quiz) return { title: "Quiz not found", robots: { index: false } };

  const description = quiz.description || `Take the ${quiz.title} quiz and review every answer with an explanation.`;

  return {
    title: quiz.title,
    description,
    alternates: { canonical: `/quiz/${quiz.id}` },
    openGraph: {
      type: "website",
      url: `/quiz/${quiz.id}`,
      title: quiz.title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: quiz.title,
      description,
    },
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  const quiz = getQuizById(quizId);
  if (!quiz) notFound();

  return <QuizWorkspace quizId={quiz.id} quizTitle={quiz.title} />;
}
