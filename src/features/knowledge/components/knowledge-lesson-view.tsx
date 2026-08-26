import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Markdown } from "@/components/markdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { catalogHref, type AnalyticsSubject } from "@/features/catalog/navigation";
import type { TopicAnalytics } from "@/lib/analytics/types";
import type { KnowledgeTopic } from "@/lib/knowledge/types";

export function KnowledgeLessonView({ topic, stats, filter }: {
  topic: KnowledgeTopic;
  stats: TopicAnalytics | undefined;
  filter: AnalyticsSubject;
}) {
  return (
    <main className="mx-auto min-h-svh w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href={catalogHref("analytics", filter)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft aria-hidden="true" /> Back to Analytics
        </Link>
        <ThemeToggle />
      </div>
      <article>
        <header className="mb-8">
          <Badge variant="secondary">{topic.subjectTitle}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{topic.title}</h1>
          {stats ? (
            <p className="mt-3 text-sm text-muted-foreground">{stats.incorrectCount} incorrect · {stats.accuracyPercent}% accuracy · {stats.questionCount} questions</p>
          ) : null}
        </header>
        {stats && stats.mistakeExamples.length > 0 ? (
          <section aria-labelledby="missed-heading" className="mb-8 rounded-xl bg-destructive/5 p-5">
            <h2 id="missed-heading" className="mb-3 font-medium text-destructive">Questions you missed</h2>
            <ul className="space-y-3 text-sm">
              {stats.mistakeExamples.map((prompt) => <li key={prompt}><Markdown content={prompt} /></li>)}
            </ul>
          </section>
        ) : null}
        <Markdown content={topic.content} />
      </article>
    </main>
  );
}
