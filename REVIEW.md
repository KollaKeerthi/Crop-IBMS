# REVIEW.md

Code-review rubric. Applies to humans and bots.

Read [`CLAUDE.md`](./CLAUDE.md) and [`STANDARDS.md`](./STANDARDS.md) first.

---

## Severity rubric

### Block-merge

- **`"use server"` outside `features/auth/actions.ts`** — REST-only architecture; mutations belong in `/api/v1/*`
- **Auth bypass** in route handlers — missing `requireAuth()`
- **Webhook signature missing** — Stripe / Slack / GitHub
- **Module-load throws for env vars** — breaks `next build`
- **`NOT NULL` on a populated table without default** — fails on deploy
- **FK violations** — non-user UUIDs in `audit_logs.user_id`
- **`apiOk` / `apiError` bypassed** — response envelope broken
- **Missing try/catch + `apiError(err)` in route handlers** — unhandled exceptions leak stacks
- **`handlers.ts` importing HTTP types** (`Request`, `NextResponse`, `next/headers`) — handlers must stay pure
- **`"use client"` on a `page.tsx` / `layout.tsx`** — kills SSR/SEO

### Discuss

- Missing `revalidateQueries` on mutation success — leaves stale React Query cache
- Missing `logAudit` on a state-changing handler
- New `AuditAction` not added to the union
- Wrong HTTP status code (e.g. 200 for POST that created — should be 201)
- Hardcoded color/px values — use tokens / Tailwind scale
- Component filename in PascalCase — should be kebab-case
- `useState` + `useEffect` data fetching — should be React Query
- Form without `react-hook-form` + `zodResolver`
- Native `confirm()` / `alert()` — use shadcn `Dialog`
- Duplicate shadcn components — extend via `cva`

### Skip

- Auto-fixable style nits
- Theoretical race conditions
- Missing tests for trivial helpers
- DoS / resource exhaustion concerns
- Outdated transitive deps

### Files to skip entirely

| Path                                                  | Reason             |
| ----------------------------------------------------- | ------------------ |
| `**/drizzle/0*.sql`, `**/drizzle/meta/**`             | Generated          |
| `bun.lock`, `package-lock.json`                       | Lockfiles          |
| `**/*.test.ts(x)`                                     | Reviewed by humans |
| `**/_template/**`                                     | Scaffolding source |
| `STANDARDS.md`, `CLAUDE.md`, `REVIEW.md`, `AGENTS.md` | Context            |
| `**/.next/**`, `**/dist/**`, `**/build/**`            | Build artifacts    |

---

## Migration / schema PR rubric

### Block-merge

- **Schema and SQL drift** — `src/db/schema/<table>.ts` doesn't match the generated SQL
- **`NOT NULL` added without default** on a populated table
- **FK to a table that doesn't exist yet** in the migration order
- **Dropping a column / table referenced by live code** — grep for it
- **Renaming a column without a data-preserving plan**

### Discuss

- Enum value added to one side but not the other (TS literal type vs Postgres enum)
- Index on a column without a query that needs it
- Unexpected statements in the generated migration

---

## API contract PR rubric

When a PR touches `/api/v1/`:

### Block-merge

- **Changing the response shape of a published endpoint** — that's a v2, not a v1 patch
- **Changing the request body shape required by a published endpoint** — same; goes in v2
- **Removing an endpoint** — deprecate first, remove later
- **Wrong status code** — POST that creates must return 201, not 200; DELETE returns 204

### Discuss

- Adding an optional field to a response — fine, but document
- Adding a new endpoint under an existing resource — fine
- Loosening request validation — usually fine but worth a sanity check

---

## Confidence calibration

- Read the file, not just the diff
- Don't recommend renames or refactors that aren't behavior changes
- Don't recommend components that don't exist
- Match existing patterns
- If unsure, don't flag unless block-merge or discuss
