"use client";

import { ArrowRight, BookOpen, CheckCircle2, Clock3, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogTab } from "@/features/catalog/navigation";
import type { QuizAttemptStat } from "@/lib/attempts/types";
import type { QuizSummary } from "@/lib/quizzes/types";

function QuizGrid({ quizzes, stats, completed }: {
  quizzes: QuizSummary[];
  stats: Record<string, QuizAttemptStat>;
  completed: boolean;
}) {
  if (quizzes.length === 0) {
    return (
      <Empty className="min-h-64 border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><BookOpen aria-hidden="true" /></EmptyMedia>
          <EmptyTitle>{completed ? "No completed quizzes" : "No quizzes available"}</EmptyTitle>
          <EmptyDescription>{completed ? "Submit a quiz and it will appear here." : "Add a public Markdown quiz to content/quizzes."}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => {
        const quizStats = stats[quiz.id];
        const hasCompleted = (quizStats?.attemptCount ?? 0) > 0;
        const isInProgress = Boolean(quizStats?.inProgressAttemptId);
        return (
          <Card key={quiz.id} className="min-h-64 transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {quiz.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                {quiz.settings.timeLimitMinutes !== null ? <Badge variant="outline"><Clock3 aria-hidden="true" /> {quiz.settings.timeLimitMinutes} min</Badge> : null}
                {quiz.multipleChoiceCount > 0 ? <Badge variant="outline">Multi-select</Badge> : null}
              </div>
              <CardTitle className="text-lg text-pretty"><h2>{quiz.title}</h2></CardTitle>
              <CardDescription className="line-clamp-3">{quiz.description || "A multiple-choice quiz with detailed explanations."}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto text-sm text-muted-foreground">
              <p>{quiz.questionCount} questions · {quiz.totalPoints} points</p>
              {hasCompleted ? (
                <p className="mt-1 flex items-center gap-1.5 text-foreground"><CheckCircle2 className="size-4" aria-hidden="true" /> Best score: {quizStats.bestScore}%</p>
              ) : isInProgress ? <p className="mt-1 text-foreground">Saved attempt in progress</p> : <p className="mt-1">Not attempted</p>}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {hasCompleted ? (
                <>
                  <Link href={`/quiz/${quiz.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><RotateCcw aria-hidden="true" /> Retake</Link>
                  {quizStats.latestReviewAvailable ? <Link href={`/attempts/${quizStats.latestAttemptId}`} className={buttonVariants({ size: "sm" })}>Review <ArrowRight aria-hidden="true" /></Link> : null}
                </>
              ) : (
                <Link href={`/quiz/${quiz.id}`} className={buttonVariants({ size: "sm" })}>{isInProgress ? "Resume" : "Start"} <ArrowRight aria-hidden="true" /></Link>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export function QuizCatalogView({ quizzes, stats, tab, errors, analytics, onTabChange }: {
  quizzes: QuizSummary[];
  stats: Record<string, QuizAttemptStat>;
  tab: CatalogTab;
  errors: string[];
  analytics: ReactNode;
  onTabChange(value: string): void;
}) {
  const available = quizzes.filter((quiz) => (stats[quiz.id]?.attemptCount ?? 0) === 0);
  const completed = quizzes.filter((quiz) => (stats[quiz.id]?.attemptCount ?? 0) > 0);
  return (
    <>
      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList aria-label="Quiz catalog" className="mb-5 h-10 w-full sm:w-auto">
          <TabsTrigger value="available" className="px-2 sm:px-4">Available <Badge variant="secondary">{available.length}</Badge></TabsTrigger>
          <TabsTrigger value="completed" className="px-2 sm:px-4">Completed <Badge variant="secondary">{completed.length}</Badge></TabsTrigger>
          <TabsTrigger value="analytics" className="px-2 sm:px-4">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="available"><QuizGrid quizzes={available} stats={stats} completed={false} /></TabsContent>
        <TabsContent value="completed"><QuizGrid quizzes={completed} stats={stats} completed /></TabsContent>
        <TabsContent value="analytics">{analytics}</TabsContent>
      </Tabs>
      {errors.length > 0 ? (
        <Alert variant="destructive" className="mt-6"><AlertTitle>{errors.length} quiz files were skipped</AlertTitle><AlertDescription><ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></AlertDescription></Alert>
      ) : null}
    </>
  );
}
