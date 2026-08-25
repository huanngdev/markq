import { z } from "zod";

import { AttemptApplicationError } from "@/lib/attempts/application";
import { startOrResumeAttempt } from "@/lib/attempts/server-attempt-service";
import { requireSessionUserId } from "@/lib/auth/session";
import { getQuizById } from "@/lib/quizzes/repository";

const startAttemptSchema = z.object({ quizId: z.string().min(1).max(120) });

export async function POST(request: Request) {
  const body = await request.json().catch((): unknown => null);
  const input = startAttemptSchema.safeParse(body);
  if (!input.success) {
    return Response.json({ error: "The start request is invalid." }, { status: 400 });
  }

  const quiz = getQuizById(input.data.quizId);
  if (!quiz) {
    return Response.json({ error: "The quiz was not found or is not published." }, { status: 404 });
  }

  try {
    const userId = await requireSessionUserId();
    return Response.json({ attempt: startOrResumeAttempt(userId, quiz) }, { status: 201 });
  } catch (error) {
    if (error instanceof AttemptApplicationError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return Response.json({ error: "Could not start the quiz." }, { status: 500 });
  }
}
