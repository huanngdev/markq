import "server-only";

import fs from "node:fs";
import path from "node:path";

import { KnowledgeFormatError, parseKnowledgeMarkdown } from "./parser";
import type { KnowledgeDocument, KnowledgeTopic } from "./types";

const knowledgeDirectory = path.join(process.cwd(), "content", "knowledge");

export type KnowledgeCatalog = {
  documents: KnowledgeDocument[];
  topics: Map<string, KnowledgeTopic>;
  errors: KnowledgeFormatError[];
};

export function readKnowledgeCatalog(): KnowledgeCatalog {
  if (!fs.existsSync(knowledgeDirectory)) {
    return { documents: [], topics: new Map(), errors: [] };
  }

  const documents: KnowledgeDocument[] = [];
  const topics = new Map<string, KnowledgeTopic>();
  const errors: KnowledgeFormatError[] = [];
  const files = fs.readdirSync(knowledgeDirectory)
    .filter((file) => file.endsWith(".md"))
    .toSorted((a, b) => a.localeCompare(b));

  for (const file of files) {
    try {
      const document = parseKnowledgeMarkdown(
        fs.readFileSync(path.join(knowledgeDirectory, file), "utf8"),
        file,
      );
      for (const topic of document.topics) {
        if (topics.has(topic.id)) {
          throw new KnowledgeFormatError(file, `duplicate topic ID across documents: ${topic.id}`);
        }
        topics.set(topic.id, topic);
      }
      documents.push(document);
    } catch (error) {
      errors.push(error instanceof KnowledgeFormatError
        ? error
        : new KnowledgeFormatError(file, error instanceof Error ? error.message : "unknown error"));
    }
  }

  return { documents, topics, errors };
}
