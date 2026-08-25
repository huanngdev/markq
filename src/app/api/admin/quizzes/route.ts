import { z } from "zod";

import { isAdminRequest } from "@/lib/auth/admin";
import { readQuizDocuments, saveQuizDocument } from "@/lib/quizzes/repository";
import { toQuizSummary } from "@/lib/quizzes/types";

const saveDocumentSchema = z.object({
  sourceFile: z.string().min(4).max(160),
  markdown: z.string().min(1).max(2_000_000),
});

function unauthorized() {
  return Response.json({ error: "A valid admin token is required." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const documents = readQuizDocuments().map((document) => ({
    sourceFile: document.sourceFile,
    markdown: document.markdown,
    summary: document.quiz ? toQuizSummary(document.quiz) : null,
    published: document.quiz?.published ?? false,
    error: document.error,
  }));
  return Response.json({ documents });
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const body = await request.json().catch((): unknown => null);
  const input = saveDocumentSchema.safeParse(body);
  if (!input.success) {
    return Response.json({ error: "The quiz document is invalid." }, { status: 400 });
  }

  try {
    const quiz = saveQuizDocument(input.data.sourceFile, input.data.markdown);
    return Response.json({ summary: toQuizSummary(quiz), published: quiz.published });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the quiz.";
    return Response.json({ error: message }, { status: 400 });
  }
}
