import { redirect } from "next/navigation";

import { analyticsSubjectFrom, catalogHref } from "@/features/catalog/navigation";

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<{ subject?: string | string[] }>;
}) {
  const { subject } = await searchParams;
  redirect(catalogHref("analytics", analyticsSubjectFrom(subject)));
}
