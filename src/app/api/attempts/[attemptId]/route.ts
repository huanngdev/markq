import { z } from "zod";

import {
  AttemptApplicationError,
} from "@/lib/attempts/application";
import {
  getOwnedAttemptWorkspace,
  saveAttemptProgress,
} from "@/lib/attempts/server-attempt-service";
import { getSessionUserId } from "@/lib/auth/session";

const updateSchema = z.object({
  version: z.number().int().positive(),
  updates: z.array(z.object({
    questionId: z.string().min(1).max(120),
    selectedOptions: z.array(z.string().min(1).max(16)).max(50).optional(),
    isFlagged: z.boolean().optional(),
  })).min(1).max(100),
});

type AttemptRouteContext = { params: Promise<{ attemptId: string }> };

export async function GET(_request: Request, { params }: AttemptRouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Attempt not found." }, { status: 404 });

  const { attemptId } = await params;
  const attempt = getOwnedAttemptWorkspace(userId, attemptId);
  return attempt
    ? Response.json({ attempt })
    : Response.json({ error: "Attempt not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: AttemptRouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ error: "Attempt not found." }, { status: 404 });

  const body = await request.json().catch((): unknown => null);
  const input = updateSchema.safeParse(body);
  if (!input.success) {
    return Response.json({ error: "The progress update is invalid." }, { status: 400 });
  }

  const { attemptId } = await params;
  try {
    const attempt = saveAttemptProgress(userId, attemptId, input.data.version, input.data.updates);
    return Response.json({ attempt });
  } catch (error) {
    if (error instanceof AttemptApplicationError) {
      const status = error.code === "ATTEMPT_NOT_FOUND" ? 404 : 409;
      return Response.json({ error: error.message }, { status });
    }
    const message = error instanceof Error ? error.message : "Could not save progress.";
    return Response.json({ error: message }, { status: 400 });
  }
}
