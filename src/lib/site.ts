export const siteName = "MarkQ";

export const siteDescription =
  "Turn Markdown files into self-hosted quizzes with answer review, explanations, and SQLite result history.";

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteUrl = new URL(configuredUrl);
