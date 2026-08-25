---
name: markq-quiz-author
description: Create, convert, repair, or validate versioned single-answer and multiple-answer Markdown quizzes for MarkQ. Use when quiz content should be placed in content/quizzes and loaded by MarkQ; do not use for changing the app parser or supporting unrelated formats.
---

# MarkQ Quiz Author

Produce a `.md` quiz that MarkQ accepts without manual cleanup.

## Workflow

1. Read [references/format.md](references/format.md) completely before authoring or repairing a quiz.
2. Preserve the user's language, wording, difficulty, choices, answers, points, and explanations. Ask when the source does not establish the correct answer.
3. For structured data, prefer the deterministic generator:

   ```bash
   python3 .agents/skills/markq-quiz-author/scripts/generate_quiz.py --input quiz.json
   ```

   It writes `content/quizzes/<quiz-id>.md`. Use `--output` for another path and `--force` only when replacement is authorized.
4. For direct authoring, copy [assets/quiz-template.md](assets/quiz-template.md), replace every placeholder, and add complete question blocks.
5. Run `bun run quiz:validate` from the repository root and fix every reported error before handoff.

## Invariants

- New quizzes use `schemaVersion: 2`; keep stable, unique kebab-case quiz and question IDs.
- Every question has `Question`, `Options`, `Answer`, and `Explanation`; `Points` is optional and defaults to `1`.
- `Topic` is an optional kebab-case knowledge ID. Use it when Analytics should group mistakes and show a matching article from `content/knowledge`.
- Create at least two unique options, each on one source line as `- [ ] A. Content`.
- One correct answer is a bare ID. Multiple correct answers use one list item per ID. Every answer must exist in `Options` and must be unique.
- Never mark the option list with `[x]`; truth belongs only in `Answer`.
- Write a useful explanation. Markdown is allowed in prompts, options, and explanations.
- Use settings intentionally. Do not invent a time limit, penalty, passing score, or attempt limit unless requested.
- Keep unfinished content `published: false` and `visibility: private`.
