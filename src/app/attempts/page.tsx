import { ArrowRight, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getAttempts } from "@/lib/attempts/repository";

export const metadata: Metadata = {
  title: "Attempt history",
  robots: { index: false, follow: false },
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AttemptsPage() {
  await connection();
  const attempts = getAttempts();

  return (
    <main className="mx-auto min-h-svh w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Saved results</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">Attempt History</h1>
          <p className="mt-2 text-sm text-muted-foreground">Each submission keeps its own quiz snapshot for accurate review.</p>
        </div>
        <ThemeToggle />
      </div>

      {attempts.length > 0 ? (
        <div className="mt-8 space-y-3">
          {attempts.map((attempt) => (
            <Link key={attempt.id} href={`/attempts/${attempt.id}`} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground tabular-nums">{attempt.scorePercent}%</div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-medium">{attempt.quizTitle}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{formatSubmittedAt(attempt.submittedAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant="secondary">{attempt.correctCount} correct</Badge>
                    <Badge variant="destructive">{attempt.incorrectCount} incorrect</Badge>
                    {attempt.unansweredCount > 0 ? <Badge variant="outline">{attempt.unansweredCount} unanswered</Badge> : null}
                    <ArrowRight className="ml-2 text-muted-foreground transition-transform group-hover:translate-x-1" size={18} aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty className="mt-8 min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><ClipboardList aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>No saved attempts</EmptyTitle>
            <EmptyDescription>Choose a quiz and submit it to save your first result.</EmptyDescription>
          </EmptyHeader>
          <Link href="/" className="text-sm font-medium underline underline-offset-4">Browse Quizzes</Link>
        </Empty>
      )}
    </main>
  );
}
