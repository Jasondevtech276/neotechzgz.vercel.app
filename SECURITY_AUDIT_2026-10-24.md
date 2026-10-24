# NeoTech ZGZ — security audit and release gate (2026-10-24)

## Scope and evidence

Reviewed the canonical GitHub repository, Vercel project `neotechzgz`, canonical Supabase project `qkzmpxyefuqdhyxwfjcw`, available metadata for the legacy Supabase project, and the connected Stripe account. Secret values were not intentionally displayed or copied into repository files. The production database least-privilege migration has since been applied; the live Stripe endpoints and production secrets have not been rotated or disabled in this workstream.

## Verified completed changes

- Canonical Supabase migration version `20261024133121`, name `least_privilege_public_tables_20261024150000`, is recorded as applied.
- Post-migration catalog checks confirmed no direct table privileges for `anon` on the five reviewed application tables, narrowed `authenticated` grants, and the expected own-quote/admin-read RLS policies.
- The account-retention cron schedule remains `0 3 * * *`; its code still requires `CRON_SECRET` and fails closed when the secret is missing or invalid.
- The Cloudflare zone for `neotechzgz.eu.org` was removed. Registrar-side EU.org delegation is outside the available Cloudflare control surface and remains unverified.
- The isolated dependency workspace used `npm ci`, `npm audit --audit-level=high` (0 advisories), `npm test` (11 passing), and `npm run build` (success) after pinning Next.js to `16.4.3`, overriding DOMPurify to `3.4.17`, and simplifying the test script to `node --test`.
- GitHub Actions Security build gate succeeded for branch commit `27d693d613ee16e45d2bf2d9f515d472af8d00dd`. This is a branch/preview validation, not evidence of production deployment.

## Least-privilege database migration

File: `supabase/migrations/20261024133121_least_privilege_public_tables_20261024150000.sql`.

The migration removes broad direct grants for `anon` and `authenticated` on `profiles`, `payments`, `quotes`, `quote_status_history`, and `support_tickets`; restores only intended authenticated operations; adds own-quote SELECT and administrator-only SELECT policies for payments/tickets; and revokes default client privileges on future tables/sequences created by `postgres` in `public`. The migration is applied to the canonical project. Do not apply it to the alternate Supabase project without confirming that project's purpose and access model.

## Outstanding critical issues

### Secrets / Vercel

- Vercel metadata flags these encrypted variables as `readable-secret`: `CRON_SECRET`, `EMAILJS_PRIVATE_KEY`, `STRIPE_MCP_KEY`, `STRIPE_SECRET_KEY`, `VERCEL_AI_GATEWAY_KEY`, `REDIS_URL`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `SUPABASE_SECRET_KEY_2`, `SUPABASE_SECRET_KEY`, and `SERVICE_ROLE`.
- Several production variable names with the `NEXT_PUBLIC_` prefix suggest server-only credentials (including PostgreSQL password/URL and a Supabase JWT secret), and there are duplicated/malformed Supabase aliases. This does not alone prove browser-bundle exposure. Code references and deployed artifacts must be checked before removing variables.
- Secret rotation remains pending. Rotate provider-issued Stripe, Supabase, Redis/KV and EmailJS credentials at their source, coordinate consumers, then update Vercel and redeploy. Do not replace provider-issued tokens with random strings.
- Rotate `CRON_SECRET` only through a staged overlap and redeployment sequence so the existing scheduled account-retention job is not interrupted.

### Stripe

- Three live endpoints were previously inventoried: two Vercel webhook endpoint configurations point to `/api/stripe/webhook`; another points to a Supabase Edge Function in a separate project.
- The Vercel handler verifies a signature, upserts completed Checkout sessions by `stripe_session_id`, and returns 500 when persistence fails so Stripe can retry. However, there is no demonstrated event-ID deduplication ledger, and invoice/subscription updates need replay/out-of-order tests.
- The two endpoints to the same URL may have distinct signing secrets; a single `STRIPE_WEBHOOK_SECRET` cannot be assumed to validate both. Delivery history and the external Edge Function implementation are not available through this repository connection.
- No live endpoint was disabled. Do not consolidate until endpoint-specific signing secrets, delivered event coverage, retry history, idempotency, and reconciliation are verified.
- The connected Stripe context exposed here is live mode. No end-to-end test-mode payment was executed through the available Stripe connector.

### GitHub / deployment

- The branch protection API returned 403 for the detailed rules endpoint, but branch metadata reported `protected: true` and the workflow status check is active. Required review count and all advanced rule settings still need independent verification.
- The latest verified production alias metadata pointed to commit `87e9a566c108e3199701b094564576540cf7e341`; the security branch preview is not production.
- Re-check the public HTTP response, deployment commit, alias mapping, and core flows after the approved merge and production deployment.

### Legal / commercial readiness

The technical review does not establish legal formation or tax registration. The service owner must complete any required Spanish tax/social-security registrations and confirm the legal identity, contact address, pricing/tax display, cancellation, withdrawal and early-performance consent wording, privacy/cookie disclosures, retention, and B2B/B2C VAT handling with a qualified Spanish adviser before public paid sales. International selling requires a scoped market-by-market review; global legal compliance is not certified here.

## Release gate

Do not describe the system as perfectly secure or legally certified. Do not merge or deploy if the current required GitHub checks are not green. Do not rotate provider-issued secrets without a consumer inventory and rollback sequence, disable Stripe live endpoints without delivery/idempotency evidence, or change the cron schedule.