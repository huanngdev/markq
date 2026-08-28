import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

import { Markdown } from "@/components/markdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { catalogHref } from "@/features/catalog/navigation";
import type { KnowledgeDocument } from "@/lib/knowledge/types";

export function KnowledgeDocumentView({ document }: { document: KnowledgeDocument }) {
  return (
    <main className="mx-auto min-h-svh w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href={catalogHref("knowledge", "all")} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft aria-hidden="true" /> Back to Knowledge
        </Link>
        <ThemeToggle />
      </div>

      <article className="flex flex-col gap-10">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{document.subjectTitle}</Badge>
            <Badge variant="outline"><BookOpen aria-hidden="true" /> {document.topics.length} topics</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{document.title}</h1>
          {document.description ? <p className="mt-3 max-w-3xl text-muted-foreground">{document.description}</p> : null}
        </header>

        <Card>
          <CardHeader><CardTitle>Contents</CardTitle></CardHeader>
          <CardContent>
            <nav aria-label="Knowledge guide contents">
              <ol className="grid gap-2 sm:grid-cols-2">
                {document.topics.map((topic, index) => (
                  <li key={topic.id}>
                    <a className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href={`#${topic.id}`}>
                      {index + 1}. {topic.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-10">
          {document.topics.map((topic, index) => (
            <section id={topic.id} key={topic.id} className="scroll-mt-8">
              {index > 0 ? <Separator className="mb-10" /> : null}
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-balance">{topic.title}</h2>
              <Markdown content={topic.content} />
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
