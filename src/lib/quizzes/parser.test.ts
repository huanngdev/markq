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
      correctOptions: ["B"],
      selectionMode: "single",
      points: 1,
      options: [
        { id: "A", content: "One" },
        { id: "B", content: "Two" },
      ],
    });
    expect(quiz).toMatchObject({
      schemaVersion: 1,
      visibility: "public",
      settings: {
        timeLimitMinutes: null,
        scoringMode: "exact",
      },
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

    expect(question.correctOptions).toBeUndefined();
    expect(question.explanation).toBeUndefined();
  });

  it("parses versioned settings, multiple answers, and question points", () => {
    const versionedQuiz = validQuiz
      .replace("id: sample-quiz", `schemaVersion: 2\nid: sample-quiz`)
      .replace("published: true", `published: true\nvisibility: unlisted\nsettings:\n  timeLimitMinutes: 30\n  shuffleQuestions: true\n  shuffleOptions: true\n  navigationMode: sequential\n  allowUnanswered: false\n  reviewMode: never\n  passingScore: 70\n  expireBehavior: mark-expired\n  scoringMode: partial\n  incorrectPenalty: 0.25\n  attemptsAllowed: 2`)
      .replace("\nB\n\n### Explanation", "\n- A\n- B\n\n### Points\n\n2.5\n\n### Explanation");

    const quiz = parseQuizMarkdown(versionedQuiz);

    expect(quiz.schemaVersion).toBe(2);
    expect(quiz.visibility).toBe("unlisted");
    expect(quiz.settings).toEqual({
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      shuffleOptions: true,
      navigationMode: "sequential",
      allowUnanswered: false,
      reviewMode: "never",
      passingScore: 70,
      expireBehavior: "mark-expired",
      scoringMode: "partial",
      incorrectPenalty: 0.25,
      attemptsAllowed: 2,
    });
    expect(quiz.questions[0]).toMatchObject({
      correctOptions: ["A", "B"],
      selectionMode: "multiple",
      points: 2.5,
    });
  });

  it("rejects duplicate and malformed multiple answers", () => {
    const duplicate = validQuiz.replace("\nB\n\n### Explanation", "\n- A\n- A\n\n### Explanation");
    const malformed = validQuiz.replace("\nB\n\n### Explanation", "\nA, B\n\n### Explanation");

    expect(() => parseQuizMarkdown(duplicate)).toThrow(/unique/);
    expect(() => parseQuizMarkdown(malformed)).toThrow(/does not exist|option ID/);
  });

  it("rejects non-positive question points", () => {
    const invalid = validQuiz.replace("\n### Explanation", "\n### Points\n\n0\n\n### Explanation");
    expect(() => parseQuizMarkdown(invalid)).toThrow(/positive number/);
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
