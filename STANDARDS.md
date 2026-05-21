# STANDARDS.md

Engineering rules for this repo. Every code change should satisfy them.

1. **No `any`, no `as` casts on user input** — validate with Zod at every boundary
2. **`safeParse` everywhere, `firstError` for the user message** — never `.parse()`
3. **Every route handler returns `apiOk(data)` or throws `ApiError`** — never raw `NextResponse.json` for success/error responses
4. **`requireAuth()` is the first line of every protected route handler** — before any DB call
5. **`handlers.ts` is HTTP-agnostic** — never imports `Request`, `NextResponse`, or `headers()`. Pure `(ctx, input) → output` shape
6. **No `console.log` server-side** — use `log` from `@/lib/log`
7. **`log.info` + `logAudit` after every state change** — state changes have an audit trail
8. **No top-level `throw` for runtime env vars** — lazy getter pattern only
9. **`"use server"` only in `features/auth/actions.ts`** — every other mutation goes through `/api/v1/*`
10. **API responses follow the envelope** — success: `{ data: ... }`, error: `{ error: { code, message } }`
11. **API routes live under `/api/v1/`** — new breaking changes go to `/api/v2/`, never edit a published version
12. **HTTP status codes follow the convention table** — 201 for POST that creates, 204 for DELETE, 404 for scoped-out resources
13. **`apiFetch({ responseSchema })` validates every API response client-side** — even your own API, even in dev
14. **Server state goes through React Query, not `useState`/`useEffect`** — `useState` fetching causes race conditions
15. **Commit messages: `type: description`** — enforced by commit-msg hook
16. **Test every handler: happy path + validation-fail + not-found** — minimum 3 cases
17. **Feature folders: `schema → queries → mutations → handlers → api → hooks → index → components`** — no exceptions
18. **Cross-feature imports go through `index.ts`** — never deep-import into another feature
19. **Component filenames are kebab-case** — `home-navbar.tsx`, not `HomeNavbar.tsx`
20. **No hardcoded color values** — semantic tokens only
21. **No hardcoded `px` values** — use Tailwind spacing scale
22. **Use shadcn components, never duplicate them** — extend via `cva` variants
23. **Rate limit every unauthenticated public route by IP** — applied in middleware for `/api/v1/*`; webhooks exempt
24. **`page.tsx` files never use `"use client"`** — kills SSR/SEO; extract interactivity into a child component
25. **Static assets live in `public/`, referenced with absolute paths** — no secrets, no files >1MB
26. **Use `next/image` for raster images and `next/font` for fonts**
27. **Every form uses `react-hook-form` + `zodResolver`** — same Zod schema the route handler validates with; submit via `useMutation`, not raw `fetch`
