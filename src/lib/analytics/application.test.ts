import { describe, expect, it } from "bun:test";

import type { KnowledgeTopic } from "@/lib/knowledge/types";

import { buildAnalyticsReport } from "./application";
import type { AnalyticsAnswerRecord } from "./types";

const topic: KnowledgeTopic = {
  id: "english-second-conditional",
  subject: "english",
  subjectTitle: "English",
  title: "Second conditional",
  content: "Knowledge",
  sourceFile: "english.md",
};

describe("buildAnalyticsReport", () => {
  it("discovers arbitrary subjects and counts mixed-subject attempts only once overall", () => {
    const topics: KnowledgeTopic[] = [topic, {
      id: "networks-routing", subject: "computer-networks", subjectTitle: "Mạng máy tính",
      title: "Routing", content: "Routing lesson", sourceFile: "networks.md",
    }, {
      id: "math-sets", subject: "discrete-math", subjectTitle: "Toán rời rạc",
      title: "Sets", content: "Set lesson", sourceFile: "math.md",
    }];
    const report = buildAnalyticsReport([
      { attemptId: "mixed", quizId: "mixed-quiz", questionId: "one", prompt: "Grammar", topicId: topic.id, selectedOptions: ["A"], isCorrect: true },
      { attemptId: "mixed", quizId: "mixed-quiz", questionId: "two", prompt: "Routing", topicId: "networks-routing", selectedOptions: ["B"], isCorrect: false },
      { attemptId: "second", quizId: "network-quiz", questionId: "three", prompt: "Routing again", topicId: "networks-routing", selectedOptions: [], isCorrect: false },
      { attemptId: "ignored", quizId: "unlinked-quiz", questionId: "four", prompt: "Unlinked", topicId: null, selectedOptions: ["B"], isCorrect: false },
    ], new Map(topics.map((item) => [item.id, item])), new Map());
    expect(report).toMatchObject({ attemptCount: 2, questionCount: 3, correctCount: 1, incorrectCount: 1, unansweredCount: 1, accuracyPercent: 33 });
    expect(report.subjects).toHaveLength(3);
    expect(report.subjects.find((subject) => subject.subject === "computer-networks")).toMatchObject({
      subjectTitle: "Mạng máy tính", attemptCount: 2, questionCount: 2, incorrectCount: 1, unansweredCount: 1,
    });
    expect(report.subjects.find((subject) => subject.subject === "discrete-math")).toMatchObject({
      questionCount: 0, attemptCount: 0, accuracyPercent: 0,
    });
    expect(report.weakTopics.map((item) => item.topicId)).toEqual(["networks-routing"]);
    expect(report.subjects.some((subject) => subject.subject === "iq")).toBe(false);
  });

  it("has no predefined subjects when the knowledge catalog is empty", () => {
    const report = buildAnalyticsReport([], new Map(), new Map());
    expect(report.subjects).toEqual([]);
    expect(report).toMatchObject({ attemptCount: 0, questionCount: 0, accuracyPercent: 0 });
  });

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
    expect(report.subjects.find((subject) => subject.subject === "english")).toMatchObject({ attemptCount: 2, questionCount: 3 });
    expect(report.weakTopics[0]).toMatchObject({
      topicId: topic.id,
      incorrectCount: 1,
      unansweredCount: 1,
      mistakeExamples: ["Wrong one"],
    });
  });
});
