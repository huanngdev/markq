import type { KnowledgeSubject } from "@/lib/knowledge/types";
import { isKnowledgeSubject } from "@/lib/knowledge/subject";

export type CatalogTab = "available" | "completed" | "analytics";
export type AnalyticsSubject = "all" | KnowledgeSubject;

export function catalogTabFrom(value: unknown): CatalogTab {
  return value === "completed" || value === "analytics" ? value : "available";
}

export function analyticsSubjectFrom(value: unknown): AnalyticsSubject {
  return isKnowledgeSubject(value) ? value : "all";
}

export function catalogHref(tab: CatalogTab, subject: AnalyticsSubject = "all"): string {
  switch (tab) {
    case "available": return "/";
    case "completed": return "/?status=completed";
    case "analytics": return subject === "all" ? "/?status=analytics" : `/?status=analytics&subject=${subject}`;
  }
}
