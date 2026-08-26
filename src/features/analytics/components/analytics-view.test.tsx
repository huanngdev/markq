import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { QuizCatalogView } from "@/features/catalog/components/quiz-catalog-view";
import { KnowledgeLessonView } from "@/features/knowledge/components/knowledge-lesson-view";
import { buildAnalyticsReport } from "@/lib/analytics/application";
import type { KnowledgeTopic } from "@/lib/knowledge/types";
import { defaultQuizSettings, type QuizSummary } from "@/lib/quizzes/types";

import { AnalyticsView } from "./analytics-view";

const english: KnowledgeTopic = {
  id: "english-conditionals", subject: "english", subjectTitle: "English", title: "Second conditional",
  content: "## Formula\n\nIf + past simple, **would + base verb**.\n\n## Hints\n\nImagine an unlikely situation.", sourceFile: "english.md",
};
const iq: KnowledgeTopic = {
  id: "iq-sums", subject: "iq", subjectTitle: "IQ", title: "Sequence sums",
  content: "## Formula\n\nPair the first and last terms.", sourceFile: "iq.md",
};
const report = buildAnalyticsReport(
  [english, iq].map((topic) => ({
    attemptId: "attempt-one", quizId: "quiz-one", questionId: topic.id,
    prompt: `Missed question for ${topic.title}`, topicId: topic.id,
    selectedOptions: ["B"], isCorrect: false,
  })),
  new Map([[english.id, english], [iq.id, iq]]),
  new Map(),
);

describe("catalog Analytics and knowledge navigation", () => {
  it("renders a custom subject throughout filters, cards and lessons without English/IQ assumptions", () => {
    const topic: KnowledgeTopic = {
      id: "networks-routing", subject: "computer-networks", subjectTitle: "Mạng máy tính",
      title: "Định tuyến", content: "### Nguyên lý\n\nA complete routing lesson.", sourceFile: "networks.md",
    };
    const customReport = buildAnalyticsReport([{
      attemptId: "one", quizId: "networks-quiz", questionId: "route", prompt: "A routing problem",
      topicId: topic.id, selectedOptions: ["B"], isCorrect: false,
    }], new Map([[topic.id, topic]]), new Map());
    const html = renderToStaticMarkup(<AnalyticsView report={customReport} filter="computer-networks" />);
    expect(html).toContain('href="/?status=analytics&amp;subject=computer-networks"');
    expect(html).toContain('href="/knowledge/networks-routing?subject=computer-networks"');
    expect(html).toContain("Mạng máy tính");
    expect(html).not.toContain("English");
    expect(html).not.toContain("IQ");
    const lesson = renderToStaticMarkup(<KnowledgeLessonView topic={topic} stats={customReport.weakTopics[0]} filter="computer-networks" />);
    expect(lesson).toContain("Mạng máy tính");
    expect(lesson).toContain("A complete routing lesson.");
    expect(lesson).toContain('href="/?status=analytics&amp;subject=computer-networks"');
    const unknown = renderToStaticMarkup(<AnalyticsView report={customReport} filter="not-configured" />);
    expect(unknown).toContain('href="/knowledge/networks-routing?subject=all"');
  });

  it("keeps Available quiz actions and Completed review links in their own panels", () => {
    const quizzes: QuizSummary[] = ["available-quiz", "completed-quiz"].map((id) => ({
      id, title: id, description: "Practice questions", tags: [], visibility: "public",
      settings: defaultQuizSettings, questionCount: 6, totalPoints: 6, multipleChoiceCount: 0,
    }));
    const stats = { "completed-quiz": {
      attemptCount: 1, latestScore: 80, bestScore: 80, latestAttemptId: "saved-attempt",
      inProgressAttemptId: null, latestReviewAvailable: true,
    } };
    for (const tab of ["available", "completed"] as const) {
      const html = renderToStaticMarkup(<QuizCatalogView quizzes={quizzes} stats={stats} tab={tab} errors={[]} onTabChange={() => {}} analytics={<p>Analytics content</p>} />);
      expect(html).toContain(`href="/quiz/${tab}-quiz"`);
      expect(html).not.toContain("Analytics content");
      if (tab === "completed") expect(html).toContain('href="/attempts/saved-attempt"');
      else expect(html).not.toContain('href="/attempts/saved-attempt"');
    }
  });

  it("renders Analytics in the same tablist as Available and Completed, without History", () => {
    const html = renderToStaticMarkup(
      <QuizCatalogView quizzes={[]} stats={{}} tab="analytics" errors={[]} onTabChange={() => {}}
        analytics={<AnalyticsView report={report} filter="all" />} />,
    );
    expect(html.match(/role="tablist"/g)).toHaveLength(1);
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html).toMatch(/role="tablist"[\s\S]*Available[\s\S]*Completed[\s\S]*Analytics/);
    expect(html).toMatch(/<button[^>]*aria-selected="true"[^>]*>Analytics<\/button>/);
    expect(html).toContain("Knowledge review");
    expect(html).not.toContain("History");
    expect(html).not.toContain("Primary navigation");
  });

  it("renders full-card lesson links in the quiz grid style, not inline lessons", () => {
    const html = renderToStaticMarkup(<AnalyticsView report={report} filter="all" />);
    expect(html).toContain("grid gap-4 md:grid-cols-2 lg:grid-cols-3");
    expect(html).toContain("min-h-64");
    for (const topic of [english, iq]) {
      expect(html).toContain(`href="/knowledge/${topic.id}?subject=all"`);
      expect(html).toContain(`aria-label="Review ${topic.title}"`);
    }
    expect(html).not.toContain("<details");
    expect(html).not.toContain("Imagine an unlikely situation.");
    expect(html).not.toContain("Missed question for");
  });

  it("keeps the Analytics tab and active subject in filter and lesson links", () => {
    const html = renderToStaticMarkup(<AnalyticsView report={report} filter="english" />);
    expect(html).toContain('href="/?status=analytics&amp;subject=english"');
    expect(html).toContain('href="/?status=analytics&amp;subject=iq"');
    expect(html).toContain(`href="/knowledge/${english.id}?subject=english"`);
    expect(html).not.toContain(`href="/knowledge/${iq.id}`);
  });

  it("shows the full lesson and missed questions on a separate page with a filtered return link", () => {
    const html = renderToStaticMarkup(<KnowledgeLessonView topic={english} stats={report.subjects.find((subject) => subject.subject === "english")?.topics[0]} filter="english" />);
    expect(html).toContain("<article>");
    expect(html).toMatch(/<h1[^>]*>Second conditional<\/h1>/);
    expect(html).toContain("<h2>Formula</h2>");
    expect(html).toContain("<strong>would + base verb</strong>");
    expect(html).toContain("Imagine an unlikely situation.");
    expect(html).toContain("Missed question for Second conditional");
    expect(html).toContain('href="/?status=analytics&amp;subject=english"');
    expect(html).toContain("Back to Analytics");
  });

  it("supports empty analytics and lessons without any attempts", () => {
    const empty = buildAnalyticsReport([], new Map(), new Map());
    const html = renderToStaticMarkup(<AnalyticsView report={empty} filter="all" />);
    expect(html).toContain("No analytics yet");
    expect(html).not.toContain("Knowledge review");
    const lesson = renderToStaticMarkup(<KnowledgeLessonView topic={iq} stats={undefined} filter="all" />);
    expect(lesson).toContain("Pair the first and last terms.");
    expect(lesson).not.toContain("Questions you missed");
  });
});
