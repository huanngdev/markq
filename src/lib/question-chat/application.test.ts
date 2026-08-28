import { describe, expect, it } from "bun:test";

import type { AttemptReview, AttemptWorkspace } from "@/lib/attempts/types";
import { defaultQuizSettings } from "@/lib/quizzes/types";

import {
  buildQuestionChatSystemPrompt,
  questionChatContextFromReview,
  questionChatContextFromWorkspace,
} from "./application";

const workspace: AttemptWorkspace = {
  id: "attempt-1",
  quizId: "quiz-1",
  quizTitle: "Software basics",
  status: "in_progress",
  settings: defaultQuizSettings,
  expiresAt: null,
  version: 1,
  answers: [{
    questionId: "question-1",
    questionOrder: 0,
    prompt: "Which property describes an atomic transaction?",
    options: [
      { id: "A", content: "It completes fully or not at all" },
      { id: "B", content: "It always runs in parallel" },
    ],
    selectedOptions: [],
    selectionMode: "single",
    points: 1,
    isFlagged: false,
  }],
};

const review: AttemptReview = {
  id: "attempt-1",
  quizId: "quiz-1",
  quizTitle: "Software basics",
  quizSchemaVersion: 2,
  status: "submitted",
  correctCount: 1,
  incorrectCount: 0,
  unansweredCount: 0,
  totalQuestions: 1,
  earnedPoints: 1,
  totalPoints: 1,
  scorePercent: 100,
  passed: true,
  startedAt: "2026-08-27T00:00:00.000Z",
  expiresAt: null,
  updatedAt: "2026-08-27T00:01:00.000Z",
  submittedAt: "2026-08-27T00:01:00.000Z",
  version: 2,
  reviewMode: "after-submit",
  answers: [{
    id: "answer-1",
    questionId: "question-1",
    topicId: null,
    questionOrder: 0,
    prompt: "Which property describes an atomic transaction?",
    options: [
      { id: "A", content: "It completes fully or not at all" },
      { id: "B", content: "It always runs in parallel" },
    ],
    selectedOptions: ["A"],
    correctOptions: ["A"],
    selectionMode: "single",
    points: 1,
    earnedPoints: 1,
    isCorrect: true,
    isFlagged: false,
    explanation: "Atomicity prevents partial transactions.",
  }],
};

describe("question chat application", () => {
  it("builds an in-progress context without official answers or explanations", () => {
    const context = questionChatContextFromWorkspace(workspace, {
      attemptId: "attempt-1",
      questionId: "question-1",
      mode: "quiz",
      selectedOptions: ["B", "FORGED"],
    });
    expect(context).not.toBeNull();
    expect(context?.selectedOptions).toEqual(["B"]);
    expect(context?.correctOptions).toBeNull();
    expect(context?.explanation).toBeNull();
    if (!context) throw new Error("Expected quiz context.");

    const prompt = buildQuestionChatSystemPrompt(context);
    expect(prompt).toContain("không được cung cấp đáp án chính thức");
    expect(prompt).not.toContain("Atomicity prevents partial transactions");
  });

  it("uses the official answer and explanation only for submitted review context", () => {
    const context = questionChatContextFromReview(review, {
      attemptId: "attempt-1",
      questionId: "question-1",
      mode: "review",
      selectedOptions: [],
    });
    expect(context).not.toBeNull();
    if (!context) throw new Error("Expected review context.");

    const prompt = buildQuestionChatSystemPrompt(context);
    expect(prompt).toContain("Đáp án chính thức: A");
    expect(prompt).toContain("Atomicity prevents partial transactions.");
  });

  it("rejects attempts, questions, and modes that do not match the server snapshot", () => {
    expect(questionChatContextFromWorkspace(workspace, {
      attemptId: "another-attempt",
      questionId: "question-1",
      mode: "quiz",
      selectedOptions: [],
    })).toBeNull();
    expect(questionChatContextFromReview(review, {
      attemptId: "attempt-1",
      questionId: "question-1",
      mode: "quiz",
      selectedOptions: [],
    })).toBeNull();
  });
});
