import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AttemptReviewWorkspace } from "@/components/attempt-review";
import { AttemptApplicationError } from "@/lib/attempts/application";
import { getOwnedAttemptReview } from "@/lib/attempts/server-attempt-service";
import { getSessionUserId } from "@/lib/auth/session";

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
  const userId = await getSessionUserId();
  let attempt = null;
  try {
    attempt = userId ? getOwnedAttemptReview(userId, attemptId) : null;
  } catch (error) {
    if (!(error instanceof AttemptApplicationError) || error.code !== "REVIEW_DISABLED") throw error;
  }
  if (!attempt) notFound();

  return <AttemptReviewWorkspace attempt={attempt} />;
}
