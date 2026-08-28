import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { KnowledgeDocumentView } from "@/features/knowledge/components/knowledge-document-view";
import type { KnowledgeDocument } from "@/lib/knowledge/types";

describe("KnowledgeDocumentView", () => {
  it("renders document metadata, contents and complete topic Markdown", () => {
    const document: KnowledgeDocument = {
      subject: "iq",
      subjectTitle: "IQ",
      title: "Kiến thức IQ EVN",
      description: "Ôn tập đầy đủ.",
      sourceFile: "iq.md",
      topics: [
        { id: "iq-sequences", subject: "iq", subjectTitle: "IQ", title: "Dãy số", content: "### Công thức\n\n**Hiệu bậc hai**.", sourceFile: "iq.md" },
        { id: "iq-logic", subject: "iq", subjectTitle: "IQ", title: "Logic", content: "Chỉ kết luận điều bắt buộc đúng.", sourceFile: "iq.md" },
      ],
    };

    const html = renderToStaticMarkup(<KnowledgeDocumentView document={document} />);
    expect(html).toContain('href="/?status=knowledge"');
    expect(html).toContain('aria-label="Knowledge guide contents"');
    expect(html).toContain('href="#iq-sequences"');
    expect(html).toContain('id="iq-logic"');
    expect(html).toContain("<strong>Hiệu bậc hai</strong>");
    expect(html).toContain("Chỉ kết luận điều bắt buộc đúng.");
  });
});
