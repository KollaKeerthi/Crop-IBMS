# CLAUDE.md

Auto-loaded by Claude Code. Companion files:

- [`STANDARDS.md`](./STANDARDS.md) — engineering rules
- [`REVIEW.md`](./REVIEW.md) — review rubric
- [`AGENTS.md`](./AGENTS.md) — AI review bot entry point

---

## This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## Never run git commands — show them instead

Never execute `git add`, `git commit`, `git push`, or any mutating git command. Paste the exact commands for the user to run instead.

---

## Repo orientation

Next.js 16 app with **strict REST APIs and zero server actions** (except the NextAuth sign-in/sign-out forms). Bun = package manager, Node.js = runtime.

| Surface                              | Where                                    |
| ------------------------------------ | ---------------------------------------- |
| Authenticated UI                     | `src/app/(platform)/`                    |
| Public pages (login, terms, privacy) | `src/app/(auth)/`, `src/app/terms`, etc. |
| **Versioned REST API**               | `src/app/api/v1/<resource>/route.ts`     |
| Webhooks                             | `src/app/api/webhooks/<vendor>/route.ts` |
| Business logic                       | `src/features/<name>/handlers.ts`        |
| DB reads                             | `src/features/<name>/queries.ts`         |
| DB writes                            | `src/features/<name>/mutations.ts`       |
| Shared utilities                     | `src/lib/`                               |
| DB schema                            | `src/db/schema/`                         |

---

## Canonical feature reference

Every feature follows:

```
src/features/<name>/
  schema.ts       — Zod request + response schemas
  queries.ts      — DB reads
  mutations.ts    — DB writes
  handlers.ts     — (ctx, input) → output; pure business logic
  api.ts          — Client-side fetch wrappers
  hooks/          — React Query hooks
  index.ts        — public barrel
  components/
```

**The handler/route split is the core architectural decision:**

- `handlers.ts` is HTTP-agnostic — easy to unit-test, reusable across routes
- `route.ts` is the HTTP adapter — parses + auths + validates + calls handler

Cross-feature imports go through `index.ts`. Never deep-import.

---

## How to... (playbooks)

### Add a new feature

```bash
bun run create-feature <kebab-name>
```

Then follow the printed steps: define the DB table, extend `AuditAction`, build the route handlers under `/api/v1/<name>/`, build components.

### Add a new API endpoint

1. Define request + response schemas in `feature/schema.ts`
2. Write the handler in `feature/handlers.ts` — accepts `(ctx, input)`, returns data or throws `ApiError`
3. Create `src/app/api/v1/<resource>/route.ts` — the HTTP adapter
4. Add the typed fetch wrapper in `feature/api.ts`
5. Add a React Query hook in `feature/hooks/`
6. Test: handler tests cover business logic, hook tests cover client behavior

### Add a server action

**Don't.** This scaffold has exactly one server action surface — `features/auth/actions.ts` for sign-in/sign-out. Every other mutation goes through `/api/v1/*`. If you find yourself wanting a server action, you want a route handler instead.

### Add a DB column or table

1. Edit `src/db/schema/<table>.ts` (and re-export from `src/db/schema/index.ts` if new)
2. `bun run db:generate` — creates `drizzle/NNNN_<name>.sql` + updates `drizzle/meta/`
3. **Read the generated SQL.** Drizzle is good but not perfect — verify column types, FK actions, and that nothing surprising got dropped.
4. `bun run db:migrate` to apply locally against `DATABASE_URL_DIRECT`
5. Commit **both** `drizzle/NNNN_*.sql` and `drizzle/meta/` — they're paired

In production: the `migrate` job in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs `bunx drizzle-kit migrate` against `DATABASE_URL_DIRECT` before the deploy job starts. If migrations fail, the deploy is skipped and the previous version stays live.

⚠️ **Adding `NOT NULL` to a populated table without a default fails on deploy.** Three-step pattern instead:

1. Ship migration 1: add the column as **nullable**
2. Ship a backfill (one-off script or a chunked job)
3. Ship migration 2: `ALTER COLUMN ... SET NOT NULL`

### Rolling back a bad migration

Drizzle generates **forward-only** migrations — there's no `db:rollback` and no `down.sql`. Three recovery paths, in order of preference:

1. **Roll forward.** Write a new migration that reverses the broken change (`DROP COLUMN`, restore old default, etc.) and ship that. This is the only option that's safe under concurrent writes.
2. **Manual SQL hotfix** via `bun run db:studio` or `psql` — _only_ if no new writes have happened against the broken schema. Then write a new migration that captures what you did, so dev/staging match.
3. **Neon point-in-time restore** — for catastrophic data loss only, when you can afford to lose minutes of writes. Console → Project → Branches → restore a new branch at a timestamp, then promote it.

When the production migrate job fails: the deploy was skipped, so prod is still running the old code against the old schema. You can fix the migration SQL, push again, and retry. Never edit a migration file that's already been applied somewhere — write a new one that corrects it.

### Add an env var

1. Read it via a lazy memoized getter — never top-level `throw` on missing env
2. Add to `.env.example`
3. Add to the `REQUIRED` list in `src/instrumentation.ts`
4. Add to CI workflow's `env:` block

### Add a webhook handler

1. Route at `src/app/api/webhooks/<vendor>/route.ts` with `export const runtime = "nodejs"`
2. Verify signature against the **raw body** before parsing JSON
3. Make the handler idempotent (webhooks retry)
4. Skip rate limiting for webhook routes — signature verification is the gate

---

## Gotchas (non-obvious)

**`page.tsx` files never use `"use client"`.** Kills SSR/SEO. Extract interactivity into a child component.

**Server components import from `queries.ts` directly, not via the API.** No HTTP roundtrip for SSR. Client components fetch via React Query hooks.

**`handlers.ts` files cannot import `next/headers` or `Request`.** Stay HTTP-agnostic so they're testable without HTTP. Auth context flows in via `ApiContext`.

**API versioning is one-way.** Don't edit `/api/v1/*` once it's published. New breaking changes get a new version directory.

**Response envelope is consistent:** success → `{ data: ... }`, error → `{ error: { code, message } }`. The `apiOk` and `apiError` helpers enforce this — never bypass them.

---

## Commands

| Command                         | What                      |
| ------------------------------- | ------------------------- |
| `bun install`                   | Install deps              |
| `bun run dev`                   | Start dev server on :3000 |
| `bun run build`                 | Production build          |
| `bun run create-feature <name>` | Scaffold a new feature    |
| `bunx vitest run`               | Run tests                 |
| `bunx tsc --noEmit`             | Typecheck                 |
| `bunx eslint .`                 | ESLint                    |
| `bunx drizzle-kit generate`     | Generate migration        |
| `bunx drizzle-kit migrate`      | Apply migrations          |
| `bun audit --audit-level=high`  | Security audit            |
