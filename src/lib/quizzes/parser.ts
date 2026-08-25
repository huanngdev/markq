import matter from "gray-matter";
import type { Heading, Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { z } from "zod";

import {
  currentQuizSchemaVersion,
  defaultQuizSettings,
  type Quiz,
  type QuizOption,
  type QuizQuestion,
} from "./types";

const quizSettingsSchema = z.object({
  timeLimitMinutes: z.number().int().positive().max(1_440).nullable().default(null),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  navigationMode: z.enum(["free", "sequential"]).default("free"),
  allowUnanswered: z.boolean().default(true),
  reviewMode: z.enum(["after-submit", "never"]).default("after-submit"),
  passingScore: z.number().min(0).max(100).nullable().default(null),
  expireBehavior: z.enum(["auto-submit", "mark-expired"]).default("auto-submit"),
  scoringMode: z.enum(["exact", "partial"]).default("exact"),
  incorrectPenalty: z.number().min(0).default(0),
  attemptsAllowed: z.number().int().positive().nullable().default(null),
});

const frontmatterSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(currentQuizSchemaVersion)]).default(1),
  id: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must use kebab-case"),
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
  tags: z.array(z.string().trim().min(1)).default([]),
  published: z.boolean().default(true),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  settings: quizSettingsSchema.default(defaultQuizSettings),
});

const requiredSectionNames = ["question", "options", "answer", "explanation"] as const;
type SectionName = (typeof requiredSectionNames)[number] | "points";
const sectionAliases: Record<string, SectionName> = {
  question: "question",
  "câu hỏi": "question",
  options: "options",
  "lựa chọn": "options",
  answer: "answer",
  "đáp án": "answer",
  explanation: "explanation",
  "lời giải": "explanation",
  points: "points",
  "điểm": "points",
};

type MarkdownNode = {
  type: string;
  url?: string;
  children?: MarkdownNode[];
  position?: {
    start: { offset?: number };
    end: { offset?: number };
  };
};

const markdownParser = unified().use(remarkParse);

export class QuizFormatError extends Error {
  constructor(
    public readonly sourceFile: string,
    message: string,
    public readonly questionId?: string,
  ) {
    super(`${sourceFile}${questionId ? ` (${questionId})` : ""}: ${message}`);
    this.name = "QuizFormatError";
  }
}

function offset(node: RootContent, edge: "start" | "end") {
  const value = node.position?.[edge].offset;
  if (value === undefined) {
    throw new Error("Markdown parser did not provide source offsets");
  }
  return value;
}

function normalizeHeading(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function quizAssetUrl(sourceFile: string, relativeUrl: string) {
  const queryIndex = relativeUrl.search(/[?#]/);
  const pathname = queryIndex === -1 ? relativeUrl : relativeUrl.slice(0, queryIndex);
  const suffix = queryIndex === -1 ? "" : relativeUrl.slice(queryIndex);
  const sourceParts = sourceFile.replaceAll("\\", "/").split("/").slice(0, -1);
  const parts = [...sourceParts];

  for (const segment of pathname.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (parts.length === 0) {
        throw new QuizFormatError(sourceFile, `image path escapes content/quizzes: ${relativeUrl}`);
      }
      parts.pop();
    } else {
      parts.push(segment);
    }
  }

  return `/quiz-assets/${parts.map(encodeURIComponent).join("/")}${suffix}`;
}

export function rewriteRelativeImageUrls(markdown: string, sourceFile: string) {
  const tree = markdownParser.parse(markdown) as unknown as MarkdownNode;
  const replacements: Array<{ start: number; end: number; value: string }> = [];

  function visit(node: MarkdownNode) {
    if (
      node.type === "image" &&
      node.url &&
      !/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(node.url)
    ) {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (start !== undefined && end !== undefined) {
        const source = markdown.slice(start, end);
        const localIndex = source.indexOf(node.url);
        if (localIndex !== -1) {
          replacements.push({
            start: start + localIndex,
            end: start + localIndex + node.url.length,
            value: quizAssetUrl(sourceFile, node.url),
          });
        }
      }
    }
    node.children?.forEach(visit);
  }

  visit(tree);
  return replacements
    .toSorted((a, b) => b.start - a.start)
    .reduce(
      (content, replacement) =>
        `${content.slice(0, replacement.start)}${replacement.value}${content.slice(replacement.end)}`,
      markdown,
    );
}

function sectionContent(segment: string, tree: Root, sourceFile: string, questionId: string) {
  const headings = tree.children.filter(
    (node): node is Heading => node.type === "heading" && node.depth === 3,
  );
  const sections = new Map<SectionName, string>();

  headings.forEach((heading, index) => {
    const headingName = normalizeHeading(toString(heading));
    const name = sectionAliases[headingName];
    if (!name) {
      throw new QuizFormatError(sourceFile, `unsupported section: ${toString(heading)}`, questionId);
    }
    if (sections.has(name)) {
      throw new QuizFormatError(sourceFile, `duplicate section: ${toString(heading)}`, questionId);
    }

    const nextHeading = headings[index + 1];
    const start = offset(heading, "end");
    const end = nextHeading ? offset(nextHeading, "start") : segment.length;
    sections.set(name, segment.slice(start, end).trim());
  });

  for (const name of requiredSectionNames) {
    if (!sections.get(name)) {
      throw new QuizFormatError(sourceFile, `missing or empty section "${name}"`, questionId);
    }
  }

  return sections as Map<SectionName, string>;
}

function parseCorrectOptions(raw: string, sourceFile: string, questionId: string) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const listPattern = /^-\s*(?:\[(?: |x|X)\]\s*)?([A-Za-z0-9]+)$/;
  const values = lines.length === 1 && !lines[0].startsWith("-")
    ? [lines[0]]
    : lines.map((line) => {
        const match = line.match(listPattern);
        if (!match) {
          throw new QuizFormatError(
            sourceFile,
            `multiple answers must use one option ID per list item: ${line}`,
            questionId,
          );
        }
        return match[1];
      });
  const answers = values.map((value) => value.trim().toUpperCase());

  if (answers.some((answer) => !/^[A-Z0-9]+$/.test(answer))) {
    throw new QuizFormatError(sourceFile, "answer must be an option ID", questionId);
  }
  if (new Set(answers).size !== answers.length) {
    throw new QuizFormatError(sourceFile, "answer option IDs must be unique", questionId);
  }

  return answers;
}

function parsePoints(raw: string | undefined, sourceFile: string, questionId: string) {
  if (raw === undefined) return 1;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new QuizFormatError(sourceFile, "points must be a positive number", questionId);
  }
  return value;
}

