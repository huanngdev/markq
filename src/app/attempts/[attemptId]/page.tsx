import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AttemptReviewWorkspace } from "@/components/attempt-review";
import { getAttemptById } from "@/lib/attempts/repository";

export const metadata: Metadata = {
  title: "Review attempt",
  robots: { index: false, follow: false },
};

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  await connection();
  const { attemptId } = await params;
  const attempt = getAttemptById(attemptId);
  if (!attempt) notFound();

  return <AttemptReviewWorkspace attempt={attempt} />;
}
