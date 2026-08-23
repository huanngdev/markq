import "server-only";

import { desc, eq } from "drizzle-orm";

import { attemptAnswers, attempts } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import type { Quiz, QuizOption } from "@/lib/quizzes/types";

import { gradeQuiz, type SubmittedAnswers } from "./grading";

export type AttemptSummary = {
  id: string;
  quizId: string;
  quizTitle: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  scorePercent: number;
  submittedAt: string;
};

export type AttemptReviewAnswer = {
  id: string;
  questionId: string;
  questionOrder: number;
  prompt: string;
  options: QuizOption[];
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  explanation: string;
};

export type AttemptReview = AttemptSummary & {
  answers: AttemptReviewAnswer[];
};

export type QuizAttemptStat = {
  attemptCount: number;
  latestScore: number;
  bestScore: number;
  latestAttemptId: string;
};

export function createAttempt(quiz: Quiz, submittedAnswers: SubmittedAnswers) {
  const result = gradeQuiz(quiz, submittedAnswers);
  const database = getDatabase();
  const attemptId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();

  database.transaction((transaction) => {
    transaction
      .insert(attempts)
      .values({
        id: attemptId,
        quizId: quiz.id,
        quizTitle: quiz.title,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        unansweredCount: result.unansweredCount,
        totalQuestions: result.totalQuestions,
        scorePercent: result.scorePercent,
        submittedAt,
      })
      .run();

    transaction
      .insert(attemptAnswers)
      .values(
        result.answers.map(({ question, questionOrder, selectedOption, isCorrect }) => ({
          id: crypto.randomUUID(),
          attemptId,
          questionId: question.id,
          questionOrder,
          questionSnapshot: question.prompt,
          optionsSnapshot: JSON.stringify(question.options),
          selectedOption,
          correctOption: question.correctOption,
          isCorrect,
          explanationSnapshot: question.explanation,
        })),
      )
      .run();
  });

  return attemptId;
}

export function getAttempts(): AttemptSummary[] {
  return getDatabase().select().from(attempts).orderBy(desc(attempts.submittedAt)).all();
}

export function getAttemptById(id: string): AttemptReview | null {
  const database = getDatabase();
  const attempt = database.select().from(attempts).where(eq(attempts.id, id)).get();
  if (!attempt) return null;

  const answers = database
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, id))
    .orderBy(attemptAnswers.questionOrder)
    .all()
    .map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionOrder: answer.questionOrder,
      prompt: answer.questionSnapshot,
      options: JSON.parse(answer.optionsSnapshot) as QuizOption[],
      selectedOption: answer.selectedOption,
      correctOption: answer.correctOption,
      isCorrect: answer.isCorrect,
      explanation: answer.explanationSnapshot,
    }));

  return { ...attempt, answers };
}

export function getQuizAttemptStats(): Record<string, QuizAttemptStat> {
  const stats: Record<string, QuizAttemptStat> = {};

  for (const attempt of getAttempts()) {
    const current = stats[attempt.quizId];
    if (!current) {
      stats[attempt.quizId] = {
        attemptCount: 1,
        latestScore: attempt.scorePercent,
        bestScore: attempt.scorePercent,
        latestAttemptId: attempt.id,
      };
      continue;
    }

    current.attemptCount += 1;
    current.bestScore = Math.max(current.bestScore, attempt.scorePercent);
  }

  return stats;
}
