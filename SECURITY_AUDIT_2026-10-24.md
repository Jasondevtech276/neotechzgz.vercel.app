# NeoTech ZGZ — security audit checkpoint (2026-10-24)

## Scope and evidence

Read-only inspection of GitHub `main`, the connected Vercel project `neotechzgz`, the canonical Supabase project `qkzmpxyefuqdhyxwfjcw`, the linked legacy Supabase project `hdpikaqxeadqmckmmjfh`, and the live Stripe account metadata. No production database, Stripe, environment-variable, DNS, or deployment changes were made as part of this audit checkpoint.

## Verified state

- GitHub default branch is `main`; current head at audit time: `87e9a566c108e3199701b094564576540cf7e341`.
- Vercel production deployment for that commit is `READY`; the canonical `neotechzgz.vercel.app` alias currently maps to that deployment.
- The canonical Supabase project has five public application tables with RLS enabled.
- The existing policy set has own-row policies for profiles, payments, and support tickets; admin-only policies for quote management; however, `quotes` lacked a user-own-row SELECT policy even though `app/api/account/route.ts` queries a user's quotes using the authenticated client.
- `app/api/admin/overview/route.ts` reads all payments and support tickets through the authenticated client, but the current policy set lacked explicit administrator SELECT policies for those tables.
- The authenticated and anonymous roles have broad table-level DML grants on the five public tables. RLS currently restricts row access, but the grants exceed the operations the application needs. A proposed migration removes broad grants and re-grants only required operations.
- The alternate Supabase project `hdpikaqxeadqmckmmjfh` has `public.quotes` with RLS enabled and no policies returned by the policy catalog query. Do not change it until its relationship to the alternate Vercel project and intended access model is confirmed.
- Vercel environment metadata includes production variables whose names have a `NEXT_PUBLIC_` prefix while suggesting database passwords/JWT signing material, plus duplicate Supabase variable names. This audit did not read or reveal secret values and did not establish that those values were embedded in the current browser bundle. Treat this as a critical configuration finding: verify references, remove unsafe public aliases, rotate any actual secret exposed to clients, and redeploy.
- Stripe live mode has three enabled webhook endpoints: two target the same Vercel webhook URL and one targets a Supabase Edge Function. Do not disable either endpoint until the Edge Function, delivery history, idempotency, and authoritative event processor are reviewed.
- Supabase Auth security advisor reports leaked-password protection disabled on the canonical project. The existing project roadmap says this feature requires a paid plan; this audit did not change the plan or bypass the restriction.
- The legal page itself says certain titular/business-registration and postal-address details require verification. Analytics/ad-tech providers and cookie-consent behavior also need to be compared with actual production configuration before legal compliance can be attested.

## Proposed canonical-database migration

`supabase/migrations/20261024150000_least_privilege_public_tables.sql`:

1. Removes direct table-level privileges from `anon` and `authenticated` on the five application tables.
2. Re-grants authenticated SELECT and only the necessary profile display-name update, quote status update, support-ticket insert, and quote-history insert permissions.
3. Adds own-quote SELECT and administrator SELECT policies for payments and support tickets, matching the existing account/admin API access patterns.
4. Revokes default table/sequence privileges for future application objects created by `postgres` in `public`, so client access is opt-in.

This migration is staged for review only; it has not been applied to production. It must pass a transaction-based SQL verification and application tests before rollout. No change is proposed for the alternate Supabase project until its intended use is confirmed.

## Six previously authorized workstreams

1. Supabase Auth: **partial / pending** — advisor warning remains; other Auth settings and end-to-end flows not fully rechecked.
2. Secret review/rotation: **pending** — unsafe-looking public variable names and duplicate configuration require dependency mapping, rotation sequencing, and a successful redeploy.
3. Stripe webhooks: **pending** — three live endpoints are enabled; duplicates/overlap are not yet resolved.
4. Protect `main`: **reported complete in the prior roadmap, but not independently re-verified** — GitHub integration returned 403 for branch-protection inspection.
5. End-to-end tests in Stripe test mode: **pending** — no test-mode payment flow was run in this audit.
6. DNS/deployment: **partially verified** — canonical alias currently maps to the latest READY production deployment; alternate domain/delegation and full route validation remain outstanding.

## Release gate

Do not declare the service invulnerable or legally certified. Do not disable live Stripe endpoints, rotate credentials without a dependency/rollback plan, or deploy a database migration before its SQL assertions and application checks pass. Keep the account-retention cron schedule unchanged.
