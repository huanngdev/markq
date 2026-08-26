import { AlertTriangle, ArrowRight, BarChart3, BookOpen, CircleCheck } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { catalogHref, type AnalyticsSubject } from "@/features/catalog/navigation";
import type { AnalyticsReport, SubjectAnalytics, TopicAnalytics } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

function SummaryCard({ label, value, detail, tone = "default" }: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-emerald-600 dark:text-emerald-400",
        )}>{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}

function SubjectCard({ stats }: { stats: SubjectAnalytics }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{stats.subjectTitle}</CardTitle>
            <CardDescription>{stats.attemptCount} completed attempt{stats.attemptCount === 1 ? "" : "s"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-end justify-between gap-4">
          <span className="text-2xl font-semibold tabular-nums">{stats.accuracyPercent}%</span>
          <span className="text-xs text-muted-foreground">{stats.incorrectCount} incorrect · {stats.unansweredCount} unanswered</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${stats.accuracyPercent}% accuracy`}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${stats.accuracyPercent}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function WeakTopicChart({ topics }: { topics: TopicAnalytics[] }) {
  const visible = topics.slice(0, 8);
  const maximum = Math.max(...visible.map((topic) => topic.incorrectCount), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most frequent mistakes</CardTitle>
        <CardDescription>Topics are ranked by incorrect answers, then by lower accuracy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {visible.map((topic, index) => (
          <div key={topic.topicId}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{topic.title}</span>
              <span className="shrink-0 font-medium tabular-nums">{topic.incorrectCount} wrong</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-destructive"
                style={{ width: `${Math.max(5, (topic.incorrectCount / maximum) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function KnowledgeReviewCard({ topic, filter }: { topic: TopicAnalytics; filter: AnalyticsSubject }) {
  return (
    <Link
      href={`/knowledge/${topic.topicId}?subject=${filter}`}
      aria-label={`Review ${topic.title}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full min-h-64 transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{topic.subjectTitle}</Badge>
            <Badge variant="destructive">{topic.incorrectCount} incorrect</Badge>
          </div>
          <CardTitle className="text-lg text-pretty"><h3>{topic.title}</h3></CardTitle>
          <CardDescription className="line-clamp-3">Review the lesson, formulas, examples, and common mistakes for this topic.</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto text-sm text-muted-foreground">
          <p>{topic.questionCount} questions · {topic.accuracyPercent}% accuracy</p>
          <p className="mt-1">{topic.correctCount} correct · {topic.unansweredCount} unanswered</p>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <span className={buttonVariants({ size: "sm" })}>Read lesson <ArrowRight aria-hidden="true" /></span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function AnalyticsView({ report, filter: requestedFilter, showErrors = false }: {
  report: AnalyticsReport;
  filter: AnalyticsSubject;
  showErrors?: boolean;
}) {
  const selectedSubject = report.subjects.find((subject) => subject.subject === requestedFilter);
  const filter = selectedSubject?.subject ?? "all";
  const overview = selectedSubject ?? report;
  const weakTopics = filter === "all"
    ? report.weakTopics
    : report.weakTopics.filter((topic) => topic.subject === filter);

  return (
    <div>
      <p className="max-w-2xl text-sm text-muted-foreground">Find the topics you miss most, then review the formulas, reasoning, examples, and hints connected to those questions.</p>
      <nav aria-label="Analytics subject" className="mt-4 flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1">
        {[{ subject: "all", subjectTitle: "All" }, ...report.subjects].map(({ subject: value, subjectTitle }) => (
          <Link
            key={value}
            href={catalogHref("analytics", value)}
            scroll={false}
            aria-current={filter === value ? "page" : undefined}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", filter === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {subjectTitle}
          </Link>
        ))}
      </nav>

      {overview.questionCount === 0 ? (
        <Empty className="mt-8 min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BarChart3 aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>No analytics yet</EmptyTitle>
            <EmptyDescription>Submit a quiz with topic metadata linked to a knowledge document to see recurring mistakes and review lessons here.</EmptyDescription>
          </EmptyHeader>
          <Link href="/" className="text-sm font-medium underline underline-offset-4">Browse quizzes</Link>
        </Empty>
      ) : (
        <>
          <section aria-label="Overview" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Completed attempts" value={overview.attemptCount} detail="Attempts with linked analytics topics" />
            <SummaryCard label="Accuracy" value={`${overview.accuracyPercent}%`} detail={`${overview.correctCount} correct of ${overview.questionCount}`} tone="success" />
            <SummaryCard label="Incorrect" value={overview.incorrectCount} detail="Answered but graded incorrect" tone="danger" />
            <SummaryCard label="Unanswered" value={overview.unansweredCount} detail="Submitted without a selection" />
          </section>

          <section aria-labelledby="subject-heading" className="mt-8">
            <h2 id="subject-heading" className="mb-4 text-xl font-semibold">By subject</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(selectedSubject ? [selectedSubject] : report.subjects).map((stats) => <SubjectCard key={stats.subject} stats={stats} />)}
            </div>
          </section>

          {weakTopics.length > 0 ? (
            <>
              <section aria-labelledby="weak-heading" className="mt-8">
                <h2 id="weak-heading" className="mb-4 text-xl font-semibold">What to improve first</h2>
                <WeakTopicChart topics={weakTopics} />
              </section>
              <section aria-labelledby="knowledge-heading" className="mt-8 pb-8">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 id="knowledge-heading" className="text-xl font-semibold">Knowledge review</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Open any weak topic for the full lesson, formulas, examples, and common mistakes.</p>
                  </div>
                  <Badge variant="secondary"><CircleCheck aria-hidden="true" /> {weakTopics.length} topics</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {weakTopics.map((topic) => <KnowledgeReviewCard key={topic.topicId} topic={topic} filter={filter} />)}
                </div>
              </section>
            </>
          ) : (
            <Alert className="mt-8"><CircleCheck aria-hidden="true" /><AlertTitle>No incorrect answers in this view</AlertTitle><AlertDescription>Your completed questions for this subject are currently correct. Unanswered questions remain visible in the overview.</AlertDescription></Alert>
          )}
        </>
      )}

      {report.knowledgeErrors.length > 0 && showErrors ? (
        <Alert variant="destructive" className="mt-6"><AlertTriangle aria-hidden="true" /><AlertTitle>Knowledge documents contain errors</AlertTitle><AlertDescription>{report.knowledgeErrors.join(" · ")}</AlertDescription></Alert>
      ) : null}
    </div>
  );
}
