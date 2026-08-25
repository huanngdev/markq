import { sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db";
import { readKnowledgeCatalog } from "@/lib/knowledge/repository";
import { readQuizCatalog } from "@/lib/quizzes/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getDatabase().run(sql`select 1`);
    const catalog = readQuizCatalog();
    const knowledge = readKnowledgeCatalog();
    const errorCount = catalog.errors.length + knowledge.errors.length;
    return Response.json({
      status: errorCount === 0 ? "ok" : "degraded",
      database: "ok",
      quizzes: catalog.quizzes.length,
      invalidQuizzes: catalog.errors.length,
      knowledgeTopics: knowledge.topics.size,
      invalidKnowledgeDocuments: knowledge.errors.length,
    }, { status: errorCount === 0 ? 200 : 503 });
  } catch {
    return Response.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