function parseOptions(raw: string, sourceFile: string, questionId: string): QuizOption[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const optionPattern = /^\s*-\s*\[(?: |x|X)?\]\s+([A-Za-z0-9]+)\.\s+(.+?)\s*$/;
  const options = lines.map((line) => {
    const match = line.match(optionPattern);
    if (!match) {
      throw new QuizFormatError(
        sourceFile,
        `option must match "- [ ] A. Content": ${line.trim()}`,
        questionId,
      );
    }
    return { id: match[1].toUpperCase(), content: match[2].trim() };
  });

  if (options.length < 2) {
    throw new QuizFormatError(sourceFile, "at least 2 options are required", questionId);
  }

  const optionIds = new Set(options.map((option) => option.id));
  if (optionIds.size !== options.length) {
    throw new QuizFormatError(sourceFile, "option IDs must be unique", questionId);
  }

  return options;
}

function parseQuestion(
  questionId: string,
  segment: string,
  sourceFile: string,
): QuizQuestion {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(questionId)) {
    throw new QuizFormatError(sourceFile, "question ID must use kebab-case", questionId);
  }

  const tree = markdownParser.parse(segment) as Root;
  const sections = sectionContent(segment, tree, sourceFile, questionId);
  const options = parseOptions(sections.get("options")!, sourceFile, questionId);
  const correctOptions = parseCorrectOptions(sections.get("answer")!, sourceFile, questionId);
  const optionIds = new Set(options.map((option) => option.id));

  const unknownAnswer = correctOptions.find((answer) => !optionIds.has(answer));
  if (unknownAnswer) {
    throw new QuizFormatError(
      sourceFile,
      `answer "${unknownAnswer}" does not exist in the option list`,
      questionId,
    );
  }

  return {
    id: questionId,
    prompt: rewriteRelativeImageUrls(sections.get("question")!, sourceFile),
    options,
    correctOptions,
    selectionMode: correctOptions.length === 1 ? "single" : "multiple",
    points: parsePoints(sections.get("points"), sourceFile, questionId),
    explanation: rewriteRelativeImageUrls(sections.get("explanation")!, sourceFile),
  };
}

export function parseQuizMarkdown(raw: string, sourceFile = "quiz.md"): Quiz {
  let parsedMatter: matter.GrayMatterFile<string>;
  try {
    parsedMatter = matter(raw);
  } catch (error) {
    throw new QuizFormatError(
      sourceFile,
      `invalid frontmatter YAML: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  const metadata = frontmatterSchema.safeParse(parsedMatter.data);
  if (!metadata.success) {
    throw new QuizFormatError(
      sourceFile,
      `invalid frontmatter: ${z.prettifyError(metadata.error)}`,
    );
  }

  const content = parsedMatter.content;
  const tree = markdownParser.parse(content) as Root;
  const questionHeadings = tree.children.filter(
    (node): node is Heading => node.type === "heading" && node.depth === 2,
  );

  if (questionHeadings.length === 0) {
    throw new QuizFormatError(sourceFile, "quiz must contain at least one level-2 question heading");
  }

  const questionIds = new Set<string>();
  const questions = questionHeadings.map((heading, index) => {
    const questionId = toString(heading).trim();
    if (questionIds.has(questionId)) {
      throw new QuizFormatError(sourceFile, "duplicate question ID", questionId);
    }
    questionIds.add(questionId);

    const nextHeading = questionHeadings[index + 1];
    const start = offset(heading, "end");
    const end = nextHeading ? offset(nextHeading, "start") : content.length;
    return parseQuestion(questionId, content.slice(start, end), sourceFile);
  });

  return {
    ...metadata.data,
    questions,
    sourceFile,
  };
}
