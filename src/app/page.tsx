import { connection } from "next/server";

import { QuizCatalog } from "@/components/quiz-catalog";
import { getQuizAttemptStats } from "@/lib/attempts/repository";
import { readQuizCatalog } from "@/lib/quizzes/repository";
import { toQuizSummary } from "@/lib/quizzes/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await connection();
  const { status } = await searchParams;
  const catalog = readQuizCatalog();
  const quizzes = catalog.quizzes.map(toQuizSummary);
  const stats = getQuizAttemptStats();

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Quizzes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a quiz to start or review a completed attempt.
        </p>
      </div>
      <QuizCatalog
        quizzes={quizzes}
        stats={stats}
        initialTab={status === "completed" ? "completed" : "not-started"}
        errors={
          process.env.NODE_ENV === "development"
            ? catalog.errors.map((error) => error.message)
            : []
        }
      />
    </main>
  );
}
