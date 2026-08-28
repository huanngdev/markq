import type { Metadata } from "next";
import { connection } from "next/server";

import { QuizCatalog } from "@/components/quiz-catalog";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnalyticsView } from "@/features/analytics/components/analytics-view";
import { analyticsSubjectFrom, catalogTabFrom } from "@/features/catalog/navigation";
import { getOwnedAnalyticsReport } from "@/lib/analytics/server-analytics-service";
import { getOwnedQuizAttemptStats } from "@/lib/attempts/server-attempt-service";
import { getSessionUserId } from "@/lib/auth/session";
import { readKnowledgeCatalog, toKnowledgeDocumentSummary } from "@/lib/knowledge/repository";
import { getPublicQuizCatalog } from "@/lib/quizzes/repository";
import { toQuizSummary } from "@/lib/quizzes/types";

type HomePageProps = {
  searchParams: Promise<{ status?: string | string[]; subject?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const tab = catalogTabFrom((await searchParams).status);
  if (tab === "available") return {};
  return {
    title: tab === "analytics"
      ? "Analytics"
      : tab === "knowledge" ? "Knowledge" : "Completed quizzes",
    robots: { index: false, follow: false },
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await connection();
  const [{ status, subject }, userId] = await Promise.all([searchParams, getSessionUserId()]);
  const tab = catalogTabFrom(status);
  const catalog = getPublicQuizCatalog();
  const knowledgeCatalog = readKnowledgeCatalog();
  const quizzes = catalog.quizzes.map(toQuizSummary);
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
      <QuizCatalog
        quizzes={quizzes}
        stats={stats}
        knowledge={knowledgeCatalog.documents.map(toKnowledgeDocumentSummary)}
        initialTab={tab}
        analytics={tab === "analytics" ? (
          <AnalyticsView
            report={getOwnedAnalyticsReport(userId ?? "")}
            filter={analyticsSubjectFrom(subject)}
            showErrors={process.env.NODE_ENV === "development"}
          />
        ) : null}
        errors={
          process.env.NODE_ENV === "development"
            ? catalog.errors.map((error) => error.message)
            : []
        }
        knowledgeErrors={
          process.env.NODE_ENV === "development"
            ? knowledgeCatalog.errors.map((error) => error.message)
            : []
        }
      />
    </main>
  );
}
