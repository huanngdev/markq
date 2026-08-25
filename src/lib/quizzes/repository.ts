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

export type QuizDocument = {
  sourceFile: string;
  markdown: string;
  quiz: Quiz | null;
  error: string | null;
};

function markdownFiles() {
  if (!fs.existsSync(quizzesDirectory)) return [];
  return fs
    .readdirSync(quizzesDirectory)
    .filter((file) => file.endsWith(".md"))
    .toSorted((a, b) => a.localeCompare(b));
}

export function readQuizCatalog(): QuizCatalog {
  if (!fs.existsSync(quizzesDirectory)) {
    return { quizzes: [], errors: [] };
  }

  const quizzes: Quiz[] = [];
  const errors: QuizFormatError[] = [];
  const seenIds = new Set<string>();

  const files = markdownFiles();

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
  return readQuizCatalog().quizzes.find(
    (quiz) => quiz.id === id && quiz.visibility !== "private",
  ) ?? null;
}

export function getQuizSummaries() {
  return readQuizCatalog().quizzes
    .filter((quiz) => quiz.visibility === "public")
    .map(toQuizSummary);
}

export function getPublicQuizCatalog() {
  const catalog = readQuizCatalog();
  return {
    quizzes: catalog.quizzes.filter((quiz) => quiz.visibility === "public"),
    errors: catalog.errors,
  };
}

export function readQuizDocuments(): QuizDocument[] {
  return markdownFiles().map((sourceFile) => {
    const markdown = fs.readFileSync(path.join(quizzesDirectory, sourceFile), "utf8");
    try {
      return { sourceFile, markdown, quiz: parseQuizMarkdown(markdown, sourceFile), error: null };
    } catch (error) {
      return {
        sourceFile,
        markdown,
        quiz: null,
        error: error instanceof Error ? error.message : "Unknown quiz format error",
      };
    }
  });
}

export function saveQuizDocument(sourceFile: string, markdown: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(sourceFile)) {
    throw new QuizFormatError(sourceFile, "filename must use kebab-case and end in .md");
  }
  const quiz = parseQuizMarkdown(markdown, sourceFile);
  const duplicate = readQuizDocuments().find(
    (document) => document.sourceFile !== sourceFile && document.quiz?.id === quiz.id,
  );
  if (duplicate) {
    throw new QuizFormatError(sourceFile, `quiz ID is already used by ${duplicate.sourceFile}`);
  }
  fs.mkdirSync(quizzesDirectory, { recursive: true });
  const destination = path.join(quizzesDirectory, sourceFile);
  const temporary = path.join(quizzesDirectory, `.${sourceFile}.${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, markdown, { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporary, destination);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return quiz;
}
