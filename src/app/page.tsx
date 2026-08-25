import { connection } from "next/server";

import { QuizCatalog } from "@/components/quiz-catalog";
import { AppNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { getOwnedQuizAttemptStats } from "@/lib/attempts/server-attempt-service";
import { getSessionUserId } from "@/lib/auth/session";
import { getPublicQuizCatalog } from "@/lib/quizzes/repository";
import { toQuizSummary } from "@/lib/quizzes/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await connection();
  const { status } = await searchParams;
  const catalog = getPublicQuizCatalog();
  const quizzes = catalog.quizzes.map(toQuizSummary);
  const userId = await getSessionUserId();
  const stats = userId ? getOwnedQuizAttemptStats(userId) : {};

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Quizzes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a quiz to start or review a completed attempt.
          </p>
        </div>
        <ThemeToggle />
      </div>
      <div className="mb-6"><AppNav active="quizzes" /></div>
      <QuizCatalog
        quizzes={quizzes}
        stats={stats}
        initialTab={status === "completed" ? "completed" : "available"}
        errors={
          process.env.NODE_ENV === "development"
            ? catalog.errors.map((error) => error.message)
            : []
        }
      />
    </main>
  );
}
