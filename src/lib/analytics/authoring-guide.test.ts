import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { parseKnowledgeMarkdown } from "@/lib/knowledge/parser";
import { parseQuizMarkdown } from "@/lib/quizzes/parser";

import { buildAnalyticsReport } from "./application";

describe("public Analytics authoring guide", () => {
  it("provides valid, linked quiz and knowledge examples for a custom subject", () => {
    const guide = fs.readFileSync(path.join(process.cwd(), "docs/ANALYTICS.md"), "utf8");
    const examples = [...guide.matchAll(/```md\n([\s\S]*?)\n```/g)].map((match) => match[1]);
    expect(examples).toHaveLength(2);
    const knowledge = parseKnowledgeMarkdown(examples[0]);
    const quiz = parseQuizMarkdown(examples[1]);
    const report = buildAnalyticsReport(quiz.questions.map((question) => ({
      attemptId: "example-attempt", quizId: quiz.id, questionId: question.id,
      prompt: question.prompt, topicId: question.topicId,
      selectedOptions: ["A"], isCorrect: false,
    })), new Map(knowledge.topics.map((topic) => [topic.id, topic])), new Map());
    expect(report.subjects).toHaveLength(1);
    expect(report.subjects[0]).toMatchObject({ subject: "discrete-math", subjectTitle: "Discrete Mathematics", incorrectCount: 1 });
    expect(report.weakTopics[0]).toMatchObject({ topicId: "discrete-math-union" });
  });
});
