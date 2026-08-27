# MarkQ scaling architecture

MarkQ now scales feature depth without coupling quiz UI to storage or grading. The supported request path is:

```text
Markdown v1/v2
  → parser + normalized Quiz domain
  → start/resume application use case
  → AttemptRepository port
  → SQLite adapter
  → safe workspace DTO
  → feature hook
  → presentational UI
```

## Implemented capabilities

- Versioned Markdown with legacy v1 compatibility.
- Single-select and multi-select questions, per-question points, exact/partial scoring, and penalties.
- Time limits with server-issued deadlines and configurable auto-submit/expired behavior.
- Persisted question and option shuffling, free/sequential navigation, unanswered policy, passing score, review policy, flags, attempt limits, autosave, and resume.
- HTTP-only guest ownership so attempt history is isolated per browser session.
- Public, unlisted, and private visibility.
- Protected Markdown content editor, atomic writes, health reporting, and migration coverage.
- Topic snapshots, per-subject analytics, weak-topic ranking, and Markdown knowledge articles linked to quiz questions.

## Extension points

### Account authentication

Replace `src/lib/auth/session.ts` with an SSO/account adapter that returns a stable user ID. Application use cases already require an owner ID for every attempt; no grading or UI rewrite is needed.

### PostgreSQL or remote storage

Implement `AttemptRepository` from `src/lib/attempts/repository-port.ts`, then replace the dependency in `server-attempt-service.ts`. Preserve optimistic version checks and transaction boundaries.

### Large quiz catalogs

The filesystem repository currently reparses Markdown per request. For hundreds of quizzes, add a build-time content index keyed by file hash. Keep answer keys in the server-only artifact and generate public summaries separately.

### Analytics and knowledge content

Question topics are copied into attempt snapshots, so historical analytics remain stable after a quiz file changes. Knowledge articles live in `content/knowledge/` and are joined by their kebab-case topic ID. For larger datasets, move aggregation behind the analytics repository boundary and precompute per-user topic counters; keep knowledge Markdown as independently deployable content.

Subjects and display titles are discovered from knowledge frontmatter, with no fixed subject enum. Follow [ANALYTICS.md](ANALYTICS.md) to add a domain using content alone. Keep topic IDs and subject assignments stable; legacy attempts use a current-quiz fallback when no topic snapshot exists.

### Horizontal deployment

SQLite requires a persistent volume and is best for one application writer. Multiple instances should use a shared transactional database or a single-writer SQLite service. Session identity is already stateless in an HTTP-only cookie, so only the repository adapter changes.

### High-stakes assessments

Add named authentication, audit events, rate limits, server-side proctoring policies, and a signed immutable quiz version. Guest sessions and browser timers are suitable for study tools, not identity verification.

## Invariants to preserve

- Active workspace DTOs never expose correct answers or explanations.
- Deadlines, grading, attempt limits, ownership, and review access remain server-authoritative.
- Submission stays idempotent and snapshots remain reviewable after source edits.
- Analytics only includes submitted or expired attempts and never treats an unanswered question as an incorrect answer.
- UI components do not fetch or own workflow state; hooks coordinate client behavior.
- Every new setting has a normalized default, parser validation, snapshot representation, domain behavior, UI state, and test.
