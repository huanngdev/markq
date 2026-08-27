import fs from "node:fs";
import path from "node:path";

import { validateKnowledgeDocument } from "../src/lib/knowledge/catalog-validation";
import { parseKnowledgeMarkdown } from "../src/lib/knowledge/parser";
import type { KnowledgeTopic } from "../src/lib/knowledge/types";
import { parseQuizMarkdown, QuizFormatError } from "../src/lib/quizzes/parser";

const directory = path.join(process.cwd(), "content", "quizzes");
const knowledgeDirectory = path.join(process.cwd(), "content", "knowledge");

if (!fs.existsSync(directory)) {
  console.error("The content/quizzes directory was not found.");
  process.exitCode = 1;
} else {
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".md"));
  const ids = new Set<string>();
  const topicReferences: Array<{ file: string; questionId: string; topicId: string }> = [];
  let failed = false;

  for (const file of files) {
    try {
      const quiz = parseQuizMarkdown(fs.readFileSync(path.join(directory, file), "utf8"), file);
      if (ids.has(quiz.id)) throw new QuizFormatError(file, `duplicate quiz ID: ${quiz.id}`);
      ids.add(quiz.id);
      for (const question of quiz.questions) {
        if (question.topicId) {
          topicReferences.push({ file, questionId: question.id, topicId: question.topicId });
        }
      }
      console.log(`✓ ${file}: ${quiz.questions.length} questions`);
    } catch (error) {
      failed = true;
      console.error(`✗ ${error instanceof Error ? error.message : file}`);
    }
  }

  if (files.length === 0) {
    console.log("No quizzes to validate: content/quizzes is empty.");
  }

  const knowledgeTopics = new Map<string, KnowledgeTopic>();
  if (fs.existsSync(knowledgeDirectory)) {
    const knowledgeFiles = fs.readdirSync(knowledgeDirectory).filter((file) => file.endsWith(".md"));
    for (const file of knowledgeFiles) {
      try {
        const document = parseKnowledgeMarkdown(
          fs.readFileSync(path.join(knowledgeDirectory, file), "utf8"),
          file,
        );
        validateKnowledgeDocument(document, knowledgeTopics);
        for (const topic of document.topics) knowledgeTopics.set(topic.id, topic);
        console.log(`✓ ${file}: ${document.topics.length} knowledge topics`);
      } catch (error) {
        failed = true;
        console.error(`✗ ${error instanceof Error ? error.message : file}`);
      }
    }
  }

  for (const reference of topicReferences) {
    if (!knowledgeTopics.has(reference.topicId)) {
      failed = true;
      console.error(`✗ ${reference.file} (${reference.questionId}): unknown topic ID: ${reference.topicId}`);
    }
  }

  if (failed) process.exitCode = 1;
}
