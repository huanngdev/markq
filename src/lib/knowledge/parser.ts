import matter from "gray-matter";
import type { Heading, Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { z } from "zod";

import type { KnowledgeDocument, KnowledgeSubject, KnowledgeTopic } from "./types";

const metadataSchema = z.object({
  subject: z.enum(["english", "iq"]),
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
});

const topicIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const markdownParser = unified().use(remarkParse);

export class KnowledgeFormatError extends Error {
  constructor(public readonly sourceFile: string, message: string) {
    super(`${sourceFile}: ${message}`);
    this.name = "KnowledgeFormatError";
  }
}

function offset(node: RootContent, edge: "start" | "end") {
  const value = node.position?.[edge].offset;
  if (value === undefined) throw new Error("Markdown parser did not provide source offsets");
  return value;
}

function parseTopicHeading(raw: string, sourceFile: string) {
  const separator = raw.indexOf("|");
  if (separator === -1) {
    throw new KnowledgeFormatError(sourceFile, `topic heading must use "topic-id | Title": ${raw}`);
  }
  const id = raw.slice(0, separator).trim();
  const title = raw.slice(separator + 1).trim();
  if (!topicIdPattern.test(id)) {
    throw new KnowledgeFormatError(sourceFile, `topic ID must use kebab-case: ${id}`);
  }
  if (!title) throw new KnowledgeFormatError(sourceFile, `topic title is required: ${id}`);
  return { id, title };
}

export function parseKnowledgeMarkdown(raw: string, sourceFile = "knowledge.md"): KnowledgeDocument {
  let parsedMatter: matter.GrayMatterFile<string>;
  try {
    parsedMatter = matter(raw);
  } catch (error) {
    throw new KnowledgeFormatError(
      sourceFile,
      `invalid frontmatter YAML: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  const metadata = metadataSchema.safeParse(parsedMatter.data);
  if (!metadata.success) {
    throw new KnowledgeFormatError(sourceFile, `invalid frontmatter: ${z.prettifyError(metadata.error)}`);
  }

  const tree = markdownParser.parse(parsedMatter.content) as Root;
  const headings = tree.children.filter(
    (node): node is Heading => node.type === "heading" && node.depth === 2,
  );
  if (headings.length === 0) {
    throw new KnowledgeFormatError(sourceFile, "document must contain at least one level-2 topic");
  }

  const ids = new Set<string>();
  const topics = headings.map((heading, index): KnowledgeTopic => {
    const parsedHeading = parseTopicHeading(toString(heading).trim(), sourceFile);
    if (ids.has(parsedHeading.id)) {
      throw new KnowledgeFormatError(sourceFile, `duplicate topic ID: ${parsedHeading.id}`);
    }
    ids.add(parsedHeading.id);
    const nextHeading = headings[index + 1];
    const end = nextHeading ? offset(nextHeading, "start") : parsedMatter.content.length;
    const content = parsedMatter.content
      .slice(offset(heading, "end"), end)
      .trim();
    if (!content) throw new KnowledgeFormatError(sourceFile, `topic content is empty: ${parsedHeading.id}`);
    return {
      ...parsedHeading,
      subject: metadata.data.subject as KnowledgeSubject,
      content,
      sourceFile,
    };
  });

  return { ...metadata.data, topics, sourceFile };
}
