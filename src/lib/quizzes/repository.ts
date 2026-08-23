import "server-only";

import fs from "node:fs";
import path from "node:path";

import { parseQuizMarkdown, QuizFormatError } from "./parser";
import type { Quiz } from "./types";
import { toQuizSummary } from "./types";

const quizzesDirectory = path.join(process.cwd(), "content", "quizzes");

export type QuizCatalog = {
  quizzes: Quiz[];
  errors: QuizFormatError[];
};

export function readQuizCatalog(): QuizCatalog {
  if (!fs.existsSync(quizzesDirectory)) {
    return { quizzes: [], errors: [] };
  }

  const quizzes: Quiz[] = [];
  const errors: QuizFormatError[] = [];
  const seenIds = new Set<string>();

  const files = fs
    .readdirSync(quizzesDirectory)
    .filter((file) => file.endsWith(".md"))
    .toSorted((a, b) => a.localeCompare(b));

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(quizzesDirectory, file), "utf8");
      const quiz = parseQuizMarkdown(raw, file);
      if (seenIds.has(quiz.id)) {
        throw new QuizFormatError(file, `duplicate quiz ID: ${quiz.id}`);
      }
      seenIds.add(quiz.id);
      if (quiz.published) quizzes.push(quiz);
    } catch (error) {
      const formatError =
        error instanceof QuizFormatError
          ? error
          : new QuizFormatError(file, error instanceof Error ? error.message : "unknown error");
      errors.push(formatError);
      if (process.env.NODE_ENV !== "test") console.error(formatError.message);
    }
  }

  quizzes.sort((a, b) => a.title.localeCompare(b.title, "vi"));
  return { quizzes, errors };
}

export function getQuizById(id: string) {
  return readQuizCatalog().quizzes.find((quiz) => quiz.id === id) ?? null;
}

export function getQuizSummaries() {
  return readQuizCatalog().quizzes.map(toQuizSummary);
}
