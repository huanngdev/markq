# MarkQ TypeScript and Architecture Rules

These rules are the source of truth for application code under `src/`, scripts, migrations, and tests. Generated shadcn/ui components may keep their upstream style unless MarkQ-specific behavior is added.

## 1. Compiler baseline

- TypeScript runs in `strict` mode.
- Do not add `any`, `@ts-ignore`, unchecked casts, or non-null assertions to make an error disappear.
- Prefer `unknown` at untrusted boundaries and narrow it with Zod or a type guard.
- Model absence explicitly with `null` or an optional property; do not use empty strings as hidden state.
- Use discriminated unions for lifecycle states and mutually exclusive behavior.
- Use exhaustive `switch` statements for domain unions. An unhandled state is a compile error.
- Export types close to the domain that owns them. Do not create a generic global `types.ts` dumping ground.

## 2. Module boundaries

MarkQ uses four layers:

```text
UI components → feature hooks → application services → domain + repository ports
                                             infrastructure adapters ──┘
```

### Domain

- Contains pure types, validation-independent invariants, grading, ordering, scoring, and attempt state transitions.
- Has no React, Next.js, database, filesystem, clock, random generator, or network imports.
- Receives time and randomness as values or small interfaces when deterministic behavior matters.
- Every domain rule has focused unit tests.

### Application

- Implements use cases such as start, resume, save, submit, expire, and review an attempt.
- Coordinates domain functions and repository ports.
- Performs authorization for every user-owned resource.
- Does not render UI or parse HTTP requests.

### Infrastructure

- Implements repository ports for SQLite, filesystem Markdown, and future database adapters.
- Converts storage rows into domain models at the boundary.
- Keeps SQL/Drizzle details out of application and UI modules.

### UI and hooks

- Feature UI components are presentational: serializable props in, semantic events out.
- UI components may format display text and derive CSS state, but may not fetch, mutate storage, grade, authorize, manage timers, or own workflow transitions.
- Client state, effects, keyboard shortcuts, browser lifecycle, and API orchestration live in feature hooks under `src/features/<feature>/hooks`.
- Hooks return a named view model and named commands. Avoid returning positional tuples for feature workflows.
- Server Components load data and compose UI. Interactive leaf components define the smallest practical `"use client"` boundary.

## 3. Functions and data flow

- Prefer small named functions with one reason to change.
- Pass objects when a function needs more than two related parameters.
- Keep side effects at module boundaries; keep transformations pure.
- Do not mutate arguments or exported shared state.
- Use early returns to keep the happy path visible.
- Do not catch errors unless adding context, translating a boundary error, or recovering.
- Domain errors use typed error classes or discriminated results. HTTP status selection belongs to the HTTP boundary.
- Do not read `process.env`, `Date.now()`, `crypto`, or storage inside pure domain functions.

## 4. Runtime validation

- Validate HTTP bodies, URL params, environment variables, Markdown frontmatter, JSON columns, and imported files at their boundary.
- Infer TypeScript types from stable Zod schemas when the schema is the runtime source of truth.
- Never trust client-calculated scores, deadlines, ownership, answer correctness, or shuffled order.
- Error messages exposed to clients must be actionable but must not leak answer keys, SQL, paths, or secrets.

## 5. Quiz and attempt invariants

- Quiz, question, and option IDs are stable identifiers, never array indexes.
- Public quiz DTOs never contain correct answers or explanations.
- An attempt snapshots question text, displayed option order, correct answers, scoring settings, and explanations at submission.
- Timed attempts use a server-issued `expiresAt`; the browser timer is display-only.
- Submission is idempotent. A submitted or expired attempt cannot be graded twice.
- Shuffling occurs once per attempt and its resulting order is persisted.
- Legacy schema and Markdown formats remain readable through explicit compatibility code and migration tests.

## 6. React rules

- Do not derive state in an effect when it can be derived during render.
- Use functional state updates when the next value depends on the previous value.
- Register each global event listener once and keep the current handler through `useEffectEvent` or a ref.
- Do not memoize trivial expressions. Memoize only measured expensive work or required stable identities.
- Every control has native semantics, an accessible name, keyboard behavior, and a visible focus state.
- Loading, empty, error, disabled, expired, and offline states are explicit UI states.
- Use Server Components for database/filesystem reads and Client Components only for interaction.

## 7. Naming and file structure

- Files and directories use kebab-case.
- React components and exported types use PascalCase.
- Functions, hooks, and variables use camelCase. Hooks start with `use`.
- Boolean names start with `is`, `has`, `can`, `should`, or `was`.
- Event props start with `on`; local handlers start with `handle`.
- Zod schemas end with `Schema`; repository interfaces end with `Repository`.
- Prefer feature folders over type-based dumping grounds once a feature has UI, hooks, and application logic.

## 8. Imports and exports

- Import directly from the owning module; avoid broad barrel files that hide client/server boundaries.
- Use `import type` for type-only dependencies.
- A `server-only` module must never be reachable from a Client Component.
- Avoid default exports except where Next.js file conventions require them.
- Avoid circular feature dependencies. Shared domain code must have a clear owner.

## 9. Tests and verification

Every behavior change includes the narrowest useful test:

- Domain rules: unit tests.
- Parser and compatibility: fixture-driven tests.
- Repositories and migrations: temporary SQLite integration tests.
- Route contracts: request/response tests where meaningful.
- Hooks and critical user workflows: browser smoke tests.

Before handoff, run:

```bash
bun run quiz:validate
bun run lint
bun run typecheck
bun test
bun run build
```

## 10. Definition of clean code

Code is clean when a new contributor can answer these questions from file placement and types alone:

1. Where is the business rule defined?
2. Where is the side effect performed?
3. Which boundary validates the input?
4. Which user is authorized to perform the action?
5. Which test proves the behavior?

If one function or component answers several of these at once, split it at the boundary rather than adding comments to explain the coupling.
