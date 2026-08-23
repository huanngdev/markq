---
name: markq-quiz-author
description: Create, convert, repair, or validate single-answer Markdown quizzes for the MarkQ app. Use when a user wants quiz content that can be placed in content/quizzes and loaded by MarkQ; do not use for changing the app's parser or supporting other quiz formats.
---

# MarkQ Quiz Author

Produce a `.md` file that MarkQ accepts without manual cleanup.

## Workflow

1. Read [references/format.md](references/format.md) before creating or repairing a quiz.
2. Preserve the user's wording, language, difficulty, answer choices, correct answer, and explanation. Do not invent factual answers when the source is ambiguous; ask for the missing answer or flag the assumption.
3. For structured question data, prefer the deterministic generator:

   ```bash
   python3 .agents/skills/markq-quiz-author/scripts/generate_quiz.py --input quiz.json
   ```

   It writes `content/quizzes/<quiz-id>.md` by default. Pass `--output <path>` for another location and `--force` only when the user authorized replacing an existing file.
4. For direct authoring, copy [assets/quiz-template.md](assets/quiz-template.md), replace every placeholder, and add or remove complete question blocks as needed.
5. From the MarkQ repository root, run `bun run quiz:validate`. Fix every error involving the new or edited file before handing it off.

## Invariants

- Use stable, unique kebab-case IDs for the quiz and every question. Do not change an existing ID after attempts may have been stored unless the user explicitly wants a new identity.
- Include exactly these level-3 sections for every question: `Question`, `Options`, `Answer`, `Explanation`.
- Create at least two options. Keep each option on one line in the form `- [ ] A. Content`; option IDs must be unique within the question.
- Put exactly one option ID in `Answer`, and ensure it exists in `Options`.
- Provide a useful explanation, not only a repetition of the answer. Markdown is allowed in prompts, option text, and explanations, but option text stays on one source line.
- Set `published: true` only when the quiz is ready to appear in the app.
- Do not add answer markers such as `[x]` to the option list. The correct answer belongs only in the `Answer` section.
