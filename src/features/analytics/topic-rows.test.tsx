import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { TopicAnalytics } from "@/lib/analytics/types";
import { TopicTable } from "./components/topic-table";
import { buildTopicRows } from "./topic-rows";

function topic(title: string, incorrectCount: number, accuracyPercent = 0): TopicAnalytics {
  return {
    topicId: title.toLowerCase(), title, subject: "math", subjectTitle: "Mathematics",
    correctCount: 0, incorrectCount, unansweredCount: 0, questionCount: incorrectCount,
    accuracyPercent, mistakeExamples: ["Private prompt"], knowledgeMarkdown: "Private lesson",
  };
}

describe("analytics topic rows", () => {
  it("ranks the entire dataset by mistakes descending, accuracy ascending, then title", () => {
    const topics = [topic("Zero", 0, 100), topic("Beta", 2), topic("Frequent", 8, 50), topic("Alpha", 2), topic("Accurate", 2, 75)];
    const rows = buildTopicRows(topics, "math");
    expect(rows.map((row) => row.title)).toEqual(["Frequent", "Alpha", "Beta", "Accurate", "Zero"]);
    expect(topics[0]?.title).toBe("Zero");
    expect(rows[0]?.lessonHref).toBe("/knowledge/frequent?subject=math");
    expect(JSON.stringify(rows)).not.toContain("Private");
    const html = renderToStaticMarkup(<TopicTable rows={rows} />);
    expect(html.indexOf('aria-label="Review Frequent"')).toBeLessThan(html.indexOf('aria-label="Review Alpha"'));
    expect(html.indexOf('aria-label="Review Accurate"')).toBeLessThan(html.indexOf('aria-label="Review Zero"'));
  });

  it("paginates after ranking, showing the ten most-missed topics first", () => {
    const rows = buildTopicRows(Array.from({ length: 12 }, (_, index) => topic(`Topic-${index}`, index + 1)), "all");
    const html = renderToStaticMarkup(<TopicTable rows={rows} />);
    expect(html.match(/aria-label="Review Topic-/g)).toHaveLength(10);
    expect(html).toContain('aria-label="Review Topic-11"');
    expect(html).not.toContain('aria-label="Review Topic-0"');
    expect(html).toContain("Page 1 of 2");
  });
});
