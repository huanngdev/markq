# MarkQ quiz format v2

## Frontmatter

```yaml
---
schemaVersion: 2
id: javascript-basic
title: JavaScript Fundamentals
description: Test foundational JavaScript knowledge.
tags:
  - javascript
published: true
visibility: public
settings:
  timeLimitMinutes: 30
  shuffleQuestions: true
  shuffleOptions: true
  navigationMode: free
  allowUnanswered: true
  reviewMode: after-submit
  passingScore: 70
  expireBehavior: auto-submit
  scoringMode: exact
  incorrectPenalty: 0
  attemptsAllowed: null
---
```

- `schemaVersion`: use `2` for new files. Files without it remain compatible as v1.
- `id`: globally unique kebab-case ID; `title` is required.
- `description` and `tags` are optional.
- `published`: whether the file is loaded. `visibility` is `public`, `unlisted`, or `private`; only public quizzes appear in the catalog.
- `timeLimitMinutes`: positive integer up to 1440, or `null`.
- `navigationMode`: `free` or `sequential`.
- `reviewMode`: `after-submit` or `never`.
- `passingScore`: number from 0 through 100, or `null`.
- `expireBehavior`: `auto-submit` or `mark-expired`.
- `scoringMode`: `exact` or `partial`; `incorrectPenalty` is a non-negative point penalty.
- `attemptsAllowed`: positive integer, or `null`.

## Single-answer question

```md
## typeof-null

### Question

What does `typeof null` return?

### Options

- [ ] A. `null`
- [ ] B. `object`

### Answer

B

### Points

1

### Explanation

`typeof null` returns `"object"` because of a historical JavaScript behavior.
```

## Multiple-answer question

```md
## select-primes

### Question

Select every prime number.

### Options

- [ ] A. 2
- [ ] B. 3
- [ ] C. 4

### Answer

- A
- B

### Points

2.5

### Explanation

2 and 3 each have exactly two positive divisors; 4 is composite.
```

Question IDs are unique kebab-case. Option IDs contain ASCII letters or digits and normalize to uppercase. Each option stays on one source line. `Points` is optional, must be positive, and defaults to 1.

## Generator JSON

The JSON mirrors frontmatter. Each question has `id`, `prompt`, `options`, `answer`, `points`, and `explanation`. `answer` is either one string or an array:

```json
{
  "id": "number-basics",
  "title": "Number Basics",
  "published": false,
  "visibility": "private",
  "settings": { "timeLimitMinutes": 20, "shuffleQuestions": true },
  "questions": [
    {
      "id": "select-primes",
      "prompt": "Select every prime number.",
      "options": [
        { "id": "A", "content": "2" },
        { "id": "B", "content": "3" },
        { "id": "C", "content": "4" }
      ],
      "answer": ["A", "B"],
      "points": 2,
      "explanation": "2 and 3 are prime; 4 is composite."
    }
  ]
}
```

Run the generator, then always run `bun run quiz:validate`.
