import { ImageResponse } from "next/og";

export const alt = "MarkQ — Turn Markdown files into quizzes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#09090b",
        color: "#fafafa",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "2px solid #3f3f46",
          borderRadius: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div style={{ color: "#a1a1aa", display: "flex", fontSize: 30 }}>
          Open-source · Next.js · shadcn/ui · SQLite
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: "-4px" }}>
          MarkQ
        </div>
        <div style={{ display: "flex", fontSize: 44, lineHeight: 1.25 }}>
          Turn Markdown files into quizzes.
        </div>
      </div>
    </div>,
    size,
  );
}
