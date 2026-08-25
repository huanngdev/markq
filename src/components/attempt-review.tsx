"use client";

import { AttemptReviewView } from "@/features/review/components/attempt-review-view";
import { useAttemptReview } from "@/features/review/hooks/use-attempt-review";
import type { AttemptReview } from "@/lib/attempts/types";

export function AttemptReviewWorkspace({ attempt }: { attempt: AttemptReview }) {
  const { viewModel, commands } = useAttemptReview(attempt);
  return <AttemptReviewView attempt={attempt} viewModel={viewModel} commands={commands} />;
}
