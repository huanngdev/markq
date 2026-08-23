import { describe, expect, it } from "bun:test";

import type { Quiz } from "@/lib/quizzes/types";

import { gradeQuiz } from "./grading";

const quiz: Quiz = {
  id: "grading-test",
  title: "Grading test",
  description: "",
  tags: [],
  published: true,
  sourceFile: "grading-test.md",
  questions: [
    {
      id: "q1",
      prompt: "One",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOption: "A",
      explanation: "A",
    },
    {
      id: "q2",
      prompt: "Two",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOption: "B",
      explanation: "B",
    },
    {
      id: "q3",
      prompt: "Three",
      options: [{ id: "A", content: "A" }, { id: "B", content: "B" }],
      correctOption: "A",
      explanation: "A",
    },
  ],
};

describe("gradeQuiz", () => {
  it("counts correct, incorrect and unanswered answers separately", () => {
    const result = gradeQuiz(quiz, { q1: "a", q2: "A" });

    expect(result).toMatchObject({
      correctCount: 1,
      incorrectCount: 1,
      unansweredCount: 1,
      totalQuestions: 3,
      scorePercent: 33,
    });
  });

  it("rejects unknown questions and options", () => {
    expect(() => gradeQuiz(quiz, { q4: "A" })).toThrow(/does not exist/);
    expect(() => gradeQuiz(quiz, { q1: "C" })).toThrow(/Invalid option/);
  });
});
