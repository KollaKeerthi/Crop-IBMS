# crop-management

Next.js 16 app with **strict REST APIs and zero server actions** (except NextAuth sign-in/out). Bun is the package manager; Next.js runs on Node.js.

Companion docs you should read **once, on day one**:

- [`STANDARDS.md`](./STANDARDS.md) — engineering rules (27 of them; non-negotiable)
- [`CLAUDE.md`](./CLAUDE.md) — repo orientation + playbooks for common tasks
- [`AGENTS.md`](./AGENTS.md) — review rubric for AI bots
- [`REVIEW.md`](./REVIEW.md) — review rubric for humans

---

## Setup

### 1. Prerequisites

| Tool    | Version | Install                                     |
| ------- | ------- | ------------------------------------------- |
| Bun     | ≥1.3    | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | ≥18     | `brew install node`                         |

### 2. Install deps

```bash
bun install
```

### 3. Create `.env.local`

Copy [`.env.example`](./.env.example) → `.env.local` and fill in real values. You'll need accounts on:

| Service                                                         | What for        | Env vars                                             |
| --------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| [NeonDB](https://console.neon.tech)                             | Postgres        | `DATABASE_URL`, `DATABASE_URL_DIRECT`                |
| [Google Cloud Console](https://console.cloud.google.com)        | OAuth           | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`               |
| [Upstash Redis](https://console.upstash.com)                    | Rate limiting   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| [Gmail App Password](https://myaccount.google.com/apppasswords) | SMTP            | `GMAIL_USER`, `GMAIL_APP_PASSWORD`                   |
| (local)                                                         | NextAuth secret | `AUTH_SECRET=$(openssl rand -base64 32)`             |

Google OAuth redirect URIs to register:

- `http://localhost:3000/api/auth/callback/google` (dev)
- `https://your-domain.com/api/auth/callback/google` (prod)

### 4. Apply DB migrations

```bash
bun run db:migrate     # applies any unapplied drizzle/*.sql against DATABASE_URL_DIRECT
```

The scaffold ships with [`drizzle/0000_init.sql`](./drizzle/) (users, accounts, sessions, verification_tokens, audit_logs). You **don't** need to run `db:generate` on a fresh clone — that's only for when you change `src/db/schema/*.ts`.

> **Migrations in production:** the [`migrate` job in deploy.yml](./.github/workflows/deploy.yml) runs `bunx drizzle-kit migrate` against `DATABASE_URL_DIRECT` **before** the Vercel deploy job. If migrations fail, the deploy is skipped and the previous version stays live. You'll need a `DATABASE_URL_DIRECT` GitHub secret for this to work.

### 5. Run dev server

```bash
bun run dev
```

Open <http://localhost:3000> → it redirects to `/login` → sign in with Google → land on `/dashboard`.

---

## Commands

| Command                         | What                                       |
| ------------------------------- | ------------------------------------------ |
| `bun run dev`                   | Start dev server on `:3000`                |
| `bun run build`                 | Production build                           |
| `bun run start`                 | Run the production build                   |
| `bun run lint`                  | ESLint (`eslint .`)                        |
| `bun run test`                  | Vitest                                     |
| `bun run db:generate`           | Generate migration SQL from schema         |
| `bun run db:migrate`            | Apply pending migrations                   |
| `bun run db:studio`             | Open Drizzle Studio (browse DB in browser) |
| `bun run create-feature <name>` | Scaffold a new feature folder              |
| `bunx tsc --noEmit`             | Typecheck                                  |
| `bunx prettier --write .`       | Format everything                          |
| `bun audit --audit-level=high`  | Security audit                             |

---

## Architecture at a glance

```
src/
  app/
    (auth)/login/              ← public pages
    (platform)/                ← auth-gated UI (PlatformLayout calls auth())
    api/
      auth/[...nextauth]/      ← NextAuth handlers
      v1/<resource>/route.ts   ← versioned REST API — every mutation lives here
      webhooks/<vendor>/       ← signature-verified webhook handlers
      health/                  ← liveness probe
      log/client-error/        ← receives client-side errors
  features/<name>/
    schema.ts                  ← Zod request + response schemas (one source of truth)
    queries.ts                 ← DB reads (used by server components AND handlers)
    mutations.ts               ← DB writes
    handlers.ts                ← Pure business logic: (ctx, input) → output. HTTP-agnostic.
    api.ts                     ← Client-side typed fetch wrappers
    hooks/                     ← React Query hooks wrapping api.ts
    components/                ← Server + client components
    index.ts                   ← Public barrel
  lib/
    api/{errors,response,auth,client}.ts
    {log,audit,rate-limit,email,get-ip,report-client-error,utils}.ts
  db/
    schema/                    ← Drizzle table definitions
    index.ts                   ← Connection pool
  middleware.ts                ← auth gate + IP rate limit on /api/v1/*
  instrumentation.ts           ← startup env check + onRequestError capture
```

### The handler/route split

The core architectural decision: **`handlers.ts` knows nothing about HTTP**.

```ts
// features/farms/handlers.ts — pure
export async function createFarm(ctx: ApiContext, input: CreateFarmInput): Promise<Farm> {
  const farm = await insertFarm(ctx.userId, input);
  if (!farm) throw new ApiError(500, "internal_error", "Could not create farm.");
  await logAudit({ userId: ctx.userId, action: "farm.created", resource: farm.id });
  return farm;
}

// app/api/v1/farms/route.ts — thin HTTP adapter
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json().catch(() => {
      throw new ApiError(400, "bad_request", "Invalid JSON.");
    });
    const parsed = CreateFarmInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(400, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    return apiOk(await createFarm(ctx, parsed.data), 201);
  } catch (err) {
    return apiError(err);
  }
}
```

Why: handlers are unit-testable without HTTP, server components can call them directly (no HTTP roundtrip for SSR), and the same handler can be reused by `/api/v1/farms` and `/api/v1/admin/farms`.

---

## Conventions (the short version)

Full list is in [`STANDARDS.md`](./STANDARDS.md). The ones you'll hit on day one:

### Validation

- Zod is the **only** validation library
- Always `.safeParse()`, never `.parse()`
- Same schema validates the API request **and** the form (zodResolver)
- Validate API responses on the client too via `apiFetch({ responseSchema })`

### Mutations

- **Every mutation goes through `/api/v1/*`** — never a server action
- The only `"use server"` allowed is [`features/auth/actions.ts`](./src/features/auth/actions.ts) (NextAuth sign-in/out)
- Forms use `react-hook-form` + `zodResolver` + `useMutation` — no raw `fetch`, no `useState` form state

### API contract

- Versioned: `/api/v1/*`. Don't edit a published version — breaking changes go to `/v2`.
- Response envelope: success → `{ data: ... }`, error → `{ error: { code, message } }`
- Use `apiOk()` / `apiError()` helpers — never raw `NextResponse.json` for success/error
- HTTP status codes follow conventions: **201** for POST that creates, **204** for DELETE, **404** for resources scoped out

### Auth

- `requireAuth()` is the first line of every protected route handler
- Server components call `auth()` from `@/features/auth`
- Middleware redirects unauthenticated UI requests; `/api/v1/*` returns 401 from the handler

### Data fetching

- Server state goes through **React Query**, not `useState`/`useEffect`
- Server components import from `queries.ts` directly (no HTTP roundtrip for SSR)
- Client components use React Query hooks from `features/<name>/hooks/`
- Mutation hooks invalidate via `onSuccess: () => qc.invalidateQueries(...)`

### Logging

- Pino is the **only** logger; `console.log` is banned server-side
- Context object first, message string second: `log.info({ userId, farmId }, "farms.created")`
- Event name format: `feature.verb`
- Every state-changing handler calls `logAudit(...)` in addition to `log.info`

### Styling

- shadcn components only — never duplicate, extend via `cva` variants
- Component filenames are **kebab-case** (`home-navbar.tsx`, not `HomeNavbar.tsx`)
- No hardcoded colors — use semantic tokens (`text-muted-foreground`, not `text-gray-500`)
- No hardcoded `px` — use the Tailwind scale (`p-3.5`, not `p-[14px]`)
- `page.tsx` and `layout.tsx` files **never** use `"use client"` — push interactivity into a child

### Commits

Enforced by `.husky/commit-msg`:

```
type: description

types: feat, fix, docs, style, refactor, test, chore, perf
```

---

## Pre-launch TODO list

These are deliberately left as stubs in the scaffold — fill them in **once the product is fully built and you know what it is**, not now. Each file has inline TODO comments explaining what to add.

| File                                         | What's missing                                       | When to do it                              |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| [`src/app/layout.tsx`](./src/app/layout.tsx) | Real `description`, OG image, Twitter image, favicon | Before launch — once you have brand + copy |
| [`src/app/sitemap.ts`](./src/app/sitemap.ts) | Real public routes (static + dynamic from DB)        | Before submitting to Google Search Console |
| [`src/app/robots.ts`](./src/app/robots.ts)   | Real `disallow` list matching your private routes    | Before launch — review every new route     |
| [`public/`](./public/)                       | Empty. Drop favicon / OG images here.                | When you have brand assets                 |

The scaffold also has **no root-level `loading.tsx`** (`src/app/loading.tsx`) on purpose — the only loading state is on the authenticated platform shell ([`src/app/(platform)/loading.tsx`](<./src/app/(platform)/loading.tsx>)). Add a root one only if you build a slow public landing route.

---

## Adding a feature

```bash
bun run create-feature farms --singular Farm
```

This copies `src/features/_template/` → `src/features/farms/`, replacing `things`/`Thing`/`Things` with `farms`/`Farm`/`Farms`. It prints the next steps:

1. Define the table in [`src/db/schema/farms.ts`](./src/db/schema/) and re-export from `src/db/schema/index.ts`
2. Extend `AuditAction` in [`src/lib/audit.ts`](./src/lib/audit.ts) with the new actions (`"farm.created"`, etc.)
3. Create HTTP routes at `src/app/api/v1/farms/route.ts` and `[id]/route.ts` (thin adapters around your handlers)
4. Build out components under `src/features/farms/components/`
5. `bun run db:generate && bun run db:migrate`
6. `bunx tsc --noEmit && bun run test`

---

## Migrations

The full playbook is in [`CLAUDE.md`](./CLAUDE.md#add-a-db-column-or-table); the day-one summary:

| Action                                          | Command               | Notes                                                                                        |
| ----------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| Apply pending migrations locally                | `bun run db:migrate`  | Reads `DATABASE_URL_DIRECT` (non-pooled)                                                     |
| Generate a new migration after editing a schema | `bun run db:generate` | Creates `drizzle/NNNN_*.sql` + updates `drizzle/meta/`. Commit both.                         |
| Browse the DB                                   | `bun run db:studio`   | Drizzle Studio in the browser                                                                |
| Apply in production                             | (automatic)           | The `migrate` job in [`deploy.yml`](./.github/workflows/deploy.yml) runs before every deploy |

**Rolling back a bad migration** — Drizzle is **forward-only**; there's no `db:rollback`. Three paths:

1. **Roll forward** — write a new migration that reverses the broken change. Only option that's safe under concurrent writes.
2. **Manual SQL hotfix** via `bun run db:studio` or `psql` — only if no new writes have happened yet, then capture the fix in a new migration.
3. **Neon point-in-time restore** — for catastrophic data loss only. Console → Branches → restore at timestamp → promote.

**Never edit a migration that's already been applied** somewhere — write a new one that corrects it.

⚠️ **Adding `NOT NULL` to a populated table without a default fails on deploy.** Three-step pattern: nullable column → backfill → `SET NOT NULL`.

---

## Testing

```bash
bun run test                  # all tests
bunx vitest                   # watch mode
bunx vitest path/to/file      # one file
```

Mock builders live in [`src/test/mocks/`](./src/test/mocks/):

- `buildApiContext({ userId })` — for handler tests
- `buildSession(...)` — for component tests that need a Session
- `buildSelectChain` / `buildInsertChain` / `buildUpdateChain` / `buildDeleteChain` — chainable Drizzle mocks

**Minimum 3 cases per handler:** happy path, validation-fail, not-found.

---

## Pre-commit & pre-push hooks

Husky runs these automatically:

| Hook         | What                                                       |
| ------------ | ---------------------------------------------------------- |
| `commit-msg` | Enforces conventional commit format                        |
| `pre-commit` | `prettier --write` on staged files + `eslint .`            |
| `pre-push`   | Lint + format check + `tsc --noEmit` + tests + `bun audit` |

To bypass in an emergency, use `git commit --no-verify` — but **don't push that way**; CI will catch it.

---

## Deployment

### Vercel (recommended)

One-time setup:

```bash
vercel link                                  # creates .vercel/project.json
cat .vercel/project.json                     # grab projectId + orgId
```

Then add three GitHub repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. The [deploy workflow](./.github/workflows/deploy.yml) handles the rest on every push to `main`.

[`vercel.json`](./vercel.json) disables Vercel's auto-git deploy — only the GitHub Action deploys, so it stays in lockstep with CI.

### Docker (for non-Vercel hosts)

```bash
docker build \
  --build-arg DATABASE_URL=... \
  --build-arg AUTH_SECRET=... \
  --build-arg AUTH_GOOGLE_ID=... \
  --build-arg AUTH_GOOGLE_SECRET=... \
  --build-arg NEXT_PUBLIC_APP_URL=... \
  --build-arg UPSTASH_REDIS_REST_URL=... \
  --build-arg UPSTASH_REDIS_REST_TOKEN=... \
  -t crop-management .

docker run -p 3000:3000 --env-file .env.production crop-management
```

---

## CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on every push, in parallel:

- `lint` — `eslint .`
- `format` — `prettier --check`
- `typecheck` — `tsc --noEmit`
- `audit` — `bun audit --audit-level=high`
- `test` — `vitest run --passWithNoTests`
- `build` — blocks until the above five pass

---

## Troubleshooting

**`DATABASE_URL is not set`** — copy `.env.example` to `.env.local`. Migrations use `DATABASE_URL_DIRECT`; the app uses `DATABASE_URL` (pooled).

**Sign-in redirects but stays on `/login`** — check `AUTH_SECRET` is set and the Google OAuth redirect URI matches `http://localhost:3000/api/auth/callback/google` exactly.

**`Redis.fromEnv() is not configured`** — middleware imports rate-limit at startup; you need real `UPSTASH_REDIS_REST_URL` / `_TOKEN` values even in dev. Free tier is enough.

**Typecheck fails on `_template`** — it's excluded in [`tsconfig.json`](./tsconfig.json). The template references a `things` table that only exists after you scaffold a feature.

**`next lint` fails with "Invalid project directory"** — Next 16 removed `next lint`. Use `bunx eslint .` or `bun run lint`.
