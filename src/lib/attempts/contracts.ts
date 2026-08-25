import { z } from "zod";

const quizSettingsSchema = z.object({
  timeLimitMinutes: z.number().nullable(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  navigationMode: z.enum(["free", "sequential"]),
  allowUnanswered: z.boolean(),
  reviewMode: z.enum(["after-submit", "never"]),
  passingScore: z.number().nullable(),
  expireBehavior: z.enum(["auto-submit", "mark-expired"]),
  scoringMode: z.enum(["exact", "partial"]),
  incorrectPenalty: z.number(),
  attemptsAllowed: z.number().nullable(),
});

const optionSchema = z.object({ id: z.string(), content: z.string() });

export const attemptWorkspaceSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  quizTitle: z.string(),
  status: z.enum(["in_progress", "submitted", "expired"]),
  settings: quizSettingsSchema,
  expiresAt: z.string().nullable(),
  version: z.number().int().positive(),
  answers: z.array(z.object({
    questionId: z.string(),
    questionOrder: z.number().int().nonnegative(),
    prompt: z.string(),
    options: z.array(optionSchema),
    selectedOptions: z.array(z.string()),
    selectionMode: z.enum(["single", "multiple"]),
    points: z.number().positive(),
    isFlagged: z.boolean(),
  })),
});

export const attemptWorkspaceResponseSchema = z.object({ attempt: attemptWorkspaceSchema });
export const submitAttemptResponseSchema = z.object({
  attemptId: z.string(),
  status: z.enum(["submitted", "expired"]),
});
export const apiErrorSchema = z.object({ error: z.string() });
