import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import { AttemptApplicationError } from "@/lib/attempts/application";
import { getSessionUserId } from "@/lib/auth/session";
import { buildQuestionChatSystemPrompt } from "@/lib/question-chat/application";
import { questionChatRequestSchema } from "@/lib/question-chat/contracts";
import { getOwnedQuestionChatContext } from "@/lib/question-chat/server-question-chat-service";

export const maxDuration = 30;

const modelId = "google/gemini-2.5-flash-lite";

function toUIMessages(messages: ReturnType<typeof questionChatRequestSchema.parse>["messages"]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts.map((part) => ({ type: "text" as const, text: part.text })),
  }));
}

export async function POST(request: Request) {
  const body = await request.json().catch((): unknown => null);
  const input = questionChatRequestSchema.safeParse(body);
  if (!input.success) {
    return Response.json({ error: "The chat request is invalid or too long." }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "The AI tutor is not configured." }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "The quiz attempt was not found." }, { status: 404 });
  }

  try {
    const context = getOwnedQuestionChatContext(userId, input.data.context);
    if (!context) {
      return Response.json({ error: "The question context was not found." }, { status: 404 });
    }

    const messages = toUIMessages(input.data.messages);
    const openrouter = createOpenRouter({
      apiKey,
      compatibility: "strict",
      appName: "MarkQ",
    });
    const result = streamText({
      model: openrouter.chat(modelId),
      instructions: buildQuestionChatSystemPrompt(context),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 600,
      temperature: 0.2,
      maxRetries: 1,
      abortSignal: request.signal,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        sendReasoning: false,
        sendSources: false,
        onError: () => "The AI tutor could not answer this question.",
      }),
    });
  } catch (error) {
    if (error instanceof AttemptApplicationError) {
      return Response.json({ error: "The question context was not found." }, { status: 404 });
    }
    return Response.json({ error: "The AI tutor could not start a response." }, { status: 502 });
  }
}
