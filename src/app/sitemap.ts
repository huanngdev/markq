import type { MetadataRoute } from "next";

import { getQuizSummaries } from "@/lib/quizzes/repository";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl.toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...getQuizSummaries().map((quiz) => ({
      url: new URL(`/quiz/${quiz.id}`, siteUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
