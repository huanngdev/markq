"use client";

import { ArrowRight, BookOpen, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QuizAttemptStat } from "@/lib/attempts/repository";
import type { QuizSummary } from "@/lib/quizzes/types";

type CatalogTab = "not-started" | "completed";

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
          <EmptyTitle>{completed ? "No completed quizzes" : "No quizzes to start"}</EmptyTitle>
          <EmptyDescription>
            {completed ? "Submit a quiz and it will appear here." : "Add a valid Markdown file to content/quizzes."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => {
        const quizStats = stats[quiz.id];
        return (
          <Card key={quiz.id} className="min-h-60 transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {quiz.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
              <CardTitle className="text-lg text-pretty"><h2>{quiz.title}</h2></CardTitle>
              <CardDescription className="line-clamp-3">
                {quiz.description || "A multiple-choice quiz with detailed explanations."}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto text-sm text-muted-foreground">
              <p>{quiz.questionCount} questions</p>
              {quizStats ? (
                <p className="mt-1 flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="size-4" aria-hidden="true" /> Best score: {quizStats.bestScore}%
                </p>
              ) : <p className="mt-1">Not attempted</p>}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {quizStats ? (
                <>
                  <Link href={`/quiz/${quiz.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <RotateCcw data-icon="inline-start" aria-hidden="true" /> Retake
                  </Link>
                  <Link href={`/attempts/${quizStats.latestAttemptId}`} className={buttonVariants({ size: "sm" })}>
                    Review <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <Link href={`/quiz/${quiz.id}`} className={buttonVariants({ size: "sm" })}>
                  Start <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export function QuizCatalog({ quizzes, stats, initialTab, errors }: {
  quizzes: QuizSummary[];
  stats: Record<string, QuizAttemptStat>;
  initialTab: CatalogTab;
  errors: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<CatalogTab>(initialTab);
  const notStarted = quizzes.filter((quiz) => !stats[quiz.id]);
  const completed = quizzes.filter((quiz) => Boolean(stats[quiz.id]));

  function changeTab(value: string) {
    const nextTab = value === "completed" ? "completed" : "not-started";
    setTab(nextTab);
    router.replace(nextTab === "completed" ? "/?status=completed" : "/", { scroll: false });
  }

  return (
    <>
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="mb-5 h-10 w-full sm:w-auto">
          <TabsTrigger value="not-started" className="px-4">Not Started <Badge variant="secondary">{notStarted.length}</Badge></TabsTrigger>
          <TabsTrigger value="completed" className="px-4">Completed <Badge variant="secondary">{completed.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="not-started"><QuizGrid quizzes={notStarted} stats={stats} completed={false} /></TabsContent>
        <TabsContent value="completed"><QuizGrid quizzes={completed} stats={stats} completed /></TabsContent>
      </Tabs>

      {errors.length > 0 ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>{errors.length} quiz files were skipped</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
