import { describe, expect, it } from "bun:test";

import { defaultQuizSettings, type Quiz } from "@/lib/quizzes/types";

import { gradeQuiz } from "./grading";

const quiz: Quiz = {
  schemaVersion: 2,
  id: "grading-test",
  title: "Grading test",
  description: "",
  tags: [],
  published: true,
  visibility: "public",
  settings: defaultQuizSettings,
  sourceFile: "grading-test.md",
  questions: [
    {
      id: "q1",
      prompt: "One",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOptions: ["A"],
      selectionMode: "single",
      points: 1,
      explanation: "A",
    },
    {
      id: "q2",
      prompt: "Two",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOptions: ["B"],
      selectionMode: "single",
      points: 2,
      explanation: "B",
    },
    {
      id: "q3",
      prompt: "Three",
      options: [
        { id: "A", content: "A" },
        { id: "B", content: "B" },
        { id: "C", content: "C" },
      ],
      correctOptions: ["A", "C"],
      selectionMode: "multiple",
      points: 3,
      explanation: "A and C",
    },
  ],
};

describe("gradeQuiz", () => {
  it("grades exact single and multiple selections by points", () => {
    const result = gradeQuiz(quiz, { q1: "a", q2: "A", q3: ["c", "a"] });

    expect(result).toMatchObject({
      correctCount: 2,
      incorrectCount: 1,
      unansweredCount: 0,
      totalQuestions: 3,
      earnedPoints: 4,
      totalPoints: 6,
      scorePercent: 67,
    });
    expect(result.answers[2].selectedOptions).toEqual(["A", "C"]);
  });

  it("counts unanswered answers separately", () => {
    const result = gradeQuiz(quiz, { q1: "A" });
    expect(result).toMatchObject({ correctCount: 1, incorrectCount: 0, unansweredCount: 2 });
  });

  it("supports partial scoring and penalties without a negative aggregate score", () => {
    const partialQuiz: Quiz = {
      ...quiz,
      settings: { ...quiz.settings, scoringMode: "partial", incorrectPenalty: 0.5 },
    };
    const partiallyCorrect = gradeQuiz(partialQuiz, { q3: ["A"] });
    const wrong = gradeQuiz(partialQuiz, { q3: ["B"] });

    expect(partiallyCorrect.answers[2].earnedPoints).toBe(1.5);
    expect(partiallyCorrect.earnedPoints).toBe(1.5);
    expect(wrong.answers[2].earnedPoints).toBe(-3);
    expect(wrong.earnedPoints).toBe(0);
  });

  it("rejects unknown questions, options, duplicates, and multiple values for single-select", () => {
    expect(() => gradeQuiz(quiz, { q4: "A" })).toThrow(/does not exist/);
    expect(() => gradeQuiz(quiz, { q1: "C" })).toThrow(/Invalid option/);
    expect(() => gradeQuiz(quiz, { q3: ["A", "A"] })).toThrow(/Duplicate/);
    expect(() => gradeQuiz(quiz, { q1: ["A", "B"] })).toThrow(/only accepts one/);
  });
});
