import { AlertTriangle, BarChart3, BookOpenText, Brain, CircleCheck, Languages } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { AppNav } from "@/components/app-nav";
import { Markdown } from "@/components/markdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getOwnedAnalyticsReport } from "@/lib/analytics/server-analytics-service";
import type { SubjectAnalytics, TopicAnalytics } from "@/lib/analytics/types";
import { getSessionUserId } from "@/lib/auth/session";
import type { KnowledgeSubject } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analytics",
  description: "See recurring mistakes and review the knowledge behind them.",
  robots: { index: false, follow: false },
};

type SubjectFilter = "all" | KnowledgeSubject;

function filterFrom(value: string | undefined): SubjectFilter {
  return value === "english" || value === "iq" ? value : "all";
}

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
  const isEnglish = stats.subject === "english";
  const Icon = isEnglish ? Languages : Brain;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{isEnglish ? "English" : "IQ"}</CardTitle>
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

function KnowledgeReview({ topic, open }: { topic: TopicAnalytics; open: boolean }) {
  return (
    <details className="group rounded-xl bg-card ring-1 ring-foreground/10" open={open}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-xl px-5 py-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{topic.title}</h3>
            <Badge variant={topic.subject === "english" ? "secondary" : "outline"}>{topic.subject === "english" ? "English" : "IQ"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{topic.incorrectCount} incorrect · {topic.accuracyPercent}% accuracy · {topic.questionCount} answered</p>
        </div>
        <BookOpenText className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-colors group-open:text-primary" aria-hidden="true" />
      </summary>
      <div className="border-t px-5 py-5">
        {topic.mistakeExamples.length > 0 ? (
          <div className="mb-6 rounded-lg bg-destructive/5 p-4">
            <p className="mb-2 text-sm font-medium text-destructive">Questions you missed</p>
            <ul className="space-y-2 text-sm">
              {topic.mistakeExamples.map((prompt) => <li key={prompt}><Markdown content={prompt} /></li>)}
            </ul>
          </div>
        ) : null}
        <Markdown content={topic.knowledgeMarkdown} />
      </div>
    </details>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  await connection();
  const [{ subject }, userId] = await Promise.all([searchParams, getSessionUserId()]);
  const filter = filterFrom(subject);
  const report = getOwnedAnalyticsReport(userId ?? "");
  const weakTopics = filter === "all"
    ? report.weakTopics
    : report.weakTopics.filter((topic) => topic.subject === filter);

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Learning diagnosis</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Find the topics you miss most, then review the formulas, reasoning, examples, and hints connected to those questions.</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-5"><AppNav active="analytics" /></div>

      <nav aria-label="Analytics subject" className="mt-6 flex w-fit gap-1 rounded-lg bg-muted p-1">
        {(["all", "english", "iq"] as const).map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/analytics" : `/analytics?subject=${value}`}
            aria-current={filter === value ? "page" : undefined}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", filter === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {value === "all" ? "All" : value === "english" ? "English" : "IQ"}
          </Link>
        ))}
      </nav>

      {report.questionCount === 0 ? (
        <Empty className="mt-8 min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BarChart3 aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>No analytics yet</EmptyTitle>
            <EmptyDescription>Submit an English or IQ quiz with topic metadata to see recurring mistakes and review lessons here.</EmptyDescription>
          </EmptyHeader>
          <Link href="/" className="text-sm font-medium underline underline-offset-4">Browse quizzes</Link>
        </Empty>
      ) : (
        <>
          <section aria-label="Overview" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Completed attempts" value={report.attemptCount} detail="English and IQ attempts with analytics topics" />
            <SummaryCard label="Accuracy" value={`${report.accuracyPercent}%`} detail={`${report.correctCount} correct of ${report.questionCount}`} tone="success" />
            <SummaryCard label="Incorrect" value={report.incorrectCount} detail="Answered but graded incorrect" tone="danger" />
            <SummaryCard label="Unanswered" value={report.unansweredCount} detail="Submitted without a selection" />
          </section>

          <section aria-labelledby="subject-heading" className="mt-8">
            <h2 id="subject-heading" className="mb-4 text-xl font-semibold">By subject</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <SubjectCard stats={report.subjects.english} />
              <SubjectCard stats={report.subjects.iq} />
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
                <div className="space-y-3">
                  {weakTopics.map((topic, index) => <KnowledgeReview key={topic.topicId} topic={topic} open={index === 0} />)}
                </div>
              </section>
            </>
          ) : (
            <Alert className="mt-8"><CircleCheck aria-hidden="true" /><AlertTitle>No incorrect answers in this view</AlertTitle><AlertDescription>Your completed questions for this subject are currently correct. Unanswered questions remain visible in the overview.</AlertDescription></Alert>
          )}
        </>
      )}

      {report.knowledgeErrors.length > 0 && process.env.NODE_ENV === "development" ? (
        <Alert variant="destructive" className="mt-6"><AlertTriangle aria-hidden="true" /><AlertTitle>Knowledge documents contain errors</AlertTitle><AlertDescription>{report.knowledgeErrors.join(" · ")}</AlertDescription></Alert>
      ) : null}
    </main>
  );
}
