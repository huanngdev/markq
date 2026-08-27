import { AttemptApplicationError } from "@/lib/attempts/application";
import { submitAttempt } from "@/lib/attempts/server-attempt-service";
import { getSessionUserId } from "@/lib/auth/session";

type SubmitRouteContext = { params: Promise<{ attemptId: string }> };

export async function POST(_request: Request, { params }: SubmitRouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Attempt not found." }, { status: 404 });

  const { attemptId } = await params;
  try {
    const attempt = submitAttempt(userId, attemptId);
    return Response.json({ attemptId: attempt.id, status: attempt.status });
  } catch (error) {
    if (error instanceof AttemptApplicationError) {
      const status = error.code === "ATTEMPT_NOT_FOUND" ? 404 : 409;
      return Response.json({ error: error.message }, { status });
    }
    return Response.json({ error: "Could not submit the quiz." }, { status: 500 });
  }
}
