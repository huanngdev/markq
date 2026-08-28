"use client";

import type { UIMessage } from "ai";
import { SendHorizontal, Square, Trash2, X } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import type {
  QuestionChatCommands,
  QuestionChatViewModel,
} from "@/features/question-chat/hooks/use-question-chat";
import { cn } from "@/lib/utils";

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const content = messageText(message);
  if (!content) return null;

  return (
    <Message align={isUser ? "end" : "start"}>
      <MessageContent className={cn(!isUser && "w-full")}>
        <Bubble
          align={isUser ? "end" : "start"}
          variant={isUser ? "default" : "ghost"}
          className={cn(!isUser && "w-full")}
        >
          <BubbleContent className={cn(!isUser && "w-full")}>
            <Markdown content={content} />
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

export function QuestionChatPanel({
  viewModel,
  commands,
  className,
}: {
  viewModel: QuestionChatViewModel;
  commands: QuestionChatCommands;
  className?: string;
}) {
  const isResponding = viewModel.status === "submitted" || viewModel.status === "streaming";
  const canSubmit = viewModel.input.trim().length > 0 && !isResponding;

  return (
    <section className={cn("flex min-h-[28rem] min-w-0 flex-col xl:min-h-0", className)} aria-label="AI tutor for this question">
      <div className="min-h-0 flex-1">
        {viewModel.messages.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyDescription>Ask anything about this question.</EmptyDescription>
          </Empty>
        ) : (
          <MessageScrollerProvider autoScroll scrollPreviousItemPeek={48}>
            <MessageScroller>
              <MessageScrollerViewport aria-label="Question chat messages">
                <MessageScrollerContent className="gap-4 p-4" aria-busy={isResponding}>
                  {viewModel.messages.map((message) => (
                    <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={message.role === "user"}>
                      <ChatMessage message={message} />
                    </MessageScrollerItem>
                  ))}
                  {viewModel.status === "submitted" ? (
                    <MessageScrollerItem>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner /> <span className="shimmer">Thinking…</span>
                      </div>
                    </MessageScrollerItem>
                  ) : null}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t p-3">
        {viewModel.error ? (
          <Alert variant="destructive">
            <AlertDescription>{viewModel.error}</AlertDescription>
            <AlertAction>
              <Button type="button" variant="ghost" size="icon-xs" onClick={commands.dismissError} aria-label="Dismiss chat error">
                <X aria-hidden="true" />
              </Button>
            </AlertAction>
          </Alert>
        ) : null}
        <form onSubmit={(event) => { event.preventDefault(); commands.submit(); }}>
          <InputGroup>
            <InputGroupTextarea
              value={viewModel.input}
              onChange={(event) => commands.setInput(event.target.value)}
              onKeyDown={commands.handleComposerKeyDown}
              placeholder="Ask about this question…"
              aria-label="Message MarkQ Tutor"
              rows={2}
              maxLength={4_000}
              disabled={isResponding}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              <div className="flex items-center gap-1">
                {viewModel.messages.length > 0 ? (
                  <InputGroupButton type="button" size="icon-sm" variant="ghost" onClick={commands.clear} aria-label="Clear chat" title="Clear chat">
                    <Trash2 aria-hidden="true" />
                  </InputGroupButton>
                ) : null}
                <InputGroupText><Kbd>Enter</Kbd> send · <Kbd>Shift Enter</Kbd> new line</InputGroupText>
              </div>
              {isResponding ? (
                <InputGroupButton type="button" size="icon-sm" variant="outline" onClick={commands.stop} aria-label="Stop response">
                  <Square aria-hidden="true" />
                </InputGroupButton>
              ) : (
                <InputGroupButton type="submit" size="icon-sm" variant="default" disabled={!canSubmit} aria-label="Send message">
                  <SendHorizontal aria-hidden="true" />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </section>
  );
}
