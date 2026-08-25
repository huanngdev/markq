import { sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db";
import { readQuizCatalog } from "@/lib/quizzes/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getDatabase().run(sql`select 1`);
    const catalog = readQuizCatalog();
    return Response.json({
      status: catalog.errors.length === 0 ? "ok" : "degraded",
      database: "ok",
      quizzes: catalog.quizzes.length,
      invalidQuizzes: catalog.errors.length,
    }, { status: catalog.errors.length === 0 ? 200 : 503 });
  } catch {
    return Response.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
