# MarkQ quiz format

## Frontmatter

Every quiz begins with YAML frontmatter:

```yaml
---
id: javascript-basic
title: JavaScript Fundamentals
description: Test foundational JavaScript knowledge.
tags:
  - javascript
  - beginner
published: true
---
```

- `id`: required, unique across files, kebab-case (`a-z`, `0-9`, hyphens).
- `title`: required, non-empty.
- `description`: optional text; use an empty string if no description is available.
- `tags`: optional list of non-empty strings.
- `published`: boolean; defaults to `true` when omitted, but write it explicitly.

The level-1 title after frontmatter is for Obsidian readability. Keep it equal to `title`.

## Question block

Each question starts with a unique level-2 kebab-case ID and contains four required level-3 sections in this order:

```md
## q1

### Question

Question content supports **Markdown**, code blocks, and images.

### Options

- [ ] A. First option
- [ ] B. Second option
- [ ] C. Third option
- [ ] D. Fourth option

### Answer

B

### Explanation

Explain why B is correct and, when useful, why the other options are incorrect.
```

MarkQ MVP supports exactly one correct answer. Two or more options are allowed; four is a convention, not a requirement. Option IDs may contain ASCII letters or digits and are normalized to uppercase. Each option's Markdown source must remain on one line.

## JSON input for the generator

The generator accepts UTF-8 JSON shaped like this:

```json
{
  "id": "javascript-basic",
  "title": "JavaScript Fundamentals",
  "description": "Test foundational knowledge.",
  "tags": ["javascript", "beginner"],
  "published": true,
  "questions": [
    {
      "id": "q1",
      "prompt": "What does `typeof null` return?",
      "options": [
        { "id": "A", "content": "`null`" },
        { "id": "B", "content": "`object`" }
      ],
      "answer": "B",
      "explanation": "This is historical JavaScript behavior."
    }
  ]
}
```

Run:

```bash
python3 .agents/skills/markq-quiz-author/scripts/generate_quiz.py --input quiz.json
bun run quiz:validate
```

The script refuses invalid IDs, duplicate IDs, missing explanations, multiline option text, unknown answers, and accidental overwrite.
