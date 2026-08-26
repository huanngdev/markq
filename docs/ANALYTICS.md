# Analytics for your own subjects

MarkQ discovers subjects from Markdown knowledge documents. No subject registry, code edit, extra dependency, or database migration is needed when adding a subject.

## Content contract

- Put quizzes in `content/quizzes/*.md` and lessons in `content/knowledge/*.md` (direct children, not subdirectories).
- A knowledge document has one `subject` ID, optional `subjectTitle`, a document `title`, optional `description`, and one or more topic sections.
- Subject and topic IDs use lowercase kebab-case. `all` is reserved as a subject ID for the combined filter.
- A subject may span several knowledge files; use the same `subjectTitle` in each. If omitted, a display title is derived from the ID (legacy `english` and `iq` still work).
- Topic IDs must be globally unique. Prefixing them with the subject ID is recommended, not required.
- Every `## topic-id | Topic title` starts a lesson. Use `###` or deeper headings inside the lesson.
- A quiz question's optional `### Topic` contains exactly one matching topic ID. A quiz can mix subjects because each question is classified through its topic, not through quiz tags or filenames.

## Complete example: add a new subject

Create `content/knowledge/discrete-math.md`:

```md
---
subject: discrete-math
subjectTitle: Discrete Mathematics
title: Sets and counting
description: Short lessons for practice quizzes.
---

## discrete-math-union | Union of sets

### Principle

The union contains every distinct element found in either set.

### Example

For A = {1, 2} and B = {2, 3}, A ∪ B = {1, 2, 3}.

### Common mistake

Do not count the shared element twice. For finite sets,
|A ∪ B| = |A| + |B| − |A ∩ B|.
```

Create `content/quizzes/discrete-math-practice.md`:

```md
---
schemaVersion: 2
id: discrete-math-practice
title: Set operations practice
published: true
visibility: public
---

# Set operations practice

## union-cardinality

### Topic

discrete-math-union

### Question

For A = {1, 2} and B = {2, 3}, how many distinct elements are in A ∪ B?

### Options

- [ ] A. 2
- [ ] B. 3
- [ ] C. 4
- [ ] D. 1

### Answer

B

### Explanation

The union is {1, 2, 3}, which contains three distinct elements.
```

Run `bun run quiz:validate`, take the quiz, and submit it. Analytics adds **Discrete Mathematics** automatically. Incorrect answers create a **Union of sets** knowledge card, which opens the full lesson in its own page. The subject filter also applies to overview totals. Subjects with lessons but no completed answers have an empty state.

## How results are counted

- Results belong to the current guest session; another browser/profile does not automatically share them.
- Only submitted/expired attempts enter analytics; in-progress work does not.
- Linked questions are counted on every completed attempt, including retakes. This is cumulative practice history, not only the latest or best score.
- Unselected questions count as unanswered, not incorrect. Accuracy is correct divided by all linked questions, including unanswered ones.
- Multiple-answer questions use their stored grading outcome. Partially awarded points do not make a question fully correct; Analytics measures question correctness, not weighted points.
- Weak topics have at least one incorrect answer and sort by incorrect count, then lower accuracy. Up to three distinct missed prompts are shown on the lesson page.
- A mixed-subject attempt counts once overall and once within each represented subject. Subject attempt counts therefore need not sum to the overall count.
- Questions without a topic or without a matching knowledge article are not counted. Topic references missing from the knowledge catalog fail CLI validation.
- New attempts snapshot topic IDs. Legacy attempts without IDs use the current quiz/question mapping when available. Keep topic IDs stable: removing a lesson excludes its questions; changing its subject reclassifies those results.

## Workflow for another agent

1. Read the user's source and the [quiz format](../.agents/skills/markq-quiz-author/references/format.md). Do not assume an English/IQ-only catalog.
2. Choose stable subject/topic IDs and a readable subject title. Reuse existing IDs for the same concept, rather than fragmenting statistics.
3. Write substantive knowledge articles and attach `Topic` to questions. Keep answer keys/explanations in the server-side quiz format.
4. If the user requests syllabus coverage, build a source-item → question-ID matrix. Agree on or clearly state the practice-time calculation; do not assume every quiz lasts 30 minutes or requires three questions per topic.
5. Validate content and check a custom subject, an existing subject, a wrong answer, an unanswered question, and an empty subject. Preserve guest ownership.
6. Keep private source material under `local/`. New quiz and knowledge Markdown files are ignored by Git by default. Only explicitly allowlist material the user intends to publish.

The bundled `markq-quiz-author` skill routes here whenever authoring analytics-linked quizzes.

## Troubleshooting

- **No subject filter:** check the knowledge frontmatter, filename extension and validator output. Quiz tags alone do not define a subject.
- **No knowledge card:** complete an attempt with a linked incorrect answer. Correct-only or unanswered-only topics do not create weak-topic cards.
- **Unknown filter URL:** the view falls back to All; invalid identifiers are normalized before navigation.
- **Conflicting labels:** give every document with the same `subject` the same resolved `subjectTitle`.
- **Content absent after cloning:** ignored local files are intentionally not published. Add your own content using the examples above.
