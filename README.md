# MarkQ — Markdown to Quiz

[![CI](https://github.com/huanngdev/markq/actions/workflows/ci.yml/badge.svg)](https://github.com/huanngdev/markq/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun)](https://bun.sh)

**Turn Markdown files into a clean, self-hosted quiz website.** Write questions, answers, and explanations in Markdown or Obsidian, drop the files into one folder, and MarkQ turns them into interactive quizzes with answer review and SQLite result history.

MarkQ is an open-source **Markdown quiz generator** built with Next.js, shadcn/ui, Bun, and SQLite. It is designed for teachers, study groups, certification practice, interview preparation, internal training, and anyone who wants a simple file-based alternative to a quiz CMS.

![MarkQ quiz workspace in dark mode](public/markq-quiz.jpg)

## Why MarkQ?

- **Markdown in, quiz out** — no admin panel, proprietary editor, or content database.
- **Obsidian-friendly** — quiz files remain readable and editable as ordinary `.md` notes.
- **Answers stay server-side** — correct answers and explanations are not included in the browser's quiz payload.
- **Built-in review** — show the selected answer, correct answer, and full Markdown explanation after submission.
- **Persistent history** — SQLite stores scores and immutable snapshots of completed attempts.
- **Self-hosted and private** — your content and results stay on infrastructure you control.
- **Responsive and accessible** — keyboard shortcuts, light/dark mode, and layouts for desktop and mobile.

## Features

- Multiple single-answer quizzes loaded from `content/quizzes/*.md`.
- Markdown questions and explanations with GFM, code blocks, lists, and local images.
- One-question-at-a-time workspace with fast question navigation.
- Server-side grading and Zod validation.
- Correct, incorrect, and unanswered result breakdowns.
- Attempt history with quiz snapshots, so old reviews remain accurate after a quiz changes.
- Dark mode based on system preference with a manual toggle.
- CLI validation plus a bundled Codex skill for authoring valid quizzes.
- SEO metadata, Open Graph/Twitter images, `robots.txt`, and a generated sitemap.

## Tech stack

- [Next.js](https://nextjs.org/) App Router, React, and TypeScript
- [shadcn/ui](https://ui.shadcn.com/), Base UI, and Tailwind CSS
- [Bun](https://bun.sh/) as the only package manager and runtime
- [SQLite](https://sqlite.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- `gray-matter`, Unified, Remark, and React Markdown
- Zod for content and API validation

## Quick start

Requirements: **Bun 1.3.14 or newer**.

```bash
git clone https://github.com/huanngdev/markq.git
cd markq
bun install
cp .env.example .env.local
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). MarkQ also applies missing migrations automatically when the database is first opened.

## Create a quiz from Markdown

Create a file such as `content/quizzes/javascript-basics.md`:

```md
---
id: javascript-basics
title: JavaScript Basics
description: Test your JavaScript fundamentals.
tags:
  - javascript
  - beginner
published: true
---

# JavaScript Basics

## typeof-null

### Question

What does `typeof null` return in JavaScript?

### Options

- [ ] A. `null`
- [ ] B. `object`
- [ ] C. `undefined`
- [ ] D. `number`

### Answer

B

### Explanation

This is a historical JavaScript behavior. Although `null` is a primitive value, `typeof null` returns `"object"`.
```

Validate every quiz before running or deploying:

```bash
bun run quiz:validate
```

The repository includes a working [example quiz](content/quizzes/example-quiz.md) and the complete [quiz format reference](.agents/skills/markq-quiz-author/references/format.md).

### Format rules

- Quiz and question IDs must be stable, unique, and kebab-case.
- Every question must contain `Question`, `Options`, `Answer`, and `Explanation` sections.
- Each option uses one line: `- [ ] A. Option content`.
- `Answer` contains exactly one option ID.
- Questions, explanations, and option content support Markdown.
- Set `published: false` to keep a valid quiz hidden from the catalog.

### Keeping private quizzes out of Git

MarkQ ignores every `content/quizzes/*.md` file except the public `example-quiz.md`. Your local quizzes therefore stay private by default.

To publish a quiz with your fork, add an allow rule to `.gitignore`:

```gitignore
!/content/quizzes/your-public-quiz.md
```

Source-material folders matching `content/*-docs/` are also ignored and never required by the app.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `A`–`D` or `1`–`4` | Select an answer |
| `←` / `→` | Previous / next question |
| `Ctrl` + `Enter` or `⌘` + `Enter` | Submit the quiz |
| `T` | Toggle light/dark mode |

Shortcuts are disabled while focus is inside a text input or dialog.

## Configuration

Copy `.env.example` to `.env.local`:

```dotenv
DATABASE_URL=./data/markq.db
NEXT_PUBLIC_SITE_URL=https://quiz.example.com
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | No | SQLite path. Defaults to `./data/markq.db`. |
| `NEXT_PUBLIC_SITE_URL` | Production SEO | Public origin used for canonical URLs, Open Graph metadata, and the sitemap. |

When deployed on Vercel, MarkQ also reads `VERCEL_PROJECT_PRODUCTION_URL` automatically if `NEXT_PUBLIC_SITE_URL` is not set.

## SQLite and deployment

MarkQ writes attempts to the SQLite file configured by `DATABASE_URL`. For production, deploy to a server or container with a **persistent volume** mounted for the `data` directory. An ephemeral or read-only filesystem will lose result history or prevent submissions.

Example backup:

```bash
sqlite3 data/markq.db ".backup 'markq-backup.db'"
```

The app can be deployed anywhere that supports Bun/Node-compatible Next.js servers and persistent storage. Build and start it with:

```bash
bun run build
bun run start
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run start` | Run the production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run strict TypeScript checks |
| `bun test` | Run unit tests |
| `bun run db:generate` | Generate a Drizzle migration |
| `bun run db:migrate` | Apply SQLite migrations |
| `bun run quiz:validate` | Validate all Markdown quizzes |

## Architecture and security

```text
content/quizzes/*.md
        │
        ▼
Markdown parser + validator ──► public quiz DTO ──► browser
        │                            (no answers)
        └──► server-side grading ──► SQLite attempt snapshot ──► review UI
```

Correct answers and explanations are removed before quiz data crosses the Server Component boundary. On submission, the server reloads the trusted Markdown source, validates selected question and option IDs, grades the attempt, and saves a review snapshot.

The current MVP intentionally has no authentication. Anyone who can reach a deployment can take quizzes and view its shared attempt history. Add authentication before using MarkQ for private multi-user data.

## AI-assisted quiz authoring

The project includes a `markq-quiz-author` skill for Codex-compatible agents. Example prompt:

```text
Use $markq-quiz-author to create a 20-question quiz about HTTP fundamentals.
```

Structured JSON can also be converted deterministically:

```bash
python3 .agents/skills/markq-quiz-author/scripts/generate_quiz.py --input quiz.json
bun run quiz:validate
```

The generator refuses malformed IDs, duplicate questions, missing explanations, unknown answers, multiline options, and accidental overwrites.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), then run the complete local check before opening a pull request:

```bash
bun run quiz:validate
bun run lint
bun run typecheck
bun test
bun run build
```

MarkQ is released under the [MIT License](LICENSE).
