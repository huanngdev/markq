"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { QuestionChatContextRequest } from "@/lib/question-chat/contracts";

export type QuestionChatViewModel = {
  input: string;
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  error: string | null;
};

export type QuestionChatCommands = {
  setInput(value: string): void;
  submit(): void;
  stop(): void;
  clear(): void;
  dismissError(): void;
  useSuggestion(suggestion: string): void;
  handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void;
};

function chatId(context: QuestionChatContextRequest) {
  return `question-chat:${context.mode}:${context.attemptId}:${context.questionId}`;
}

export function useQuestionChat(context: QuestionChatContextRequest) {
  const [histories, setHistories] = useState<Record<string, UIMessage[]>>({});
  const messageChatIdsRef = useRef(new Map<string, string>());
  const activeChatId = chatId(context);
  const [input, setInput] = useState("");
  const { attemptId, mode, questionId, selectedOptions } = context;

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/question-chat",
    prepareSendMessagesRequest: ({ messages }) => ({
      body: {
        messages,
        context: { attemptId, mode, questionId, selectedOptions },
      },
    }),
  }), [attemptId, mode, questionId, selectedOptions]);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop,
    clearError,
  } = useChat({
    id: activeChatId,
    messages: histories[activeChatId] ?? [],
    transport,
    throttle: 50,
    onFinish: ({ messages: completedMessages }) => {
      const latestUserMessage = completedMessages.findLast((message) => message.role === "user");
      const completedChatId = latestUserMessage
        ? messageChatIdsRef.current.get(latestUserMessage.id)
        : undefined;
      if (!completedChatId) return;
      setHistories((current) => ({ ...current, [completedChatId]: completedMessages }));
    },
  });

  useEffect(() => () => {
    void stop();
  }, [activeChatId, stop]);

  function submit() {
    const message = input.trim();
    if (!message || status === "submitted" || status === "streaming") return;
    const messageId = crypto.randomUUID();
    const userMessage: UIMessage = {
      id: messageId,
      role: "user",
      parts: [{ type: "text", text: message }],
    };
    messageChatIdsRef.current.set(messageId, activeChatId);
    setHistories((current) => ({
      ...current,
      [activeChatId]: [...messages, userMessage],
    }));
    setInput("");
    clearError();
    void sendMessage({
      id: messageId,
      role: "user",
      parts: userMessage.parts,
    }).catch(() => undefined);
  }

  function clear() {
    void stop();
    setHistories((current) => {
      const next = { ...current };
      delete next[activeChatId];
      return next;
    });
    for (const message of messages) messageChatIdsRef.current.delete(message.id);
    setMessages([]);
    setInput("");
    clearError();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  }

  const viewModel: QuestionChatViewModel = {
    input,
    messages,
    status,
    error: error?.message ?? null,
  };
  const commands: QuestionChatCommands = {
    setInput,
    submit,
    stop: () => { void stop(); },
    clear,
    dismissError: clearError,
    useSuggestion: (suggestion) => setInput(suggestion),
    handleComposerKeyDown,
  };

  return { viewModel, commands };
}
