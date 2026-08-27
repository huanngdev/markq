import { KnowledgeFormatError } from "./parser";
import type { KnowledgeDocument, KnowledgeTopic } from "./types";

export function validateKnowledgeDocument(document: KnowledgeDocument, existingTopics: ReadonlyMap<string, KnowledgeTopic>): void {
  for (const topic of existingTopics.values()) {
    if (topic.subject === document.subject && topic.subjectTitle !== document.subjectTitle) {
      throw new KnowledgeFormatError(document.sourceFile, `conflicting subjectTitle for ${document.subject}: expected "${topic.subjectTitle}"`);
    }
  }
  for (const topic of document.topics) {
    if (existingTopics.has(topic.id)) {
      throw new KnowledgeFormatError(document.sourceFile, `duplicate topic ID across documents: ${topic.id}`);
    }
  }
}
