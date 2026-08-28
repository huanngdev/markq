import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "bun:test";

import { Markdown } from "@/components/markdown";

describe("Markdown", () => {
  it("renders structured prose and inline math", () => {
    const html = renderToStaticMarkup(
      <Markdown content={"**Phân tích:**\n\n- Góc là $2 \\times 30^\\circ = 60^\\circ$."} />,
    );

    expect(html).toContain("<strong>Phân tích:</strong>");
    expect(html).toContain("<ul>");
    expect(html).toContain("class=\"katex\"");
    expect(html).not.toContain("$2");
  });

  it("renders same-line double-dollar formulas as display math", () => {
    const html = renderToStaticMarkup(
      <Markdown content={"Thời gian là: $$ \\frac{60}{5.5} = \\frac{120}{11} $$ phút."} />,
    );

    expect(html).toContain("katex-display");
    expect(html).not.toContain("$$");
  });

  it("does not parse math delimiters inside code", () => {
    const html = renderToStaticMarkup(<Markdown content={"`echo $$`"} />);

    expect(html).toContain("<code>echo $$</code>");
    expect(html).not.toContain("class=\"katex\"");
  });
});
