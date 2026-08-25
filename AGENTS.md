<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MarkQ engineering rules

All TypeScript and React changes must follow [docs/TYPESCRIPT_RULES.md](docs/TYPESCRIPT_RULES.md).

In particular:

- Keep business rules in pure domain modules.
- Keep server orchestration in application services and route handlers thin.
- Keep client state, effects, shortcuts, and network orchestration in feature hooks.
- Keep feature UI components presentational: props in, events out.
- Validate every external boundary and never expose answer keys in public quiz DTOs.
