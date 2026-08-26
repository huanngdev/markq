import { describe, expect, it } from "bun:test";

import { parseKnowledgeMarkdown } from "./parser";
import { validateKnowledgeDocument } from "./catalog-validation";

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
      subjectTitle: "English",
      title: "Second conditional",
      content: "### Formula\n\nIf + past simple, would + verb.",
      sourceFile: "english.md",
    }]);
  });

  it("accepts custom subjects and display titles while preserving old documents", () => {
    const document = parseKnowledgeMarkdown(validDocument.replace("subject: english", "subject: computer-networks\nsubjectTitle: Mạng máy tính"));
    expect(document).toMatchObject({ subject: "computer-networks", subjectTitle: "Mạng máy tính" });
    expect(document.topics[0]).toMatchObject({ subject: "computer-networks", subjectTitle: "Mạng máy tính" });
    expect(parseKnowledgeMarkdown(validDocument.replace("subject: english", "subject: iq")).subjectTitle).toBe("IQ");
    expect(parseKnowledgeMarkdown(validDocument.replace("subject: english", "subject: discrete-math")).subjectTitle).toBe("Discrete Math");
  });

  it("rejects invalid subject IDs, the reserved all filter, and blank labels", () => {
    for (const subject of ["all", "Computer Networks", "../math", "math&status=all", ""]) {
      expect(() => parseKnowledgeMarkdown(validDocument.replace("subject: english", `subject: '${subject}'`))).toThrow(/frontmatter/);
    }
    expect(() => parseKnowledgeMarkdown(validDocument.replace("subject: english", 'subject: math\nsubjectTitle: " "'))).toThrow(/frontmatter/);
  });

  it("rejects duplicate topics and conflicting subject titles before merging documents", () => {
    const first = parseKnowledgeMarkdown(validDocument);
    const existing = new Map(first.topics.map((topic) => [topic.id, topic]));
    expect(() => validateKnowledgeDocument(first, existing)).toThrow(/duplicate topic/);
    const conflicting = parseKnowledgeMarkdown(validDocument.replace("subject: english", "subject: english\nsubjectTitle: Different label").replace("english-second-conditional", "english-passive"));
    expect(() => validateKnowledgeDocument(conflicting, existing)).toThrow(/conflicting subjectTitle/);
    expect(existing.size).toBe(1);
    const matching = parseKnowledgeMarkdown(validDocument.replace("english-second-conditional", "english-passive"));
    expect(() => validateKnowledgeDocument(matching, existing)).not.toThrow();
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
