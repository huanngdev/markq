import { describe, expect, it } from "bun:test";

import type { KnowledgeTopic } from "@/lib/knowledge/types";

import { buildAnalyticsReport } from "./application";
import type { AnalyticsAnswerRecord } from "./types";

const topic: KnowledgeTopic = {
  id: "english-second-conditional",
  subject: "english",
  title: "Second conditional",
  content: "Knowledge",
  sourceFile: "english.md",
};

describe("buildAnalyticsReport", () => {
  it("ranks mistakes, separates unanswered answers, and supports legacy topic fallback", () => {
    const records: AnalyticsAnswerRecord[] = [
      { attemptId: "a1", quizId: "q1", questionId: "one", prompt: "Wrong one", topicId: topic.id, selectedOptions: ["B"], isCorrect: false },
      { attemptId: "a1", quizId: "q1", questionId: "two", prompt: "Skipped", topicId: null, selectedOptions: [], isCorrect: false },
      { attemptId: "a2", quizId: "q1", questionId: "one", prompt: "Wrong one", topicId: topic.id, selectedOptions: ["A"], isCorrect: true },
    ];
    const report = buildAnalyticsReport(
      records,
      new Map([[topic.id, topic]]),
      new Map([["q1:two", topic.id]]),
    );

    expect(report).toMatchObject({
      attemptCount: 2,
      correctCount: 1,
      incorrectCount: 1,
      unansweredCount: 1,
      questionCount: 3,
      accuracyPercent: 33,
    });
    expect(report.subjects.english).toMatchObject({ attemptCount: 2, questionCount: 3 });
    expect(report.weakTopics[0]).toMatchObject({
      topicId: topic.id,
      incorrectCount: 1,
      unansweredCount: 1,
      mistakeExamples: ["Wrong one"],
    });
  });
});
