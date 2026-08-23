import fs from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";

const contentDirectory = path.join(process.cwd(), "content", "quizzes");
const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetPath: string[] }> },
) {
  const { assetPath } = await params;
  if (assetPath.length === 0 || assetPath.some((segment) => !segment || segment === "." || segment === "..")) {
    notFound();
  }

  const filename = path.resolve(contentDirectory, ...assetPath);
  if (!filename.startsWith(`${contentDirectory}${path.sep}`)) notFound();

  const contentType = contentTypes[path.extname(filename).toLowerCase()];
  if (!contentType) notFound();

  try {
    const file = await fs.readFile(filename);
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    notFound();
  }
}
