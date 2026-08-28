import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1).max(4_000),
}).passthrough();

const chatMessageSchema = z.object({
  id: z.string().min(1).max(120),
  role: z.enum(["user", "assistant"]),
  parts: z.array(textPartSchema).min(1).max(4),
}).passthrough();

export const questionChatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(24),
  context: z.object({
    attemptId: z.string().min(1).max(120),
    questionId: z.string().min(1).max(120),
    mode: z.enum(["quiz", "review"]),
    selectedOptions: z.array(z.string().min(1).max(16)).max(50),
  }).strict(),
}).strict().superRefine((value, context) => {
  const textLength = value.messages.reduce(
    (total, message) => total + message.parts.reduce((sum, part) => sum + part.text.length, 0),
    0,
  );
  if (textLength > 24_000) {
    context.addIssue({
      code: "custom",
      path: ["messages"],
      message: "The chat history is too long.",
    });
  }
  if (value.messages.at(-1)?.role !== "user") {
    context.addIssue({
      code: "custom",
      path: ["messages"],
      message: "The last message must be from the user.",
    });
  }
});

export type QuestionChatRequest = z.infer<typeof questionChatRequestSchema>;
export type QuestionChatContextRequest = QuestionChatRequest["context"];

