import { describe, expect, it } from "bun:test";

import { parseKnowledgeMarkdown } from "./parser";

const validDocument = `---
subject: english
title: English knowledge
description: Review notes
---

# English knowledge

## english-second-conditional | Second conditional

### Formula

If + past simple, would + verb.
`;

describe("parseKnowledgeMarkdown", () => {
  it("parses topics and preserves their Markdown content", () => {
    const document = parseKnowledgeMarkdown(validDocument, "english.md");
    expect(document.subject).toBe("english");
    expect(document.topics).toEqual([{
      id: "english-second-conditional",
      subject: "english",
      title: "Second conditional",
      content: "### Formula\n\nIf + past simple, would + verb.",
      sourceFile: "english.md",
    }]);
  });

  it("rejects malformed and duplicate topic IDs", () => {
    expect(() => parseKnowledgeMarkdown(validDocument.replace(
      "english-second-conditional | Second conditional",
      "Not valid | Second conditional",
    ))).toThrow(/kebab-case/);
    expect(() => parseKnowledgeMarkdown(`${validDocument}\n## english-second-conditional | Duplicate\n\nText`))
      .toThrow(/duplicate/);
  });
});
