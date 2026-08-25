"use client";

import { Check, ChevronLeft, ChevronRight, CircleMinus, House, List, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

import { Markdown } from "@/components/markdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AttemptReview } from "@/lib/attempts/repository";
import { cn } from "@/lib/utils";

function ReviewQuestionList({ attempt, currentIndex, onChange }: {
  attempt: AttemptReview;
  currentIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-4">
        <p className="text-xs font-medium text-muted-foreground">Score</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <strong className="text-2xl tabular-nums">{attempt.scorePercent}%</strong>
          <span className="text-sm text-muted-foreground">{attempt.correctCount}/{attempt.totalQuestions} correct</span>
        </div>
      </div>
      <nav aria-label="Review question list" className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-wrap gap-2">
          {attempt.answers.map((answer, index) => {
            const state = answer.selectedOption === null ? "unanswered" : answer.isCorrect ? "correct" : "incorrect";
            return (
              <Button
                key={answer.id}
                type="button"
                size="icon"
                variant={index === currentIndex ? "secondary" : "outline"}
                aria-current={index === currentIndex ? "step" : undefined}
                aria-label={`Question ${index + 1}, ${state}`}
                onClick={() => onChange(index)}
                className={cn(
                  "size-9 tabular-nums",
                  state === "correct" && "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
                  state === "incorrect" && "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
                  state === "unanswered" && "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </Button>
            );
          })}
        </div>
      </nav>
      <div className="space-y-1 border-t p-4 text-xs text-muted-foreground">
        <p><span className="text-emerald-600">●</span> Correct: {attempt.correctCount}</p>
        <p><span className="text-red-600">●</span> Incorrect: {attempt.incorrectCount}</p>
        <p><span className="text-amber-600">●</span> Unanswered: {attempt.unansweredCount}</p>
      </div>
    </div>
  );
}

export function AttemptReviewWorkspace({ attempt }: { attempt: AttemptReview }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentAnswer = attempt.answers[currentIndex];

  function changeQuestion(index: number) {
    setCurrentIndex(index);
    setMobileOpen(false);
  }

  const handleReviewShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.isContentEditable ||
      target.matches("input, textarea, select")
    );
    if (event.defaultPrevented || isTyping || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "ArrowLeft" && currentIndex > 0) {
      event.preventDefault();
      changeQuestion(currentIndex - 1);
    } else if (event.key === "ArrowRight" && currentIndex < attempt.answers.length - 1) {
      event.preventDefault();
      changeQuestion(currentIndex + 1);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleReviewShortcut);
    return () => window.removeEventListener("keydown", handleReviewShortcut);
  }, []);

  return (
    <main className="h-svh max-h-screen overflow-hidden bg-muted/30 p-3 sm:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1520px] flex-col gap-3">
        <Card size="sm" className="shrink-0 gap-0 py-0">
          <CardHeader className="flex min-h-16 grid-cols-none flex-row items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-lg"
                  nativeButton={false}
                  render={<Link href="/" aria-label="Home" title="Home" />}
                >
                  <House aria-hidden="true" />
                </Button>
                <ThemeToggle />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Review</p>
                <CardTitle className="truncate text-lg"><h1>{attempt.quizTitle}</h1></CardTitle>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <strong className="text-lg tabular-nums lg:hidden">{attempt.scorePercent}%</strong>
              <Button variant="outline" size="icon-lg" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open review question list">
                <List aria-hidden="true" />
              </Button>
              <Link className={buttonVariants({ variant: "outline", size: "lg", className: "hidden sm:inline-flex" })} href={`/quiz/${attempt.quizId}`}>
                <RotateCcw data-icon="inline-start" aria-hidden="true" /> Retake
              </Link>
            </div>
          </CardHeader>
        </Card>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Card className="hidden h-full min-h-0 gap-0 py-0 lg:flex">
            <ReviewQuestionList attempt={attempt} currentIndex={currentIndex} onChange={changeQuestion} />
          </Card>

          <Card className="h-full min-h-0 gap-0 py-0">
            <CardContent className="flex h-full min-h-0 flex-col overflow-y-auto p-4 sm:p-5">
              <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium tabular-nums">Question {currentIndex + 1} of {attempt.totalQuestions}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={currentAnswer.isCorrect ? "secondary" : currentAnswer.selectedOption ? "destructive" : "outline"}>
                    {currentAnswer.isCorrect ? <Check aria-hidden="true" /> : <CircleMinus aria-hidden="true" />}
                    {currentAnswer.isCorrect ? "Correct" : currentAnswer.selectedOption ? "Incorrect" : "Unanswered"}
                  </Badge>
                  <Button variant="outline" size="sm" disabled={currentIndex === 0} onClick={() => changeQuestion(currentIndex - 1)}>
                    <ChevronLeft data-icon="inline-start" aria-hidden="true" /> Previous <Kbd className="hidden lg:inline-flex">←</Kbd>
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentIndex === attempt.answers.length - 1} onClick={() => changeQuestion(currentIndex + 1)}>
                    Next <Kbd className="hidden lg:inline-flex">→</Kbd><ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <section className="shrink-0" aria-labelledby="review-question-heading">
                <h2 id="review-question-heading" className="sr-only">Review question {currentIndex + 1}</h2>
                <Markdown content={currentAnswer.prompt} className="w-full text-base font-medium sm:text-lg" />
              </section>

              <div className="mt-3 grid shrink-0 gap-2 sm:grid-cols-2" aria-label="Answer options and results">
                {currentAnswer.options.map((option) => {
                  const isCorrect = option.id === currentAnswer.correctOption;
                  const isSelected = option.id === currentAnswer.selectedOption;
                  return (
                    <div key={option.id} className={cn(
                      "flex min-h-16 items-center gap-3 rounded-lg border bg-card p-4",
                      isCorrect && "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
                      isSelected && !isCorrect && "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
                    )}>
                      <span className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold",
                        isCorrect && "bg-emerald-600 text-white",
                        isSelected && !isCorrect && "bg-red-600 text-white",
                      )}>{option.id}</span>
                      <Markdown content={option.content} className="min-w-0 flex-1" />
                      <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-medium">
                        {isCorrect ? <><Check aria-hidden="true" /> Correct answer</> : null}
                        {isSelected && !isCorrect ? <><X aria-hidden="true" /> Your answer</> : null}
                      </span>
                    </div>
                  );
                })}
              </div>

              <section className="mt-3 shrink-0 rounded-lg border bg-muted/40 p-4" aria-labelledby="explanation-heading">
                <h2 id="explanation-heading" className="mb-2 text-sm font-medium">Explanation</h2>
                <Markdown content={currentAnswer.explanation} />
              </section>

            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="w-[min(90vw,24rem)] gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Review Navigation</SheetTitle>
            <SheetDescription>Jump to any question in this attempt.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <ReviewQuestionList attempt={attempt} currentIndex={currentIndex} onChange={changeQuestion} />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
