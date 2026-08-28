"use client";

import { QuestionChatPanel } from "@/features/question-chat/components/question-chat-panel";
import { useQuestionChat } from "@/features/question-chat/hooks/use-question-chat";
import type { QuestionChatContextRequest } from "@/lib/question-chat/contracts";

export function QuestionChat({
  context,
  className,
}: {
  context: QuestionChatContextRequest;
  className?: string;
}) {
  const { viewModel, commands } = useQuestionChat(context);
  return <QuestionChatPanel viewModel={viewModel} commands={commands} className={className} />;
}
