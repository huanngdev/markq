import fs from "node:fs";
import path from "node:path";

import { parseQuizMarkdown, QuizFormatError } from "../src/lib/quizzes/parser";

const directory = path.join(process.cwd(), "content", "quizzes");

if (!fs.existsSync(directory)) {
  console.error("The content/quizzes directory was not found.");
  process.exitCode = 1;
} else {
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".md"));
  const ids = new Set<string>();
  let failed = false;

  for (const file of files) {
    try {
      const quiz = parseQuizMarkdown(fs.readFileSync(path.join(directory, file), "utf8"), file);
      if (ids.has(quiz.id)) throw new QuizFormatError(file, `duplicate quiz ID: ${quiz.id}`);
      ids.add(quiz.id);
      console.log(`✓ ${file}: ${quiz.questions.length} questions`);
    } catch (error) {
      failed = true;
      console.error(`✗ ${error instanceof Error ? error.message : file}`);
    }
  }

  if (files.length === 0) {
    failed = true;
    console.error("No .md files were found in content/quizzes.");
  }

  if (failed) process.exitCode = 1;
}
