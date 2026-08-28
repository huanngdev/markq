"use client";

import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  House,
  List,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { Markdown } from "@/components/markdown";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  QuizAttemptCommands,
  QuizAttemptViewModel,
} from "@/features/quiz/hooks/use-quiz-attempt";
import type { AttemptWorkspace } from "@/lib/attempts/types";
import { cn } from "@/lib/utils";

type QuizWorkspaceViewProps = {
  quizTitle: string;
  viewModel: QuizAttemptViewModel;
  commands: QuizAttemptCommands;
};

function formatTime(seconds: number | null) {
  if (seconds === null) return "No time limit";
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function QuestionSidebar({
  attempt,
  currentIndex,
  onQuestionChange,
  canOpenQuestion,
}: {
  attempt: AttemptWorkspace;
  currentIndex: number;
  onQuestionChange(index: number): void;
  canOpenQuestion(index: number): boolean;
}) {
  const answeredCount = attempt.answers.filter((answer) => answer.selectedOptions.length > 0).length;
  const flaggedCount = attempt.answers.filter((answer) => answer.isFlagged).length;
  const progress = (answeredCount / attempt.answers.length) * 100;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Question list" className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Questions</p>
        <div className="flex flex-wrap gap-2">
          {attempt.answers.map((answer, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = answer.selectedOptions.length > 0;
            return (
              <Button
                key={answer.questionId}
                type="button"
                size="icon"
                variant={isCurrent ? "secondary" : "outline"}
                disabled={!canOpenQuestion(index)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Question ${index + 1}, ${isAnswered ? "answered" : "not answered"}${answer.isFlagged ? ", flagged" : ""}`}
                onClick={() => onQuestionChange(index)}
                className="relative size-9 tabular-nums"
              >
                {String(index + 1).padStart(2, "0")}
                {isAnswered ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
                {answer.isFlagged ? <Bookmark className="absolute bottom-0.5 left-0.5 size-2.5 fill-amber-500 text-amber-500" aria-hidden="true" /> : null}
              </Button>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Answered {answeredCount}/{attempt.answers.length}</span>
          {flaggedCount > 0 ? <span>{flaggedCount} flagged</span> : null}
        </div>
        <Progress value={progress} aria-label={`${answeredCount} of ${attempt.answers.length} questions answered`} />
      </div>
    </div>
  );
}

function LoadingState({ quizTitle }: { quizTitle: string }) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="animate-spin" aria-hidden="true" />
        Loading {quizTitle}…
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Could not open quiz</CardTitle></CardHeader>
        <CardContent>
          <p role="alert" className="text-sm text-destructive">{message}</p>
          <Button className="mt-4" onClick={onRetry}><RefreshCw aria-hidden="true" /> Retry</Button>
        </CardContent>
      </Card>
    </main>
  );
}

export function QuizWorkspaceView({ quizTitle, viewModel, commands }: QuizWorkspaceViewProps) {
  const { attempt } = viewModel;
  if (viewModel.isLoading) return <LoadingState quizTitle={quizTitle} />;
  if (!attempt) return <ErrorState message={viewModel.error || "The quiz is unavailable."} onRetry={commands.retry} />;

  const currentAnswer = attempt.answers[viewModel.currentIndex];
  const isFirst = viewModel.currentIndex === 0;
  const isLast = viewModel.currentIndex === attempt.answers.length - 1;
  const isBusy = viewModel.isSubmitting || attempt.status !== "in_progress";
  const timerIsUrgent = viewModel.remainingSeconds !== null && viewModel.remainingSeconds <= 60;

  return (
    <main className="h-svh max-h-screen overflow-hidden bg-muted/30 p-3 sm:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1520px] flex-col gap-3">
        <Card size="sm" className="shrink-0 gap-0 py-0">
          <CardHeader className="flex min-h-16 grid-cols-none flex-row items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="outline" size="icon-lg" aria-label="Home" title="Home" onClick={commands.requestHome}>
                  <House aria-hidden="true" />
                </Button>
                <ThemeToggle />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Quiz</p>
                <CardTitle className="truncate text-lg"><h1>{attempt.quizTitle}</h1></CardTitle>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={timerIsUrgent ? "destructive" : "outline"} className="gap-1 tabular-nums">
                <Clock3 aria-hidden="true" /> {formatTime(viewModel.remainingSeconds)}
              </Badge>
              <span className="hidden text-xs text-muted-foreground sm:inline" aria-live="polite">
                {viewModel.isSaving ? "Saving…" : "Saved"}
              </span>
              <Button variant="outline" size="icon-lg" className="lg:hidden" onClick={() => commands.setMobileOpen(true)} aria-label="Open question list">
                <List aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Card className="hidden h-full min-h-0 gap-0 py-0 lg:flex">
            <QuestionSidebar
              attempt={attempt}
              currentIndex={viewModel.currentIndex}
              onQuestionChange={commands.goToQuestion}
              canOpenQuestion={commands.canOpenQuestion}
            />
          </Card>

          <Card className="h-full min-h-0 gap-0 py-0">
            <CardContent className="flex h-full min-h-0 flex-col overflow-hidden p-0">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 p-4 pb-3 text-sm sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">Question {viewModel.currentIndex + 1} of {attempt.answers.length}</span>
                  <Badge variant="outline">{currentAnswer.points} pt{currentAnswer.points === 1 ? "" : "s"}</Badge>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant={currentAnswer.isFlagged ? "secondary" : "outline"} size="sm" disabled={isBusy} onClick={commands.toggleFlag}>
                    {currentAnswer.isFlagged ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                    {currentAnswer.isFlagged ? "Flagged" : "Flag"} <Kbd className="hidden lg:inline-flex">F</Kbd>
                  </Button>
                  <Button variant="outline" size="sm" disabled={isFirst || isBusy} onClick={() => commands.goToQuestion(viewModel.currentIndex - 1)}>
                    <ChevronLeft data-icon="inline-start" aria-hidden="true" /> Previous <Kbd className="hidden lg:inline-flex">←</Kbd>
                  </Button>
                  <Button variant="outline" size="sm" disabled={isLast || isBusy || !commands.canOpenQuestion(viewModel.currentIndex + 1)} onClick={() => commands.goToQuestion(viewModel.currentIndex + 1)}>
                    Next <Kbd className="hidden lg:inline-flex">→</Kbd><ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                  <Button size="sm" disabled={isBusy} onClick={commands.requestSubmit}>
                    {viewModel.isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                    {viewModel.isSubmitting ? "Grading…" : "Submit Quiz"}
                    <Kbd className="hidden bg-primary-foreground/15 text-primary-foreground lg:inline-flex">⌘↵</Kbd>
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="min-w-0 p-4 pt-0 sm:px-5 xl:overflow-y-auto">
                  {viewModel.error ? <p role="alert" className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{viewModel.error}</p> : null}

                  <section className="shrink-0" aria-labelledby="question-heading">
                    <h2 id="question-heading" className="sr-only">Question {viewModel.currentIndex + 1}</h2>
                    <Markdown content={currentAnswer.prompt} className="w-full text-base font-medium sm:text-lg" />
                    {currentAnswer.selectionMode === "multiple" ? (
                      <p className="mt-1 text-xs text-muted-foreground">Select all correct answers.</p>
                    ) : null}
                  </section>

                  {currentAnswer.selectionMode === "single" ? (
                    <RadioGroup
                      value={currentAnswer.selectedOptions[0] ?? ""}
                      onValueChange={(value) => commands.selectOption(String(value))}
                      aria-label="Answer options"
                      className="mt-3 shrink-0 grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                      {currentAnswer.options.map((option) => {
                        const isSelected = currentAnswer.selectedOptions.includes(option.id);
                        return (
                          <Label key={option.id} htmlFor={`${currentAnswer.questionId}-${option.id}`} className={cn(
                            "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent",
                            isSelected && "border-primary bg-accent",
                          )}>
                            <span className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold", isSelected && "bg-primary text-primary-foreground")}>{option.id}</span>
                            <Markdown content={option.content} className="min-w-0 flex-1" />
                            <RadioGroupItem id={`${currentAnswer.questionId}-${option.id}`} value={option.id} aria-label={option.content} />
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    <div className="mt-3 grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Answer options">
                      {currentAnswer.options.map((option) => {
                        const isSelected = currentAnswer.selectedOptions.includes(option.id);
                        return (
                          <Label key={option.id} htmlFor={`${currentAnswer.questionId}-${option.id}`} className={cn(
                            "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent",
                            isSelected && "border-primary bg-accent",
                          )}>
                            <span className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold", isSelected && "bg-primary text-primary-foreground")}>{option.id}</span>
                            <Markdown content={option.content} className="min-w-0 flex-1" />
                            <Checkbox id={`${currentAnswer.questionId}-${option.id}`} checked={isSelected} onCheckedChange={() => commands.selectOption(option.id)} aria-label={option.content} />
                          </Label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={viewModel.isMobileOpen} onOpenChange={commands.setMobileOpen}>
        <SheetContent className="w-[min(90vw,24rem)] gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Quiz Navigation</SheetTitle>
            <SheetDescription>Review progress or jump to an available question.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            <QuestionSidebar attempt={attempt} currentIndex={viewModel.currentIndex} onQuestionChange={commands.goToQuestion} canOpenQuestion={commands.canOpenQuestion} />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={viewModel.pendingAction !== null} onOpenChange={(open) => { if (!open) commands.dismissPendingAction(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{viewModel.pendingAction?.type === "home" ? "Leave this quiz?" : "Submit incomplete quiz?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {viewModel.pendingAction?.type === "home"
                ? "Saved progress will remain available when you return."
                : `${viewModel.pendingAction?.unanswered ?? 0} questions are still unanswered.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={commands.confirmPendingAction}>
              {viewModel.pendingAction?.type === "home" ? "Leave Quiz" : "Submit Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
