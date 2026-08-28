import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";

import { cn } from "@/lib/utils";

const codePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g;
const displayMathPattern = /\$\$([\s\S]*?)\$\$/g;

const remarkPlugins: PluggableList = [remarkGfm, remarkMath];
const rehypePlugins: PluggableList = [[rehypeKatex, {
  strict: "ignore",
  throwOnError: false,
}]];

function normalizeDisplayMath(content: string) {
  return content
    .split(codePattern)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part.replace(displayMathPattern, (_match, expression: string) => (
        `\n\n$$\n${expression.trim()}\n$$\n\n`
      ));
    })
    .join("");
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {normalizeDisplayMath(content)}
      </ReactMarkdown>
    </div>
  );
}
