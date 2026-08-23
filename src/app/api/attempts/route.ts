import { z } from "zod";

import { createAttempt } from "@/lib/attempts/repository";
import { getQuizById } from "@/lib/quizzes/repository";

const submissionSchema = z.object({
  quizId: z.string().min(1).max(120),
  answers: z.record(z.string().min(1).max(120), z.string().min(1).max(16)).default({}),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request body is not valid JSON." }, { status: 400 });
  }

  const submission = submissionSchema.safeParse(body);
  if (!submission.success) {
    return Response.json({ error: "The submitted attempt is invalid." }, { status: 400 });
  }

  const quiz = getQuizById(submission.data.quizId);
  if (!quiz) {
    return Response.json({ error: "The quiz was not found or is not published." }, { status: 404 });
  }

  try {
    const attemptId = createAttempt(quiz, submission.data.answers);
    return Response.json({ attemptId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not grade the quiz.";
    return Response.json({ error: message }, { status: 400 });
  }
}
