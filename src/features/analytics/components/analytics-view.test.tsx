import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { QuizCatalogView } from "@/features/catalog/components/quiz-catalog-view";
import { KnowledgeLessonView } from "@/features/knowledge/components/knowledge-lesson-view";
import { buildAnalyticsReport } from "@/lib/analytics/application";
import type { KnowledgeDocumentSummary, KnowledgeTopic } from "@/lib/knowledge/types";
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
  it("renders a custom subject throughout filters, table and lessons without English/IQ assumptions", () => {
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

  it("renders Analytics and Knowledge in the same tablist as quiz statuses, without History", () => {
    const html = renderToStaticMarkup(
      <QuizCatalogView quizzes={[]} stats={{}} tab="analytics" errors={[]} onTabChange={() => {}}
        analytics={<AnalyticsView report={report} filter="all" />} />,
    );
    expect(html.match(/role="tablist"/g)).toHaveLength(1);
    expect(html.match(/role="tab"/g)).toHaveLength(4);
    expect(html).toMatch(/role="tablist"[\s\S]*Available[\s\S]*Completed[\s\S]*Analytics[\s\S]*Knowledge/);
    expect(html).toMatch(/<button[^>]*aria-selected="true"[^>]*>Analytics<\/button>/);
    expect(html).toContain("Knowledge review");
    expect(html).not.toContain("History");
    expect(html).not.toContain("Primary navigation");
  });

  it("renders Markdown knowledge guides as cards with document routes", () => {
    const knowledge: KnowledgeDocumentSummary[] = [{
      subject: "iq", subjectTitle: "IQ", title: "Kiến thức IQ EVN",
      description: "Công thức và phương pháp suy luận.", topicCount: 29,
    }];
    const html = renderToStaticMarkup(
      <QuizCatalogView quizzes={[]} stats={{}} knowledge={knowledge} tab="knowledge" errors={[]}
        onTabChange={() => {}} analytics={null} />,
    );
    expect(html).toContain("Kiến thức IQ EVN");
    expect(html).toContain("29 topics");
    expect(html).toContain('href="/knowledge/iq"');
    expect(html).not.toContain("No knowledge guides available");
  });

  it("renders charts and a ranked TanStack table with lesson links, not lesson cards", () => {
    const html = renderToStaticMarkup(<AnalyticsView report={report} filter="all" />);
    expect(html).toContain("<table");
    expect(html).toContain('aria-sort="descending"');
    expect(html).toContain("Answer outcomes");
    expect(html).toContain("Most frequent mistakes");
    expect(html.match(/data-slot="chart"/g)).toHaveLength(2);
    expect(html).not.toContain("min-h-64");
    expect(html).not.toContain('role="slider"');
    expect(html).not.toContain("Find the topics you miss most");
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
    const empty = buildAnalyticsReport([], new Map([[iq.id, iq]]), new Map());
    const html = renderToStaticMarkup(<AnalyticsView report={empty} filter="all" />);
    expect(html).toContain("No analytics yet");
    expect(html).not.toContain("Knowledge review");
    expect(html).not.toContain('aria-label="Analytics subject"');
    expect(html).not.toContain("IQ");
    expect(html).not.toContain('data-slot="chart"');
    const lesson = renderToStaticMarkup(<KnowledgeLessonView topic={iq} stats={undefined} filter="all" />);
    expect(lesson).toContain("Pair the first and last terms.");
    expect(lesson).not.toContain("Questions you missed");
  });

  it("keeps correct-only and unanswered-only topics in the table without inventing mistakes", () => {
    for (const selectedOptions of [["A"], []]) {
      const clean = buildAnalyticsReport([{
        attemptId: "clean", quizId: "quiz", questionId: "one", prompt: "Question", topicId: iq.id,
        selectedOptions, isCorrect: selectedOptions.length > 0,
      }], new Map([[iq.id, iq]]), new Map());
      const html = renderToStaticMarkup(<AnalyticsView report={clean} filter="iq" />);
      expect(html).toContain("No incorrect answers in this view");
      expect(html).toContain(`href="/knowledge/${iq.id}?subject=iq"`);
      expect(html).toContain("<table");
      expect(html).not.toContain("currently correct");
    }
  });
});
