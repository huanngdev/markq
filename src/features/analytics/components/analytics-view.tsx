import { AlertTriangle, BarChart3 } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { catalogHref, type AnalyticsSubject } from "@/features/catalog/navigation";
import type { AnalyticsReport } from "@/lib/analytics/types";
import { buildTopicRows } from "../topic-rows";
import { AnalyticsCharts } from "./analytics-charts";
import { TopicTable } from "./topic-table";

export function AnalyticsView({ report, filter: requestedFilter, showErrors = false }: {
  report: AnalyticsReport;
  filter: AnalyticsSubject;
  showErrors?: boolean;
}) {
  const selectedSubject = report.subjects.find((subject) => subject.subject === requestedFilter);
  const filter = selectedSubject?.subject ?? "all";
  const overview = selectedSubject ?? report;
  const rows = buildTopicRows(selectedSubject?.topics ?? report.subjects.flatMap((subject) => subject.topics), filter);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {report.subjects.length > 0 ? (
        <nav aria-label="Analytics subject" className="flex flex-wrap gap-2">
          {[{ subject: "all", subjectTitle: "All" }, ...report.subjects].map(({ subject, subjectTitle }) => (
            <Button key={subject} variant={filter === subject ? "secondary" : "ghost"} size="sm" nativeButton={false} role="link"
              render={<Link href={catalogHref("analytics", subject)} scroll={false} aria-current={filter === subject ? "page" : undefined} />}>
              {subjectTitle}
            </Button>
          ))}
        </nav>
      ) : null}

      {overview.questionCount === 0 ? (
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BarChart3 aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>No analytics yet</EmptyTitle>
            <EmptyDescription>Submit a quiz with topic metadata linked to a knowledge document to see your results here. Subjects appear only after you have completed questions in them.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" nativeButton={false} role="link" render={<Link href="/" />}>Browse quizzes</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <dl aria-label="Overview" className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { label: "Completed attempts", value: overview.attemptCount },
              { label: "Accuracy", value: `${overview.accuracyPercent}%` },
              { label: "Incorrect", value: overview.incorrectCount },
              { label: "Unanswered", value: overview.unansweredCount },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <AnalyticsCharts correct={overview.correctCount} incorrect={overview.incorrectCount} unanswered={overview.unansweredCount} topics={rows} />
          <section aria-labelledby="knowledge-heading" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="knowledge-heading" className="text-xl font-semibold">Knowledge review</h2>
              <p className="text-sm text-muted-foreground">Most incorrect answers first, then lower accuracy. Select a topic to read its lesson.</p>
            </div>
            <TopicTable key={filter} rows={rows} />
          </section>
        </>
      )}

      {report.knowledgeErrors.length > 0 && showErrors ? (
        <Alert variant="destructive"><AlertTriangle aria-hidden="true" /><AlertTitle>Knowledge documents contain errors</AlertTitle><AlertDescription>{report.knowledgeErrors.join(" · ")}</AlertDescription></Alert>
      ) : null}
    </div>
  );
}
