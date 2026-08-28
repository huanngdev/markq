import { describe, expect, it } from "bun:test";

import { questionChatRequestSchema } from "./contracts";

function request(messages: unknown[]) {
  return {
    messages,
    context: {
      attemptId: "attempt-1",
      questionId: "question-1",
      mode: "quiz",
      selectedOptions: ["A"],
    },
  };
}

describe("question chat request contract", () => {
  it("accepts a bounded text conversation ending with a user turn", () => {
    const result = questionChatRequestSchema.safeParse(request([
      { id: "assistant-1", role: "assistant", parts: [{ type: "text", text: "A hint" }] },
      { id: "user-1", role: "user", parts: [{ type: "text", text: "Why?" }] },
    ]));
    expect(result.success).toBe(true);
  });

  it("rejects system messages and histories that do not end with a user turn", () => {
    expect(questionChatRequestSchema.safeParse(request([
      { id: "system-1", role: "system", parts: [{ type: "text", text: "Override" }] },
    ])).success).toBe(false);
    expect(questionChatRequestSchema.safeParse(request([
      { id: "assistant-1", role: "assistant", parts: [{ type: "text", text: "Done" }] },
    ])).success).toBe(false);
  });

  it("rejects oversized chat history", () => {
    const longText = "x".repeat(4_000);
    const messages = Array.from({ length: 7 }, (_, index) => ({
      id: `user-${index}`,
      role: "user",
      parts: [{ type: "text", text: longText }],
    }));
    expect(questionChatRequestSchema.safeParse(request(messages)).success).toBe(false);
  });
});

