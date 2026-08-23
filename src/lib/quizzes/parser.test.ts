import { describe, expect, it } from "bun:test";

import { QuizFormatError, parseQuizMarkdown, rewriteRelativeImageUrls } from "./parser";
import { toPublicQuiz } from "./types";

const validQuiz = `---
id: sample-quiz
title: Sample quiz
description: A test quiz
tags:
  - test
published: true
---

# Sample quiz

## q1

### Question

What does this return?

\`\`\`js
const heading = "## not-a-question";
\`\`\`

### Options

- [ ] A. One
- [ ] B. Two

### Answer

B

### Explanation

Because **B** is correct.
`;

describe("parseQuizMarkdown", () => {
  it("parses a valid quiz and ignores headings inside code blocks", () => {
    const quiz = parseQuizMarkdown(validQuiz, "sample.md");

    expect(quiz.id).toBe("sample-quiz");
    expect(quiz.questions).toHaveLength(1);
    expect(quiz.questions[0]).toMatchObject({
      id: "q1",
      correctOption: "B",
      options: [
        { id: "A", content: "One" },
        { id: "B", content: "Two" },
      ],
    });
  });

  it("rejects an answer that is not in the option list", () => {
    expect(() => parseQuizMarkdown(validQuiz.replace("\nB\n\n### Explanation", "\nC\n\n### Explanation")))
      .toThrow(/does not exist/);
  });

  it("rejects missing answers and explanations", () => {
    const missingAnswer = validQuiz.replace("\nB\n\n### Explanation", "\n\n### Explanation");
    const missingExplanation = validQuiz.replace("Because **B** is correct.", "");

    expect(() => parseQuizMarkdown(missingAnswer)).toThrow(/answer/);
    expect(() => parseQuizMarkdown(missingExplanation)).toThrow(/explanation/);
  });

  it("rejects malformed frontmatter", () => {
    const malformed = validQuiz.replace("tags:\n  - test", "tags: [test");
    expect(() => parseQuizMarkdown(malformed)).toThrow(/frontmatter YAML/);
  });

  it("rejects duplicate question ids", () => {
    const duplicate = `${validQuiz}\n## q1\n\n### Question\n\nSecond?\n\n### Options\n\n- [ ] A. Yes\n- [ ] B. No\n\n### Answer\n\nA\n\n### Explanation\n\nExplanation.`;
    expect(() => parseQuizMarkdown(duplicate)).toThrow(QuizFormatError);
    expect(() => parseQuizMarkdown(duplicate)).toThrow(/duplicate/);
  });

  it("creates a client-safe DTO without answers or explanations", () => {
    const publicQuiz = toPublicQuiz(parseQuizMarkdown(validQuiz));
    const question = publicQuiz.questions[0] as unknown as Record<string, unknown>;

    expect(question.correctOption).toBeUndefined();
    expect(question.explanation).toBeUndefined();
  });

  it("rewrites relative images without touching code blocks or remote images", () => {
    const markdown = "![Local](./images/example.png)\n\n![Remote](https://example.com/a.png)\n\n```md\n![Code](fake.png)\n```";
    const rewritten = rewriteRelativeImageUrls(markdown, "nested/sample.md");

    expect(rewritten).toContain("![Local](/quiz-assets/nested/images/example.png)");
    expect(rewritten).toContain("![Remote](https://example.com/a.png)");
    expect(rewritten).toContain("![Code](fake.png)");
  });

  it("rejects relative images that escape the quiz directory", () => {
    expect(() => rewriteRelativeImageUrls("![Unsafe](../private.png)", "sample.md"))
      .toThrow(/escapes/);
  });
});
