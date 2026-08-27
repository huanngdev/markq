import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { analyticsSubjectFrom } from "@/features/catalog/navigation";
import { KnowledgeLessonView } from "@/features/knowledge/components/knowledge-lesson-view";
import { getOwnedAnalyticsReport } from "@/lib/analytics/server-analytics-service";
import { getSessionUserId } from "@/lib/auth/session";
import { readKnowledgeCatalog } from "@/lib/knowledge/repository";

export const metadata: Metadata = {
  title: "Knowledge review",
  robots: { index: false, follow: false },
};

export default async function KnowledgePage({ params, searchParams }: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ subject?: string | string[] }>;
}) {
  await connection();
  const [{ topicId }, { subject }, userId] = await Promise.all([params, searchParams, getSessionUserId()]);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topicId)) notFound();
  const topic = readKnowledgeCatalog().topics.get(topicId);
  if (!topic) notFound();

  const report = userId ? getOwnedAnalyticsReport(userId) : null;
  const stats = report?.subjects.find((item) => item.subject === topic.subject)?.topics.find((item) => item.topicId === topicId);
  return <KnowledgeLessonView topic={topic} stats={stats} filter={analyticsSubjectFrom(subject)} />;
}
