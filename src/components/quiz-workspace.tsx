"use client";

import { ChevronLeft, ChevronRight, House, List, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Markdown } from "@/components/markdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PublicQuiz } from "@/lib/quizzes/types";
import { cn } from "@/lib/utils";

type Answers = Record<string, string>;
type PendingAction = { type: "home" } | { type: "submit"; unanswered: number };

type SidebarProps = {
  quiz: PublicQuiz;
  answers: Answers;
  currentIndex: number;
  onQuestionChange: (index: number) => void;
};

function QuestionSidebar({ quiz, answers, currentIndex, onQuestionChange }: SidebarProps) {
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Question list" className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Questions</p>
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((question, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = Boolean(answers[question.id]);
            return (
              <Button
                key={question.id}
                type="button"
                size="icon"
                variant={isCurrent ? "secondary" : "outline"}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Question ${index + 1}, ${isAnswered ? "answered" : "not answered"}`}
                onClick={() => onQuestionChange(index)}
                className="relative size-9 tabular-nums"
              >
                {String(index + 1).padStart(2, "0")}
                {isAnswered ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
              </Button>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Answered</span>
          <span className="tabular-nums">{answeredCount}/{quiz.questions.length}</span>
        </div>
        <Progress value={progress} aria-label={`${answeredCount} of ${quiz.questions.length} questions answered`} />
      </div>
    </div>
  );
}

export function QuizWorkspace({ quiz }: { quiz: PublicQuiz }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const currentQuestion = quiz.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const hasAnswers = answeredCount > 0;

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!hasAnswers || submitting) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasAnswers, submitting]);

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    setMobileOpen(false);
  }

  async function saveAttempt() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers }),
      });
      const result = (await response.json()) as { attemptId?: string; error?: string };
      if (!response.ok || !result.attemptId) throw new Error(result.error ?? "Could not submit the quiz.");
      router.push(`/attempts/${result.attemptId}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not submit the quiz.");
      setSubmitting(false);
    }
  }

  function submitQuiz() {
    const unanswered = quiz.questions.length - answeredCount;
    if (unanswered > 0) {
      setPendingAction({ type: "submit", unanswered });
      return;
    }
    void saveAttempt();
  }

  function confirmPendingAction() {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.type === "home") router.push("/");
    else void saveAttempt();
  }

  return (
    <main className="h-svh max-h-screen overflow-hidden bg-muted/30 p-3 sm:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1520px] flex-col gap-3">
        <Card size="sm" className="shrink-0 gap-0 py-0">
          <CardHeader className="flex min-h-16 grid-cols-none flex-row items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Home"
                title="Home"
                className={buttonVariants({ variant: "outline", size: "icon-lg" })}
                onNavigate={(event) => {
                  if (!hasAnswers) return;
                  event.preventDefault();
                  setPendingAction({ type: "home" });
                }}
              >
                <House aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Quiz</p>
                <CardTitle className="truncate text-lg"><h1>{quiz.title}</h1></CardTitle>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:block">{quiz.questions.length} questions · No time limit</span>
              <Button variant="outline" size="icon-lg" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open question list">
                <List aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Card className="hidden h-full min-h-0 gap-0 py-0 lg:flex">
            <QuestionSidebar quiz={quiz} answers={answers} currentIndex={currentIndex} onQuestionChange={goToQuestion} />
          </Card>

          <Card className="h-full min-h-0 gap-0 py-0">
            <CardContent className="flex h-full min-h-0 flex-col p-4 sm:p-5">
              <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium tabular-nums">Question {currentIndex + 1} of {quiz.questions.length}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentIndex === 0 || submitting} onClick={() => goToQuestion(currentIndex - 1)}>
                    <ChevronLeft data-icon="inline-start" aria-hidden="true" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentIndex === quiz.questions.length - 1 || submitting} onClick={() => goToQuestion(currentIndex + 1)}>
                    Next <ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <section className="shrink-0" aria-labelledby="question-heading">
                <h2 id="question-heading" className="sr-only">Question {currentIndex + 1}</h2>
                <Markdown content={currentQuestion.prompt} className="w-full text-base font-medium sm:text-lg" />
              </section>

              <RadioGroup
                value={answers[currentQuestion.id] ?? ""}
                onValueChange={(value) => setAnswers((current) => ({ ...current, [currentQuestion.id]: String(value) }))}
                aria-label="Answer options"
                className="mt-3 shrink-0 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2"
              >
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.id;
                  return (
                    <Label
                      key={option.id}
                      htmlFor={`${currentQuestion.id}-${option.id}`}
                      className={cn(
                        "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-card p-4 transition-[border-color,background-color] hover:bg-accent",
                        selected && "border-primary bg-accent",
                      )}
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold", selected && "bg-primary text-primary-foreground")}>{option.id}</span>
                      <Markdown content={option.content} className="min-w-0 flex-1" />
                      <RadioGroupItem id={`${currentQuestion.id}-${option.id}`} value={option.id} aria-label={option.content} />
                    </Label>
                  );
                })}
              </RadioGroup>

              <div className="mt-auto shrink-0 border-t pt-3">
                {error ? <p role="alert" className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                <div className="flex justify-end">
                  <Button size="lg" disabled={submitting} onClick={submitQuiz}>
                    {submitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" aria-hidden="true" /> : null}
                    <span aria-live="polite">{submitting ? "Grading…" : "Submit Quiz"}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="w-[min(90vw,24rem)] gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Quiz Navigation</SheetTitle>
            <SheetDescription>Jump to any question in this quiz.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <QuestionSidebar quiz={quiz} answers={answers} currentIndex={currentIndex} onQuestionChange={goToQuestion} />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.type === "home" ? "Leave this quiz?" : "Submit incomplete quiz?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "home"
                ? "Your unsubmitted answers will be lost."
                : `${pendingAction?.unanswered ?? 0} questions are still unanswered.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction}>
              {pendingAction?.type === "home" ? "Leave Quiz" : "Submit Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
